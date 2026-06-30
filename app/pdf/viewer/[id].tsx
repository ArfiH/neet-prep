import { useEffect, useState, useMemo, useRef } from 'react';
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
import { hasLocalPDF, getDecryptedTempPath } from '@/lib/downloadManager';
import ReactNativeBlobUtil from 'react-native-blob-util';

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
  const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [adSettings, setAdSettings] = useState<{ ad_on_free_read: string; ad_on_free_download: string } | null>(null);
  const [isLocal, setIsLocal] = useState(false);
  const [localTempPath, setLocalTempPath] = useState<string | null>(null);
  const tempPathRef = useRef<string | null>(null);

  usePreventScreenCapture();
  const { user } = useAuth();

  const watermarkEmail = user?.email || 'NEET ZYMEE';
  const watermarkPhone = user?.phone ? ` | ${user.phone}` : '';
  const watermarkText = `${watermarkEmail}${watermarkPhone}`;

  useEffect(() => {
    fetchViewUrl();
    return () => {
      if (tempPathRef.current) {
        ReactNativeBlobUtil.fs.unlink(tempPathRef.current).catch(() => {});
      }
    };
  }, [id]);

  useEffect(() => {
    api.getAdSettings().then(s => setAdSettings(s)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isLocal) {
      setPdfReady(true);
      return;
    }
    if (viewData && viewData.is_free) {
      if (!adSettings) return;
      if (adSettings.ad_on_free_read === '1' && !hasWatchedAd(id)) {
        setShowAdOverlay(true);
      } else {
        setPdfReady(true);
      }
    } else if (viewData) {
      setPdfReady(true);
    }
  }, [viewData, id, isLocal, adSettings]);

  async function fetchViewUrl() {
    try {
      const local = await hasLocalPDF(id);
      if (local) {
        const tempPath = await getDecryptedTempPath(id);
        setLocalTempPath(tempPath);
        tempPathRef.current = tempPath;
        setIsLocal(true);
        setLoading(false);
        return;
      }
    } catch {
      // Local file error — fall through to network
    }

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
    setAdLoading(true);
    setAdError(null);
    const result = await showInterstitialAd(id);
    if (result.canViewPdf) {
      setShowAdOverlay(false);
      setPdfReady(true);
    } else if (result.error) {
      setAdError(result.error);
    }
    setAdLoading(false);
  }

  const pdfSource = useMemo(() => {
    if (localTempPath) {
      return { uri: `file://${localTempPath}`, cache: false };
    }
    if (!viewData) return undefined;
    const src: any = { uri: viewData.url };
    if (viewData.headers && Object.keys(viewData.headers).length > 0) {
      src.headers = viewData.headers;
    }
    return src;
  }, [viewData, localTempPath]);

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
          <TouchableOpacity onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }} style={styles.backButton}>
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
          <TouchableOpacity style={styles.backBtn} onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }}>
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
              {adError && (
                <Text style={styles.adErrorText}>{adError}</Text>
              )}
              <TouchableOpacity style={[styles.watchAdButton, adLoading && { opacity: 0.6 }]} onPress={handleWatchAd} disabled={adLoading}>
                {adLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.watchAdButtonText}>Watch Ad</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(tabs)'); }}>
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
              renderActivityIndicator={() => (
                <ActivityIndicator size="large" color={COLORS.primary} />
              )}
            />
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={styles.watermarkCentered}>
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

  watermarkCentered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  watermarkText: { fontSize: 28, fontWeight: '600', color: 'rgba(0, 0, 0, 0.23)', transform: [{ rotate: '-45deg' }] },

  adOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  adOverlayContent: { backgroundColor: '#fff', padding: 30, borderRadius: 16, alignItems: 'center', marginHorizontal: 20 },
  adOverlayTitle: { fontSize: 20, fontWeight: '700', color: COLORS.fg, marginBottom: 12 },
  adOverlayText: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 24 },
  watchAdButton: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 999 },
  watchAdButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  adErrorText: { fontSize: 12, color: COLORS.error, textAlign: 'center', marginBottom: 16, lineHeight: 18 },
  cancelButton: { marginTop: 16, paddingVertical: 10 },
  cancelButtonText: { color: COLORS.muted, fontSize: 14 },
});
