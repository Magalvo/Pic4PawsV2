import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mobileFoundationContent } from '../src/foundation';

export default function IndexScreen() {
  const { hero, primaryAction, mediaUpload, readiness } = mobileFoundationContent;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.shell}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{hero.eyebrow}</Text>
          <Text style={styles.title}>{hero.title}</Text>
          <Text style={styles.lead}>{hero.body}</Text>
          <Text style={styles.statusPill}>{primaryAction.label}</Text>
        </View>

        <View accessibilityLabel="Upload seguro de imagens" style={styles.mediaUpload}>
          <Text style={styles.eyebrow}>Media</Text>
          <Text style={styles.mediaUploadTitle}>{mediaUpload.title}</Text>
          <Text style={styles.mediaUploadDescription}>{mediaUpload.description}</Text>
          <Text style={styles.mediaUploadStatus}>
            {mediaUpload.status === 'contract-ready' ? 'Contrato pronto' : mediaUpload.status}
          </Text>
        </View>

        <View accessibilityLabel="Estado da fundação técnica mobile" style={styles.readinessList}>
          {readiness.map((item) => (
            <View key={item.id} style={styles.readinessItem}>
              <View style={styles.readinessCopy}>
                <Text style={styles.readinessTitle}>{item.label}</Text>
                <Text style={styles.readinessDescription}>{item.description}</Text>
              </View>
              <Text style={styles.readinessStatus}>
                {item.status === 'contract-ready' ? 'Contrato pronto' : item.status}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f6f6',
  },
  shell: {
    gap: 20,
    padding: 20,
  },
  hero: {
    gap: 14,
    paddingVertical: 16,
  },
  eyebrow: {
    color: '#2aa7a2',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#0f172a',
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 48,
  },
  lead: {
    color: '#334155',
    fontSize: 17,
    lineHeight: 26,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ec5b13',
    borderRadius: 16,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  readinessList: {
    gap: 12,
  },
  mediaUpload: {
    borderBottomColor: '#f1d8cd',
    borderBottomWidth: 1,
    borderTopColor: '#f1d8cd',
    borderTopWidth: 1,
    gap: 8,
    paddingVertical: 20,
  },
  mediaUploadTitle: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
  },
  mediaUploadDescription: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
  },
  mediaUploadStatus: {
    alignSelf: 'flex-start',
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
  },
  readinessItem: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  readinessCopy: {
    gap: 6,
  },
  readinessTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  readinessDescription: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
  },
  readinessStatus: {
    alignSelf: 'flex-start',
    color: '#0f766e',
    fontSize: 13,
    fontWeight: '700',
  },
});
