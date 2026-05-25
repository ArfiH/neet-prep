import { useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { COLORS } from '@/constants/colors';
import { markPaymentHandled, paymentHandled } from '@/lib/paymentSession';

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
      Alert.alert('Purchase successful', 'You can now read this PDF.', [
        { text: 'Read PDF', onPress: () => router.replace(`/pdf/viewer/${pdfId}`) },
      ]);
    } else {
      Alert.alert('Payment failed', error || 'The payment was not completed.', [
        { text: 'OK', onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace(`/pdf/${pdfId}` as any);
          }
        }},
      ]);
    }
  }, []);

  return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
}