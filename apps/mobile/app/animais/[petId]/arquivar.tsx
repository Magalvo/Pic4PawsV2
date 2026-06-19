import { useState, useCallback } from 'react';
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
import { createPetArchiveClient } from '@pic4paws/client';
import {
  createMobilePetArchiveUi,
  type MobilePetArchiveIdleState,
  type MobilePetArchiveSubmittingState,
  type MobilePetArchiveResultViewModel,
} from '../../../src/pet-archive';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

type ViewModel =
  | MobilePetArchiveIdleState
  | MobilePetArchiveSubmittingState
  | MobilePetArchiveResultViewModel;

const IDLE: MobilePetArchiveIdleState = {
  state: 'idle',
  title: 'Arquivar animal',
  message: 'Confirma que queres arquivar este animal.',
  primaryAction: 'Arquivar',
};

export default function ArquivarScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<ViewModel>(IDLE);

  const confirmArchive = useCallback(() => {
    setViewModel({ state: 'submitting', title: 'A processar...', message: 'A arquivar o animal.' });
    const supabase = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const petArchiveClient = createPetArchiveClient({
      workerBaseUrl: workerUrl(),
      petFeedPath: '/pets',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobilePetArchiveUi({ petArchiveClient });
    ui.archivePet(petId).then(setViewModel);
  }, [petId]);

  if (viewModel.state === 'submitting') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>{viewModel.title}</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'archived' || viewModel.state === 'published') {
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

  if (viewModel.state === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={confirmArchive}>
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={[styles.buttonText, { color: '#0f172a' }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.warning}>{viewModel.message}</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={confirmArchive}>
          <Text style={styles.buttonText}>{viewModel.primaryAction}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={[styles.buttonText, { color: '#0f172a' }]}>Cancelar</Text>
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
  warning: { color: '#ef4444', fontSize: 15, lineHeight: 22 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingVertical: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    paddingVertical: 14,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    paddingVertical: 14,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
