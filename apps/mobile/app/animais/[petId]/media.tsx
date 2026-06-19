import { useState, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import {
  createMediaUploadFlowClient,
  createPetMediaAttachClient,
  createPetMediaUploadAttachFlowClient,
} from '@pic4paws/client';
import {
  createMobilePetMediaUploadUi,
  type MobilePetMediaUploadReadyViewModel,
  type MobilePetMediaUploadResultViewModel,
} from '../../../src/pet-media-upload';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

type ViewModel = MobilePetMediaUploadReadyViewModel | MobilePetMediaUploadResultViewModel;

export default function MediaScreen() {
  const { petId, petName = '', shelterId = '' } = useLocalSearchParams<{
    petId: string;
    petName?: string;
    shelterId?: string;
  }>();
  const router = useRouter();
  const [fileUri, setFileUri] = useState('');
  const [uploading, setUploading] = useState(false);
  const [viewModel, setViewModel] = useState<ViewModel>(() =>
    createMobilePetMediaUploadUi({
      uploadAttachFlow: {
        uploadAndAttachPetMedia: async () => { throw new Error('unreachable'); },
      },
    }).getInitialState({ petId, petName, shelterId })
  );

  const makeUi = useCallback(() => {
    const supabase = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const uploadClient = createMediaUploadFlowClient({
      workerBaseUrl: workerUrl(),
      mediaUploadPath: '/uploads/media',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const attachClient = createPetMediaAttachClient({
      workerBaseUrl: workerUrl(),
      petDraftsPath: '/pets/drafts',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const uploadAttachFlow = createPetMediaUploadAttachFlowClient({
      uploadClient,
      attachClient,
      generateMediaId: () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
    });
    return createMobilePetMediaUploadUi({ uploadAttachFlow });
  }, []);

  const handleUpload = useCallback(async () => {
    const uri = fileUri.trim();
    if (!uri) return;
    setUploading(true);
    const ui = makeUi();
    const fetchResponse = await globalThis.fetch(uri);
    const blob = await fetchResponse.blob();
    const result = await ui.uploadSelectedImage({
      pet: { petId, petName, shelterId },
      file: {
        name: uri.split('/').pop() ?? 'imagem.jpg',
        type: blob.type || 'image/jpeg',
        size: blob.size,
        body: blob,
      },
    });
    setViewModel(result);
    setUploading(false);
  }, [makeUi, petId, petName, shelterId, fileUri]);

  if (viewModel.state === 'uploaded') {
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
          <TouchableOpacity style={styles.button} onPress={handleUpload} disabled={!fileUri.trim()}>
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
      <View style={styles.content}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>
        <TextInput
          style={styles.input}
          value={fileUri}
          onChangeText={setFileUri}
          placeholder="URI do ficheiro de imagem"
          autoCapitalize="none"
          editable={!uploading}
        />
        <TouchableOpacity
          style={[styles.button, (!fileUri.trim() || uploading) && styles.disabled]}
          onPress={handleUpload}
          disabled={!fileUri.trim() || uploading}
        >
          <Text style={styles.buttonText}>
            {uploading ? 'A enviar...' : viewModel.primaryAction}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} disabled={uploading}>
          <Text style={[styles.buttonText, { color: '#0f172a' }]}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 16, padding: 24 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
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
  button: { alignItems: 'center', backgroundColor: '#2aa7a2', borderRadius: 6, paddingVertical: 14 },
  secondaryButton: { alignItems: 'center', backgroundColor: '#e2e8f0', borderRadius: 6, paddingVertical: 14 },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
