"use server";

import { createClient, getCachedUser } from "@/lib/supabase/server";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { getImpactFeedback, getContributionStreak, getPersonalizedWikiEntries } from "./discover";
import { getMyBookmarks } from "./wiki";

export async function getFullMyPageData() {
 noStore();
 try {

 // Only fetch lightweight, critical data on the server to ensure < 100ms TTFB.
 // Heavy personalized queries (Impact, Recommendations) are deferred to the client.
 const [profileRes, contribRes, bookmarksRes, streakRes] = await Promise.all([
 getMyProfile().catch(() => ({ success: false as const, data: null, error: "プロフィール取得エラー" })),
 getMyContributions().catch(() => ({ success: true, data: [] })),
 getMyBookmarks().catch(() => ({ success: false, data: [] })),
 getContributionStreak().catch(() => ({ success: false, data: null }))
 ]);
 const profileError = !profileRes.success ? ('error' in profileRes ? String(profileRes.error) : "不明なエラー") : null;
 if (profileError?.includes("ログイン")) {
 return { success: false, error: "ログインが必要です", data: null };
 } else if (profileError) {
 return { success: false, error: profileError, data: null };
 }

 return {
 success: true,
 data: {
 profile: profileRes.success ? profileRes.data : null,
 contributions: contribRes.success ? contribRes.data : [],
 bookmarks: bookmarksRes.success ? bookmarksRes.data : [],
 streak: streakRes.success ? streakRes.data : null,
 impact: null, // Deferred to client
 recommendedWikis: [] // Deferred to client
 }
 }
 } catch {
 return { success: false, error: "データ一括取得に失敗しました", data: null };
 }
}

export async function getMyProfile() {
 try {
 const supabase = await createClient();
 if (!supabase) return { success: false, error: "DB未接続" };

 const { data: { user } } = await getCachedUser();
 if (!user) return { success: false, error: "ログインが必要です" };

 const fullColumns = "id, display_name, avatar_url, trust_score, total_contributions, total_thanks_received, allergen_tags, child_age_months, children_profiles, interests";
 const minimalColumns = "id, display_name, avatar_url, trust_score, total_contributions, total_thanks_received, allergen_tags, child_age_months";

 let profile = null;
 let queryError = null;

 // Try full columns first, fallback to minimal
 const { data: fullProfile, error: fullError } = await supabase
 .from("profiles")
 .select(fullColumns)
 .eq("id", user.id)
 .maybeSingle();

 if (fullError) {
 // Try minimal columns
 const { data: minProfile, error: minError } = await supabase
 .from("profiles")
 .select(minimalColumns)
 .eq("id", user.id)
 .maybeSingle();
 
 if (minError) {
 queryError = minError;
 } else {
 profile = minProfile ? { ...minProfile, children_profiles: [], interests: [] } : null;
 }
 } else {
 profile = fullProfile;
 queryError = null;
 }

 if (!profile && !queryError) {
 // Profile not found — create one
 const displayName = 
 user.user_metadata?.custom_claims?.name ||
 user.user_metadata?.full_name ||
 user.user_metadata?.name ||
 user.user_metadata?.display_name ||
 "ゲスト";
 const avatarUrl = 
 user.user_metadata?.custom_claims?.picture ||
 user.user_metadata?.avatar_url ||
 user.user_metadata?.picture || 
 null;

 const { data: newProfile, error: insertError } = await supabase
 .from("profiles")
 .upsert({
 id: user.id,
 display_name: displayName,
 avatar_url: avatarUrl,
 }, { onConflict: "id" })
 .select(minimalColumns)
 .maybeSingle();

 if (insertError) throw insertError;
 return { success: true, data: newProfile ? { ...newProfile, children_profiles: [], interests: [] } : null };
 }

 if (queryError) throw queryError;
 
 // Legacy Data Migration on Read (Polyfill for users who haven't updated yet)
 if (profile && profile.allergen_tags && Array.isArray(profile.allergen_tags)) {
 const firstTag = profile.allergen_tags[0];
 if (firstTag && typeof firstTag === "string" && firstTag.startsWith("JSON_PAYLOAD_")) {
 try {
 if (firstTag.startsWith("JSON_PAYLOAD_V3:")) {
 const parsed = JSON.parse(firstTag.replace("JSON_PAYLOAD_V3:", ""));
 // Only polyfill if DB columns are empty
 if (!profile.children_profiles || (profile.children_profiles as unknown[]).length === 0) profile.children_profiles = parsed.children || [];
 if (!profile.interests || (profile.interests as unknown[]).length === 0) profile.interests = parsed.interests || [];
 profile.allergen_tags = profile.allergen_tags.slice(1);
 } else if (firstTag.startsWith("JSON_PAYLOAD_V2:")) {
 if (!profile.children_profiles || (profile.children_profiles as unknown[]).length === 0) profile.children_profiles = JSON.parse(firstTag.replace("JSON_PAYLOAD_V2:", ""));
 profile.allergen_tags = profile.allergen_tags.slice(1);
 if (!profile.interests) profile.interests = [];
 }
 } catch { /* ignore */ }
 }
 }

 return { success: true, data: profile };
 } catch (err) {
 console.error("[getMyProfile]", err);
 return { success: false, error: "プロフィール取得に失敗しました" };
 }
}

export async function updateMyProfile(updates: {
 display_name?: string;
 avatar_url?: string | null;
 allergen_tags?: string[];
 child_age_months?: number | null;
 children_profiles?: Record<string, unknown>[];
 interests?: string[];
}) {
 try {
 const supabase = await createClient();
 if (!supabase) return { success: false, error: "DB未接続" };

 const { data: { user } } = await getCachedUser();
 if (!user) return { success: false, error: "ログインが必要です" };

 const payload = { ...updates };

 // Handle avatar upload: if avatar_url is a data URI, upload to Storage
 if (payload.avatar_url && payload.avatar_url.startsWith("data:image/")) {
 try {
 // Extract base64 content
 const matches = payload.avatar_url.match(/^data:image\/(\w+);base64,(.+)$/);
 if (matches) {
 const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
 const base64Data = matches[2];
 const buffer = Buffer.from(base64Data, "base64");
 const filePath = `${user.id}/avatar.${ext}`;

 // Upload to Supabase Storage (avatars bucket)
 const { error: uploadError } = await supabase.storage
 .from("avatars")
 .upload(filePath, buffer, {
 contentType: `image/${matches[1]}`,
 upsert: true, // Overwrite existing avatar
 });

 if (uploadError) {
 console.error("[updateMyProfile] Avatar upload error:", uploadError.message);
 // If bucket doesn't exist, fall back to storing short emoji or null
 // Don't block the rest of the profile update
 delete payload.avatar_url;
 } else {
 // Get public URL
 const { data: urlData } = supabase.storage
 .from("avatars")
 .getPublicUrl(filePath);
 // Add cache-buster to force browser to reload
 payload.avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
 }
 }
 } catch (uploadErr) {
 console.error("[updateMyProfile] Avatar processing error:", uploadErr);
 delete payload.avatar_url; // Don't block the profile update
 }
 }

 if (payload.children_profiles) {
 // Collect all allergens from children into the parent allergen_tags
 const flatAllergens = new Set<string>();
 if (payload.allergen_tags) payload.allergen_tags.forEach(a => flatAllergens.add(a));
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 payload.children_profiles.forEach((c: any) => {
 if (Array.isArray(c.allergens)) c.allergens.forEach((a: string) => flatAllergens.add(a));
 if (Array.isArray(c.customAllergens)) c.customAllergens.forEach((a: string) => flatAllergens.add(a));
 });
 payload.allergen_tags = Array.from(flatAllergens);
 }

 const { data: updatedData, error } = await supabase
 .from("profiles")
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 .update(payload as any)
 .eq("id", user.id)
 .select();

 if (error) throw error;
 if (!updatedData || updatedData.length === 0) {
 console.warn("[updateMyProfile] No rows updated. Check RLS or IDs.");
 throw new Error("更新できませんでした");
 }
 
 revalidatePath("/", "layout");
 revalidatePath("/talk/[slug]/[topicId]", "page");
 return { success: true, data: updatedData[0] };
 } catch (err) {
 console.error("[updateMyProfile]", err);
 return { success: false, error: "プロフィール更新に失敗しました" };
 }
}

export async function getMyContributions() {
 try {
 const supabase = await createClient();
 if (!supabase) return { success: true, data: [] };

 const { data: { user } } = await getCachedUser();
 if (!user) return { success: false, error: "ログインが必要です" };

 // Get wiki sources where this user contributed
 const { data, error } = await supabase
 .from("wiki_sources")
 .select(`
 id,
 original_message_snippet,
 extracted_at,
 wiki_entries:wiki_entry_id (
 id,
 title,
 slug,
 category
 )
 `)
 .eq("contributor_id", user.id)
 .order("extracted_at", { ascending: false })
 .limit(20);

 if (error) throw error;
 return { success: true, data: data || [] };
 } catch (err) {
 console.error("[getMyContributions]", err);
 return { success: true, data: [] };
 }
}

/**
 * Gap 5: Calculate the user's impact metrics.
 * Shows how their contributions are helping others.
 */
export async function getMyImpact() {
 try {
 const supabase = await createClient();
 if (!supabase) return { success: true, data: null };

 const { data: { user } } = await getCachedUser();
 if (!user) return { success: false, error: "ログインが必要です" };

 // Count wiki entries the user contributed to
 const { data: sources } = await supabase
 .from("wiki_sources")
 .select("wiki_entry_id")
 .eq("contributor_id", user.id)
 .limit(2000);

 const articlesContributed = new Set(
 (sources || []).map((s) => s.wiki_entry_id).filter(Boolean)
 ).size;

 // True compound impact: real helpful votes
 const { data: profile } = await supabase
 .from("profiles")
 .select("trust_score, total_contributions, total_thanks_received, total_helpful_votes")
 .eq("id", user.id)
 .maybeSingle();

 const totalHelpfulVotes = profile?.total_helpful_votes || 0;
 const trustDelta = Math.round((profile?.trust_score || 0));

 return {
 success: true,
 data: {
 articlesContributed,
 totalHelpfulVotes,
 trustDelta,
 },
 };
 } catch (err) {
 console.error("[getMyImpact]", err);
 return { success: true, data: null };
 }
}

/**
 * F6: Complete account deletion.
 * Removes all user data while preserving anonymized wiki contributions.
 */
export async function deleteMyAccount() {
 try {
 const supabase = await createClient();
 if (!supabase) return { success: false, error: "DB未接続" };

 const { data: { user } } = await getCachedUser();
 if (!user) return { success: false, error: "ログインが必要です" };

 // Sever contributor links (anonymize wiki_sources)
 await supabase
 .from("wiki_sources")
 .update({ contributor_id: null })
 .eq("contributor_id", user.id);

 // Delete concierge sessions
 await supabase
 .from("concierge_sessions")
 .delete()
 .eq("user_id", user.id);

 // Delete isolated related row data (Prevents FK Violations)
 await supabase.from("message_thanks").delete().eq("user_id", user.id);
 await supabase.from("wiki_helpful_votes").delete().eq("user_id", user.id);
 await supabase.from("user_bookmarks").delete().eq("user_id", user.id);
 await supabase.from("contribution_days").delete().eq("user_id", user.id);

 // 安全対策: Pending raw messages are immediately wiped
 await supabase
 .from("messages")
 .delete()
 .eq("user_id", user.id);

 // Delete profile
 await supabase
 .from("profiles")
 .delete()
 .eq("id", user.id);

 // Sign out first
 await supabase.auth.signOut();

 // Delete auth.users record using admin client
 try {
 const { createAdminClient } = await import("@/lib/supabase/admin");
 const adminClient = createAdminClient();
 await adminClient.auth.admin.deleteUser(user.id);
 } catch (adminErr) {
 console.error("[deleteMyAccount] Admin deletion failed:", adminErr);
 // Profile and data are already deleted, so this is best-effort
 }

 revalidatePath("/", "layout");
 return { success: true };
 } catch (err) {
 console.error("[deleteMyAccount]", err);
 return { success: false, error: "削除に失敗しました" };
 }
}

/**
 * Phase 9: 300-point Utility-Led Growth
 * Fetch public allergy passport safely for sharing.
 */
export async function getPublicAllergyCard(profileId: string) {
 try {
 const { createAdminClient } = await import("@/lib/supabase/admin");
 const adminClient = createAdminClient();

 // Only fetch safe, essential data needed for the amulet card.
 const { data: profile, error } = await adminClient
 .from("profiles")
 .select("id, display_name, allergen_tags, child_age_months, children_profiles")
 .eq("id", profileId)
 .maybeSingle();

 if (error) throw error;
 if (!profile) return { success: false, error: "カードが見つかりません" };

 return { success: true, data: profile };
 } catch (err) {
 console.error("[getPublicAllergyCard]", err);
 return { success: false, error: "カードの読み込みに失敗しました" };
 }
}
