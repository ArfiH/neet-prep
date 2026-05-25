import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/colors';

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const info = [
  { label: 'App Name', value: 'NEET Zyme' },
  { label: 'Version', value: '1.0.0' },
  { label: 'Platform', value: 'Android' },
  { label: 'Contact', value: 'support@neetzymee.com' },
  { label: 'Website', value: 'neetzymee.com' },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={14} color={COLORS.muted} strokeWidth={1.6} />
        </TouchableOpacity>
        <Text style={styles.topbarText}>ABOUT</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>NZ</Text>
          </View>
          <Text style={styles.appName}>NEET Zyme</Text>
          <Text style={styles.tagline}>Your NEET preparation companion</Text>
        </View>

        {/* Info rows */}
        <View style={styles.card}>
          {info.map((item, i) => (
            <View key={item.label} style={[styles.row, i < info.length - 1 && styles.rowBorder]}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.desc}>
          NEET Zyme helps NEET aspirants access high-quality study material, predict college admissions based on rank, and track their preparation journey.
        </Text>

        <Text style={styles.copy}>© 2026 NEET Zyme. All rights reserved.</Text>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 6 },
  backCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  topbarText: { fontSize: 12, fontWeight: '600', color: COLORS.muted, fontFamily: monoFont, letterSpacing: 0.14 },
  content: { paddingHorizontal: 22, paddingTop: 12 },

  logoArea: { alignItems: 'center', paddingVertical: 28 },
  logoCircle: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoText: { fontSize: 26, fontWeight: '800', color: '#fff', fontFamily: monoFont },
  appName: { fontSize: 22, fontWeight: '700', color: COLORS.fg, letterSpacing: -0.01 },
  tagline: { fontSize: 13, color: COLORS.muted, marginTop: 4 },

  card: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.surface, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { fontSize: 13, color: COLORS.muted },
  rowValue: { fontSize: 13, fontWeight: '600', color: COLORS.fg },

  desc: { fontSize: 13, color: COLORS.muted, lineHeight: 20, textAlign: 'center', marginBottom: 20 },
  copy: { fontSize: 11, fontFamily: monoFont, color: COLORS.muted, textAlign: 'center' },
});
