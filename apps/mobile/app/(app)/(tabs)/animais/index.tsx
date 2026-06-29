import { useState, useEffect } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { createPetFeedClient, type PetFeedPet } from '@pic4paws/client';
import { createMobilePetFeedUi, type MobilePetFeedResultViewModel } from '../../../../src/pet-feed';
import { workerUrl } from '../../../../src/env';

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', horse: '🐴', donkey: '🫏',
  guinea_pig: '🐹', rabbit: '🐇', bird: '🦜', other: '🐾',
};

const SPECIES_LABEL: Record<string, string> = {
  dog: 'Cão', cat: 'Gato', horse: 'Cavalo', donkey: 'Burro',
  guinea_pig: 'Porquinho-da-índia', rabbit: 'Coelho', bird: 'Ave', other: 'Animal',
};

function PetCard({ pet, onPress }: { pet: PetFeedPet; onPress: () => void }) {
  const emoji = pet.species ? (SPECIES_EMOJI[pet.species] ?? '🐾') : '🐾';
  const speciesLabel = pet.species ? (SPECIES_LABEL[pet.species] ?? 'Animal') : 'Animal';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardHero}>
        <Text style={styles.cardEmoji}>{emoji}</Text>
        <View style={styles.cardBadge}>
          <Text style={styles.cardBadgeText}>Disponível</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardName} numberOfLines={1}>
          {pet.name ?? 'Sem nome'}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {speciesLabel}{pet.locationLabel ? ` · ${pet.locationLabel}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AnimaisScreen() {
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobilePetFeedResultViewModel | null>(null);

  useEffect(() => {
    setViewModel(null);
    const feedClient = createPetFeedClient({
      workerBaseUrl: workerUrl(),
      petFeedPath: '/pets',
      fetch: globalThis.fetch,
    });
    const ui = createMobilePetFeedUi({ feedClient });
    setViewModel(ui.getInitialState());
    ui.loadFeed({ query: {} }).then(setViewModel);
  }, []);

  if (viewModel === null || viewModel.state === 'idle') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.stateEmoji}>🐾</Text>
        <Text style={styles.loadingText}>A carregar animais...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.stateEmoji}>🔍</Text>
        <Text style={styles.stateTitle}>{viewModel.title}</Text>
        <Text style={styles.stateMessage}>{viewModel.message}</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.stateEmoji}>⚠️</Text>
        <Text style={styles.stateTitle}>{viewModel.title}</Text>
        <Text style={styles.stateMessage}>{viewModel.message}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={viewModel.pets}
        numColumns={2}
        keyExtractor={(pet) => pet.id}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.screenTitle}>{viewModel.title}</Text>
        }
        renderItem={({ item: pet }) => (
          <PetCard
            pet={pet}
            onPress={() => router.push(`/animais/${pet.id}` as never)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  center: {
    flex: 1,
    backgroundColor: '#f8f6f6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  list: { padding: 16, paddingBottom: 32 },
  row: { gap: 12, marginBottom: 12 },
  screenTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  stateEmoji: { fontSize: 40, textAlign: 'center' },
  loadingText: { color: '#64748b', fontSize: 15, marginTop: 12 },
  stateTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  stateMessage: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardPressed: { opacity: 0.85 },
  cardHero: {
    aspectRatio: 4 / 5,
    backgroundColor: '#e6f7f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 44 },
  cardBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#ec5b13',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cardBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  cardContent: { padding: 10, gap: 3 },
  cardName: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  cardMeta: { color: '#64748b', fontSize: 11 },
});
