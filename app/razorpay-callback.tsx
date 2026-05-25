import { useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';

export default function RazorpayCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ success: string; error?: string; pdfId: string }>();

  useEffect(() => {
    const { success, error, pdfId } = params;
    if (!pdfId) return;

    if (success === 'true') {
      Alert.alert('Purchase successful', 'You can now read this PDF.', [
        { text: 'Read PDF', onPress: () => router.replace(`/pdf/viewer/${pdfId}`) },
      ]);
    } else {
      Alert.alert('Payment failed', error || 'The payment was not completed.', [
        { text: 'OK', onPress: () => router.replace(`/pdf/${pdfId}`) },
      ]);
    }
  }, []);

  return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
}