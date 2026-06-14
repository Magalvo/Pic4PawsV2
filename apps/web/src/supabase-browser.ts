import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './env';

export const createSupabaseBrowserClient = () =>
  createClient(supabaseUrl(), supabaseAnonKey());
