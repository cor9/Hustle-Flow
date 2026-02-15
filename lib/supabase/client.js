import { createClient } from "@supabase/supabase-js";

let browserClient;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clientKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_LEGACY_KEY;
  if (!url || !clientKey) return null;

  browserClient = createClient(url, clientKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });

  return browserClient;
}
