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
import { createPetPublishClient } from '@pic4paws/client';
import {
  createMobilePetPublishUi,
  type MobilePetPublishReadyViewModel,
  type MobilePetPublishResultViewModel,
} from '../../../src/pet-publish';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

type ViewModel =
  | MobilePetPublishReadyViewModel
  | { state: 'publishing'; title: string; message: string }
  | MobilePetPublishResultViewModel;

export default function PublicarScreen() {
  const { petId, petName = '' } = useLocalSearchParams<{ petId: string; petName?: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<ViewModel>({
    state: 'ready',
    title: petName ? `Publicar perfil de ${petName}` : 'Publicar perfil',
    message: 'Confirma que o rascunho está completo antes de publicar o perfil.',
    primaryAction: 'Publicar perfil',
    petId,
    petName,
  });

  const confirmPublish = useCallback(() => {
    setViewModel({
      state: 'publishing',
      title: 'A publicar perfil',
      message: 'Estamos a confirmar o rascunho e a publicar o perfil.',
    });
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const publishClient = createPetPublishClient({
      workerBaseUrl: workerUrl(),
      petDraftsPath: '/pets/drafts',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobilePetPublishUi({ publishClient });
    ui.publishPetDraft({ pet: { petId, petName } }).then(setViewModel);
  }, [petId, petName]);

  if (viewModel.state === 'publishing') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>{viewModel.title}</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'published') {
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
          <TouchableOpacity style={styles.button} onPress={confirmPublish}>
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
        <Text style={styles.message}>{viewModel.message}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={confirmPublish}>
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
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
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
