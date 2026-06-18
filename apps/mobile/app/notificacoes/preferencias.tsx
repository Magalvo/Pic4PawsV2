import { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { createNotificationPreferencesClient } from '@pic4paws/client';
import type { NotificationClientType } from '@pic4paws/client';
import {
  createMobileNotificationPreferencesUi,
  type MobileNotificationPreferencesState,
  type MobileNotificationPreferencesLoadedState,
} from '../../src/notification-preferences';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../src/env';

const TYPE_LABELS: Record<NotificationClientType, string> = {
  adoption_status_changed: 'Estado de adoção alterado',
  new_adoption_application: 'Nova candidatura de adoção',
  donation_paid: 'Donativo recebido',
  sponsorship_status_changed: 'Estado de apadrinhamento alterado',
};

export default function PreferenciasNotificacaoScreen() {
  const [viewModel, setViewModel] = useState<MobileNotificationPreferencesState | null>(null);

  const makeUi = useCallback(() => {
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const notificationPreferencesClient = createNotificationPreferencesClient({
      workerBaseUrl: workerUrl(),
      notificationsPath: '/notifications',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    return createMobileNotificationPreferencesUi({ notificationPreferencesClient });
  }, []);

  const load = useCallback(() => {
    setViewModel(null);
    makeUi().loadPreferences().then(setViewModel);
  }, [makeUi]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = useCallback(async (type: string, enabled: boolean) => {
    const current = viewModel;
    if (!current || current.state !== 'loaded') return;
    const next = await makeUi().updatePreference(
      current as MobileNotificationPreferencesLoadedState,
      type,
      enabled,
    );
    setViewModel(next);
  }, [viewModel, makeUi]);

  if (viewModel === null || viewModel.state === 'idle') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar preferências...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.message}>Não foi possível carregar as preferências.</Text>
          <TouchableOpacity style={styles.button} onPress={load}>
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Preferências de notificação</Text>
        {viewModel.preferences.map((pref) => (
          <View key={pref.type} style={styles.row}>
            <Text style={styles.label}>{TYPE_LABELS[pref.type as NotificationClientType] ?? pref.type}</Text>
            <Switch
              value={pref.enabled}
              onValueChange={(val) => handleToggle(pref.type, val)}
              trackColor={{ true: '#2aa7a2' }}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 4, padding: 20 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  row: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: { color: '#0f172a', fontSize: 15, flexShrink: 1, marginRight: 8 },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
