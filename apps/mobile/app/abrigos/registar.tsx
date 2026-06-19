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
import { useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { createShelterRegistrationClient } from '@pic4paws/client';
import {
  createMobileShelterRegistrationUi,
  type MobileShelterRegistrationState,
} from '../../src/shelter-register';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../src/env';

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

export default function RegistarAbrigoScreen() {
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileShelterRegistrationState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSubmit = !submitting && form.name.trim().length > 0 && form.city.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false } });
    const { data: { session } } = await supabase.auth.getSession();
    const shelterRegistrationClient = createShelterRegistrationClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken: async () => session?.access_token ?? null,
      fetch: globalThis.fetch,
    });
    const ui = createMobileShelterRegistrationUi({ shelterRegistrationClient });
    const result = await ui.registerShelter({
      name: form.name.trim(),
      kind: form.kind,
      city: form.city.trim(),
      district: form.district.trim() || null,
      publicEmail: form.publicEmail.trim() || null,
      publicPhone: form.publicPhone.trim() || null,
      description: form.description.trim() || null,
    });
    setViewModel(result);
    setSubmitting(false);
  };

  if (viewModel?.state === 'registered') {
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
          <Text style={styles.title}>Registar abrigo</Text>
          <Text style={styles.hint}>Preenche os dados para registar o teu abrigo na plataforma.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nome do abrigo *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setField('name', v)}
              editable={!submitting}
              autoCapitalize="words"
              placeholder="Nome do abrigo"
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
            <Text style={styles.label}>Cidade *</Text>
            <TextInput
              style={styles.input}
              value={form.city}
              onChangeText={(v) => setField('city', v)}
              editable={!submitting}
              autoCapitalize="words"
              placeholder="Cidade"
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
              placeholder="Distrito (opcional)"
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
              placeholder="Email (opcional)"
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
              placeholder="Telefone (opcional)"
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
              placeholder="Descrição do abrigo (opcional)"
              placeholderTextColor="#9ca3af"
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.buttonText}>
              {submitting ? 'A registar...' : 'Registar abrigo'}
            </Text>
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
