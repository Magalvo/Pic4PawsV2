import { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createAdminPendingSheltersClient } from '@pic4paws/client';
import {
  createMobileAdminPendingSheltersUi,
  type MobileAdminPendingSheltersState,
  type MobileAdminPendingShelterListItem,
} from '../../src/admin-pending-shelters';
import { mobileSupabaseClient } from '../../src/supabase';
import { workerUrl } from '../../src/env';

type AdminPendingSheltersUi = ReturnType<typeof createMobileAdminPendingSheltersUi>;

export default function AdminAbrigosPendentesScreen() {
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileAdminPendingSheltersState | null>(null);
  const uiRef = useRef<AdminPendingSheltersUi | null>(null);

  const getUi = (): AdminPendingSheltersUi => {
    if (uiRef.current) return uiRef.current;
    const adminPendingSheltersClient = createAdminPendingSheltersClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken: async () => {
        const { data: { session } } = await mobileSupabaseClient.auth.getSession();
        return session?.access_token ?? null;
      },
      fetch: globalThis.fetch,
    });
    uiRef.current = createMobileAdminPendingSheltersUi({ adminPendingSheltersClient });
    return uiRef.current;
  };

  const load = async () => {
    const result = await getUi().loadPendingShelters();
    setViewModel(result);
  };

  useEffect(() => {
    load();
  }, []);

  if (viewModel === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={styles.teal.color} />
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'idle') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={load}>
            <Text style={styles.buttonText}>{viewModel.primaryAction}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'empty') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={load}>
            <Text style={styles.buttonText}>Recarregar</Text>
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
          {viewModel.status === 'unauthenticated' && (
            <TouchableOpacity style={styles.button} onPress={() => router.push('/entrar' as never)}>
              <Text style={styles.buttonText}>Entrar na conta</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={load}>
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: MobileAdminPendingShelterListItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(item.reviewHref as never)}
    >
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardCity}>{item.city}{item.district ? `, ${item.district}` : ''}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <Text style={styles.count}>{viewModel.total} pendente(s)</Text>
      </View>
      <FlatList
        data={viewModel.shelters}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={load}>
          <Text style={styles.buttonText}>Recarregar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  teal: { color: '#2aa7a2' },
  header: { padding: 24, paddingBottom: 8 },
  content: { flex: 1, gap: 16, padding: 24 },
  footer: { padding: 16 },
  title: { color: '#0f172a', fontSize: 22, fontWeight: '800' },
  count: { color: '#64748b', fontSize: 14, marginTop: 4 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  list: { paddingHorizontal: 16, paddingBottom: 8 },
  separator: { height: 1, backgroundColor: '#e5e7eb' },
  card: { paddingVertical: 16, paddingHorizontal: 8 },
  cardName: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  cardCity: { color: '#64748b', fontSize: 14, marginTop: 2 },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    paddingVertical: 14,
  },
  buttonSecondary: { backgroundColor: '#64748b' },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
