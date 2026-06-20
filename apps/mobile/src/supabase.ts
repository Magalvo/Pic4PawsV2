import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './env';

// Single in-memory client shared across the entire app.
// Both the root layout guard and the sign-in screen must use this instance so
// that auth state changes (SIGNED_IN / SIGNED_OUT) are visible to all subscribers.
// persistSession: false — no AsyncStorage or SecureStore required.
export const mobileSupabaseClient = createClient(supabaseUrl(), supabaseAnonKey(), {
  auth: { persistSession: false },
});
