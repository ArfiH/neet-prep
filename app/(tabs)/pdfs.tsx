import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Search, ListFilter as Filter, BookOpen, Lock } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { supabase } from '@/backend/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

type PDF = {
  id: string;
  title: string;
  description: string;
  subject: string;
  author: string;
  price: number;
  is_free: boolean;
  cover_image_url: string;
  pages_count: number;
  tags: string[];
  downloads: number;
};

const SUBJECTS = ['All', 'Biology', 'Chemistry', 'Physics', 'Anatomy', 'Biochemistry', 'Pharmacology', 'Practice'];

export default function PDFsScreen() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [filtered, setFiltered] = useState<PDF[]>([]);
  const [activeSubject, setActiveSubject] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'paid'>('all');

  useEffect(() => {
    fetchPdfs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pdfs, activeSubject, search, activeFilter]);

  async function fetchPdfs() {
    setLoading(true);
    const { data } = await supabase.from('pdfs').select('*').order('created_at', { ascending: false });
    if (data) {
      setPdfs(data);
      setFiltered(data);
    }
    setLoading(false);
  }

  function applyFilters() {
    let result = [...pdfs];
    if (activeSubject !== 'All') {
      result = result.filter((p) => p.subject === activeSubject);
    }
    if (activeFilter === 'free') result = result.filter((p) => p.is_free);
    if (activeFilter === 'paid') result = result.filter((p) => !p.is_free);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.subject.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }

  const renderPDF = ({ item }: { item: PDF }) => (
    <TouchableOpacity
      style={styles.pdfCard}
      onPress={() => router.push(`/pdf/${item.id}` as any)}
      activeOpacity={0.88}
    >
      <Image
        source={{ uri: item.cover_image_url || 'https://images.pexels.com/photos/4855428/pexels-photo-4855428.jpeg' }}
        style={styles.pdfImage}
      />
      <View style={styles.pdfInfo}>
        <View style={styles.pdfTopRow}>
          <View style={[styles.subjectBadge]}>
            <Text style={styles.subjectBadgeText}>{item.subject}</Text>
          </View>
          <View style={[styles.priceBadge, item.is_free ? styles.freeBadge : styles.paidBadge]}>
            {item.is_free ? (
              <Text style={[styles.priceBadgeText, { color: COLORS.tagFree }]}>FREE</Text>
            ) : (
              <>
                <Lock size={9} color={COLORS.tagPaid} strokeWidth={2.5} />
                <Text style={[styles.priceBadgeText, { color: COLORS.tagPaid }]}> ₹{item.price}</Text>
              </>
            )}
          </View>
        </View>
        <Text style={styles.pdfTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.pdfAuthor} numberOfLines={1}>by {item.author}</Text>
        <View style={styles.pdfMeta}>
          <Text style={styles.pdfMetaText}>{item.pages_count} pages</Text>
          <View style={styles.dot} />
          <Text style={styles.pdfMetaText}>{item.downloads} downloads</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Read PDFs</Text>
        <Text style={styles.headerSubtitle}>NEET study materials</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={16} color={COLORS.textLight} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, subject, author..."
            placeholderTextColor={COLORS.textLight}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {(['all', 'free', 'paid'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      
      {/* Subject Tabs */}
      <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6 }}>
        <Text style={{paddingHorizontal: 4, fontSize: 16, fontWeight: '900'}}>Subjects</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll} contentContainerStyle={styles.subjectScrollContent}>
        {SUBJECTS.map((subject) => (
          <TouchableOpacity
            key={subject}
            style={[styles.subjectTab, activeSubject === subject && styles.subjectTabActive]}
            onPress={() => setActiveSubject(subject)}
          >
            <Text style={[styles.subjectTabText, activeSubject === subject && styles.subjectTabTextActive]}>
              {subject}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading PDFs...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookOpen size={48} color={COLORS.border} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No PDFs found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderPDF}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: '#fff',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterPillText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  filterPillTextActive: { color: '#fff' },

  subjectScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  subjectScrollContent: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  subjectTab: {
    paddingHorizontal: 14,
    height: 32,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  subjectTabActive: { backgroundColor: COLORS.primarySurface, borderColor: COLORS.primaryBorder },
  subjectTabText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  subjectTabTextActive: { color: COLORS.primary },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary },

  listContent: { padding: 16, gap: 12 },

  pdfCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  pdfImage: { width: 100, height: 120, resizeMode: 'cover' },
  pdfInfo: { flex: 1, padding: 12 },
  pdfTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subjectBadge: {
    backgroundColor: COLORS.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subjectBadgeText: { fontSize: 10, fontWeight: '600', color: COLORS.primary },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  freeBadge: { backgroundColor: COLORS.tagFreeBg },
  paidBadge: { backgroundColor: COLORS.tagPaidBg },
  priceBadgeText: { fontSize: 11, fontWeight: '700' },
  pdfTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, lineHeight: 20 },
  pdfAuthor: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  pdfMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  pdfMetaText: { fontSize: 11, color: COLORS.textLight },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.border },
});
