import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { createAdoptionApplicationClient } from '@pic4paws/client';
import type { HousingType } from '@pic4paws/client';
import {
  createMobileAdoptionUi,
  type MobileAdoptionResultViewModel,
} from '../../../src/adoption';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

type FormState = {
  applicantFullName: string;
  applicantEmail: string;
  applicantPhoneNumber: string;
  applicantCity: string;
  housingType: HousingType;
  hasOutdoorSpace: boolean;
  hasChildren: boolean;
  hasOtherAnimals: boolean;
  previousPetExperience: string;
  dailyRoutine: string;
  adoptionMotivation: string;
  dataProcessingAccepted: boolean;
  shelterContactAccepted: boolean;
};

const initialForm: FormState = {
  applicantFullName: '',
  applicantEmail: '',
  applicantPhoneNumber: '',
  applicantCity: '',
  housingType: 'apartment',
  hasOutdoorSpace: false,
  hasChildren: false,
  hasOtherAnimals: false,
  previousPetExperience: '',
  dailyRoutine: '',
  adoptionMotivation: '',
  dataProcessingAccepted: false,
  shelterContactAccepted: false,
};

export default function AdotarScreen() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileAdoptionResultViewModel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.dataProcessingAccepted || !form.shelterContactAccepted) return;
    setSubmitting(true);
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const { data: { session } } = await supabase.auth.getSession();
    const adoptionApplicationClient = createAdoptionApplicationClient({
      workerBaseUrl: workerUrl(),
      adoptionsPath: '/adoptions',
      getAccessToken: async () => session?.access_token ?? null,
      fetch: globalThis.fetch,
    });
    const ui = createMobileAdoptionUi({ adoptionApplicationClient });
    const result = await ui.submitApplication({
      petId,
      applicantFullName: form.applicantFullName,
      applicantEmail: form.applicantEmail,
      applicantPhoneNumber: form.applicantPhoneNumber,
      applicantCity: form.applicantCity,
      housingType: form.housingType,
      hasOutdoorSpace: form.hasOutdoorSpace,
      hasChildren: form.hasChildren,
      hasOtherAnimals: form.hasOtherAnimals,
      previousPetExperience: form.previousPetExperience,
      dailyRoutine: form.dailyRoutine,
      adoptionMotivation: form.adoptionMotivation,
      dataProcessingAccepted: true,
      shelterContactAccepted: true,
      consentVersion: 'v1.0',
      consentAcceptedAt: new Date().toISOString(),
    });
    setViewModel(result);
    setSubmitting(false);
  };

  if (viewModel?.state === 'submitted') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Voltar ao perfil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel?.state === 'pet_not_found') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/animais' as never)}>
            <Text style={styles.buttonText}>Ver animais disponíveis</Text>
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
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push('/entrar' as never)}
            >
              <Text style={styles.buttonText}>Entrar na conta</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Voltar</Text>
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
          <Text style={styles.title}>Candidatura à adoção</Text>
          <Text style={styles.hint}>Preenche o formulário para te candidatares à adoção.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              value={form.applicantFullName}
              onChangeText={(v) => setField('applicantFullName', v)}
              editable={!submitting}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={form.applicantEmail}
              onChangeText={(v) => setField('applicantEmail', v)}
              editable={!submitting}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Telefone</Text>
            <TextInput
              style={styles.input}
              value={form.applicantPhoneNumber}
              onChangeText={(v) => setField('applicantPhoneNumber', v)}
              editable={!submitting}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput
              style={styles.input}
              value={form.applicantCity}
              onChangeText={(v) => setField('applicantCity', v)}
              editable={!submitting}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.label}>Tem espaço exterior</Text>
            <Switch
              value={form.hasOutdoorSpace}
              onValueChange={(v) => setField('hasOutdoorSpace', v)}
              disabled={submitting}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.label}>Tem crianças em casa</Text>
            <Switch
              value={form.hasChildren}
              onValueChange={(v) => setField('hasChildren', v)}
              disabled={submitting}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.label}>Tem outros animais</Text>
            <Switch
              value={form.hasOtherAnimals}
              onValueChange={(v) => setField('hasOtherAnimals', v)}
              disabled={submitting}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Experiência com animais</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.previousPetExperience}
              onChangeText={(v) => setField('previousPetExperience', v)}
              editable={!submitting}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Rotina diária</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.dailyRoutine}
              onChangeText={(v) => setField('dailyRoutine', v)}
              editable={!submitting}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Motivação para adotar</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.adoptionMotivation}
              onChangeText={(v) => setField('adoptionMotivation', v)}
              editable={!submitting}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.label}>Aceito o tratamento de dados pessoais</Text>
            <Switch
              value={form.dataProcessingAccepted}
              onValueChange={(v) => setField('dataProcessingAccepted', v)}
              disabled={submitting}
            />
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.label}>Aceito ser contactado pelo abrigo</Text>
            <Switch
              value={form.shelterContactAccepted}
              onValueChange={(v) => setField('shelterContactAccepted', v)}
              disabled={submitting}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (submitting || !form.dataProcessingAccepted || !form.shelterContactAccepted) &&
                styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || !form.dataProcessingAccepted || !form.shelterContactAccepted}
          >
            <Text style={styles.buttonText}>
              {submitting ? 'A enviar...' : 'Candidatar'}
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
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
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
