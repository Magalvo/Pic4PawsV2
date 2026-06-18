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
import { createShelterDeletionClient } from '@pic4paws/client';
import {
  createMobileShelterDeletionUi,
  type MobileShelterDeletionState,
} from '../../../src/shelter-delete';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

const IDLE: MobileShelterDeletionState = {
  state: 'idle',
  title: 'Eliminar abrigo',
};

export default function EliminarArigoScreen() {
  const { shelterId } = useLocalSearchParams<{ shelterId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileShelterDeletionState>(IDLE);

  const confirmDelete = useCallback(() => {
    setViewModel({ state: 'submitting', title: 'A eliminar...' });
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const shelterDeletionClient = createShelterDeletionClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobileShelterDeletionUi({ shelterDeletionClient });
    ui.deleteShelter(shelterId).then(setViewModel);
  }, [shelterId]);

  if (viewModel.state === 'submitting') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>{viewModel.title}</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'deleted') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/abrigos' as never)}>
            <Text style={styles.buttonText}>Voltar ao início</Text>
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
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
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
        <Text style={styles.warning}>
          Esta ação é irreversível. O abrigo e todos os seus dados serão desativados.
        </Text>
        <TouchableOpacity style={styles.dangerButton} onPress={confirmDelete}>
          <Text style={styles.buttonText}>Confirmar eliminação</Text>
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
