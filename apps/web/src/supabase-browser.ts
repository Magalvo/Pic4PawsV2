import { createBrowserClient } from '@supabase/ssr';
import { supabaseUrl, supabaseAnonKey } from './env';

export const createSupabaseBrowserClient = () =>
  createBrowserClient(supabaseUrl(), supabaseAnonKey());
