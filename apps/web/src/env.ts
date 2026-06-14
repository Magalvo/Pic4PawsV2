export const workerUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_WORKER_URL;
  if (!url) throw new Error('NEXT_PUBLIC_WORKER_URL is not set');
  return url;
};

export const supabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return url;
};

export const supabaseAnonKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  return key;
};
