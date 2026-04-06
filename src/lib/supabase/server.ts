import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/database";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...COOKIE_OPTIONS, ...options })
          );
        } catch {
          // Server Component context
        }
      },
    },
  });
}


/**
 * Creates a Supabase client that intentionally DOES NOT read cookies.
 * Use this for fetching public data in Server Components where you want to allow Static Site Generation (SSG) and avoid the "Dynamic server usage" de-opt penalty.
 */
import { createClient as createJSClient } from "@supabase/supabase-js";
export function createStaticClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createJSClient<Database>(url, key, {
    auth: {
      persistSession: false,
    },
  });
}
