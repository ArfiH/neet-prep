import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { BookOpen, Download } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { getTileBg, getGlyphColor, getGlyphLetter } from '@/constants/subjectVisuals';
import { api, formatPrice, isNetworkError } from '@/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDownloadedIds, getDownloadedPDFs } from '@/lib/downloadManager';
import AlertBanner from '@/components/AlertBanner';

type PDF = {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  pages_count: number;
  category: string | null;
  class: string | null;
};

const SUBJECTS = ['Biology', 'Physics', 'Chemistry'];

function getUniqueSubjects(pdfs: PDF[]): string[] {
  const subjects = pdfs.map((p) => p.subject);
  const unique = [...new Set(subjects)];
  return unique.sort();
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeClass, setActiveClass] = useState<string | null>(null);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [isOffline, setIsOffline] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    fetchPdfs();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPurchased();
      fetchDownloaded();
    }, [])
  );

  useEffect(() => {
    applyFilters();
  }, [pdfs, activeSubject, activeFilter, activeCategory, activeClass]);

  async function fetchPdfs() {
    setLoading(true);
    try {
      const data = await api.getPdfs();
      if (data) {
        setPdfs(data);
      }
      setIsOffline(false);
    } catch (e: any) {
      if (isNetworkError(e)) {
        setIsOffline(true);
        const downloaded = await getDownloadedPDFs();
        setOfflineCount(downloaded.length);
      }
    }
    setLoading(false);
  }

  async function fetchPurchased() {
    try {
      const data = await api.getPurchasedPdfs();
      if (data && Array.isArray(data)) {
        setPurchasedIds(new Set(data.map((p: any) => String(p.id))));
      }
    } catch (e: any) {
      if (isNetworkError(e)) setIsOffline(true);
    }
  }

  async function fetchDownloaded() {
    try {
      const ids = await getDownloadedIds();
      setDownloadedIds(new Set(ids));
    } catch {
      // ignore
    }
  }

  function applyFilters() {
    let result = [...pdfs];
    if (activeSubject) {
      result = result.filter((p) => p.subject === activeSubject);
    }
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (activeClass) {
      result = result.filter((p) => p['class'] === activeClass);
    }
    if (activeFilter === 'free') result = result.filter((p) => p.is_free);
    if (activeFilter === 'paid') result = result.filter((p) => !p.is_free);
    setFiltered(result);
  }

  const freeCount = filtered.filter((p) => p.is_free).length;
  const paidCount = filtered.filter((p) => !p.is_free).length;
  const uniqueSubjects = getUniqueSubjects(pdfs);
  const uniqueCategories = [...new Set(pdfs.map((p) => p.category).filter(Boolean))] as string[];
  const uniqueClasses = [...new Set(pdfs.map((p) => p['class']).filter(Boolean))] as string[];

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

        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <AlertBanner
              type="info"
              message={`You're offline. PDFs will appear when connected. ${offlineCount > 0 ? `${offlineCount} downloaded PDF${offlineCount > 1 ? 's' : ''} available.` : ''}`}
              action={offlineCount > 0 ? { label: 'View Downloaded', onPress: () => router.push('/(tabs)/downloaded') } : undefined}
              dismissable
              onDismiss={() => setIsOffline(false)}
            />
          </View>
        )}

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

        {/* Category Bar */}
        {uniqueCategories.length > 0 && (
          <>
            <Text style={styles.barLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryBar}>
              {uniqueCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
                  onPress={() => setActiveCategory(activeCategory === cat ? null : cat)}
                >
                  <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Class Bar */}
        {uniqueClasses.length > 0 && (
          <>
            <Text style={styles.barLabel}>Class</Text>
            <View style={styles.subjectBar}>
              {uniqueClasses.map((cls) => (
                <TouchableOpacity
                  key={cls}
                  style={[styles.subj, activeClass === cls && styles.subjActive]}
                  onPress={() => setActiveClass(activeClass === cls ? null : cls)}
                >
                  <Text style={[styles.subjText, activeClass === cls && styles.subjTextActive]} numberOfLines={1}>Class {cls}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

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
                {downloadedIds.has(String(item.id)) && (
                  <View style={styles.downloadBadge}>
                    <Download size={9} color="#fff" strokeWidth={3} />
                  </View>
                )}
                {item.is_free ? (
                  <Text style={styles.freeTag}>FREE</Text>
                ) : purchasedIds.has(String(item.id)) ? (
                  <Text style={styles.ownedTag}>OWNED</Text>
                ) : (
                  <Text style={styles.paidTag}>₹{formatPrice(item.price)}</Text>
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

  offlineBanner: { paddingHorizontal: 14, paddingTop: 4 },
  barLabel: { fontSize: 10.5, fontWeight: '700', fontFamily: monoFont, letterSpacing: 0.16, color: COLORS.muted, textTransform: 'uppercase', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8 },

  subjectBar: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 8, gap: 6 },
  subj: { flex: 1, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  subjActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  subjText: { fontSize: 11, fontWeight: '600', color: COLORS.muted },
  subjTextActive: { color: '#fff' },

  availBar: { flexDirection: 'row', paddingHorizontal: 14, paddingBottom: 6, gap: 6 },
  categoryBar: { paddingHorizontal: 14, paddingBottom: 8, gap: 6, flexDirection: 'row' },
  catChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 11, fontWeight: '600', color: COLORS.muted },
  catChipTextActive: { color: '#fff' },
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
  ownedTag: { position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: '700', fontFamily: monoFont, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 999, backgroundColor: COLORS.primaryDark, color: '#fff', letterSpacing: 0.06 },
  downloadBadge: { position: 'absolute', top: 10, left: 10, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },

  loadingContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyContainer: { paddingVertical: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.fg },
  emptySubtitle: { fontSize: 13, color: COLORS.muted },
});
