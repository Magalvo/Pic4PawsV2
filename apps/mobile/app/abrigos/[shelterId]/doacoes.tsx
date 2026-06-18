import { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { createDonationListClient } from '@pic4paws/client';
import type { DonationClientKind, DonationClientPaymentMethod, DonationClientStatus } from '@pic4paws/client';
import {
  createMobileDonationListUi,
  type MobileDonationListResultViewModel,
} from '../../../src/donation-list';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

const KIND_LABELS: Record<DonationClientKind, string> = {
  one_time_donation: 'Doação única',
  monthly_sponsorship: 'Patrocínio mensal',
};

const STATUS_LABELS: Record<DonationClientStatus, string> = {
  created: 'Criado',
  pending_payment: 'Aguarda pagamento',
  paid: 'Pago',
  failed: 'Falhado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  partially_refunded: 'Parcialmente reembolsado',
};

const PAYMENT_LABELS: Record<DonationClientPaymentMethod, string> = {
  mb_way: 'MB Way',
  multibanco: 'Multibanco',
  card: 'Cartão',
  bank_transfer: 'Transferência',
  unknown: 'Outro',
};

export default function DoacoesAbrigoScreen() {
  const { shelterId } = useLocalSearchParams<{ shelterId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileDonationListResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const donationListClient = createDonationListClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobileDonationListUi({ donationListClient });
    ui.loadDonations(shelterId).then(setViewModel);
  }, [shelterId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar donativos...</Text>
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

  if (viewModel.state === 'forbidden') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/entrar' as never)}>
            <Text style={styles.buttonText}>Entrar na conta</Text>
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
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.subtitle}>{viewModel.message}</Text>
        {viewModel.donations.map((don) => (
          <View key={don.donationId} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.amount}>
                {(don.amountCents / 100).toFixed(2)} {don.currency}
              </Text>
              <Text style={styles.statusBadge}>
                {STATUS_LABELS[don.status] ?? don.status}
              </Text>
            </View>
            <Text style={styles.cardMeta}>
              {KIND_LABELS[don.kind] ?? don.kind}
              {' · '}
              {PAYMENT_LABELS[don.paymentMethod] ?? don.paymentMethod}
            </Text>
            {!don.anonymous && don.donorDisplayName ? (
              <Text style={styles.cardMeta}>{don.donorDisplayName}</Text>
            ) : null}
            <Text style={styles.cardDate}>
              {new Date(don.createdAt).toLocaleDateString('pt-PT')}
            </Text>
          </View>
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
  amount: { color: '#0f172a', fontSize: 18, fontWeight: '800' },
  statusBadge: { color: '#2aa7a2', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  cardMeta: { color: '#64748b', fontSize: 13 },
  cardDate: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
