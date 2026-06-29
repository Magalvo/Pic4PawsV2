import { useState, useEffect } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createPetProfileClient, createMediaUrlClient, type PetProfilePet } from '@pic4paws/client';
import {
  createMobilePetProfileUi,
  type MobilePetProfileResultViewModel,
} from '../../../src/pet-profile';
import { workerUrl } from '../../../src/env';

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕', cat: '🐈', horse: '🐴', donkey: '🫏',
  guinea_pig: '🐹', rabbit: '🐇', bird: '🦜', other: '🐾',
};

const SPECIES_LABEL: Record<string, string> = {
  dog: 'Cão', cat: 'Gato', horse: 'Cavalo', donkey: 'Burro',
  guinea_pig: 'Porquinho-da-índia', rabbit: 'Coelho', bird: 'Ave', other: 'Animal',
};

function MedicalBadge({ label, value }: { label: string; value: boolean | null | undefined }) {
  if (value == null) return null;
  return (
    <View style={[styles.badge, value ? styles.badgePositive : styles.badgeNeutral]}>
      <Text style={[styles.badgeText, value ? styles.badgeTextPositive : styles.badgeTextNeutral]}>
        {value ? '✓' : '✗'} {label}
      </Text>
    </View>
  );
}

function PetProfileLoaded({ pet }: { pet: PetProfilePet }) {
  const router = useRouter();
  const emoji = pet.species ? (SPECIES_EMOJI[pet.species] ?? '🐾') : '🐾';
  const speciesLabel = pet.species ? (SPECIES_LABEL[pet.species] ?? 'Animal') : 'Animal';
  const { medical } = pet;
  const hasMedical =
    medical.vaccinated != null || medical.sterilized != null || medical.microchipped != null;
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pet.heroMediaId) return;
    const client = createMediaUrlClient({ workerBaseUrl: workerUrl(), mediaUrlPath: '/media', fetch: globalThis.fetch });
    client.getMediaUrl(pet.heroMediaId).then((result) => { if (result.ok) setImgUrl(result.url); });
  }, [pet.heroMediaId]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Hero */}
        <View style={styles.hero}>
          {imgUrl
            ? <Image source={{ uri: imgUrl }} style={styles.heroImage} resizeMode="cover" />
            : <Text style={styles.heroEmoji}>{emoji}</Text>
          }
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Disponível para adopção</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Voltar</Text>
          </TouchableOpacity>

          {/* Name + meta */}
          <Text style={styles.name}>{pet.name ?? 'Animal sem nome'}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{speciesLabel}</Text>
            {pet.locationLabel && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.meta}>📍 {pet.locationLabel}</Text>
              </>
            )}
          </View>

          {/* Description */}
          {pet.shortDescription && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sobre mim</Text>
              <Text style={styles.description}>{pet.shortDescription}</Text>
            </View>
          )}

          {/* Medical */}
          {hasMedical && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estado de saúde</Text>
              <View style={styles.badgeRow}>
                <MedicalBadge label="Vacinado" value={medical.vaccinated} />
                <MedicalBadge label="Esterilizado" value={medical.sterilized} />
                <MedicalBadge label="Microchipado" value={medical.microchipped} />
                {medical.specialNeeds && (
                  <View style={styles.badgeAmber}>
                    <Text style={styles.badgeTextAmber}>⚠ Necessidades especiais</Text>
                  </View>
                )}
              </View>
              {medical.publicNotes && (
                <Text style={styles.medicalNotes}>{medical.publicNotes}</Text>
              )}
            </View>
          )}

          {/* Sponsorship teaser */}
          <View style={styles.sponsorCard}>
            <Text style={styles.sponsorTitle}>Apadrinhar este animal</Text>
            <Text style={styles.sponsorMessage}>
              Contribui mensalmente para os cuidados deste animal mesmo que não possas adoptá-lo.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA bar */}
      <View style={styles.ctaBar}>
        <TouchableOpacity style={styles.ctaTeal}>
          <Text style={styles.ctaText}>🤲 Apadrinha</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctaOrange}>
          <Text style={styles.ctaText}>🐾 Adoptar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function AnimalScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
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
      <SafeAreaView style={styles.center}>
        <Text style={styles.stateEmoji}>🐾</Text>
        <Text style={styles.loadingText}>A carregar animal...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'not_found') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.stateEmoji}>🔍</Text>
        <Text style={styles.errorTitle}>{viewModel.title}</Text>
        <Text style={styles.errorMessage}>{viewModel.message}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>← Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.stateEmoji}>⚠️</Text>
        <Text style={styles.errorTitle}>{viewModel.title}</Text>
        <Text style={styles.errorMessage}>{viewModel.message}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>← Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return <PetProfileLoaded pet={viewModel.pet} />;
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
  stateEmoji: { fontSize: 40, textAlign: 'center' },
  loadingText: { color: '#64748b', fontSize: 15, marginTop: 12 },
  errorTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  linkText: { color: '#2aa7a2', fontSize: 14, fontWeight: '600', marginTop: 16 },
  // Hero
  hero: {
    aspectRatio: 4 / 5,
    maxHeight: 400,
    backgroundColor: '#e6f7f6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroImage: { width: '100%', height: '100%' },
  heroEmoji: { fontSize: 80 },
  heroBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#ec5b13',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroBadgeText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  // Content
  content: { padding: 20 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#64748b', fontSize: 14 },
  name: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 20 },
  meta: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  metaDot: { color: '#94a3b8', fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#0f172a', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  description: { color: '#334155', fontSize: 14, lineHeight: 22 },
  // Badges
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgePositive: { backgroundColor: '#e6f7f6' },
  badgeNeutral: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextPositive: { color: '#2aa7a2' },
  badgeTextNeutral: { color: '#64748b' },
  badgeAmber: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
  },
  badgeTextAmber: { color: '#92400e', fontSize: 12, fontWeight: '600' },
  medicalNotes: { color: '#64748b', fontSize: 13, lineHeight: 20, marginTop: 8 },
  // Sponsorship teaser
  sponsorCard: {
    backgroundColor: '#e6f7f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sponsorTitle: { color: '#2aa7a2', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  sponsorMessage: { color: '#334155', fontSize: 13, lineHeight: 20 },
  // Sticky CTA
  ctaBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  ctaTeal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 24,
    paddingVertical: 14,
  },
  ctaOrange: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ec5b13',
    borderRadius: 24,
    paddingVertical: 14,
  },
  ctaText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
