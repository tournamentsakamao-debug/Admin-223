import { createClient } from '@supabase/supabase-js';

/**
 * ⚠️ IMPORTANT
 * Yahin sirf 2 cheez change karni hai
 * 1. Supabase Project URL
 * 2. Supabase Anon Public Key
 */

// 👇👇 YAHAN PASTE KARO
const SUPABASE_URL = 'https://tzymckfxeatibiuhvqwn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6eW1ja2Z4ZWF0aWJpdWh2cXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzMzE3NTMsImV4cCI6MjA4NDkwNzc1M30.N6KxcDLi1o54RKEGf6ZDzj3J2t50gy0YAPMiEOJQ3yQ';

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
