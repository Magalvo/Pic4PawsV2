import { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { createPetDraftClient } from '@pic4paws/client';
import type { LoadPetDraftClientDraft } from '@pic4paws/client';
import {
  createMobilePetDraftUi,
  type MobilePetDraftLoadViewModel,
  type MobilePetDraftResultViewModel,
} from '../../../../src/pet-draft';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../../src/env';

type MedicalForm = {
  vaccinated: boolean;
  sterilized: boolean;
  microchipped: boolean;
  specialNeeds: boolean;
};

type FormState = {
  name: string;
  species: string;
  locationLabel: string;
  shortDescription: string;
  heroMediaId: string;
  shelterId: string;
  medical: MedicalForm;
};

const fromDraft = (draft: LoadPetDraftClientDraft): FormState => ({
  name: draft.name ?? '',
  species: draft.species ?? '',
  locationLabel: draft.locationLabel ?? '',
  shortDescription: draft.shortDescription ?? '',
  heroMediaId: draft.heroMediaId ?? '',
  shelterId: draft.shelterId,
  medical: {
    vaccinated: Boolean(draft.medical.vaccinated),
    sterilized: Boolean(draft.medical.sterilized),
    microchipped: Boolean(draft.medical.microchipped),
    specialNeeds: Boolean(draft.medical.specialNeeds),
  },
});

const makeDraftClient = (getAccessToken: () => Promise<string | null>) =>
  createPetDraftClient({
    workerBaseUrl: workerUrl(),
    petDraftsPath: '/pets/drafts',
    getAccessToken,
    fetch: globalThis.fetch,
  });

export default function EditarDraftScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const [loadViewModel, setLoadViewModel] = useState<MobilePetDraftLoadViewModel | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<MobilePetDraftResultViewModel | null>(null);

  useEffect(() => {
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const ui = createMobilePetDraftUi({ draftClient: makeDraftClient(getAccessToken) });
    ui.loadDraft(petId).then((result) => {
      setLoadViewModel(result);
      if (result.state === 'loaded') {
        setForm(fromDraft(result.draft));
      }
    });
  }, [petId]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);

  const setMedical = (key: keyof MedicalForm, value: boolean) =>
    setForm((prev) => prev ? { ...prev, medical: { ...prev.medical, [key]: value } } : prev);

  const handleSave = useCallback(() => {
    if (!form) return;
    setSaving(true);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const ui = createMobilePetDraftUi({ draftClient: makeDraftClient(getAccessToken) });
    ui.updateDraft({
      draft: {
        petId,
        shelterId: form.shelterId,
        name: form.name || null,
        species: (form.species || null) as 'dog' | 'cat' | 'other' | null,
        locationLabel: form.locationLabel || null,
        shortDescription: form.shortDescription || null,
        mediaIds: [],
        heroMediaId: form.heroMediaId || null,
        medical: form.medical,
      },
    }).then((result) => {
      setSaveResult(result);
      setSaving(false);
    });
  }, [petId, form]);

  if (!loadViewModel) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar rascunho...</Text>
      </SafeAreaView>
    );
  }

  if (loadViewModel.state === 'not_found' || loadViewModel.state === 'forbidden') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{loadViewModel.title}</Text>
          <Text style={styles.message}>{loadViewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loadViewModel.state === 'failed' && !form) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{loadViewModel.title}</Text>
          <Text style={styles.message}>{loadViewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (saveResult?.state === 'saved') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{saveResult.title}</Text>
          <Text style={styles.message}>{saveResult.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (saveResult?.state === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{saveResult.title}</Text>
          <Text style={styles.message}>{saveResult.message}</Text>
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={[styles.buttonText, { color: '#0f172a' }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!form) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Editar rascunho</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nome do animal</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => setField('name', v)}
            editable={!saving}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Espécie (dog / cat / other)</Text>
          <TextInput
            style={styles.input}
            value={form.species}
            onChangeText={(v) => setField('species', v)}
            editable={!saving}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Localização</Text>
          <TextInput
            style={styles.input}
            value={form.locationLabel}
            onChangeText={(v) => setField('locationLabel', v)}
            editable={!saving}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descrição curta</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.shortDescription}
            onChangeText={(v) => setField('shortDescription', v)}
            editable={!saving}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>ID da imagem principal</Text>
          <TextInput
            style={styles.input}
            value={form.heroMediaId}
            onChangeText={(v) => setField('heroMediaId', v)}
            editable={!saving}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Vacinado</Text>
          <Switch value={form.medical.vaccinated} onValueChange={(v) => setMedical('vaccinated', v)} disabled={saving} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Esterilizado</Text>
          <Switch value={form.medical.sterilized} onValueChange={(v) => setMedical('sterilized', v)} disabled={saving} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Microchip</Text>
          <Switch value={form.medical.microchipped} onValueChange={(v) => setMedical('microchipped', v)} disabled={saving} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Necessidades especiais</Text>
          <Switch value={form.medical.specialNeeds} onValueChange={(v) => setMedical('specialNeeds', v)} disabled={saving} />
        </View>

        <TouchableOpacity style={[styles.button, saving && styles.disabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'A guardar...' : 'Guardar rascunho'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} disabled={saving}>
          <Text style={[styles.buttonText, { color: '#0f172a' }]}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 16, padding: 24 },
  heading: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  field: { gap: 6 },
  label: { color: '#374151', fontSize: 14, fontWeight: '600', flexShrink: 1 },
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
  textarea: { minHeight: 72, textAlignVertical: 'top' },
  toggleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  title: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  button: { alignItems: 'center', backgroundColor: '#2aa7a2', borderRadius: 6, paddingVertical: 14 },
  secondaryButton: { alignItems: 'center', backgroundColor: '#e2e8f0', borderRadius: 6, paddingVertical: 14 },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
