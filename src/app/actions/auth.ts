"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginWithLine() {
  const supabase = await createClient();
  if (!supabase) return { success: false, error: "DB未接続" };

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google" as "google", // placeholder - LINE configured via Supabase Dashboard
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) return { success: false, error: error.message };
  if (data.url) redirect(data.url);

  return { success: false, error: "認証URLの生成に失敗しました" };
}

export async function logoutAction() {
  const supabase = await createClient();
  if (!supabase) return;

  await supabase.auth.signOut();
  redirect("/login");
}
