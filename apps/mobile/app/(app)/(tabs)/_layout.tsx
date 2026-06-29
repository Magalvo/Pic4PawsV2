import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <MaterialIcons name={name} size={24} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ec5b13',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="animais"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <TabIcon name="pets" color={color} />,
        }}
      />
      <Tabs.Screen
        name="adocoes"
        options={{
          title: 'Adoções',
          tabBarIcon: ({ color }) => <TabIcon name="favorite" color={color} />,
        }}
      />
      <Tabs.Screen
        name="patrocinios"
        options={{
          title: 'Patrocínios',
          tabBarIcon: ({ color }) => <TabIcon name="volunteer-activism" color={color} />,
        }}
      />
      <Tabs.Screen
        name="abrigos"
        options={{
          title: 'Abrigos',
          tabBarIcon: ({ color }) => <TabIcon name="apartment" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notificacoes"
        options={{
          title: 'Notificações',
          tabBarIcon: ({ color }) => <TabIcon name="notifications" color={color} />,
        }}
      />
    </Tabs>
  );
}
