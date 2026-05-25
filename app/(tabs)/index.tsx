import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { getTileBg, getGlyphColor, getGlyphLetter } from '@/constants/subjectVisuals';
import { api } from '@/lib/api';
import { getRecentlyViewedIds } from '@/lib/recentlyViewed';
import { SafeAreaView } from 'react-native-safe-area-context';

type PDF = {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  pages_count: number;
  downloads: number;
};

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

function Indicator({ scrollX, contentWidth, layoutWidth }: { scrollX: Animated.Value; contentWidth: number; layoutWidth: number }) {
  const scrollable = contentWidth - layoutWidth;
  const indicatorWidth = Math.max(24, (layoutWidth / contentWidth) * (layoutWidth - 44));
  const translateX = scrollX.interpolate({
    inputRange: [0, Math.max(1, scrollable)],
    outputRange: [0, Math.max(0, layoutWidth - 44 - indicatorWidth)],
    extrapolate: 'clamp',
  });
  return <Animated.View style={[styles.scrollIndicator, { width: indicatorWidth, transform: [{ translateX }] }]} />;
}

export default function HomeScreen() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [recentPdfs, setRecentPdfs] = useState<PDF[]>([]);
  const scrollX = useRef(new Animated.Value(0)).current;
  const contentWidth = useRef(0);
  const layoutWidth = useRef(0);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPdfs();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPurchased();
    }, [])
  );

  useEffect(() => {
    if (pdfs.length > 0) {
      loadRecentPdfs();
    }
  }, [pdfs]);

  async function fetchPdfs() {
    try {
      const data = await api.getPdfs();
      if (data) setPdfs(data);
    } catch (e) {}
  }

  async function fetchPurchased() {
    try {
      const data = await api.getPurchasedPdfs();
      if (data && Array.isArray(data)) {
        setPurchasedIds(new Set(data.map((p: any) => String(p.id))));
      }
    } catch (e) {}
  }

  async function loadRecentPdfs() {
    try {
      const ids = await getRecentlyViewedIds();
      if (ids.length > 0) {
        const recents = ids
          .map((id) => pdfs.find((p: PDF) => String(p.id) === String(id)))
          .filter(Boolean) as PDF[];
        setRecentPdfs(recents.slice(0, 3));
      }
    } catch (e) {}
  }

  const featured = [...pdfs].sort((a, b) => b.downloads - a.downloads).slice(0, 4);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingTitle}>Good morning, Arfi</Text>
          <Text style={styles.greetingSub}>Continue where you left off</Text>
        </View>

        {/* Stats */}
        {/* <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{pdfs.length}</Text>
            <Text style={styles.statLabel}>PDFs read</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>48h</Text>
            <Text style={styles.statLabel}>Study time</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>18</Text>
            <Text style={styles.statLabel}>Days streak</Text>
          </View>
        </View> */}

        {/* Recently Viewed */}
        {recentPdfs.length > 0 && (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Recently viewed</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/pdfs')}>
                <Text style={styles.sectionLink}>See all</Text>
              </TouchableOpacity>
            </View>
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                { useNativeDriver: false }
              )}
              scrollEventThrottle={16}
              onContentSizeChange={(w) => { contentWidth.current = w; }}
              onLayout={(e) => { layoutWidth.current = e.nativeEvent.layout.width; }}
              style={styles.recentScroll}
              contentContainerStyle={styles.recentScrollInner}
            >
              {recentPdfs.map((item) => (
                <TouchableOpacity key={item.id} style={[styles.recentCard, { backgroundColor: getTileBg(item.subject) }]} onPress={() => router.push(`/pdf/${item.id}` as any)} activeOpacity={0.88}>
                  <View style={[styles.recentGlyph, { backgroundColor: getGlyphColor(item.subject) }]}>
                    <Text style={styles.recentGlyphText}>{getGlyphLetter(item.subject)}</Text>
                  </View>
                  <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.recentMeta} numberOfLines={1}>{item.description?.slice(0, 30) || 'Ch 1–4'}</Text>
                </TouchableOpacity>
              ))}
            </Animated.ScrollView>
            {contentWidth.current > layoutWidth.current && (
              <View style={styles.scrollTrack}>
                <Indicator scrollX={scrollX} contentWidth={contentWidth.current} layoutWidth={layoutWidth.current} />
              </View>
            )}
          </>
        )}

        {/* Featured PDFs */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Featured PDFs</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/pdfs')}>
            <Text style={styles.sectionLink}>Browse</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.featuredGrid}>
          {featured.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.featuredCard, { backgroundColor: getTileBg(item.subject) }]} onPress={() => router.push(`/pdf/${item.id}` as any)} activeOpacity={0.88}>
              <View style={[styles.featuredGlyph, { backgroundColor: getGlyphColor(item.subject) }]}>
                <Text style={styles.featuredGlyphText}>{getGlyphLetter(item.subject)}</Text>
              </View>
              <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.featuredMeta} numberOfLines={1}>{item.downloads.toLocaleString()} views</Text>
              <View style={[styles.featuredBadge, item.is_free ? styles.badgeFree : purchasedIds.has(String(item.id)) ? styles.badgeOwned : styles.badgePaid]}>
                <Text style={styles.badgeText}>{item.is_free ? 'FREE' : purchasedIds.has(String(item.id)) ? 'OWNED' : `₹${item.price}`}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },

  greeting: { paddingHorizontal: 22, paddingTop: 4 },
  greetingTitle: { fontSize: 22, fontWeight: '700', color: COLORS.fg, letterSpacing: -0.01 },
  greetingSub: { fontSize: 12.5, color: COLORS.muted, marginTop: 2 },

  stats: { flexDirection: 'row', gap: 8, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 6 },
  stat: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: COLORS.stage, borderWidth: 1, borderColor: COLORS.border },
  statNum: { fontSize: 18, fontWeight: '700', color: COLORS.primaryDark },
  statLabel: { fontSize: 10, fontFamily: monoFont, color: COLORS.muted, letterSpacing: 0.04, textTransform: 'uppercase', marginTop: 2 },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.fg, letterSpacing: -0.01 },
  sectionLink: { fontSize: 10.5, fontFamily: monoFont, fontWeight: '600', color: COLORS.primary, letterSpacing: 0.04 },

  recentScroll: { marginBottom: 6 },
  recentScrollInner: { paddingHorizontal: 22, gap: 10 },
  scrollTrack: { height: 3, borderRadius: 1.5, backgroundColor: COLORS.border, marginHorizontal: 22, marginBottom: 12, overflow: 'hidden' },
  scrollIndicator: { height: 3, borderRadius: 1.5, backgroundColor: COLORS.primary },
  recentCard: { minWidth: 140, padding: 12, borderRadius: 16, position: 'relative' },
  recentGlyph: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  recentGlyphText: { fontSize: 11, fontWeight: '700', fontFamily: monoFont, color: '#fff' },
  recentTitle: { fontSize: 12, fontWeight: '600', color: COLORS.fg },
  recentMeta: { fontSize: 10, fontFamily: monoFont, color: COLORS.muted, opacity: 0.6, marginTop: 3 },

  featuredGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 22, gap: 10 },
  featuredCard: { width: '48%', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12, position: 'relative', minHeight: 130, flexDirection: 'column' },
  featuredGlyph: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  featuredGlyphText: { fontSize: 11, fontWeight: '700', fontFamily: monoFont, color: '#fff' },
  featuredTitle: { fontSize: 13, fontWeight: '700', color: COLORS.fg },
  featuredMeta: { fontSize: 10, color: COLORS.muted, opacity: 0.7, marginTop: 3 },
  featuredBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999 },
  badgeFree: { backgroundColor: COLORS.primary },
  badgePaid: { backgroundColor: COLORS.fg },
  badgeOwned: { backgroundColor: COLORS.primaryDark },
  badgeText: { fontSize: 9, fontWeight: '700', fontFamily: monoFont, color: '#fff', letterSpacing: 0.06, textTransform: 'uppercase' },
});
