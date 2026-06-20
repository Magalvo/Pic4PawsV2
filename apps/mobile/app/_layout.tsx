import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments, usePathname } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import { mobileSupabaseClient } from '../src/supabase';

function isPublicRoute(segments: string[]): boolean {
  if (segments[0] === '(auth)') return true;
  // /animais tab root — lives at (app)/(tabs)/animais
  if (segments[0] === '(app)' && segments[1] === '(tabs)' && segments[2] === 'animais' && !segments[3]) return true;
  // /animais/[petId] public detail — stays at root animais/[petId]/index
  if (segments[0] === 'animais' && segments[1] && !segments[2]) return true;
  return false;
}

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
    if (session === undefined) return;

    const inAuthGroup = segments[0] === '(auth)';
    const publicRoute = isPublicRoute(segments as string[]);

    if (!session && !publicRoute) {
      const returnTo = encodeURIComponent(pathname);
      router.replace(`/(auth)/entrar?returnTo=${returnTo}`);
    } else if (session && inAuthGroup) {
      router.replace('/(app)/(tabs)/animais');
    }
  }, [session, segments]);

  if (session === undefined) return null;

  return <Slot />;
}
