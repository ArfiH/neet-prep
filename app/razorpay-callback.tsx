import { useEffect } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '@/constants/colors';
import { markPaymentHandled, paymentHandled } from '@/lib/paymentSession';
import Toast from 'react-native-toast-message';

export default function RazorpayCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ success: string; error?: string; pdfId: string }>();

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
      Toast.show({ type: 'error', text1: 'Payment failed', text2: error || 'The payment was not completed.' });
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(`/pdf/${pdfId}` as any);
      }
    }
  }, []);

  return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
}