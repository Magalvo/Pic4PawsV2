import { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';
import { createShelterMemberClient } from '@pic4paws/client';
import type { ShelterMemberClientRole } from '@pic4paws/client';
import {
  createMobileShelterMemberUi,
  type MobileShelterMemberListResultViewModel,
} from '../../../src/shelter-member';
import { workerUrl, supabaseUrl, supabaseAnonKey } from '../../../src/env';

const ROLE_LABELS: Record<ShelterMemberClientRole, string> = {
  shelter_owner: 'Proprietário',
  shelter_member: 'Membro',
};

export default function MembrosArigoScreen() {
  const { shelterId } = useLocalSearchParams<{ shelterId: string }>();
  const router = useRouter();
  const [viewModel, setViewModel] = useState<MobileShelterMemberListResultViewModel | null>(null);
  const [addUserId, setAddUserId] = useState('');

  const makeUi = useCallback(() => {
    const supabase = createClient(supabaseUrl(), supabaseAnonKey());
    const getAccessToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    };
    const shelterMemberClient = createShelterMemberClient({
      workerBaseUrl: workerUrl(),
      shelterPath: '/shelters',
      getAccessToken,
      fetch: globalThis.fetch,
    });
    return createMobileShelterMemberUi({ shelterMemberClient });
  }, []);

  const load = useCallback(() => {
    setViewModel(null);
    makeUi().loadShelterMembers(shelterId).then(setViewModel);
  }, [shelterId, makeUi]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = useCallback(async () => {
    if (!addUserId.trim()) return;
    const result = await makeUi().addShelterMember(shelterId, { userId: addUserId.trim(), role: 'shelter_member' });
    if (result.state === 'member_added') {
      setAddUserId('');
      load();
    } else {
      Alert.alert('Erro', result.message);
    }
  }, [addUserId, shelterId, makeUi, load]);

  const handleRemove = useCallback(async (memberId: string) => {
    const result = await makeUi().removeShelterMember(shelterId, memberId);
    if (result.state === 'member_removed') {
      load();
    } else {
      Alert.alert('Erro', result.message);
    }
  }, [shelterId, makeUi, load]);

  if (viewModel === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>A carregar membros...</Text>
      </SafeAreaView>
    );
  }

  if (viewModel.state === 'forbidden') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.message}>{viewModel.message}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/entrar' as never)}>
            <Text style={styles.buttonText}>Entrar na conta</Text>
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
          <TouchableOpacity style={styles.button} onPress={load}>
            <Text style={styles.buttonText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{viewModel.title}</Text>
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="ID do utilizador"
            value={addUserId}
            onChangeText={setAddUserId}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.buttonText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
        {viewModel.members.map((member) => (
          <View key={member.memberId} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.userId}>{member.userId}</Text>
              <Text style={styles.role}>{ROLE_LABELS[member.role] ?? member.role}</Text>
            </View>
            <Text style={styles.cardDate}>
              {new Date(member.joinedAt).toLocaleDateString('pt-PT')}
            </Text>
            {member.role !== 'shelter_owner' && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemove(member.memberId)}
              >
                <Text style={styles.removeText}>Remover</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f6f6' },
  content: { gap: 10, padding: 20 },
  loading: { padding: 20, color: '#475569', fontSize: 15 },
  title: { color: '#0f172a', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  message: { color: '#475569', fontSize: 15, lineHeight: 22 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 6,
    borderWidth: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userId: { color: '#0f172a', fontSize: 14, fontWeight: '600', flexShrink: 1 },
  role: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  cardDate: { color: '#94a3b8', fontSize: 12 },
  button: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    marginTop: 8,
    paddingVertical: 14,
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#2aa7a2',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  removeButton: { marginTop: 4 },
  removeText: { color: '#ef4444', fontSize: 13, fontWeight: '600' },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
