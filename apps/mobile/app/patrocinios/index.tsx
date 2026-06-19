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
import { createSponsorshipDonorListClient } from '@pic4paws/client';
import type { SponsorshipClientStatus, SponsorshipClientRecurringInterval } from '@pic4paws/client';
import {
  createMobileSponsorshipDonorListUi,
  type MobileSponsorshipDonorListResultViewModel,
} from '../../src/sponsorship-donor-list';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../src/env';

const STATUS_LABELS: Record<SponsorshipClientStatus, string> = {
  active: 'Ativo',
  cancelled: 'Cancelado',
  paused: 'Em pausa',
};

const STATUS_COLORS: Record<SponsorshipClientStatus, string> = {
  active: '#22c55e',
  cancelled: '#ef4444',
  paused: '#f59e0b',
};

const INTERVAL_LABELS: Record<SponsorshipClientRecurringInterval, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  annual: 'Anual',
};

export default function MeusApadrinhamentosScreen() {
  const router = useRouter();
  const [viewModel, setViewModel] =
    useState<MobileSponsorshipDonorListResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const sponsorshipDonorListClient = createSponsorshipDonorListClient({
      workerBaseUrl: workerUrl(),
      sponsorshipsPath: '/sponsorships',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobileSponsorshipDonorListUi({ sponsorshipDonorListClient });
    ui.loadDonorSponsorships().then(setViewModel);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar apadrinhamentos...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'empty') {
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
        {viewModel.sponsorships.map((sp) => (
          <TouchableOpacity
            key={sp.sponsorshipId}
            style={styles.card}
            onPress={() => router.push(`/patrocinios/${sp.sponsorshipId}` as never)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.amount}>
                {(sp.amountCents / 100).toFixed(2)} {sp.currency} · {INTERVAL_LABELS[sp.recurringInterval]}
              </Text>
              <Text style={[styles.statusBadge, { color: STATUS_COLORS[sp.status] }]}>
                {STATUS_LABELS[sp.status]}
              </Text>
            </View>
            {sp.petId ? (
              <Text style={styles.cardSub}>Animal: {sp.petId}</Text>
            ) : null}
            <Text style={styles.cardDate}>
              {new Date(sp.createdAt).toLocaleDateString('pt-PT')}
            </Text>
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
    gap: 4,
    padding: 14,
  },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  amount: { color: '#0f172a', fontSize: 15, fontWeight: '700', flexShrink: 1 },
  statusBadge: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  cardSub: { color: '#64748b', fontSize: 13 },
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
