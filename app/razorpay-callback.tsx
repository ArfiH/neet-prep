import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '@/constants/colors';
import { markPaymentHandled, paymentHandled } from '@/lib/paymentSession';
import Toast from 'react-native-toast-message';
import { api } from '@/lib/api';

export default function RazorpayCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    success: string; error?: string; pdfId: string;
    razorpay_order_id?: string; razorpay_payment_id?: string;
  }>();

  useEffect(() => {
    WebBrowser.dismissBrowser();
    if (paymentHandled) return;
    markPaymentHandled();

    const { success, error, pdfId } = params;
    if (!pdfId) {
      router.replace('/');
      return;
    }

    if (success === 'true') {
      Toast.show({ type: 'success', text1: 'Purchase successful', text2: 'You can now read this PDF.' });
      router.replace(`/pdf/viewer/${pdfId}`);
    } else {
      api.recordFailedPayment({
        razorpay_order_id: params.razorpay_order_id || pdfId,
        razorpay_payment_id: params.razorpay_payment_id,
      });
      Toast.show({ type: 'error', text1: 'Payment failed', text2: error || 'The payment was not completed.' });
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/pdf/${pdfId}` as any);
      }
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ marginTop: 12, fontSize: 14, color: COLORS.muted }}>Processing payment...</Text>
    </View>
  );
}