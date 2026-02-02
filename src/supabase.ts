import { createClient } from '@supabase/supabase-js';

/**
 * ⚠️ IMPORTANT
 * Yahin sirf 2 cheez change karni hai
 * 1. Supabase Project URL
 * 2. Supabase Anon Public Key
 */

// 👇👇 YAHAN PASTE KARO
const SUPABASE_URL = 'PASTE_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'PASTE_SUPABASE_ANON_PUBLIC_KEY';

// Supabase client
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false // hum custom admin login use kar rahe
    }
  }
);
