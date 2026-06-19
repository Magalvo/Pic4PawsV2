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
import { createDonationStatusClient } from '@pic4paws/client';
import type { DonationClientKind, DonationClientPaymentMethod, DonationClientStatus } from '@pic4paws/client';
import {
  createMobileDonationStatusUi,
  type MobileDonationStatusResultViewModel,
} from '../../src/donation-status';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../src/env';

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
  bank_transfer: 'Transferência bancária',
  unknown: 'Outro',
};

export default function DoacaoScreen() {
  const { donationId } = useLocalSearchParams<{ donationId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileDonationStatusResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const donationStatusClient = createDonationStatusClient({
      workerBaseUrl: workerUrl(),
      donationsPath: '/donations',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobileDonationStatusUi({ donationStatusClient });
    ui.loadDonationStatus(donationId).then(setViewModel);
  }, [donationId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar donativo...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'not_found') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
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

  const { donation } = viewModel;
  const amountDisplay = (donation.amountCents / 100).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Valor</Text>
            <Text style={styles.rowValue}>{amountDisplay} {donation.currency}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Estado</Text>
            <Text style={[styles.rowValue, styles.statusBadge]}>
              {STATUS_LABELS[donation.donationStatus] ?? donation.donationStatus}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tipo</Text>
            <Text style={styles.rowValue}>{KIND_LABELS[donation.kind] ?? donation.kind}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Pagamento</Text>
            <Text style={styles.rowValue}>{PAYMENT_LABELS[donation.paymentMethod] ?? donation.paymentMethod}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Data</Text>
            <Text style={styles.rowValue}>
              {new Date(donation.createdAt).toLocaleDateString('pt-PT')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push(`/abrigos/${donation.shelterId}` as never)}
        >
          <Text style={styles.buttonText}>Ver abrigo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 16, padding: 24 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 0,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowLabel: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  rowValue: { color: '#0f172a', fontSize: 14, fontWeight: '500' },
  statusBadge: { color: '#2aa7a2', fontWeight: '700' },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 4,
    paddingVertical: 14,
  },
  buttonSecondary: { backgroundColor: '#64748b' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
