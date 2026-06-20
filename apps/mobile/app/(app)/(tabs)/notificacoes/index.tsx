import { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { createNotificationClient } from '@pic4paws/client';
import type { NotificationClientType } from '@pic4paws/client';
import {
  createMobileNotificationUi,
  type MobileNotificationState,
  type MobileNotificationLoadedState,
} from '../../../../src/notification';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../../src/env';

const TYPE_LABELS: Record<NotificationClientType, string> = {
  adoption_status_changed: 'Estado de adoção alterado',
  new_adoption_application: 'Nova candidatura de adoção',
  donation_paid: 'Donativo recebido',
  sponsorship_status_changed: 'Estado de apadrinhamento alterado',
};

export default function NotificacoesScreen() {
  const [viewModel, setViewModel] = useState<MobileNotificationState | null>(null);

  const makeUi = useCallback(() => {
    const supabase = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const notificationClient = createNotificationClient({
      workerBaseUrl: workerUrl(),
      notificationsPath: '/notifications',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    return createMobileNotificationUi({ notificationClient });
  }, []);

  const load = useCallback(() => {
    setViewModel(null);
    makeUi().loadNotifications().then(setViewModel);
  }, [makeUi]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = useCallback(async (notificationId: string) => {
    setViewModel((prev) => {
      if (!prev || prev.state !== 'loaded') return prev;
      return { ...prev };
    });
    const current = viewModel;
    if (!current || current.state !== 'loaded') return;
    const next = await makeUi().markRead(current as MobileNotificationLoadedState, notificationId);
    setViewModel(next);
  }, [viewModel, makeUi]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar notificações...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.message}>Não foi possível carregar as notificações.</Text>
          <TouchableOpacity style={styles.button} onPress={load}>
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel.notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Notificações</Text>
          <Text style={styles.message}>Não tens notificações.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Notificações</Text>
        {viewModel.notifications.map((n) => (
          <View key={n.notificationId} style={[styles.card, !n.readAt && styles.unread]}>
            <Text style={styles.notifType}>{TYPE_LABELS[n.type] ?? n.type}</Text>
            <Text style={styles.notifDate}>
              {new Date(n.createdAt).toLocaleDateString('pt-PT')}
            </Text>
            {!n.readAt && (
              <TouchableOpacity onPress={() => handleMarkRead(n.notificationId)}>
                <Text style={styles.markRead}>Marcar como lida</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 10, padding: 20 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  unread: { borderLeftColor: '#2aa7a2', borderLeftWidth: 3 },
  notifType: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
  notifDate: { color: '#94a3b8', fontSize: 12 },
  markRead: { color: '#2aa7a2', fontSize: 13, fontWeight: '600', marginTop: 4 },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
