import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createShelterUpdateClient } from '@pic4paws/client';
import {
  createMobileShelterUpdateUi,
  type MobileShelterUpdateState,
} from '../../../src/shelter-update';
import { mobileSupabaseClient } from '../../../src/supabase';
import { workerUrl } from '../../../src/env';

type ShelterKind = 'shelter' | 'sanctuary' | 'association' | 'foster_network';

const KIND_LABELS: Record<ShelterKind, string> = {
  shelter: 'Canil / Gatil',
  sanctuary: 'Santuário',
  association: 'Associação',
  foster_network: 'Rede de acolhimento',
};

const KINDS: ShelterKind[] = ['shelter', 'sanctuary', 'association', 'foster_network'];

type FormState = {
  name: string;
  kind: ShelterKind;
  city: string;
  district: string;
  publicEmail: string;
  publicPhone: string;
  description: string;
};

const initialForm: FormState = {
  name: '',
  kind: 'shelter',
  city: '',
  district: '',
  publicEmail: '',
  publicPhone: '',
  description: '',
};

export default function EditarAbrigoScreen() {
  const { shelterId } = useLocalSearchParams<{ shelterId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileShelterUpdateState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const { data: { session } } = await mobileSupabaseClient.auth.getSession();
    const shelterUpdateClient = createShelterUpdateClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken: async () => session?.access_token ?? null,
      fetch: globalThis.fetch,
    });
    const ui = createMobileShelterUpdateUi({ shelterUpdateClient });

    const payload: Parameters<typeof ui.updateShelter>[1] = {
      kind: form.kind,
      district: form.district.trim() || null,
      publicEmail: form.publicEmail.trim() || null,
      publicPhone: form.publicPhone.trim() || null,
      description: form.description.trim() || null,
    };
    if (form.name.trim()) payload.name = form.name.trim();
    if (form.city.trim()) payload.city = form.city.trim();

    const result = await ui.updateShelter(shelterId, payload);
    setViewModel(result);
    setSubmitting(false);
  };

  if (viewModel?.state === 'updated') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push(`/abrigos/${viewModel.shelterId}` as never)}
          >
            <Text style={styles.buttonText}>Ver abrigo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel?.state === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          {viewModel.status === 'unauthenticated' && (
            <TouchableOpacity style={styles.button} onPress={() => router.push('/entrar' as never)}>
              <Text style={styles.buttonText}>Entrar na conta</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => { setViewModel(null); setSubmitting(false); }}
          >
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Editar abrigo</Text>
          <Text style={styles.hint}>Preenche apenas os campos que pretendes alterar.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nome do abrigo</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setField('name', v)}
              editable={!submitting}
              autoCapitalize="words"
              placeholder="Novo nome (opcional)"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tipo</Text>
            <View style={styles.optionGrid}>
              {KINDS.map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.optionButton, form.kind === k && styles.optionButtonSelected]}
                  onPress={() => setField('kind', k)}
                  disabled={submitting}
                >
                  <Text style={[styles.optionText, form.kind === k && styles.optionTextSelected]}>
                    {KIND_LABELS[k]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput
              style={styles.input}
              value={form.city}
              onChangeText={(v) => setField('city', v)}
              editable={!submitting}
              autoCapitalize="words"
              placeholder="Nova cidade (opcional)"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Distrito</Text>
            <TextInput
              style={styles.input}
              value={form.district}
              onChangeText={(v) => setField('district', v)}
              editable={!submitting}
              autoCapitalize="words"
              placeholder="Distrito (deixa em branco para remover)"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email público</Text>
            <TextInput
              style={styles.input}
              value={form.publicEmail}
              onChangeText={(v) => setField('publicEmail', v)}
              editable={!submitting}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Email (deixa em branco para remover)"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Telefone público</Text>
            <TextInput
              style={styles.input}
              value={form.publicPhone}
              onChangeText={(v) => setField('publicPhone', v)}
              editable={!submitting}
              keyboardType="phone-pad"
              placeholder="Telefone (deixa em branco para remover)"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={(v) => setField('description', v)}
              editable={!submitting}
              multiline
              numberOfLines={4}
              placeholder="Descrição (deixa em branco para remover)"
              placeholderTextColor="#9ca3af"
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>
              {submitting ? 'A guardar...' : 'Guardar alterações'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => router.push(`/abrigos/${shelterId}/verificar` as never)}
          >
            <Text style={styles.buttonText}>Verificar abrigo</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 16, padding: 24 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  hint: { color: '#475569', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  field: { gap: 6 },
  label: { color: '#374151', fontSize: 14, fontWeight: '600' },
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
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionButton: {
    borderColor: '#d1d5db',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  optionButtonSelected: { borderColor: '#2aa7a2', backgroundColor: '#e6f7f6' },
  optionText: { color: '#374151', fontSize: 14, fontWeight: '500' },
  optionTextSelected: { color: '#2aa7a2', fontWeight: '700' },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 4,
    paddingVertical: 14,
  },
  buttonSecondary: { backgroundColor: '#64748b' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
