import { useState, useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createSavePaymentConfigClient, createLoadPaymentConfigClient } from '@pic4paws/client';
import {
  createMobileShelterPaymentConfigUi,
  type MobileShelterPaymentConfigViewModel,
} from '../../../src/shelter-payment-config';
import { mobileSupabaseClient } from '../../../src/supabase';
import { workerUrl } from '../../../src/env';

export default function PagamentoAbrigoScreen() {
  const { shelterId } = useLocalSearchParams<{ shelterId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileShelterPaymentConfigViewModel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [iban, setIban] = useState('');
  const [mbWayPhone, setMbWayPhone] = useState('');
  const uiRef = useRef<ReturnType<typeof createMobileShelterPaymentConfigUi> | null>(null);

  useEffect(() => {
    const getAccessToken = async () => {
      const {
        data: { session },
      } = await mobileSupabaseClient.auth.getSession();
      return session?.access_token ?? null;
    };

    const loadConfigClient = createLoadPaymentConfigClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });

    const saveConfigClient = createSavePaymentConfigClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });

    const ui = createMobileShelterPaymentConfigUi({ saveConfigClient, loadConfigClient });
    uiRef.current = ui;

    ui.loadConfig(shelterId).then((result) => {
      if (result.state === 'idle') {
        setIban(result.iban ?? '');
        setMbWayPhone(result.mbWayPhone ?? '');
      }
      setViewModel(result);
    });
  }, [shelterId]);

  const handleSubmit = async () => {
    if (submitting || !viewModel || viewModel.state !== 'idle') return;
    if (!uiRef.current) return;
    setSubmitting(true);
    const result = await uiRef.current.saveConfig(shelterId, {
      iban,
      mbWayPhone: mbWayPhone.trim() || null,
    });
    setViewModel(result);
    setSubmitting(false);
  };

  if (viewModel === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.hint}>A carregar configuração de pagamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'saved') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push(`/abrigos/${shelterId}` as never)}
          >
            <Text style={styles.buttonText}>Ver abrigo</Text>
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
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.push(`/abrigos/${shelterId}` as never)}
          >
            <Text style={styles.buttonText}>Voltar ao abrigo</Text>
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
            onPress={() => router.push(`/abrigos/${shelterId}` as never)}
          >
            <Text style={styles.buttonText}>Voltar ao abrigo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Configuração de pagamento</Text>
          <Text style={styles.hint}>
            Introduz o IBAN do abrigo para receber donativos por transferência bancária.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>IBAN</Text>
            <TextInput
              style={styles.input}
              value={iban}
              onChangeText={setIban}
              editable={!submitting}
              autoCapitalize="characters"
              placeholder="PT50 0000 0000 0000 0000 0000 0"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Telefone MB WAY (opcional)</Text>
            <TextInput
              style={styles.input}
              value={mbWayPhone}
              onChangeText={setMbWayPhone}
              editable={!submitting}
              keyboardType="phone-pad"
              placeholder="+351 912 345 678"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>
              {submitting ? 'A guardar...' : 'Guardar configuração'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.push(`/abrigos/${shelterId}` as never)}
          >
            <Text style={styles.buttonText}>Voltar ao abrigo</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 16, padding: 24 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  hint: { color: '#475569', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  field: { gap: 6 },
  label: { color: '#374151', fontSize: 14, fontWeight: '600' },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderRadius: 6,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
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
