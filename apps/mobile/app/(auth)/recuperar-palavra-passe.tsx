import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  createMobileAuthUi,
  type MobilePasswordResetRequestViewModel,
} from '../../src/auth';
import { mobileSupabaseClient } from '../../src/supabase';

const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? 'https://pic4paws.pt';

export default function RecuperarPalavraPasScreen() {
  const router = useRouter();
  const [result, setResult] = useState<MobilePasswordResetRequestViewModel>({ state: 'idle' });
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    setResult({ state: 'submitting' });
    const ui = createMobileAuthUi({ authClient: mobileSupabaseClient });
    const redirectTo = `${WEB_BASE_URL}/recuperar-palavra-passe/confirmar`;
    const next = await ui.requestPasswordReset(email, redirectTo);
    setResult(next);
  };

  if (result.state === 'email_sent') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.title}>{result.title}</Text>
          <Text style={styles.message}>{result.message}</Text>
          <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
            <Text style={styles.linkText}>Voltar ao início de sessão</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <Text style={styles.title}>Recuperar palavra-passe</Text>
        <Text style={styles.hint}>
          Introduz o teu email e enviaremos um link para recuperares a tua palavra-passe.
        </Text>
        {result.state === 'failed' && (
          <Text style={styles.error}>{result.message}</Text>
        )}
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={result.state !== 'submitting'}
          />
        </View>
        <TouchableOpacity
          style={[styles.button, result.state === 'submitting' && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={result.state === 'submitting'}
        >
          <Text style={styles.buttonText}>
            {result.state === 'submitting' ? 'A enviar...' : 'Enviar link de recuperação'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
          <Text style={styles.linkText}>Voltar ao início de sessão</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  inner: { flex: 1, gap: 16, padding: 24, justifyContent: 'center' },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  hint: { color: '#475569', fontSize: 15, lineHeight: 22 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  error: { color: '#dc2626', fontSize: 14, lineHeight: 20 },
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
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 8,
    paddingVertical: 14,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  linkButton: { alignItems: 'center', marginTop: 4 },
  linkText: { color: '#2aa7a2', fontSize: 15 },
});
