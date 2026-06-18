import { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { createSponsorshipClient } from '@pic4paws/client';
import type { SponsorshipClientRecurringInterval } from '@pic4paws/client';
import {
  createMobileSponsorshipUi,
  type MobileSponsorshipResultViewModel,
} from '../../../src/sponsorship';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

const INTERVALS: Array<{ value: SponsorshipClientRecurringInterval; label: string }> = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'annual', label: 'Anual' },
];

const IDLE_STATE: MobileSponsorshipResultViewModel = {
  state: 'idle',
  title: 'Apadrinhar',
  message: 'Preenche os detalhes para iniciar o apadrinhamento.',
  primaryAction: 'Apadrinhar',
};

export default function ApadrinhamentoScreen() {
  const { shelterId } = useLocalSearchParams<{ shelterId: string }>();
  const [viewModel, setViewModel] = useState<MobileSponsorshipResultViewModel>(IDLE_STATE);
  const [amountEuros, setAmountEuros] = useState('');
  const [interval, setInterval] = useState<SponsorshipClientRecurringInterval>('monthly');

  const makeUi = useCallback(() => {
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const sponsorshipClient = createSponsorshipClient({
      workerBaseUrl: workerUrl(),
      sponsorshipsPath: '/sponsorships',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    return createMobileSponsorshipUi({ sponsorshipClient });
  }, []);

  const handleSubmit = useCallback(async () => {
    const parsed = parseFloat(amountEuros.replace(',', '.'));
    if (!parsed || parsed <= 0) return;
    const amountCents = Math.round(parsed * 100);
    setViewModel({ state: 'submitting', title: 'A processar...', message: 'A criar o apadrinhamento.' });
    const result = await makeUi().submitSponsorship({
      shelterId,
      amountCents,
      paymentMethod: 'card',
      recurringInterval: interval,
      dataProcessingAccepted: true,
    });
    setViewModel(result);
  }, [amountEuros, interval, shelterId, makeUi]);

  if (viewModel.state === 'submitting') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>{viewModel.title}</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'submitted') {
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
          <TouchableOpacity style={styles.button} onPress={() => setViewModel(IDLE_STATE)}>
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
        <Text style={styles.label}>Valor mensal (€)</Text>
        <TextInput
          style={styles.input}
          value={amountEuros}
          onChangeText={setAmountEuros}
          keyboardType="decimal-pad"
          placeholder="ex: 10.00"
        />
        <Text style={styles.label}>Periodicidade</Text>
        <View style={styles.intervalRow}>
          {INTERVALS.map(({ value, label }) => (
            <TouchableOpacity
              key={value}
              style={[styles.intervalBtn, interval === value && styles.intervalBtnActive]}
              onPress={() => setInterval(value)}
            >
              <Text style={[styles.intervalText, interval === value && styles.intervalTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{viewModel.primaryAction}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 12, padding: 24 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  label: { color: '#64748b', fontSize: 13, fontWeight: '600', marginTop: 4 },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  intervalRow: { flexDirection: 'row', gap: 8 },
  intervalBtn: {
    alignItems: 'center',
    borderColor: '#e2e8f0',
    borderRadius: 6,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  intervalBtnActive: { backgroundColor: '#2aa7a2', borderColor: '#2aa7a2' },
  intervalText: { color: '#64748b', fontSize: 14 },
  intervalTextActive: { color: '#ffffff', fontWeight: '700' },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 4,
    paddingVertical: 14,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
