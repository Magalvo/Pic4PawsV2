import { useEffect, useRef, useState } from 'react';
import { Slot, useRouter, useSegments, usePathname } from 'expo-router';
import type { Session } from '@supabase/supabase-js';
import type { Href } from 'expo-router';
import { createPushTokenClient } from '@pic4paws/client';
import { mobileSupabaseClient } from '../src/supabase';
import { computeAuthRedirect } from '../src/nav';
import { createMobilePushTokenRegistrar, getPushToken } from '../src/push-token';
import { workerUrl } from '../src/env';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  const registrarRef = useRef<ReturnType<typeof createMobilePushTokenRegistrar> | null>(null);
  if (!registrarRef.current) {
    registrarRef.current = createMobilePushTokenRegistrar({
      pushTokenClient: createPushTokenClient({
        workerBaseUrl: workerUrl(),
        notificationsPath: '/notifications',
        getAccessToken: async () => {
          const { data } = await mobileSupabaseClient.auth.getSession();
          return data.session?.access_token ?? null;
        },
        fetch: globalThis.fetch,
      }),
      getPushToken,
    });
  }
  const registrar = registrarRef.current;

  useEffect(() => {
    mobileSupabaseClient.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = mobileSupabaseClient.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && sess) {
        registrar.onAuthenticated();
      } else if (event === 'SIGNED_OUT') {
        registrar.onSignedOut();
      }
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
