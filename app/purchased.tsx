import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, ImageBackground } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, BookOpen, Download } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { getTileBg, getGlyphColor, getGlyphLetter } from '@/constants/subjectVisuals';
import { api } from '@/lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDownloadedIds } from '@/lib/downloadManager';

type PDF = {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  pages_count: number;
  class: string | null;
  cover_image_url?: string;
};

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export default function PurchasedScreen() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      fetchPurchased();
      fetchDownloaded();
    }, [])
  );

  async function fetchPurchased() {
    try {
      const data = await api.getPurchasedPdfs();
      if (data && Array.isArray(data)) {
        setPdfs(data);
      }
    } catch (e) {
      // not logged in or error
    } finally {
      setLoading(false);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }}>
          <ArrowLeft size={14} color={COLORS.muted} strokeWidth={1.6} />
        </TouchableOpacity>
        <Text style={styles.topbarText}>MY PURCHASED PDFs</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : pdfs.length === 0 ? (
          <View style={styles.centerBox}>
            <BookOpen size={48} color={COLORS.border} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No purchased PDFs yet</Text>
            <Text style={styles.emptySubtitle}>Browse the library and buy PDFs to see them here</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/pdfs' as any)} activeOpacity={0.85}>
              <Text style={styles.browseBtnText}>Browse PDFs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {pdfs.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.tile}
                onPress={() => router.push(`/pdf/${item.id}` as any)}
                activeOpacity={0.88}
              >
                <View style={[styles.tileImgArea, { backgroundColor: getTileBg(item.subject) }]}>
                  {item.cover_image_url && <ImageBackground source={{ uri: item.cover_image_url }} style={StyleSheet.absoluteFill} imageStyle={{ borderTopLeftRadius: 18, borderTopRightRadius: 18 }} />}
                  <View style={[styles.tileGlyph, { backgroundColor: getGlyphColor(item.subject) }]}>
                    <Text style={styles.tileGlyphText}>{getGlyphLetter(item.subject)}</Text>
                  </View>
                  {downloadedIds.has(String(item.id)) && (
                    <View style={styles.tileDownloadBadge}>
                      <Download size={9} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                  <Text style={styles.tileOwnedTag}>OWNED</Text>
                </View>
                <View style={styles.tileInfoPanel}>
                  <Text style={styles.tileSubjectTag}>{item.subject}{item.class ? ` · ${item.class}` : ''}</Text>
                  <Text style={styles.tileTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.tileMeta} numberOfLines={1}>{item.pages_count} pages</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },

  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 6 },
  backCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  topbarText: { fontSize: 12, fontWeight: '600', color: COLORS.muted, fontFamily: monoFont, letterSpacing: 0.14 },

  centerBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.fg, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },
  browseBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 999, marginTop: 8 },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingTop: 14, gap: 12 },
  tile: { width: '46.5%', borderRadius: 18, backgroundColor: '#fff', overflow: 'hidden' },
  tileImgArea: { minHeight: 100, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tileGlyph: { position: 'absolute', top: 8, left: 8, width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tileGlyphText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  tileInfoPanel: { paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: '#fff' },
  tileSubjectTag: { fontSize: 9, fontWeight: '700', fontFamily: monoFont, color: COLORS.primary, letterSpacing: 0.06, textTransform: 'uppercase', marginBottom: 2 },
  tileTitle: { fontSize: 13, fontWeight: '700', color: COLORS.fg, lineHeight: 17 },
  tileMeta: { fontSize: 10.5, color: COLORS.muted, fontFamily: monoFont },
  tileOwnedTag: { position: 'absolute', top: 8, right: 8, fontSize: 9, fontWeight: '700', fontFamily: monoFont, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 999, backgroundColor: COLORS.primaryDark, color: '#fff', letterSpacing: 0.06 },
  tileDownloadBadge: { position: 'absolute', top: 8, left: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
});