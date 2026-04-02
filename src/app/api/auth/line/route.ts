import { createAdminClient } from "@/lib/supabase/admin";

const LINE_CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

export async function POST(request: Request) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code) {
      return Response.json({ error: "Missing authorization code" }, { status: 400 });
    }

    if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET) {
      console.error("LINE credentials not configured");
      return Response.json({ error: "LINE credentials not configured" }, { status: 500 });
    }

    const validRedirectUri =
      redirectUri ||
      `${process.env.NEXT_PUBLIC_APP_URL || "https://www.anshin.kids"}/auth/callback/line`;

    // Step 1: Exchange code for access token
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: validRedirectUri,
      client_id: LINE_CHANNEL_ID,
      client_secret: LINE_CHANNEL_SECRET,
    });

    const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error("LINE token exchange error:", error);
      return Response.json(
        { error: `Failed to exchange code for token: ${error.error_description || error.error || "unknown"}` },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Get LINE user profile
    const profileResponse = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      const profileError = await profileResponse.text();
      console.error("LINE profile fetch error:", profileError);
      return Response.json({ error: "Failed to get LINE profile" }, { status: 400 });
    }

    const lineProfile = await profileResponse.json();
    const { userId: lineUserId, displayName, pictureUrl } = lineProfile;

    // Step 3: Create or find Supabase user using deterministic email + password
    const supabaseAdmin = createAdminClient();
    const dummyEmail = `${lineUserId}@line.anshin-kids.app`;
    const deterministicPassword = generateDeterministicPassword(lineUserId);

    let userId: string;
    let isNewUser = false;

    // Strategy: Try to create the user first. If already exists, sign in directly.
    const { data: authData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: dummyEmail,
        password: deterministicPassword,
        email_confirm: true,
        user_metadata: {
          line_user_id: lineUserId,
          display_name: displayName,
          picture: pictureUrl || null,
        },
      });

    if (createError) {
      if (createError.message?.includes("already been registered")) {
        // User already exists — that's fine, we'll sign in below.
        // Try to find user ID via admin API for profile update
        isNewUser = false;

        // Use signInWithPassword to get user ID reliably
        const { createClient } = await import("@supabase/supabase-js");
        const tempClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: signInData, error: signInError } =
          await tempClient.auth.signInWithPassword({
            email: dummyEmail,
            password: deterministicPassword,
          });

        if (signInError || !signInData.session) {
          // Password might have changed — reset it and retry
          // Find user via profiles table which is O(1) instead of fetching all GoTrue users
          const { data: existingProfile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("line_user_id", lineUserId)
            .maybeSingle();

          if (existingProfile) {
            await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
              password: deterministicPassword,
            });
            userId = existingProfile.id;
          } else {
            console.error("Cannot find existing user by line_user_id:", lineUserId);
            return Response.json({ error: "ユーザーが見つかりませんでした。再度お試しください。" }, { status: 500 });
          }
        } else {
          userId = signInData.session.user.id;

          // Update profile with latest LINE data
          const updateData: Record<string, string> = { display_name: displayName };
          if (pictureUrl) {
            updateData.picture_url = pictureUrl;
            updateData.avatar_url = pictureUrl;
          }
          await supabaseAdmin.from("profiles").update(updateData).eq("id", userId);

          // Already signed in — return session directly
          return Response.json({
            success: true,
            userId,
            isNewUser: false,
            session: {
              access_token: signInData.session.access_token,
              refresh_token: signInData.session.refresh_token,
            },
          });
        }
      } else {
        console.error("Supabase user creation error:", JSON.stringify(createError));
        return Response.json({ error: `ユーザー作成エラー: ${createError.message}` }, { status: 500 });
      }
    } else {
      userId = authData.user.id;
      isNewUser = true;
    }

    // Upsert profile (for new users or password-reset users)
    await supabaseAdmin.from("profiles").upsert(
      {
        id: userId!,
        line_user_id: lineUserId,
        display_name: displayName,
        avatar_url: pictureUrl || null,
      },
      { onConflict: "id" }
    );

    // Step 4: Sign in with password to get a real session
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const tempClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: signInData, error: signInError } =
      await tempClient.auth.signInWithPassword({
        email: dummyEmail,
        password: deterministicPassword,
      });

    if (signInError || !signInData.session) {
      // If password sign-in fails, update the password and retry
      console.warn("Password sign-in failed, updating password:", signInError?.message);

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId!,
        { password: deterministicPassword }
      );

      if (updateError) {
        console.error("Password update error:", updateError);
        return Response.json({ error: "Failed to establish session" }, { status: 500 });
      }

      // Retry sign-in
      const { data: retrySignIn, error: retryError } =
        await tempClient.auth.signInWithPassword({
          email: dummyEmail,
          password: deterministicPassword,
        });

      if (retryError || !retrySignIn.session) {
        console.error("Retry sign-in failed:", retryError);
        return Response.json({ error: "Failed to establish session" }, { status: 500 });
      }

      return Response.json({
        success: true,
        userId: userId!,
        isNewUser,
        session: {
          access_token: retrySignIn.session.access_token,
          refresh_token: retrySignIn.session.refresh_token,
        },
      });
    }

    return Response.json({
      success: true,
      userId: userId!,
      isNewUser,
      session: {
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      },
    });
  } catch (error) {
    console.error("LINE auth error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Generate a deterministic password from LINE userId.
 */
function generateDeterministicPassword(lineUserId: string): string {
  const secret = process.env.LINE_CHANNEL_SECRET || "fallback-secret";
  const combined = `${lineUserId}:${secret}:anshin-kids-line-auth`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `Lk${Math.abs(hash).toString(36)}${lineUserId.slice(0, 8)}!A1`;
}
