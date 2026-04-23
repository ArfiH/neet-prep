import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Star } from 'lucide-react-native';
import { COLORS, SHADOWS } from '@/constants/colors';
import { supabase } from '@/backend/supabase';
import { getRecentlyViewedIds } from '@/lib/recentlyViewed';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type PDF = {
  id: string;
  title: string;
  subject: string;
  price: number;
  is_free: boolean;
  cover_image_url: string;
  pages_count: number;
};

type College = {
  id: string;
  name: string;
  state: string;
  city: string;
  type: string;
  image_url: string;
};

const SUBJECTS = ['All', 'Biology', 'Chemistry', 'Physics', 'Anatomy', 'Pharmacology', 'Practice'];

export default function HomeScreen() {
  const router = useRouter();
  const [featuredPdfs, setFeaturedPdfs] = useState<PDF[]>([]);
  const [recentlyViewedPdfs, setRecentlyViewedPdfs] = useState<PDF[]>([]);
  const [topColleges, setTopColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [pdfsRes, collegesRes, recentIds] = await Promise.all([
        supabase.from('pdfs').select('*').limit(6),
        supabase.from('colleges').select('*').limit(4),
        getRecentlyViewedIds(),
      ]);
      if (pdfsRes.data) setFeaturedPdfs(pdfsRes.data);
      if (collegesRes.data) setTopColleges(collegesRes.data);
      
      if (recentIds.length > 0) {
        const { data: recentPdfs } = await supabase
          .from('pdfs')
          .select('*')
          .in('id', recentIds);
        if (recentPdfs) {
          const sortedRecent = recentIds
            .map((id) => recentPdfs.find((p) => p.id === id))
            .filter((p): p is PDF => p !== undefined);
          setRecentlyViewedPdfs(sortedRecent);
        }
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroGreeting}>Welcome, Future Doctor!</Text>
            <Text style={styles.heroSubtitle}>Your NEET preparation centre</Text>
          </View>
          
          {/* profile photo can go here
          <View style={styles.neetBadge}>
          </View> */}
        
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Study PDFs', value: '50+' },
            { label: 'Colleges', value: '500+' },
            { label: 'Students', value: '10K+' },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Recently Viewed PDFs */}
        {recentlyViewedPdfs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently Viewed</Text>
            <FlatList
              data={recentlyViewedPdfs}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingLeft: 2, paddingRight: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pdfCard}
                  onPress={() => router.push(`/pdf/${item.id}` as any)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: item.cover_image_url || 'https://images.pexels.com/photos/4855428/pexels-photo-4855428.jpeg' }}
                    style={styles.pdfCardImage}
                  />
                  <View style={styles.pdfCardOverlay}>
                    <View style={[styles.pdfTag, item.is_free ? styles.freeTag : styles.paidTag]}>
                      <Text style={[styles.pdfTagText, { color: item.is_free ? COLORS.tagFree : COLORS.tagPaid }]}>
                        {item.is_free ? 'FREE' : `₹${item.price}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pdfCardBody}>
                    <Text style={styles.pdfSubject}>{item.subject}</Text>
                    <Text style={styles.pdfTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.pdfPages}>{item.pages_count} pages</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Featured PDFs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured PDFs</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/pdfs')} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight size={14} color={COLORS.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={featuredPdfs.slice(0, 6)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingLeft: 2, paddingRight: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pdfCard}
                onPress={() => router.push(`/pdf/${item.id}` as any)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.cover_image_url || 'https://images.pexels.com/photos/4855428/pexels-photo-4855428.jpeg' }}
                  style={styles.pdfCardImage}
                />
                <View style={styles.pdfCardOverlay}>
                  <View style={[styles.pdfTag, item.is_free ? styles.freeTag : styles.paidTag]}>
                    <Text style={[styles.pdfTagText, { color: item.is_free ? COLORS.tagFree : COLORS.tagPaid }]}>
                      {item.is_free ? 'FREE' : `₹${item.price}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.pdfCardBody}>
                  <Text style={styles.pdfSubject}>{item.subject}</Text>
                  <Text style={styles.pdfTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.pdfPages}>{item.pages_count} pages</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Top Colleges */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Medical Colleges</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/colleges')} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>See all</Text>
              <ChevronRight size={14} color={COLORS.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          {topColleges.map((college) => (
            <TouchableOpacity
              key={college.id}
              style={styles.collegeRow}
              onPress={() => router.push(`/college/${college.id}` as any)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: college.image_url || 'https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg' }}
                style={styles.collegeRowImage}
              />
              <View style={styles.collegeRowInfo}>
                <Text style={styles.collegeRowName} numberOfLines={1}>{college.name}</Text>
                <Text style={styles.collegeRowState}>{college.city ? `${college.city}, ` : ''}{college.state}</Text>
                <View style={[styles.collegeTag, college.type === 'Government' ? styles.govtTag : styles.privateTag]}>
                  <Text style={[styles.collegeTagText, { color: college.type === 'Government' ? COLORS.tagGovt : COLORS.tagPrivate }]}>
                    {college.type}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={COLORS.textLight} strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.surface },
  heroBanner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextBlock: {},
  heroGreeting: { fontSize: 22, fontWeight: '700', color: '#fff' },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  neetBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  neetBadgeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  neetBadgeValue: { fontSize: 13, color: '#fff', fontWeight: '700', marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -16,
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },

  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12},
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  pdfCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 14,
    marginRight: 12,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  pdfCardImage: { width: '100%', height: 110, resizeMode: 'cover' },
  pdfCardOverlay: { position: 'absolute', top: 8, right: 8 },
  pdfTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  freeTag: { backgroundColor: COLORS.tagFreeBg },
  paidTag: { backgroundColor: COLORS.tagPaidBg },
  pdfTagText: { fontSize: 11, fontWeight: '700' },
  pdfCardBody: { padding: 10 },
  pdfSubject: { fontSize: 10, color: COLORS.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  pdfTitle: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginTop: 3, lineHeight: 17 },
  pdfPages: { fontSize: 10, color: COLORS.textLight, marginTop: 4 },

  collegeRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  collegeRowImage: { width: 56, height: 56, borderRadius: 10, resizeMode: 'cover' },
  collegeRowInfo: { flex: 1, marginLeft: 12 },
  collegeRowName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  collegeRowState: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  collegeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6, alignSelf: 'flex-start' },
  govtTag: { backgroundColor: COLORS.tagGovtBg },
  privateTag: { backgroundColor: COLORS.tagPrivateBg },
  collegeTagText: { fontSize: 10, fontWeight: '600' },
});
