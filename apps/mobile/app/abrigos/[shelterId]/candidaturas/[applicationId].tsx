import { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { createAdoptionStatusClient } from '@pic4paws/client';
import type { AdoptionStatusShelterManageStatus } from '@pic4paws/client';
import {
  createMobileAdoptionStatusUi,
  type MobileAdoptionStatusResultViewModel,
} from '../../../../src/adoption-status';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../../src/env';

const STATUS_OPTIONS: Array<{ status: AdoptionStatusShelterManageStatus; label: string }> = [
  { status: 'under_review', label: 'Em análise' },
  { status: 'more_info_requested', label: 'Mais informações' },
  { status: 'approved', label: 'Aprovada' },
  { status: 'rejected', label: 'Rejeitada' },
];

export default function EstadoCandidaturaScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const [viewModel, setViewModel] = useState<MobileAdoptionStatusResultViewModel>(() => {
    const supabase = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const adoptionStatusClient = createAdoptionStatusClient({
      workerBaseUrl: workerUrl(),
      adoptionsPath: '/adoptions',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    return createMobileAdoptionStatusUi({ adoptionStatusClient }).getInitialState();
  });

  const makeUi = useCallback(() => {
    const supabase = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const adoptionStatusClient = createAdoptionStatusClient({
      workerBaseUrl: workerUrl(),
      adoptionsPath: '/adoptions',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    return createMobileAdoptionStatusUi({ adoptionStatusClient });
  }, []);

  const handleStatus = useCallback(
    async (status: AdoptionStatusShelterManageStatus) => {
      setViewModel({ state: 'submitting', title: 'A processar...', message: 'A atualizar o estado da candidatura.' });
      const result = await makeUi().manageAdoptionStatus(applicationId, status);
      setViewModel(result);
    },
    [applicationId, makeUi],
  );

  if (viewModel.state === 'submitting') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>{viewModel.title}</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'succeeded') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              setViewModel({ state: 'idle', title: 'Estado da candidatura', message: 'Seleciona o estado a aplicar à candidatura.', primaryAction: 'Atualizar estado' })
            }
          >
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.subtitle}>{viewModel.message}</Text>
        {STATUS_OPTIONS.map(({ status, label }) => (
          <TouchableOpacity
            key={status}
            style={styles.optionButton}
            onPress={() => handleStatus(status)}
          >
            <Text style={styles.optionText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 12, padding: 24 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#475569', fontSize: 15, lineHeight: 22 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  optionButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 14,
  },
  optionText: { color: '#0f172a', fontSize: 16, fontWeight: '600' },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
