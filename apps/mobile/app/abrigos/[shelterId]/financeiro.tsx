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
import { createFinancialsClient } from '@pic4paws/client';
import {
  createMobileFinancialsDashboardUi,
  type MobileFinancialsDashboardState,
} from '../../../src/financials';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

export default function FinanceiroScreen() {
  const { shelterId } = useLocalSearchParams<{ shelterId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileFinancialsDashboardState | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const financialsClient = createFinancialsClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobileFinancialsDashboardUi({ financialsClient });
    ui.loadFinancials(shelterId).then(setViewModel);
  }, [shelterId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar resumo financeiro...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
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
          <Text style={styles.message}>Não foi possível carregar os dados financeiros.</Text>
          <TouchableOpacity style={styles.button} onPress={load}>
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { summary } = viewModel;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Resumo financeiro</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doações</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total recebido</Text>
            <Text style={styles.value}>
              {(summary.donations.paidTotalCents / 100).toFixed(2)} {summary.currency}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Número de doações</Text>
            <Text style={styles.value}>{summary.donations.count}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apadrinhamentos</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Ativos</Text>
            <Text style={styles.value}>{summary.sponsorships.activeCount}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total ativo</Text>
            <Text style={styles.value}>
              {(summary.sponsorships.activeTotalCents / 100).toFixed(2)} {summary.currency}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 16, padding: 20 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  section: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    padding: 10,
    textTransform: 'uppercase',
  },
  row: {
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: { color: '#64748b', fontSize: 14 },
  value: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
