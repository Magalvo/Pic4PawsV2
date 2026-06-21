import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createShelterVerificationClient } from '@pic4paws/client';
import { mobileSupabaseClient } from '../../../src/supabase';
import { workerUrl } from '../../../src/env';
import {
  createMobileShelterVerifyUi,
  type MobileShelterVerifyState,
} from '../../../src/shelter-verify';
import type { ShelterVerificationTargetStatus } from '@pic4paws/client';

type ShelterVerifyUi = ReturnType<typeof createMobileShelterVerifyUi>;

export default function VerificarAbrigoScreen() {
  const { shelterId } = useLocalSearchParams<{ shelterId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileShelterVerifyState | null>(null);
  const [submitting, setSubmitting] = useState<ShelterVerificationTargetStatus | null>(null);
  const uiRef = useRef<ShelterVerifyUi | null>(null);

  const getUi = (): ShelterVerifyUi => {
    if (uiRef.current) return uiRef.current;
    const getAccessToken = async () => {
      const { data: { session } } = await mobileSupabaseClient.auth.getSession();
      return session?.access_token ?? null;
    };
    const shelterVerificationClient = createShelterVerificationClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    uiRef.current = createMobileShelterVerifyUi({ shelterVerificationClient });
    return uiRef.current;
  };

  const handleAction = async (targetStatus: ShelterVerificationTargetStatus) => {
    if (submitting || !shelterId) return;
    setSubmitting(targetStatus);
    const result = await getUi().updateVerificationStatus(shelterId, targetStatus);
    setViewModel(result);
    setSubmitting(null);
  };

  const reset = () => setViewModel(null);

  if (viewModel?.state === 'updated') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>
        <TouchableOpacity
          style={styles.buttonPrimary}
          onPress={() => router.push(`/abrigos/${viewModel.shelterId}`)}
        >
          <Text style={styles.buttonText}>Ver abrigo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (viewModel?.state === 'failed') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>
        <TouchableOpacity style={styles.buttonPrimary} onPress={reset}>
          <Text style={styles.buttonText}>Tentar de novo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonTextSecondary}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Verificação do abrigo</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Responsável do abrigo</Text>
        <Text style={styles.sectionDescription}>
          Submete o abrigo para revisão pela equipa Pic4Paws.
        </Text>
        <TouchableOpacity
          style={[styles.buttonPrimary, submitting !== null && styles.buttonDisabled]}
          onPress={() => handleAction('pending_review')}
          disabled={submitting !== null}
        >
          {submitting === 'pending_review' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submeter para revisão</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Administração</Text>
        <Text style={styles.sectionDescription}>
          Ações reservadas à equipa Pic4Paws.
        </Text>
        <TouchableOpacity
          style={[styles.buttonAdmin, submitting !== null && styles.buttonDisabled]}
          onPress={() => handleAction('verified')}
          disabled={submitting !== null}
        >
          {submitting === 'verified' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verificar abrigo</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonDanger, submitting !== null && styles.buttonDisabled]}
          onPress={() => handleAction('rejected')}
          disabled={submitting !== null}
        >
          {submitting === 'rejected' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Rejeitar pedido</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonDanger, submitting !== null && styles.buttonDisabled]}
          onPress={() => handleAction('suspended')}
          disabled={submitting !== null}
        >
          {submitting === 'suspended' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Suspender abrigo</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.buttonBack} onPress={() => router.back()}>
        <Text style={styles.buttonTextSecondary}>Voltar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f6f6',
    padding: 24,
    gap: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#334155',
    marginBottom: 24,
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  buttonPrimary: {
    backgroundColor: '#2aa7a2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonAdmin: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDanger: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonSecondary: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  buttonBack: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonTextSecondary: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 15,
  },
});
