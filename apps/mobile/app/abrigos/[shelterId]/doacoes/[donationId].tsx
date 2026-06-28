import { useState, useEffect, useRef } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  createDonationStatusClient,
  createReviewDonationClient,
} from '@pic4paws/client';
import {
  createMobileDonationReviewUi,
  type MobileDonationReviewViewModel,
} from '../../../../src/donation-review';
import { workerUrl } from '../../../../src/env';
import { mobileSupabaseClient } from '../../../../src/supabase';

export default function DoacaoReviewScreen() {
  const { shelterId, donationId } = useLocalSearchParams<{ shelterId: string; donationId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileDonationReviewViewModel | null>(null);
  const uiRef = useRef<ReturnType<typeof createMobileDonationReviewUi> | null>(null);

  useEffect(() => {
    setViewModel(null);
    const supabase = mobileSupabaseClient;
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
    const reviewDonationClient = createReviewDonationClient({
      workerBaseUrl: workerUrl(),
      donationsPath: '/donations',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobileDonationReviewUi({ donationStatusClient, reviewDonationClient });
    uiRef.current = ui;
    ui.loadDonation(donationId).then(setViewModel);
  }, [donationId]);

  const handleApprove = () => {
    if (!uiRef.current) return;
    Alert.alert(
      'Aprovar donativo',
      'Tens a certeza que queres aprovar este donativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprovar',
          onPress: async () => {
            if (!uiRef.current) return;
            setViewModel({ state: 'approving', title: 'A aprovar...' });
            try {
              const result = await uiRef.current.approve(donationId);
              setViewModel(result);
            } catch {
              setViewModel({ state: 'failed', title: 'Erro', message: 'Não foi possível aprovar o donativo.', status: 'worker_request_failed', reasons: [], canRetry: true });
            }
          },
        },
      ],
    );
  };

  const handleReject = () => {
    if (!uiRef.current) return;
    Alert.alert(
      'Rejeitar donativo',
      'Tens a certeza que queres rejeitar este donativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rejeitar',
          style: 'destructive',
          onPress: async () => {
            if (!uiRef.current) return;
            setViewModel({ state: 'rejecting', title: 'A rejeitar...' });
            try {
              const result = await uiRef.current.reject(donationId);
              setViewModel(result);
            } catch {
              setViewModel({ state: 'failed', title: 'Erro', message: 'Não foi possível rejeitar o donativo.', status: 'worker_request_failed', reasons: [], canRetry: true });
            }
          },
        },
      ],
    );
  };

  if (viewModel === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>A carregar donativo...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'approving' || viewModel.state === 'rejecting') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>A processar...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'approved' || viewModel.state === 'rejected') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push(`/abrigos/${shelterId}/doacoes` as never)}
        >
          <Text style={styles.buttonText}>Ver donativos do abrigo</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'wrong_state') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => uiRef.current?.loadDonation(donationId).then(setViewModel)}
        >
          <Text style={styles.buttonText}>Tentar de novo</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { donation } = viewModel;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <View style={styles.detail}>
          <Text style={styles.label}>Valor</Text>
          <Text style={styles.value}>
            {(donation.amountCents / 100).toFixed(2)} {donation.currency}
          </Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Método</Text>
          <Text style={styles.value}>{donation.paymentMethod}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Data</Text>
          <Text style={styles.value}>
            {new Date(donation.createdAt).toLocaleDateString('pt-PT')}
          </Text>
        </View>
        {donation.receiptMediaId ? (
          <View style={styles.receipt}>
            <Text style={styles.label}>Comprovativo</Text>
            <Text style={styles.value}>ID: {donation.receiptMediaId}</Text>
          </View>
        ) : (
          <Text style={styles.message}>Sem comprovativo anexado.</Text>
        )}
        <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={handleApprove}>
          <Text style={styles.buttonText}>Aprovar donativo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={handleReject}>
          <Text style={styles.buttonText}>Rejeitar donativo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20, gap: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111' },
  message: { fontSize: 14, color: '#555' },
  label: { fontSize: 12, color: '#888', marginBottom: 2 },
  value: { fontSize: 15, color: '#111' },
  detail: { gap: 2 },
  receipt: { gap: 4, paddingTop: 8 },
  button: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  approveButton: { backgroundColor: '#16a34a' },
  rejectButton: { backgroundColor: '#dc2626' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
