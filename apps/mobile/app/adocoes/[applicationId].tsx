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
import { createAdoptionViewClient } from '@pic4paws/client';
import type { AdoptionApplicationStatus } from '@pic4paws/client';
import {
  createMobileAdoptionViewUi,
  type MobileAdoptionViewResultViewModel,
} from '../../src/adoption-view';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../src/env';

const STATUS_LABELS: Record<AdoptionApplicationStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Submetida',
  under_review: 'Em análise',
  more_info_requested: 'Informação solicitada',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
  withdrawn: 'Retirada',
  expired: 'Expirada',
};

export default function CandidaturaScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileAdoptionViewResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const adoptionViewClient = createAdoptionViewClient({
      workerBaseUrl: workerUrl(),
      adoptionsPath: '/adoptions',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobileAdoptionViewUi({ adoptionViewClient });
    ui.loadAdoptionView(applicationId).then(setViewModel);
  }, [applicationId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null || viewModel.state === 'idle' || viewModel.state === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar candidatura...</Text>
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
          <TouchableOpacity style={styles.button} onPress={load}>
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { application } = viewModel;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Estado</Text>
            <Text style={styles.rowValue}>
              {STATUS_LABELS[application.applicationStatus] ?? application.applicationStatus}
            </Text>
          </View>
          {application.petId ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Animal</Text>
              <TouchableOpacity onPress={() => router.push(`/animais/${application.petId}` as never)}>
                <Text style={styles.link}>Ver perfil do animal</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Abrigo</Text>
            <TouchableOpacity onPress={() => router.push(`/abrigos/${application.shelterId}` as never)}>
              <Text style={styles.link}>Ver abrigo</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Voltar</Text>
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
  rowValue: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  link: { color: '#2aa7a2', fontSize: 14, fontWeight: '600' },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 4,
    paddingVertical: 14,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
