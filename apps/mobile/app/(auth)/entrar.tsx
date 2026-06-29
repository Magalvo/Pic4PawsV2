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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createMobileAuthUi, type MobileAuthSignInResultViewModel } from '../../src/auth';
import { mobileSupabaseClient } from '../../src/supabase';
import { validateReturnTo } from '../../src/nav';

export default function EntrarScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const dest = validateReturnTo(returnTo) ?? '/(app)/(tabs)/animais';

  const [result, setResult] = useState<MobileAuthSignInResultViewModel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    const ui = createMobileAuthUi({ authClient: mobileSupabaseClient });
    const next = await ui.signIn(email, password);
    setResult(next);
    setSubmitting(false);
    if (next.state === 'signed_in') {
      router.replace(dest);
    }
  };

  if (result?.state === 'signed_in') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.title}>{result.title}</Text>
          <Text style={styles.message}>{result.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <View style={styles.inner}>
          <Text style={styles.eyebrow}>Pic4Paws</Text>
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.hint}>Entra na tua conta de adotante.</Text>

          {result?.state === 'failed' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{result.message}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, submitting && styles.inputDisabled]}
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
            <View style={styles.labelRow}>
              <Text style={styles.label}>Palavra-passe</Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/recuperar-palavra-passe' as never)}
                disabled={submitting}
              >
                <Text style={styles.forgotLink}>Esqueceste?</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, submitting && styles.inputDisabled]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!submitting}
              placeholder="A tua palavra-passe"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>
              {submitting ? 'A entrar...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/registar' as never)}
            disabled={submitting}
          >
            <Text style={styles.signUpLink}>Ainda não tens conta? Regista-te</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  kav: { flex: 1 },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  eyebrow: {
    color: '#ec5b13',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '800', marginBottom: 2 },
  hint: { color: '#64748b', fontSize: 14, lineHeight: 20 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
  },
  errorText: { color: '#dc2626', fontSize: 14, lineHeight: 20 },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#374151', fontSize: 14, fontWeight: '600' },
  forgotLink: { color: '#2aa7a2', fontSize: 13, fontWeight: '500' },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderRadius: 8,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputDisabled: { opacity: 0.6 },
  button: {
    alignItems: 'center',
    backgroundColor: '#ec5b13',
    borderRadius: 24,
    marginTop: 4,
    paddingVertical: 15,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  signUpLink: {
    color: '#2aa7a2',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
