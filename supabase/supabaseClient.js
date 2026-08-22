import { createClient } from '@supabase/supabase-js';

function readEnv(...keys) {
  const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};
  for (const key of keys) {
    if (viteEnv?.[key]) return viteEnv[key];
    if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  }
  return undefined;
}

// ============================================================================
// LOCAL DEVELOPMENT MODE
// ============================================================================
const isLocalMode = readEnv('VITE_LOCAL_MODE') === 'true';
const isDevelopment = readEnv('NODE_ENV') === 'development';

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================

// For LOCAL mode: Use Supabase CLI emulator (http://localhost:54321)
// For PRODUCTION: Use hosted Supabase (https://*.supabase.co)

export const supabaseProjectId =
  readEnv('VITE_SUPABASE_PROJECT_ID', 'SUPABASE_PROJECT_ID') ?? 
  (isLocalMode || isDevelopment ? 'primeos-local' : 'foeahubnrbclbelsqikp');

export const supabaseUrl =
  readEnv('VITE_SUPABASE_URL', 'SUPABASE_URL') ??
  (isLocalMode || isDevelopment 
    ? 'http://localhost:54321'  // Local Supabase emulator
    : `https://${supabaseProjectId}.supabase.co`  // Production
  );

export const supabaseRestUrl = `${supabaseUrl.replace(/\/$/, '')}/rest/v1`;

export const supabaseAnonKey =
  readEnv('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ??
  (isLocalMode || isDevelopment 
    ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZWFodWJucmJjbGJlbHNxaWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MzAwNzM2MjgsImV4cCI6MTk0NjI0OTYyOH0.PLACEHOLDER_LOCAL'
    : 'sb_publishable_MnURfwn0NCO-70pR4pF4Vw_Sl4r3CLA'  // Production
  );

export const supabaseServiceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

export const storageBucket =
  readEnv('VITE_SUPABASE_STORAGE_BUCKET', 'SUPABASE_STORAGE_BUCKET') ?? 
  (isLocalMode || isDevelopment ? 'primeos-local' : 'primeos-prod');

// ============================================================================
// CREATE SUPABASE CLIENT
// ============================================================================

const isBrowser = typeof window !== 'undefined';

console.log('🔧 Supabase Configuration:', {
  mode: isLocalMode ? 'LOCAL' : isDevelopment ? 'DEV' : 'PRODUCTION',
  url: supabaseUrl,
  projectId: supabaseProjectId,
  environment: readEnv('NODE_ENV'),
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
  },
  db: { schema: 'public' },
  global: {
    headers: {
      'x-client-info': isLocalMode ? 'primeos-client-local' : 'primeos-client-prod',
    },
  },
});

export function createServiceRoleClient() {
  if (!supabaseServiceRoleKey) {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Server-side operations will fail.');
    if (!isLocalMode && !isDevelopment) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required in production');
    }
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'public' },
  });
}

export default supabase;
