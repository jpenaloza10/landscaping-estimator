import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  // This will show up in the browser console if envs are missing 
  console.warn("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment variables.");
}

export const supabase = createClient(url ?? "", anon ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // required for email confirmation/magic link flows
  },
});
