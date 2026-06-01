import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, BookOpen, Trash2 } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { getTileBg, getGlyphColor, getGlyphLetter } from '@/constants/subjectVisuals';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDownloadedPDFs, deleteLocalPDF, DownloadedPDF } from '@/lib/downloadManager';

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export default function DownloadedScreen() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<DownloadedPDF[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDownloads();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshDownloads();
    }, [])
  );

  async function loadDownloads() {
    setLoading(true);
    const data = await getDownloadedPDFs();
    setPdfs(data);
    setLoading(false);
  }

  async function refreshDownloads() {
    const data = await getDownloadedPDFs();
    setPdfs(data);
  }

  async function handleDelete(id: string, title: string) {
    Alert.alert(
      'Delete PDF',
      `Remove "${title}" from offline storage? You can download it again anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteLocalPDF(id);
            loadDownloads();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topbar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={14} color={COLORS.muted} strokeWidth={1.6} />
        </TouchableOpacity>
        <Text style={styles.topbarText}>DOWNLOADED PDFs</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : pdfs.length === 0 ? (
          <View style={styles.centerBox}>
            <BookOpen size={48} color={COLORS.border} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No downloaded PDFs</Text>
            <Text style={styles.emptySubtitle}>Download a PDF from the library to read it offline</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/pdfs' as any)} activeOpacity={0.85}>
              <Text style={styles.browseBtnText}>Browse PDFs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {pdfs.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.tile, { backgroundColor: getTileBg(item.subject) }]}
                onPress={() => router.push(`/pdf/viewer/${item.id}` as any)}
                activeOpacity={0.88}
              >
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.title)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={12} color={COLORS.muted} strokeWidth={2} />
                </TouchableOpacity>
                <View style={[styles.glyph, { backgroundColor: getGlyphColor(item.subject) }]}>
                  <Text style={styles.glyphText}>{getGlyphLetter(item.subject)}</Text>
                </View>
                <Text style={styles.tileTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.tileMeta} numberOfLines={1}>{item.pagesCount} pages</Text>
                <Text style={styles.downloadedTag}>OFFLINE</Text>
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
  tile: { width: '46.5%', borderRadius: 18, padding: 16, minHeight: 150, position: 'relative' },
  deleteBtn: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  glyph: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  glyphText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  tileTitle: { fontSize: 13, fontWeight: '700', color: COLORS.fg, lineHeight: 17, flex: 1 },
  tileMeta: { fontSize: 10.5, color: COLORS.muted, fontFamily: monoFont, marginTop: 6 },
  downloadedTag: { alignSelf: 'flex-start', marginTop: 8, fontSize: 9, fontWeight: '700', fontFamily: monoFont, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 999, backgroundColor: COLORS.primary, color: '#fff', letterSpacing: 0.06, overflow: 'hidden' },
});
