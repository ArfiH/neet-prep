import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { api } from '@/lib/api';
import { COLORS, SHADOWS } from '@/constants/colors';

const { width, height } = Dimensions.get('window');

type PDF = {
  id: string;
  title: string;
  file_url: string;
};

const getPdfJsViewerHTML = (url: string, title: string, watermark: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <title>${title}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: auto;
      min-height: 100%;
      overflow: auto;
      background: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-tap-highlight-color: transparent;
    }
    #pdf-container {
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow-y: visible;
      overflow-x: hidden;
      padding: 20px;
      padding-bottom: 60px;
      -webkit-overflow-scrolling: touch;
      touch-action: manipulation;
    }
    .page-wrapper {
      position: relative;
      display: inline-block;
      width: 100%;
      margin-bottom: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      -webkit-touch-callout: none;
    }
    .page-wrapper canvas {
      display: block;
      width: 100%;
      height: auto;
    }
    .watermark {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: none;
      z-index: 10;
    }
    .watermark-text {
      font-size: 36px;
      font-weight: 800;
      color: rgba(0, 0, 0, 0.1);
      text-transform: uppercase;
      letter-spacing: 4px;
      white-space: nowrap;
    }
    #loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 16px;
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255,255,255,0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #error-message {
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ff6b6b;
      font-size: 16px;
      text-align: center;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="pdf-container">
    <div id="loading">
      <div class="spinner"></div>
      <p>Loading PDF...</p>
    </div>
    <div id="error-message">Unable to load PDF</div>
  </div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const container = document.getElementById('pdf-container');
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('error-message');
    const pdfUrl = "${url}";
    const watermarkText = "${watermark}";
    
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });
    
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey || e.metaKey) {
        if (e.key !== '+' && e.key !== '-' && e.key !== '=' && e.key !== '0') {
          e.preventDefault();
          return false;
        }
      }
    });

    loading.style.display = 'block';
    
    pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
      loading.style.display = 'none';
      
      function renderPage(pageNum) {
        if (pageNum > pdf.numPages) return;
        
        pdf.getPage(pageNum).then(function(page) {
          const scale = window.innerWidth / page.getViewport({ scale: 1 }).width;
          const viewport = page.getViewport({ scale: scale });
          
          const wrapper = document.createElement('div');
          wrapper.className = 'page-wrapper';
          
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          const watermark = document.createElement('div');
          watermark.className = 'watermark';
          const watermarkTextEl = document.createElement('div');
          watermarkTextEl.className = 'watermark-text';
          watermarkTextEl.textContent = watermarkText;
          watermark.appendChild(watermarkTextEl);
          
          wrapper.appendChild(canvas);
          wrapper.appendChild(watermark);
          container.appendChild(wrapper);
          
          const context = canvas.getContext('2d');
          page.render({
            canvasContext: context,
            viewport: viewport
          }).promise.then(function() {
            renderPage(pageNum + 1);
          });
        });
      }
      
      renderPage(1);
    }).catch(function(error) {
      loading.style.display = 'none';
      errorMsg.style.display = 'block';
      console.log('PDF load error:', error);
    });
  </script>
</body>
</html>
`;

export default function PdfViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [pdf, setPdf] = useState<PDF | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Always show "NEET ZYME" watermark
  const watermarkDisplay = 'NEET ZYME';

  useEffect(() => {
    fetchPdf();
  }, [id]);

  async function fetchPdf() {
    try {
      const pdfData = await api.getPdfById(id);

      if (!pdfData) {
        setError('PDF not found');
        setLoading(false);
        return;
      }

      if (!pdfData.file_url) {
        setError('PDF file not available. Please upload the PDF file.');
        setLoading(false);
        return;
      }

      setPdf(pdfData);
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

  const htmlContent = getPdfJsViewerHTML(pdf.file_url, pdf.title, watermarkDisplay);

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
            originWhitelist={['*']}
            source={{ html: htmlContent, baseUrl: 'https://cdnjs.cloudflare.com' }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            bounces={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            onError={(error) => {
              console.log('WebView error:', error);
            }}
            onLoadEnd={() => {
              console.log('PDF loaded via PDF.js');
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
  errorCode: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  errorDesc: {
    fontSize: 10,
    color: COLORS.textLight,
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
    backgroundColor: '#1a1a1a',
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
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
});