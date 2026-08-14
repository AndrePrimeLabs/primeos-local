import { createClient } from '@supabase/supabase-js';

function readEnv(...keys) {
  const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};
  for (const key of keys) {
    if (viteEnv?.[key]) return viteEnv[key];
    if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  }
  return undefined;
}

export const supabaseProjectId =
  readEnv('VITE_SUPABASE_PROJECT_ID', 'SUPABASE_PROJECT_ID') ?? 'foeahubnrbclbelsqikp';

export const supabaseUrl =
  readEnv('VITE_SUPABASE_URL', 'SUPABASE_URL') ??
  `https://${supabaseProjectId}.supabase.co`;

export const supabaseRestUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1`;

export const supabaseAnonKey =
  readEnv('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ??
  'sb_publishable_MnURfwn0NCO-70pR4pF4Vw_Sl4r3CLA';

export const supabaseServiceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

export const storageBucket =
  readEnv('VITE_SUPABASE_STORAGE_BUCKET', 'SUPABASE_STORAGE_BUCKET') ?? 'primeos-prod';

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
  },
  db: { schema: 'public' },
});

export function createServiceRoleClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  });
}

export default supabase;
