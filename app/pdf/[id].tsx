import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, BookOpen, Clock, ShoppingCart, Eye, Tag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '@/constants/colors';
import { getTileBg, getGlyphColor } from '@/constants/subjectVisuals';
import { api, API_BASE_URL } from '@/lib/api';
import { addRecentlyViewed } from '@/lib/recentlyViewed';
import { useAuth } from '@/lib/authContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '@/components/CustomAlert';
import { resetPaymentHandled, markPaymentHandled, paymentHandled } from '@/lib/paymentSession';
import Toast from 'react-native-toast-message';

type PDF = {
  id: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  is_free: boolean;
  pages_count: number;
  file_url: string;
  details: string[];
  category: string | null;
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
      }).catch(() => {});
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
    } catch (e) {
      // ignore
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
        <Text style={{ color: COLORS.fg }}>PDF not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: COLORS.primary, marginTop: 12 }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const tileBg = getTileBg(pdf.subject);
  const glyphColor = getGlyphColor(pdf.subject);
  const gradientEnd = darkenColor(glyphColor, 40);
  const subjectLabel = pdf.subject.toUpperCase();
  const availLabel = pdf.is_free ? 'FREE' : `₹${pdf.price}`;

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

        {/* Hero Card */}
        <LinearGradient
          colors={[tileBg, gradientEnd + '66']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pdfHero}
        >
          <View style={styles.badge}>
            <Text style={styles.badgeText}>— {subjectLabel}{pdf.category ? ` · ${pdf.category}` : ''} · {availLabel}</Text>
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
              <Text style={styles.startBtnText}>Buy Now — ₹{pdf.price}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

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
});