import { Tabs } from 'expo-router';
import { Hop as Home, BookOpen, GraduationCap, User, HomeIcon } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  return (
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
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
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
});
