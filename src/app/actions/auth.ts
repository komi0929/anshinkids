"use server";

import { redirect } from "next/navigation";

/**
 * LINE Login is handled entirely client-side via the LINE OAuth flow.
 * See: /login/page.tsx → handleLineLogin()
 * See: /auth/callback/line/page.tsx → exchanges code for session
 * See: /api/auth/line/route.ts → server-side token exchange
 * 
 * This server action is only used for logout.
 */

export async function logoutAction() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
    return;
  }

  await supabase.auth.signOut();
  redirect("/login");
}
