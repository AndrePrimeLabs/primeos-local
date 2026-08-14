import { createClient } from "@supabase/supabase-js";

// Existing PrimeOS Supabase project (publishable / anon key — safe in client).
const SUPABASE_URL = "https://foeahubnrbclbelsqikp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_MnURfwn0NCO-70pR4pF4Vw_Sl4r3CLA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
