import { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { createAdoptionDonorListClient } from '@pic4paws/client';
import type { AdoptionApplicationStatus } from '@pic4paws/client';
import {
  createMobileAdoptionDonorListUi,
  type MobileAdoptionDonorListResultViewModel,
} from '../../src/adoption-donor-list';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../src/env';

const STATUS_LABELS: Record<AdoptionApplicationStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Submetida',
  under_review: 'Em análise',
  more_info_requested: 'Info. solicitada',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  withdrawn: 'Retirada',
  expired: 'Expirada',
};

const STATUS_COLORS: Record<AdoptionApplicationStatus, string> = {
  draft: '#94a3b8',
  submitted: '#3b82f6',
  under_review: '#f59e0b',
  more_info_requested: '#8b5cf6',
  approved: '#22c55e',
  rejected: '#ef4444',
  withdrawn: '#64748b',
  expired: '#94a3b8',
};

export default function MinhasCandidaturasScreen() {
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileAdoptionDonorListResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const adoptionDonorListClient = createAdoptionDonorListClient({
      workerBaseUrl: workerUrl(),
      adoptionsPath: '/adoptions',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobileAdoptionDonorListUi({ adoptionDonorListClient });
    ui.loadDonorAdoptions().then(setViewModel);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar os meus pedidos...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/animais' as never)}>
            <Text style={styles.buttonText}>Ver animais disponíveis</Text>
          </TouchableOpacity>
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
          {viewModel.status === 'unauthenticated' && (
            <TouchableOpacity style={styles.button} onPress={() => router.push('/entrar' as never)}>
              <Text style={styles.buttonText}>Entrar na conta</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={load}>
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
        {viewModel.applications.map((app) => (
          <TouchableOpacity
            key={app.applicationId}
            style={styles.card}
            onPress={() => router.push(`/adocoes/${app.applicationId}` as never)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.petLabel}>Animal: {app.petId}</Text>
              <Text style={[styles.statusBadge, { color: STATUS_COLORS[app.status] ?? '#64748b' }]}>
                {STATUS_LABELS[app.status] ?? app.status}
              </Text>
            </View>
            {app.submittedAt ? (
              <Text style={styles.cardDate}>
                {new Date(app.submittedAt).toLocaleDateString('pt-PT')}
              </Text>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 12, padding: 20 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#475569', fontSize: 14, marginBottom: 4 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  petLabel: { color: '#0f172a', fontSize: 14, fontWeight: '600', flexShrink: 1 },
  statusBadge: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  cardDate: { color: '#94a3b8', fontSize: 12 },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonSecondary: { backgroundColor: '#64748b' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
