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
  createSubmitReceiptClient,
  createMediaUploadFlowClient,
} from '@pic4paws/client';
import {
  createMobileDonationReceiptUi,
  type MobileDonationReceiptViewModel,
  type MobileDonationReceiptFileInput,
} from '../../../src/donation-receipt';
import { mobileSupabaseClient } from '../../../src/supabase';
import { workerUrl } from '../../../src/env';

export default function ComprovativoScreen() {
  const { donationId } = useLocalSearchParams<{ donationId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileDonationReceiptViewModel | null>(null);
  const uiRef = useRef<ReturnType<typeof createMobileDonationReceiptUi> | null>(null);

  useEffect(() => {
    const getAccessToken = async () => {
      const {
        data: { session },
      } = await mobileSupabaseClient.auth.getSession();
      return session?.access_token ?? null;
    };

    const donationStatusClient = createDonationStatusClient({
      workerBaseUrl: workerUrl(),
      donationsPath: '/donations',
      getAccessToken,
      fetch: globalThis.fetch,
    });

    const mediaUploadClient = createMediaUploadFlowClient({
      workerBaseUrl: workerUrl(),
      mediaUploadPath: '/media',
      getAccessToken,
      fetch: globalThis.fetch,
    });

    const submitReceiptClient = createSubmitReceiptClient({
      workerBaseUrl: workerUrl(),
      donationsPath: '/donations',
      getAccessToken,
      fetch: globalThis.fetch,
    });

    const ui = createMobileDonationReceiptUi({
      donationStatusClient,
      mediaUploadClient,
      submitReceiptClient,
    });
    uiRef.current = ui;

    ui.loadDonation(donationId).then(setViewModel);
  }, [donationId]);

  const [isUploading, setIsUploading] = useState(false);

  const handleSelectAndUpload = () => {
    if (!uiRef.current) return;

    Alert.alert(
      'Selecionar comprovativo',
      'Escolhe como pretendes adicionar o comprovativo.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Galeria / Ficheiro',
          onPress: async () => {
            if (!uiRef.current) return;
            setIsUploading(true);
            try {
              const mockFile: MobileDonationReceiptFileInput = {
                uri: 'file:///data/placeholder/receipt.jpg',
                type: 'image/jpeg',
                name: 'receipt.jpg',
                size: 0,
              };
              setViewModel({ state: 'uploading', title: 'A carregar ficheiro...' });
              const result = await uiRef.current.uploadAndSubmit(donationId, mockFile);
              setViewModel(result);
            } catch {
              setViewModel({
                state: 'failed',
                title: 'Erro inesperado',
                message: 'Ocorreu um erro inesperado. Tenta de novo.',
                status: 'media_upload_failed',
                reasons: [],
                canRetry: true,
              });
            } finally {
              setIsUploading(false);
            }
          },
        },
      ],
    );
  };

  if (viewModel === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.hint}>A carregar donativo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'uploading' || viewModel.state === 'submitting') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.hint}>A processar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'submitted') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push(`/doacoes/${viewModel.donationId}` as never)}
          >
            <Text style={styles.buttonText}>Ver estado do donativo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'wrong_state') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.push(`/doacoes/${viewModel.donationId}` as never)}
          >
            <Text style={styles.buttonText}>Ver estado do donativo</Text>
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
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/entrar' as never)}
          >
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
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/entrar' as never)}
            >
              <Text style={styles.buttonText}>Entrar na conta</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.hint}>
          Donativo de{' '}
          <Text style={styles.bold}>
            {(viewModel.donation.amountCents / 100).toFixed(2)} {viewModel.donation.currency}
          </Text>{' '}
          por transferência bancária.
        </Text>
        <Text style={styles.hint}>
          Seleciona ou fotografa o comprovativo da tua transferência para o associar a este donativo.
        </Text>

        <TouchableOpacity
          style={[styles.button, isUploading && styles.buttonDisabled]}
          onPress={handleSelectAndUpload}
          disabled={isUploading}
        >
          <Text style={styles.buttonText}>Selecionar comprovativo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => router.push(`/doacoes/${donationId}` as never)}
        >
          <Text style={styles.buttonText}>Voltar ao donativo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 16, padding: 24 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  hint: { color: '#475569', fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '700', color: '#0f172a' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 4,
    paddingVertical: 14,
  },
  buttonSecondary: { backgroundColor: '#64748b' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
