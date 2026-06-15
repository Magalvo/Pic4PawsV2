import { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { createShelterProfileClient } from '@pic4paws/client';
import { createMobileShelterProfileUi, type MobileShelterProfileResultViewModel } from '../../src/shelter-profile';
import { workerUrl } from '../../src/env';

export default function AbrigoScreen() {
  const { shelterId } = useLocalSearchParams<{ shelterId: string }>();
  const [viewModel, setViewModel] = useState<MobileShelterProfileResultViewModel | null>(null);

  useEffect(() => {
    setViewModel(null);
    const shelterProfileClient = createShelterProfileClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      fetch: globalThis.fetch,
    });
    const ui = createMobileShelterProfileUi({ shelterProfileClient });
    ui.loadProfile(shelterId).then(setViewModel);
  }, [shelterId]);

  if (viewModel === null || viewModel.state === 'idle') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar abrigo...</Text>
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

  const { shelter } = viewModel;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{shelter.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{shelter.city}</Text>
          {shelter.district ? <Text style={styles.meta}>{shelter.district}</Text> : null}
        </View>
        {shelter.publicEmail ? (
          <Text style={styles.contact}>{shelter.publicEmail}</Text>
        ) : null}
        {shelter.publicPhone ? (
          <Text style={styles.contact}>{shelter.publicPhone}</Text>
        ) : null}
        {shelter.description ? (
          <Text style={styles.description}>{shelter.description}</Text>
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
  contact: { color: '#2aa7a2', fontSize: 15 },
  description: { color: '#334155', fontSize: 15, lineHeight: 24 },
});
