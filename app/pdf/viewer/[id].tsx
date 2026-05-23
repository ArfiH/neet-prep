import { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Pdf from 'react-native-pdf';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { COLORS } from '@/constants/colors';
import { showInterstitialAd, hasWatchedAd } from '@/lib/adService';

const { width, height } = Dimensions.get('window');

export default function PdfViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [viewData, setViewData] = useState<{ url: string; headers: Record<string, string>; is_free: boolean; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  usePreventScreenCapture();
  const { user } = useAuth();

  const watermarkEmail = user?.email || 'NEET ZYME';
  const watermarkPhone = user?.phone ? ` | ${user.phone}` : '';
  const watermarkText = `${watermarkEmail}${watermarkPhone}`;

  useEffect(() => {
    fetchViewUrl();
  }, [id]);

  useEffect(() => {
    if (viewData && viewData.is_free && !hasWatchedAd(id)) {
      setShowAdOverlay(true);
    } else if (viewData) {
      setPdfReady(true);
    }
  }, [viewData, id]);

  async function fetchViewUrl() {
    try {
      const data = await api.getPdfViewUrl(id);
      if (!data || !data.url) {
        setError('PDF file not available.');
        setLoading(false);
        return;
      }
      setViewData(data);
      setLoading(false);
    } catch (err: any) {
      const msg = (err?.message || '').toLowerCase();
      if (msg.includes('purchase')) {
        setError('Please purchase this PDF to view it.');
        setLoading(false);
        return;
      }
      // Fallback: try fetching the PDF directly with getPdfById
      try {
        const pdfData = await api.getPdfById(id);
        if (!pdfData || !pdfData.file_url) {
          setError('PDF file not available.');
          setLoading(false);
          return;
        }
        if (!pdfData.is_free) {
          const { hasPurchased } = await api.checkPdfPurchase(id);
          if (!hasPurchased) {
            setError('Please purchase this PDF to view it.');
            setLoading(false);
            return;
          }
        }
        setViewData({ url: pdfData.file_url, headers: {}, is_free: pdfData.is_free, title: pdfData.title });
        setLoading(false);
      } catch {
        setError(msg || 'Failed to load PDF');
        setLoading(false);
      }
    }
  }

  async function handleWatchAd() {
    const result = await showInterstitialAd(id);
    if (result.canViewPdf) {
      setShowAdOverlay(false);
      setPdfReady(true);
    }
  }

  const pdfSource = useMemo(() => {
    if (!viewData) return undefined;
    const src: any = { uri: viewData.url };
    if (viewData.headers && Object.keys(viewData.headers).length > 0) {
      src.headers = viewData.headers;
    }
    return src;
  }, [viewData]);

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={14} color={COLORS.muted} strokeWidth={1.6} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>{viewData?.title}</Text>
          {numPages > 0 && (
            <Text style={styles.pageIndicator}>{currentPage}/{numPages}</Text>
          )}
        </View>

        {showAdOverlay && (
          <View style={styles.adOverlay}>
            <View style={styles.adOverlayContent}>
              <Text style={styles.adOverlayTitle}>Watch Ad to View PDF</Text>
              <Text style={styles.adOverlayText}>This free PDF requires watching an ad first.</Text>
              <TouchableOpacity style={styles.watchAdButton} onPress={handleWatchAd}>
                <Text style={styles.watchAdButtonText}>Watch Ad</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {pdfReady && pdfSource && (
          <View style={styles.pdfContainer}>
            <Pdf
              source={pdfSource}
              trustAllCerts={false}
              onLoadComplete={(numberOfPages) => {
                setNumPages(numberOfPages);
              }}
              onPageChanged={(page) => {
                setCurrentPage(page);
              }}
              onError={(err: any) => {
                console.log('PDF error:', err);
                setError('This PDF file could not be loaded. It may be corrupted or unavailable.');
              }}
              style={styles.pdf}
            />
            <View style={styles.watermarkLayer} pointerEvents="none">
              <View style={styles.watermarkRow}>
                <Text style={styles.watermarkText}>{watermarkText}</Text>
              </View>
              <View style={styles.watermarkRow}>
                <Text style={styles.watermarkText}>{watermarkText}</Text>
              </View>
              <View style={styles.watermarkRow}>
                <Text style={styles.watermarkText}>{watermarkText}</Text>
              </View>
              <View style={styles.watermarkRow}>
                <Text style={styles.watermarkText}>{watermarkText}</Text>
              </View>
              <View style={styles.watermarkRow}>
                <Text style={styles.watermarkText}>{watermarkText}</Text>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 },
  loadingText: { fontSize: 14, color: COLORS.muted, marginTop: 12 },
  errorText: { fontSize: 16, color: COLORS.fg, textAlign: 'center', marginBottom: 20 },
  backButton: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: COLORS.primary, borderRadius: 12 },
  backButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  topBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 8, paddingHorizontal: 12, backgroundColor: '#1a1a1a' },
  backBtn: { backgroundColor: '#333', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  topBarTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: '#ccc', textAlign: 'center', marginHorizontal: 8 },
  pageIndicator: { fontSize: 11, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), color: '#888' },

  pdfContainer: { flex: 1, position: 'relative' },
  pdf: { flex: 1, width, height: height - 100 },

  watermarkLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-around', alignItems: 'center' },
  watermarkRow: { width: '100%', alignItems: 'center' },
  watermarkText: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.08)', transform: [{ rotate: '-25deg' }], letterSpacing: 2 },

  adOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  adOverlayContent: { backgroundColor: '#fff', padding: 30, borderRadius: 16, alignItems: 'center', marginHorizontal: 20 },
  adOverlayTitle: { fontSize: 20, fontWeight: '700', color: COLORS.fg, marginBottom: 12 },
  adOverlayText: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 24 },
  watchAdButton: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 999 },
  watchAdButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { marginTop: 16, paddingVertical: 10 },
  cancelButtonText: { color: COLORS.muted, fontSize: 14 },
});
