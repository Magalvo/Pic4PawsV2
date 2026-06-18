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
import { createPetStatusHistoryClient } from '@pic4paws/client';
import type { ShelterPetStatus } from '@pic4paws/client';
import {
  createMobilePetStatusHistoryUi,
  type MobilePetStatusHistoryState,
} from '../../../src/pet-status-history';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

const STATUS_LABELS: Record<ShelterPetStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  adoption_pending: 'Adoção pendente',
  adopted: 'Adotado',
  not_available: 'Indisponível',
  archived: 'Arquivado',
};

export default function HistoricoScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobilePetStatusHistoryState | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const petStatusHistoryClient = createPetStatusHistoryClient({
      workerBaseUrl: workerUrl(),
      petFeedPath: '/pets',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobilePetStatusHistoryUi({ petStatusHistoryClient });
    ui.loadHistory(petId).then(setViewModel);
  }, [petId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar histórico...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.message}>Não tens acesso ao histórico deste animal.</Text>
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
          <Text style={styles.message}>Não foi possível carregar o histórico.</Text>
          <TouchableOpacity style={styles.button} onPress={load}>
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel.events.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Histórico de estados</Text>
          <Text style={styles.message}>Ainda não há alterações de estado registadas.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Histórico de estados</Text>
        {viewModel.events.map((evt) => (
          <View key={evt.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.statusFrom}>{STATUS_LABELS[evt.fromStatus as ShelterPetStatus] ?? evt.fromStatus}</Text>
              <Text style={styles.arrow}> → </Text>
              <Text style={styles.statusTo}>{STATUS_LABELS[evt.toStatus as ShelterPetStatus] ?? evt.toStatus}</Text>
            </View>
            <Text style={styles.date}>
              {new Date(evt.createdAt).toLocaleDateString('pt-PT')}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 10, padding: 20 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  row: { alignItems: 'center', flexDirection: 'row' },
  statusFrom: { color: '#64748b', fontSize: 14 },
  arrow: { color: '#94a3b8', fontSize: 14 },
  statusTo: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  date: { color: '#94a3b8', fontSize: 12 },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
