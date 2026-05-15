import { createClient } from '@supabase/supabase-js';

// Define las variables como constantes al inicio del código como se solicitó
// Se recomienda usar variables de entorno para mayor seguridad (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
// Use any cast to bypass missing type definitions for import.meta.env
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'TU_SUPABASE_URL_AQUI';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'TU_SUPABASE_ANON_KEY_AQUI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
