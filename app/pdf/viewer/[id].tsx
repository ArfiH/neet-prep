import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/backend/supabase';
import { COLORS, SHADOWS } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

type PDF = {
  id: string;
  title: string;
  file_url: string;
};

export default function PdfViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [pdf, setPdf] = useState<PDF | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPdf();
  }, [id]);

  async function fetchPdf() {
    try {
      const { data, error: fetchError } = await supabase
        .from('pdfs')
        .select('id, title, file_url')
        .eq('id', id)
        .maybeSingle();

      if (fetchError) {
        setError('Failed to load PDF');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('PDF not found');
        setLoading(false);
        return;
      }

      if (!data.file_url) {
        setError('PDF file not available. Please upload the PDF file.');
        setLoading(false);
        return;
      }

      setPdf(data);
      setLoading(false);
    } catch (err) {
      console.log('Error fetching PDF:', err);
      setError('Failed to load PDF');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (error || !pdf) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'PDF not found'}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Convert direct URL to Google Docs viewer URL for better PDF rendering
  const pdfUrl = pdf.file_url;
  const googleViewerUrl = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(pdfUrl)}`;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={COLORS.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>{pdf.title}</Text>
        </View>
        <View style={styles.webviewContainer}>
          <WebView
            source={{ uri: googleViewerUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            bounces={false}
            allowsInlineMediaPlayback={true}
            onError={(error) => {
              console.log('WebView error:', error);
            }}
            onLoadEnd={() => {
              console.log('PDF loaded via Google Viewer');
            }}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading PDF...</Text>
              </View>
            )}
            renderError={(error) => (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Unable to load PDF</Text>
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 12,
    ...SHADOWS.md,
  },
  titleContainer: {
    paddingTop: 32,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
    width: width,
    height: height,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
});