import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="animais" options={{ title: 'Animais' }} />
      <Tabs.Screen name="adocoes" options={{ title: 'Adoções' }} />
      <Tabs.Screen name="patrocinios" options={{ title: 'Patrocínios' }} />
      <Tabs.Screen name="abrigos" options={{ title: 'Abrigos' }} />
      <Tabs.Screen name="notificacoes" options={{ title: 'Notificações' }} />
    </Tabs>
  );
}
