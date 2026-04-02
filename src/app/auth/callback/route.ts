import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/talk";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth error from provider
  if (errorParam) {
    console.error("OAuth error:", errorParam, errorDescription);
    // Detect LINE OIDC misconfiguration
    const desc = errorDescription || errorParam;
    const isProfileError = desc.toLowerCase().includes("profile") || desc.toLowerCase().includes("provider");
    const message = isProfileError
      ? "LINE連携の設定に問題があります。LINE Developer ConsoleのCallback URLを https://www.anshin.kids/auth/callback/line に設定してください。"
      : desc;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("exchangeCodeForSession error:", error.message);
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(error.message)}`
        );
      }

      // Check if profile exists, create if not
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          // Create profile from LINE user metadata
          const displayName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.user_metadata?.display_name ||
            user.user_metadata?.preferred_username ||
            "あんしんユーザー";
          const avatarUrl =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          await supabase.from("profiles").insert({
            id: user.id,
            display_name: displayName,
            avatar_url: avatarUrl,
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code parameter - redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}

