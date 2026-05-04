import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { BookOpen } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { api } from '@/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type PDF = {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  pages_count: number;
};

const SUBJECTS = ['Biology', 'Physics', 'Chemistry'];

function getUniqueSubjects(pdfs: PDF[]): string[] {
  const subjects = pdfs.map((p) => p.subject);
  const unique = [...new Set(subjects)];
  return unique.sort();
}

function getTileBg(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes('anat')) return COLORS.tileAnatomy;
  if (lower.includes('phys')) return COLORS.tilePhysics;
  if (lower.includes('chem')) return COLORS.tileChemistry;
  if (lower.includes('bot')) return COLORS.tileBotany;
  if (lower.includes('zoo')) return COLORS.tileZoology;
  if (lower.includes('pyq') || lower.includes('prev')) return COLORS.tilePYQ;
  if (subject === 'Biology') return COLORS.tileBotany;
  if (subject === 'Physics') return COLORS.tilePhysics;
  if (subject === 'Chemistry') return COLORS.tileChemistry;
  return COLORS.tileAnatomy;
}

function getGlyphColor(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes('anat')) return COLORS.glyphAnatomy;
  if (lower.includes('phys')) return COLORS.glyphPhysics;
  if (lower.includes('chem')) return COLORS.glyphChemistry;
  if (lower.includes('bot')) return COLORS.glyphBotany;
  if (lower.includes('zoo')) return COLORS.glyphZoology;
  if (lower.includes('pyq') || lower.includes('prev')) return COLORS.glyphPYQ;
  if (subject === 'Biology') return COLORS.glyphBotany;
  if (subject === 'Physics') return COLORS.glyphPhysics;
  if (subject === 'Chemistry') return COLORS.glyphChemistry;
  return COLORS.glyphAnatomy;
}

function getGlyphLetter(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes('anat')) return 'A';
  if (lower.includes('phys')) return 'P';
  if (lower.includes('chem')) return 'C';
  if (lower.includes('bot')) return 'B';
  if (lower.includes('zoo')) return 'Z';
  if (lower.includes('pyq') || lower.includes('prev')) return 'PY';
  if (subject === 'Biology') return 'B';
  if (subject === 'Physics') return 'P';
  if (subject === 'Chemistry') return 'C';
  return subject.charAt(0).toUpperCase();
}

function getMetaLine(item: PDF): string {
  return `${item.pages_count} pages`;
}

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export default function PDFsScreen() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [filtered, setFiltered] = useState<PDF[]>([]);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'paid'>('all');

  useEffect(() => {
    fetchPdfs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pdfs, activeSubject, activeFilter]);

  async function fetchPdfs() {
    setLoading(true);
    try {
      const data = await api.getPdfs();
      if (data) {
        setPdfs(data);
      }
    } catch (e) {
      // ignore
    }
    setLoading(false);
  }

  function applyFilters() {
    let result = [...pdfs];
    if (activeSubject) {
      result = result.filter((p) => p.subject === activeSubject);
    }
    if (activeFilter === 'free') result = result.filter((p) => p.is_free);
    if (activeFilter === 'paid') result = result.filter((p) => !p.is_free);
    setFiltered(result);
  }

  const freeCount = filtered.filter((p) => p.is_free).length;
  const paidCount = filtered.filter((p) => !p.is_free).length;
  const uniqueSubjects = getUniqueSubjects(pdfs);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.head}>
          <Text style={styles.headTitle}>Browse PDFs</Text>
        <View style={styles.headSub}>
          <Text style={styles.headSubText}>{filtered.length} PDF{filtered.length !== 1 ? 's' : ''} ready</Text>
          <View style={styles.pillRow}>
            <Text style={styles.pillFree}>{freeCount} FREE</Text>
            <Text style={styles.pillPaid}>{paidCount} PAID</Text>
          </View>
        </View>
        </View>

        {/* Subject Bar */}
        <Text style={styles.barLabel}>Subjects</Text>
        <View style={styles.subjectBar}>
          {uniqueSubjects.map((subj) => (
            <TouchableOpacity
              key={subj}
              style={[styles.subj, activeSubject === subj && styles.subjActive]}
              onPress={() => setActiveSubject(activeSubject === subj ? null : subj)}
            >
              <Text style={[styles.subjText, activeSubject === subj && styles.subjTextActive]} numberOfLines={1}>{subj}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Availability Bar */}
        <Text style={styles.barLabel}>Availability</Text>
        <View style={styles.availBar}>
          {(['all', 'free', 'paid'] as const).map((avail) => (
            <TouchableOpacity
              key={avail}
              style={[styles.avail, activeFilter === avail && styles.availActive]}
              onPress={() => setActiveFilter(avail)}
            >
              <Text style={[styles.availText, activeFilter === avail && styles.availTextActive]}>
                {avail.charAt(0).toUpperCase() + avail.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PDF Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BookOpen size={40} color={COLORS.border} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No PDFs found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
          </View>
        ) : (
          <View style={styles.pdfs}>
            {filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.tile, { backgroundColor: getTileBg(item.subject) }]}
                onPress={() => router.push(`/pdf/${item.id}` as any)}
                activeOpacity={0.88}
              >
                <View style={[styles.glyph, { backgroundColor: getGlyphColor(item.subject) }]}>
                  <Text style={styles.glyphText}>{getGlyphLetter(item.subject)}</Text>
                </View>
                <Text style={styles.tileTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.tileMeta} numberOfLines={1}>{getMetaLine(item)}</Text>
                {item.is_free ? (
                  <Text style={styles.freeTag}>FREE</Text>
                ) : (
                  <Text style={styles.paidTag}>₹{item.price}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },

  head: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 6 },
  headTitle: { fontSize: 24, fontWeight: '700', color: COLORS.fg, letterSpacing: -0.01 },
  headSub: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  headSubText: { fontSize: 12, color: COLORS.muted },
  pillRow: { flexDirection: 'row', gap: 6 },
  pillFree: { fontSize: 10, fontFamily: monoFont, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 999, backgroundColor: COLORS.primaryLight, color: COLORS.primaryDark, fontWeight: '600' },
  pillPaid: { fontSize: 10, fontFamily: monoFont, paddingVertical: 3, paddingHorizontal: 7, borderRadius: 999, backgroundColor: '#fef3e0', color: '#b5651d', fontWeight: '600' },

  barLabel: { fontSize: 10.5, fontWeight: '700', fontFamily: monoFont, letterSpacing: 0.16, color: COLORS.muted, textTransform: 'uppercase', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },

  subjectBar: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 8, gap: 6 },
  subj: { flex: 1, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  subjActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  subjText: { fontSize: 11, fontWeight: '600', color: COLORS.muted },
  subjTextActive: { color: '#fff' },

  availBar: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 6, gap: 6 },
  avail: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center' },
  availActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  availText: { fontSize: 10.5, fontWeight: '600', color: COLORS.muted },
  availTextActive: { color: '#fff' },

  pdfs: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  tile: { width: '48%', borderRadius: 18, padding: 12, minHeight: 116, position: 'relative', flexDirection: 'column', gap: 4 },
  glyph: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  glyphText: { fontSize: 11, fontWeight: '700', fontFamily: monoFont, color: '#fff' },
  tileTitle: { fontSize: 13, fontWeight: '700', color: COLORS.fg, lineHeight: 17 },
  tileMeta: { fontSize: 10.5, color: COLORS.muted, opacity: 0.7 },
  freeTag: { position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: '700', fontFamily: monoFont, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 999, backgroundColor: COLORS.primary, color: '#fff', letterSpacing: 0.06 },
  paidTag: { position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: '700', fontFamily: monoFont, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 999, backgroundColor: COLORS.fg, color: '#fff', letterSpacing: 0.06 },

  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyContainer: { paddingVertical: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.fg },
  emptySubtitle: { fontSize: 13, color: COLORS.muted },
});
