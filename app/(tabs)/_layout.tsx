import { Tabs } from 'expo-router';
import { Download, BookOpen, GraduationCap, User, HomeIcon, WifiOff } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { useNetwork } from '@/lib/networkContext';

function OfflineBar() {
  const { isOnline } = useNetwork();
  if (isOnline) return null;
  return (
    <View style={styles.offlineBar}>
      <WifiOff size={14} color="#fff" strokeWidth={2.5} />
      <Text style={styles.offlineBarText}>You're offline</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIconStyle: { marginTop: 2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'HOME',
            tabBarIcon: ({ color, size }) => <HomeIcon size={size} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="pdfs"
          options={{
            title: 'PDF',
            tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="colleges"
          options={{
            title: 'COLLEGE',
            tabBarIcon: ({ color, size }) => <GraduationCap size={size} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="downloaded"
          options={{
            title: 'OFFLINE',
            tabBarIcon: ({ color, size }) => <Download size={size} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'PROFILE',
            tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2} />,
          }}
        />
      </Tabs>
      <OfflineBar />
    </View>
  );
}

const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 26,
    paddingTop: 8,
    paddingHorizontal: 10,
    height: 70,
  },
  tabLabel: {
    fontSize: 8.5,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: monoFont,
    letterSpacing: 0.06,
  },
  offlineBar: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  offlineBarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: monoFont,
    letterSpacing: 0.06,
  },
});
