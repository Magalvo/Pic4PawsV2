import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { createDonationClient } from '@pic4paws/client';
import type { DonationClientKind, DonationClientPaymentMethod } from '@pic4paws/client';
import {
  createMobileDonationUi,
  type MobileDonationResultViewModel,
} from '../../../src/donation';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

type FormState = {
  amountEuros: string;
  kind: DonationClientKind;
  paymentMethod: DonationClientPaymentMethod;
  dataProcessingAccepted: boolean;
};

const initialForm: FormState = {
  amountEuros: '',
  kind: 'one_time_donation',
  paymentMethod: 'mb_way',
  dataProcessingAccepted: false,
};

const KIND_LABELS: Record<DonationClientKind, string> = {
  one_time_donation: 'Doação única',
  monthly_sponsorship: 'Patrocínio mensal',
};

const PAYMENT_LABELS: Record<DonationClientPaymentMethod, string> = {
  mb_way: 'MB Way',
  multibanco: 'Multibanco',
  card: 'Cartão',
  bank_transfer: 'Transferência bancária',
  unknown: 'Outro',
};

const PAYMENT_METHODS: DonationClientPaymentMethod[] = [
  'mb_way',
  'multibanco',
  'card',
  'bank_transfer',
];

export default function DoarScreen() {
  const { shelterId } = useLocalSearchParams<{ shelterId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileDonationResultViewModel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const amountCents = Math.round(parseFloat(form.amountEuros || '0') * 100);
  const canSubmit = !submitting && form.dataProcessingAccepted && amountCents > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
    const { data: { session } } = await supabase.auth.getSession();
    const donationClient = createDonationClient({
      workerBaseUrl: workerUrl(),
      donationsPath: '/donations',
      getAccessToken: async () => session?.access_token ?? null,
      fetch: globalThis.fetch,
    });
    const ui = createMobileDonationUi({ donationClient });
    const result = await ui.submitDonation({
      shelterId,
      amountCents,
      kind: form.kind,
      paymentMethod: form.paymentMethod,
      dataProcessingAccepted: true,
    });
    setViewModel(result);
    setSubmitting(false);
  };

  if (viewModel?.state === 'submitted') {
    const amountDisplay = (viewModel.amountCents / 100).toFixed(2);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <Text style={styles.amountDisplay}>{amountDisplay} {viewModel.currency}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Voltar ao abrigo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel?.state === 'submitted_automated') {
    const ref = viewModel.reference;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          {ref.method === 'multibanco' && (
            <Text style={styles.referenceText}>
              Entidade: {ref.entity} · Referência: {ref.reference}{ref.expiresAt ? ` · Válido até: ${new Date(ref.expiresAt).toLocaleDateString('pt-PT')}` : ''}
            </Text>
          )}
          {ref.method === 'mb_way' && (
            <Text style={styles.referenceText}>Aceite o pagamento no número {ref.phone}</Text>
          )}
          {ref.method === 'bank_transfer' && (
            <Text style={styles.referenceText}>IBAN: {ref.iban}</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Voltar ao abrigo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel?.state === 'failed') {
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
            onPress={() => {
              setViewModel(null);
              setSubmitting(false);
            }}
          >
            <Text style={styles.buttonText}>Tentar de novo</Text>
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
          <Text style={styles.title}>Fazer uma doação</Text>
          <Text style={styles.hint}>Escolhe o valor e o método de pagamento para fazer a tua doação.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Valor (€)</Text>
            <TextInput
              style={styles.input}
              value={form.amountEuros}
              onChangeText={(v) => setField('amountEuros', v)}
              editable={!submitting}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tipo de doação</Text>
            <View style={styles.optionRow}>
              {(['one_time_donation', 'monthly_sponsorship'] as DonationClientKind[]).map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.optionButton, form.kind === k && styles.optionButtonSelected]}
                  onPress={() => setField('kind', k)}
                  disabled={submitting}
                >
                  <Text
                    style={[styles.optionText, form.kind === k && styles.optionTextSelected]}
                  >
                    {KIND_LABELS[k]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Método de pagamento</Text>
            <View style={styles.optionGrid}>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.optionButton, form.paymentMethod === m && styles.optionButtonSelected]}
                  onPress={() => setField('paymentMethod', m)}
                  disabled={submitting}
                >
                  <Text
                    style={[styles.optionText, form.paymentMethod === m && styles.optionTextSelected]}
                  >
                    {PAYMENT_LABELS[m]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.label}>Aceito o tratamento de dados pessoais</Text>
            <Switch
              value={form.dataProcessingAccepted}
              onValueChange={(v) => setField('dataProcessingAccepted', v)}
              disabled={submitting}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.buttonText}>
              {submitting ? 'A processar...' : 'Doar'}
            </Text>
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
  amountDisplay: { color: '#0f172a', fontSize: 32, fontWeight: '800', textAlign: 'center', marginVertical: 8 },
  referenceText: { color: '#0f172a', fontSize: 15, fontWeight: '600', lineHeight: 22, textAlign: 'center', marginVertical: 8 },
  field: { gap: 6 },
  label: { color: '#374151', fontSize: 14, fontWeight: '600', flexShrink: 1 },
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
  optionRow: { flexDirection: 'row', gap: 8 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: {
    borderColor: '#d1d5db',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  optionButtonSelected: { borderColor: '#2aa7a2', backgroundColor: '#e6f7f6' },
  optionText: { color: '#374151', fontSize: 14, fontWeight: '500' },
  optionTextSelected: { color: '#2aa7a2', fontWeight: '700' },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
