import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createUserRegistrationClient } from '@pic4paws/client';
import {
  createMobileUserRegistrationUi,
  type MobileUserRegistrationState,
} from '../../src/user-register';
import { workerUrl } from '../../src/env';

const GDPR_CONSENT_VERSION = 'v1';

export default function RegistarScreen() {
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileUserRegistrationState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [gdprAccepted, setGdprAccepted] = useState(false);

  const canSubmit =
    !submitting &&
    gdprAccepted &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    displayName.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const userRegistrationClient = createUserRegistrationClient({
      workerBaseUrl: workerUrl(),
      usersPath: '/users',
      fetch: globalThis.fetch,
    });
    const ui = createMobileUserRegistrationUi({ userRegistrationClient });
    const result = await ui.registerUser({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      gdprConsentVersion: GDPR_CONSENT_VERSION,
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
            onPress={() => router.replace('/(auth)/entrar' as never)}
          >
            <Text style={styles.buttonText}>Entrar na conta</Text>
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
          {viewModel.status === 'email_already_registered' && (
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace('/(auth)/entrar' as never)}
            >
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
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.hint}>Preenche os dados para criar a tua conta de adotante.</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!submitting}
              placeholder="o-teu@email.pt"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Palavra-passe *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!submitting}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nome a apresentar *</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              editable={!submitting}
              autoCapitalize="words"
              placeholder="O teu nome"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <Pressable
            style={styles.checkboxRow}
            onPress={() => !submitting && setGdprAccepted((v) => !v)}
          >
            <View style={[styles.checkbox, gdprAccepted && styles.checkboxChecked]}>
              {gdprAccepted && <Text style={styles.checkboxTick}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Aceito os Termos de Utilização e a Política de Privacidade
            </Text>
          </Pressable>

          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.buttonText}>
              {submitting ? 'A criar conta...' : 'Criar conta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/entrar' as never)}
            disabled={submitting}
          >
            <Text style={styles.linkText}>Já tens conta? Entra aqui</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 16, padding: 24 },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '800' },
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
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: '#2aa7a2', borderColor: '#2aa7a2' },
  checkboxTick: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  checkboxLabel: { flex: 1, color: '#374151', fontSize: 14, lineHeight: 20 },
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
  linkText: { color: '#2aa7a2', fontSize: 14, textAlign: 'center', marginTop: 4 },
});
