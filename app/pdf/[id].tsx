import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, BookOpen, Clock, ShoppingCart, Eye, Tag, Download, Trash2, WifiOff, Package, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/colors';
import { getTileBg, getGlyphColor } from '@/constants/subjectVisuals';
import { api, API_BASE_URL, formatPrice, isNetworkError } from '@/lib/api';
import { addRecentlyViewed } from '@/lib/recentlyViewed';
import { useAuth } from '@/lib/authContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '@/components/CustomAlert';
import AlertBanner from '@/components/AlertBanner';
import { resetPaymentHandled, markPaymentHandled, paymentHandled } from '@/lib/paymentSession';
import { downloadPDF, isPDFDownloaded, hasLocalPDF, deleteLocalPDF } from '@/lib/downloadManager';
import { showInterstitialAd, hasWatchedAd } from '@/lib/adService';
import Toast from 'react-native-toast-message';

type PDF = {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  is_deliverable: boolean;
  pages_count: number;
  file_url: string;
  details: string[];
  category: string | null;
  class: string | null;
};

const monoFont = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const serifFont = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}

export default function PDFDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [pdf, setPdf] = useState<PDF | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [paying, setPaying] = useState(false);
  const hasStartedPayment = useRef(false);
  const [alertConfig, setAlertConfig] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDownloadAdOverlay, setShowDownloadAdOverlay] = useState(false);
  const [adLoading, setAdLoading] = useState(false);
  const [startingDownload, setStartingDownload] = useState(false);
  const [alreadyDownloaded, setAlreadyDownloaded] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    fetchPdf();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (hasStartedPayment.current) {
        setPaying(false);
        hasStartedPayment.current = false;
      }
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      api.checkPdfPurchase(id).then(({ hasPurchased }) => {
        setPurchased(hasPurchased);
      }).catch((e: any) => {
        if (isNetworkError(e)) setIsOffline(true);
      });
      hasLocalPDF(id).then(setAlreadyDownloaded).catch(() => {});
    }, [id])
  );

  async function fetchPdf() {
    try {
      const data = await api.getPdfById(id);
      if (data) {
        setPdf(data);
        addRecentlyViewed(id);
        if (!data.is_free) {
          try {
            const { hasPurchased } = await api.checkPdfPurchase(id);
            setPurchased(hasPurchased);
          } catch {
            // not authed or error — treat as not purchased
          }
        }
      }
      setIsOffline(false);
    } catch (e: any) {
      if (isNetworkError(e)) {
        setIsOffline(true);
      }
    }
    setLoading(false);
  }

  async function handleBuyPdf() {
    if (!pdf?.file_url) {
      setAlertConfig({
        type: 'warning',
        title: 'Unavailable',
        message: 'This PDF file is not uploaded yet.',
        buttons: [{ text: 'OK' }],
      });
      return;
    }
    if (purchased) {
      router.replace(`/pdf/viewer/${pdf.id}`);
      return;
    }
    try {
      setPaying(true);
      resetPaymentHandled();
      const { order_id, key_id } = await api.createRazorpayOrder(pdf.id);
      const callbackUrl = `${API_BASE_URL}/pdfs/payment-callback/${pdf.id}`;
      const checkoutUrl = `https://api.razorpay.com/v1/checkout/embedded?key_id=${key_id}&order_id=${order_id}&callback_url=${encodeURIComponent(callbackUrl)}`;

      hasStartedPayment.current = true;
      const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, 'myapp://');
      WebBrowser.dismissBrowser();

      if (paymentHandled) return;
      markPaymentHandled();

      if (result.type === 'success' && result.url) {
        const params = parseParams(result.url);
        if (params.success === 'true') {
          setPurchased(true);
          setPaying(false);
          Toast.show({ type: 'success', text1: 'Purchase successful', text2: 'You can now read this PDF.' });
          router.replace(`/pdf/viewer/${pdf.id}`);
        } else {
          setPaying(false);
          Toast.show({ type: 'error', text1: 'Payment failed', text2: params.error || 'The payment was not completed.' });
        }
      } else {
        setPaying(false);
      }
    } catch (e: any) {
      setPaying(false);
      Toast.show({ type: 'error', text1: 'Payment failed', text2: e?.message || 'Something went wrong.' });
    }
  }

  function parseParams(url: string): Record<string, string> {
    const query = url.split('?')[1] ?? '';
    const params: Record<string, string> = {};
    query.split('&').forEach((p) => {
      const [k, v] = p.split('=');
      if (k) params[k] = decodeURIComponent(v || '');
    });
    return params;
  }

  async function handleStartDownload() {
    if (!pdf || !pdf.file_url) {
      setAlertConfig({
        type: 'warning',
        title: 'Unavailable',
        message: 'This PDF file is not available for download yet.',
        buttons: [{ text: 'OK' }],
      });
      return;
    }

    if (alreadyDownloaded) {
      setAlertConfig({
        type: 'default',
        title: 'Delete Download',
        message: `Remove "${pdf.title}" from offline storage?`,
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => handleDeleteDownload() },
        ],
      });
      return;
    }

    setStartingDownload(true);
    if (pdf.is_free && !hasWatchedAd('download_' + pdf.id)) {
      setStartingDownload(false);
      setShowDownloadAdOverlay(true);
      return;
    }

    doDownload();
  }

  async function handleDeleteDownload() {
    if (!pdf) return;
    await deleteLocalPDF(pdf.id);
    setAlreadyDownloaded(false);
    Toast.show({ type: 'success', text1: 'Deleted', text2: '"' + pdf.title + '" removed from offline storage.' });
  }

  async function doDownload() {
    if (!pdf || !pdf.file_url) return;
    setDownloading(true);
    setDownloadProgress(0);
    try {
      const viewData = await api.getPdfViewUrl(pdf.id);
      const url = viewData?.url || pdf.file_url;
      const headers = viewData?.headers || {};
      await downloadPDF(pdf.id, pdf.title, pdf.subject, pdf.pages_count, url, headers, (received, total) => {
        const pct = Math.min(99, Math.round((received / total) * 100));
        setDownloadProgress(pct);
      });
      setDownloadProgress(100);
      Toast.show({ type: 'success', text1: 'Download complete', text2: '"' + pdf.title + '" is now available offline.' });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Download failed', text2: e?.message || 'Could not download PDF.' });
    }
    setDownloading(false);
    setStartingDownload(false);
  }

  async function handleWatchAdForDownload() {
    setAdLoading(true);
    const result = await showInterstitialAd('download_' + pdf!.id);
    if (result.canViewPdf) {
      setShowDownloadAdOverlay(false);
      doDownload();
    }
    setAdLoading(false);
  }

  function handleReadOrBuy() {
    if (pdf?.is_free || purchased) {
      if (!pdf?.file_url) {
        setAlertConfig({
          type: 'warning',
          title: 'Unavailable',
          message: 'This PDF file is not uploaded yet.',
          buttons: [{ text: 'OK' }],
        });
        return;
      }
      router.replace(`/pdf/viewer/${pdf.id}`);
    } else {
      handleBuyPdf();
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!pdf) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        {isOffline ? (
          <>
            <WifiOff size={44} color={COLORS.muted} strokeWidth={1.5} />
            <Text style={{ color: COLORS.fg, marginTop: 14, fontSize: 16, fontWeight: '600' }}>No internet connection</Text>
            <Text style={{ color: COLORS.muted, marginTop: 4, fontSize: 13, textAlign: 'center', paddingHorizontal: 40 }}>Internet is required to load PDF details.</Text>
          </>
        ) : (
          <Text style={{ color: COLORS.fg, fontSize: 16, fontWeight: '600' }}>PDF not found.</Text>
        )}
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, marginTop: 16, fontSize: 14, fontWeight: '600' }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const tileBg = getTileBg(pdf.subject);
  const glyphColor = getGlyphColor(pdf.subject);
  const gradientEnd = darkenColor(glyphColor, 40);
  const subjectLabel = pdf.subject.toUpperCase();
  const availLabel = pdf.is_free ? 'FREE' : `₹${formatPrice(pdf.price)}`;

  const titleParts = pdf.title.split(' — ');
  const titleMain = titleParts[0];
  const titleAccent = titleParts.length > 1 ? titleParts.slice(1).join(' — ') : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.topbar}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <ArrowLeft size={14} color={COLORS.muted} strokeWidth={1.6} />
          </TouchableOpacity>
          <Text style={styles.topbarText}>PDF DETAIL · {subjectLabel}</Text>
        </View>

        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <AlertBanner
              type="info"
              message={alreadyDownloaded ? 'You\'re offline. You can view the downloaded version.' : 'You\'re offline. Internet is required to view this PDF.'}
              action={alreadyDownloaded ? { label: 'View Offline', onPress: () => router.replace(`/pdf/viewer/${pdf.id}`) } : undefined}
              dismissable={alreadyDownloaded}
              onDismiss={() => setIsOffline(false)}
            />
          </View>
        )}

        {/* Hero Card */}
        <LinearGradient
          colors={[tileBg, gradientEnd + '66']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pdfHero}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>— {subjectLabel}{pdf['class'] ? ` · ${pdf['class']}` : ''}{pdf.category ? ` · ${pdf.category}` : ''} · {availLabel}</Text>
          </View>
          <Text style={styles.heroTitle}>
            {titleMain}
            {titleAccent ? <Text style={styles.heroAccent}> — {titleAccent}</Text> : null}
          </Text>
          <Text style={styles.heroDesc} numberOfLines={3}>{pdf.description || 'No description available.'}</Text>
        </LinearGradient>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>SUMMARY</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardTitle}>What you'll cover</Text>
            <Text style={styles.summaryCardDesc}>{pdf.description || 'Comprehensive study material aligned with the latest NEET syllabus.'}</Text>
          </View>

          {/* Meta Pills */}
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <BookOpen size={12} color={COLORS.muted} strokeWidth={1.2} />
              <Text style={styles.metaPillText}>{pdf.pages_count} pages</Text>
            </View>
            <View style={styles.metaPill}>
              <Clock size={12} color={COLORS.muted} strokeWidth={1.2} />
              <Text style={styles.metaPillText}>~{Math.ceil(pdf.pages_count / 2)} min read</Text>
            </View>
            {pdf.details?.map((detail, i) => (
              <View key={i} style={styles.metaPill}>
                <Tag size={12} color={COLORS.muted} strokeWidth={1.2} />
                <Text style={styles.metaPillText}>{detail}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Deliver Book */}
        {pdf.is_deliverable && (
          <TouchableOpacity style={styles.deliverCard} activeOpacity={0.7} onPress={() => router.push(`/pdf/delivery/${pdf.id}` as any)}>
            <View style={styles.deliverIcon}>
              <Package size={18} color={COLORS.primaryDark} strokeWidth={2} />
            </View>
            <View style={styles.deliverText}>
              <Text style={styles.deliverLabel}>Deliver this book</Text>
              <Text style={styles.deliverSublabel}>Get a physical copy delivered to your address</Text>
            </View>
            <ChevronRight size={16} color={COLORS.muted} strokeWidth={2} />
          </TouchableOpacity>
        )}

        {/* CTA */}
        <TouchableOpacity
          style={paying ? styles.startBtnDisabled : (pdf.is_free || purchased ? styles.startBtn : styles.startBtnPaid)}
          onPress={handleReadOrBuy}
          disabled={paying}
        >
          {paying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : pdf.is_free ? (
            <Text style={styles.startBtnText}>Start reading — Free</Text>
          ) : purchased ? (
            <>
              <Eye size={16} color="#fff" strokeWidth={2} />
              <Text style={styles.startBtnText}>Read PDF</Text>
            </>
          ) : (
            <>
              <ShoppingCart size={16} color="#fff" strokeWidth={2} />
              <Text style={styles.startBtnText}>Buy Now — ₹{formatPrice(pdf.price)}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Download / Delete / Progress */}
        {downloading ? (
          <View style={styles.downloadingBox}>
            <View style={styles.downloadingRow}>
              <Download size={14} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.downloadingLabel}>Downloading...</Text>
              <Text style={styles.downloadingPct}>{downloadProgress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${downloadProgress}%` }]} />
            </View>
          </View>
        ) : alreadyDownloaded ? (
          <TouchableOpacity style={styles.deleteDownloadBtn} onPress={handleStartDownload} activeOpacity={0.7}>
            <Trash2 size={14} color="#ef4444" strokeWidth={2} />
            <Text style={styles.deleteDownloadBtnText}>Delete Download</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.downloadBtn, (startingDownload || downloading) && { opacity: 0.5 }]}
            onPress={handleStartDownload}
            disabled={startingDownload || downloading}
          >
            {startingDownload ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Download size={14} color={COLORS.primary} strokeWidth={2} />
            )}
            <Text style={styles.downloadBtnText}>{startingDownload ? 'Preparing…' : 'Download Offline'}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Download Ad Overlay */}
      {showDownloadAdOverlay && (
        <View style={styles.adOverlay}>
          <View style={styles.adOverlayContent}>
            <Text style={styles.adOverlayTitle}>Watch Ad to Download</Text>
            <Text style={styles.adOverlayText}>This free PDF requires watching an ad before downloading.</Text>
            <TouchableOpacity style={[styles.watchAdButton, adLoading && { opacity: 0.6 }]} onPress={handleWatchAdForDownload} disabled={adLoading}>
              {adLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.watchAdButtonText}>Watch Ad</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelAdButton} onPress={() => setShowDownloadAdOverlay(false)}>
              <Text style={styles.cancelAdButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <CustomAlert
        visible={!!alertConfig}
        type={alertConfig?.type || 'default'}
        title={alertConfig?.title}
        message={alertConfig?.message || ''}
        buttons={alertConfig?.buttons || []}
        onDismiss={() => setAlertConfig(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  offlineBanner: { paddingHorizontal: 14, paddingTop: 4 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 6 },
  backCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  topbarText: { fontSize: 12, fontWeight: '600', color: COLORS.muted, fontFamily: monoFont, letterSpacing: 0.14 },

  pdfHero: { marginHorizontal: 14, marginVertical: 8, paddingVertical: 20, paddingHorizontal: 18, borderRadius: 24, overflow: 'hidden' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.08)' },
  badgeText: { fontSize: 10, fontFamily: monoFont, letterSpacing: 0.14, color: COLORS.fg },
  heroTitle: { fontSize: 26, fontWeight: '700', color: COLORS.fg, lineHeight: 30, letterSpacing: -0.01, marginTop: 12, marginBottom: 6 },
  heroAccent: { fontFamily: serifFont, fontStyle: 'italic', color: COLORS.primaryDark },
  heroDesc: { fontSize: 12.5, color: COLORS.muted, lineHeight: 20, maxWidth: 280 },

  summary: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 10 },
  summaryLabel: { fontSize: 10.5, fontWeight: '700', fontFamily: monoFont, letterSpacing: 0.16, color: COLORS.muted, marginTop: 10, marginBottom: 10 },
  summaryCard: { padding: 14, borderRadius: 14, backgroundColor: COLORS.stage, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  summaryCardTitle: { fontSize: 13, fontWeight: '600', color: COLORS.fg, marginBottom: 6 },
  summaryCardDesc: { fontSize: 12, color: COLORS.muted, lineHeight: 18.6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  metaPillText: { fontSize: 10.5, fontFamily: monoFont, color: COLORS.muted },

  startBtn: { marginHorizontal: 18, marginVertical: 10, paddingVertical: 14, borderRadius: 999, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  startBtnDisabled: { marginHorizontal: 18, marginVertical: 10, paddingVertical: 14, borderRadius: 999, backgroundColor: COLORS.muted, alignItems: 'center', justifyContent: 'center' },
  startBtnPaid: { marginHorizontal: 18, marginVertical: 10, paddingVertical: 14, borderRadius: 999, backgroundColor: COLORS.fg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  startBtnText: { fontSize: 14, fontWeight: '600', color: '#fff', letterSpacing: 0.04 },

  downloadBtn: { marginHorizontal: 18, marginBottom: 4, paddingVertical: 12, borderRadius: 999, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: COLORS.border },
  downloadBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  downloadingBox: { marginHorizontal: 18, marginBottom: 4, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 999, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  downloadingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  downloadingLabel: { fontSize: 13, fontWeight: '600', color: COLORS.primary, flex: 1 },
  downloadingPct: { fontSize: 11, fontWeight: '600', color: COLORS.muted, fontFamily: monoFont },
  progressBarBg: { height: 4, borderRadius: 999, backgroundColor: COLORS.border, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 999, backgroundColor: COLORS.primary },

  deleteDownloadBtn: { marginHorizontal: 18, marginBottom: 4, paddingVertical: 12, borderRadius: 999, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: '#fca5a5' },
  deleteDownloadBtnText: { fontSize: 13, fontWeight: '600', color: '#ef4444' },

  deliverCard: { marginHorizontal: 18, marginTop: 6, marginBottom: 4, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  deliverIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  deliverText: { flex: 1 },
  deliverLabel: { fontSize: 14, fontWeight: '600', color: COLORS.fg },
  deliverSublabel: { fontSize: 11.5, color: COLORS.muted, marginTop: 2, lineHeight: 16 },

  adOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  adOverlayContent: { backgroundColor: '#fff', padding: 30, borderRadius: 16, alignItems: 'center', marginHorizontal: 20 },
  adOverlayTitle: { fontSize: 20, fontWeight: '700', color: COLORS.fg, marginBottom: 12 },
  adOverlayText: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 24 },
  watchAdButton: { backgroundColor: COLORS.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 999 },
  watchAdButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelAdButton: { marginTop: 16, paddingVertical: 10 },
  cancelAdButtonText: { color: COLORS.muted, fontSize: 14 },
});