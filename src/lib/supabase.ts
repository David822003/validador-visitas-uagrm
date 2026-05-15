import { createClient } from '@supabase/supabase-js';

// Retrieve variables from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Configuration Check:');
console.log('URL provided:', SUPABASE_URL ? 'YES (length: ' + SUPABASE_URL.length + ')' : 'NO');
console.log('Key provided:', SUPABASE_ANON_KEY ? 'YES (length: ' + SUPABASE_ANON_KEY.length + ')' : 'NO');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'TU_SUPABASE_URL_AQUI') {
  console.error('CRITICAL: Supabase credentials are missing or using placeholders. Please check your environment variables.');
}

let supabaseInstance;

try {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL or Anon Key is missing');
  }
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('Supabase client initialized successfully.');
} catch (error) {
  console.error('FAILED to initialize Supabase client:', error);
  // Re-throw or handle as needed. For now, we'll export the instance (which might be undefined if initialization failed catastrophically)
}

export const supabase = supabaseInstance!;
