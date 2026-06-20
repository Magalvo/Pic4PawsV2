import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments, usePathname } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import type { Href } from 'expo-router';
import { mobileSupabaseClient } from '../src/supabase';
import { computeAuthRedirect } from '../src/nav';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    mobileSupabaseClient.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = mobileSupabaseClient.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const redirect = computeAuthRedirect({ session, segments: segments as string[], pathname });
    if (redirect) router[redirect.action](redirect.href as Href);
  }, [session, segments]);

  if (session === undefined) return null;

  return <Slot />;
}
