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
        <Text style={styles.title}>{result.title}</Text>
        <Text style={styles.message}>{result.message}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <Text style={styles.title}>Entrar</Text>
        {result?.state === 'failed' && (
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
            editable={!submitting}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Palavra-passe</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!submitting}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  inner: { flex: 1, gap: 16, padding: 24, justifyContent: 'center' },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '800', marginBottom: 8 },
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
});
