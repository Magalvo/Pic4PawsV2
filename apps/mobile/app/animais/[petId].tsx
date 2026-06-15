import { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createPetProfileClient } from '@pic4paws/client';
import { createMobilePetProfileUi, type MobilePetProfileResultViewModel } from '../../src/pet-profile';
import { workerUrl } from '../../src/env';

export default function AnimalScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const [viewModel, setViewModel] = useState<MobilePetProfileResultViewModel | null>(null);

  useEffect(() => {
    setViewModel(null);
    const profileClient = createPetProfileClient({
      workerBaseUrl: workerUrl(),
      petFeedPath: '/pets',
      fetch: globalThis.fetch,
    });
    const ui = createMobilePetProfileUi({ profileClient });
    ui.loadProfile(petId).then(setViewModel);
  }, [petId]);

  if (viewModel === null || viewModel.state === 'idle') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar animal...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'not_found') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>
      </SafeAreaView>
    );
  }

  const { pet } = viewModel;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{pet.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{pet.species}</Text>
          {pet.locationLabel ? <Text style={styles.meta}>{pet.locationLabel}</Text> : null}
        </View>
        {pet.shortDescription ? (
          <Text style={styles.description}>{pet.shortDescription}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 16, padding: 20 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '800' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  metaRow: { flexDirection: 'row', gap: 12 },
  meta: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  description: { color: '#334155', fontSize: 15, lineHeight: 24 },
});
