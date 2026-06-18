import { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createShelterSearchClient } from '@pic4paws/client';
import { createMobileShelterSearchUi, type MobileShelterSearchResultViewModel } from '../../src/shelter-search';
import { workerUrl } from '../../src/env';

export default function AbrigosScreen() {
  const [viewModel, setViewModel] = useState<MobileShelterSearchResultViewModel | null>(null);

  useEffect(() => {
    setViewModel(null);
    const shelterSearchClient = createShelterSearchClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      fetch: globalThis.fetch,
    });
    const ui = createMobileShelterSearchUi({ shelterSearchClient });
    ui.searchShelters({}).then(setViewModel);
  }, []);

  if (viewModel === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar abrigos...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'empty') {
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

  if (viewModel.state === 'loaded') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.title}>{viewModel.title}</Text>
          {viewModel.shelters.map((shelter) => (
            <View key={shelter.id} style={styles.card}>
              <Text style={styles.cardTitle}>{shelter.name}</Text>
              <Text style={styles.cardMeta}>{shelter.city}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  list: { gap: 12, padding: 20 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  cardTitle: { color: '#0f172a', fontSize: 17, fontWeight: '700' },
  cardMeta: { color: '#64748b', fontSize: 14 },
});
