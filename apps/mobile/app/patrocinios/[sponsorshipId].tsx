import { useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { createSponsorshipManageClient } from '@pic4paws/client';
import type { SponsorshipClientStatus } from '@pic4paws/client';
import {
  createMobileSponsorshipManageUi,
  type MobileSponsorshipManageResultViewModel,
} from '../../src/sponsorship-manage';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../src/env';

const STATUS_LABELS: Record<SponsorshipClientStatus, string> = {
  active: 'Ativo',
  cancelled: 'Cancelado',
  paused: 'Em pausa',
};

const IDLE: MobileSponsorshipManageResultViewModel = {
  state: 'idle',
  title: 'Gerir apadrinhamento',
  message: 'Seleciona a ação a aplicar ao apadrinhamento.',
  primaryAction: 'Gerir apadrinhamento',
};

export default function GerirApadrinhamentoScreen() {
  const { sponsorshipId } = useLocalSearchParams<{ sponsorshipId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] =
    useState<MobileSponsorshipManageResultViewModel>(IDLE);

  const manage = useCallback(
    (newStatus: SponsorshipClientStatus) => {
      setViewModel({ state: 'submitting', title: 'A processar...', message: 'A atualizar o estado do apadrinhamento.' });
      const supabase = createClient(supabaseUrl(), supabaseAnonKey());
      const getAccessToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
      };
      const sponsorshipManageClient = createSponsorshipManageClient({
        workerBaseUrl: workerUrl(),
        sponsorshipsPath: '/sponsorships',
        getAccessToken,
        fetch: globalThis.fetch,
      });
      const ui = createMobileSponsorshipManageUi({ sponsorshipManageClient });
      ui.manageSponsorship(sponsorshipId, newStatus).then(setViewModel);
    },
    [sponsorshipId],
  );

  if (viewModel.state === 'submitting') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>{viewModel.message}</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'succeeded') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <Text style={styles.info}>
            Novo estado: {STATUS_LABELS[viewModel.newStatus] ?? viewModel.newStatus}
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'failed') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.message}>{viewModel.message}</Text>
        <TouchableOpacity style={styles.button} onPress={() => manage('paused')}>
          <Text style={styles.buttonText}>Pausar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonDanger]} onPress={() => manage('cancelled')}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 12, padding: 24 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800' },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  info: { color: '#0f172a', fontSize: 15, fontWeight: '600' },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 4,
    paddingVertical: 14,
  },
  buttonDanger: { backgroundColor: '#ef4444' },
  buttonSecondary: { backgroundColor: '#64748b' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
