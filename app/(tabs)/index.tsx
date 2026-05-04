import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, GraduationCap, Clock, ChevronRight } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Logo Row */}
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <BookOpen size={20} color="#fff" strokeWidth={1.8} />
          </View>
          <Text style={styles.logoText}>NEET <Text style={styles.logoAccent}>Zyme</Text></Text>
        </View>

        {/* Eyebrow Pill */}
        <View style={styles.eyebrow}>
          <View style={styles.dot} />
          <Text style={styles.eyebrowText}>NEET MEDICAL EXAM PREP</Text>
        </View>

        {/* H1 Heading */}
        <Text style={styles.heading}>Read free or buy PDFs.{'\n'}<Text style={styles.headingAccent}>Track</Text> your rank.</Text>

        {/* Lede */}
        <Text style={styles.lede}>NEET Zyme turns NEET prep into a daily habit. Access curated study material, track your progress, and see which colleges match your rank.</Text>

        {/* Feature List */}
        <View style={styles.features}>
          <View style={styles.feat}>
            <View style={styles.chip}>
              <BookOpen size={14} color={COLORS.primaryDark} strokeWidth={1.4} />
            </View>
            <Text style={styles.featText}><Text style={styles.featBold}>Free PDFs</Text> — Starter chapters across all subjects</Text>
          </View>
          <View style={styles.feat}>
            <View style={styles.chip}>
              <GraduationCap size={14} color={COLORS.primaryDark} strokeWidth={1.4} />
            </View>
            <Text style={styles.featText}><Text style={styles.featBold}>Paid PDFs</Text> — Full question banks & solved papers</Text>
          </View>
          <View style={styles.feat}>
            <View style={styles.chip}>
              <Clock size={14} color={COLORS.primaryDark} strokeWidth={1.4} />
            </View>
            <Text style={styles.featText}><Text style={styles.featBold}>View Colleges</Text> — Match based on your NEET rank</Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/(tabs)/pdfs')}>
          <Text style={styles.ctaText}>Get Started — It's Free</Text>
        </TouchableOpacity>

        {/* Tip */}
        <View style={styles.tip}>
          <Text style={styles.tipText}><Text style={styles.tipBold}>Tip: </Text>Swipe to see the PDF library and a sample detail screen. Tap any tile to explore.</Text>
        </View>

        {/* Next Peek */}
        <TouchableOpacity style={styles.nextPeek} onPress={() => router.push('/(tabs)/pdfs')}>
          <View style={styles.swatch}>
            <BookOpen size={16} color={COLORS.primaryDark} strokeWidth={1.2} />
          </View>
          <Text style={styles.nextPeekText}>NEXT — PDF LIBRARY</Text>
          <ChevronRight size={14} color={COLORS.muted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },

  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingTop: 36, marginBottom: 24 },
  logoMark: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: '700', color: COLORS.fg, letterSpacing: -0.01 },
  logoAccent: { color: COLORS.primary },

  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginLeft: 24, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
  eyebrowText: { fontSize: 10, fontFamily: monoFont, letterSpacing: 0.18, color: COLORS.muted },

  heading: { fontSize: 34, fontWeight: '700', color: COLORS.fg, lineHeight: 38, letterSpacing: -0.02, paddingHorizontal: 24, marginBottom: 14 },
  headingAccent: { fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }), fontStyle: 'italic', color: COLORS.primary },

  lede: { fontSize: 13.5, lineHeight: 22, color: COLORS.muted, paddingHorizontal: 24, marginBottom: 20, maxWidth: 280 },

  features: { gap: 10, paddingHorizontal: 24, marginBottom: 20 },
  feat: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chip: { width: 28, height: 28, borderRadius: 8, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  featText: { fontSize: 13, lineHeight: 20, color: COLORS.fg },
  featBold: { fontWeight: '600' },

  ctaBtn: { marginHorizontal: 24, paddingVertical: 16, borderRadius: 999, backgroundColor: COLORS.primary, alignItems: 'center', marginBottom: 16, ...SHADOWS.md },
  ctaText: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: 0.02 },

  tip: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: COLORS.border, paddingTop: 12, marginHorizontal: 24, marginBottom: 16 },
  tipText: { fontSize: 10.5, lineHeight: 15, fontFamily: monoFont, color: COLORS.muted },
  tipBold: { color: COLORS.fg, fontWeight: '500' },

  nextPeek: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.stage, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingVertical: 12, paddingHorizontal: 22 },
  swatch: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  nextPeekText: { flex: 1, fontSize: 10, fontFamily: monoFont, letterSpacing: 0.14, color: COLORS.muted },
});
