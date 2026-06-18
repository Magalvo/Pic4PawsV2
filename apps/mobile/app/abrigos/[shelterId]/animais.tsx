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
import { createShelterPetListClient } from '@pic4paws/client';
import type { ShelterPetStatus } from '@pic4paws/client';
import {
  createMobileShelterPetListUi,
  type MobileShelterPetListResultViewModel,
} from '../../../src/shelter-pet-list';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

const STATUS_LABELS: Record<ShelterPetStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  adoption_pending: 'Adoção pendente',
  adopted: 'Adotado',
  not_available: 'Indisponível',
  archived: 'Arquivado',
};

const STATUS_COLORS: Record<ShelterPetStatus, string> = {
  draft: '#94a3b8',
  published: '#22c55e',
  adoption_pending: '#f59e0b',
  adopted: '#3b82f6',
  not_available: '#64748b',
  archived: '#94a3b8',
};

export default function AnimaisArigoScreen() {
  const { shelterId } = useLocalSearchParams<{ shelterId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileShelterPetListResultViewModel | null>(null);

  const load = useCallback(() => {
    setViewModel(null);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const shelterPetListClient = createShelterPetListClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    const ui = createMobileShelterPetListUi({ shelterPetListClient });
    ui.loadShelterPets(shelterId).then(setViewModel);
  }, [shelterId]);

  useEffect(() => { load(); }, [load]);

  if (viewModel === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar animais...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
        </View>
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
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={load}>
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
        {viewModel.pets.map((pet) => (
          <TouchableOpacity
            key={pet.petId}
            style={styles.card}
            onPress={() => router.push(`/animais/${pet.petId}` as never)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.petName}>{pet.name ?? pet.petId}</Text>
              <Text style={[styles.statusBadge, { color: STATUS_COLORS[pet.status] ?? '#64748b' }]}>
                {STATUS_LABELS[pet.status] ?? pet.status}
              </Text>
            </View>
            {pet.species ? <Text style={styles.cardSub}>{pet.species}</Text> : null}
            {pet.locationLabel ? <Text style={styles.cardSub}>{pet.locationLabel}</Text> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 10, padding: 20 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  petName: { color: '#0f172a', fontSize: 15, fontWeight: '700', flexShrink: 1 },
  statusBadge: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  cardSub: { color: '#64748b', fontSize: 13 },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
