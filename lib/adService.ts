import { Platform } from 'react-native';
import { MobileAds, InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';


// Production IDs — use after Play Store + AdMob review
// const ANDROID_AD_UNIT_ID = 'ca-app-pub-1317710744152870/6183406216';
// const IOS_AD_UNIT_ID = 'ca-app-pub-1317710744152870/6183406216';

// Test IDs — always fill (shows "Test Ad" watermark)
const ANDROID_AD_UNIT_ID = 'ca-app-pub-3940256099942544/1033173712';
const IOS_AD_UNIT_ID = 'ca-app-pub-3940256099942544/4411468910';

let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let currentPdfId: string | null = null;
let loadPromise: Promise<void> | null = null;

const watchedPdfIds = new Set<string>();
let lastAdError: string | null = null;

export function getLastAdError(): string | null {
  return lastAdError;
}

export async function initAdMob(): Promise<void> {
  try {
    const mobileAds = MobileAds();
    await mobileAds.initialize();
    console.log('AdMob initialized');
  } catch (e) {
    console.log('AdMob init error:', e);
  }
}

function getAdUnitId(): string {
  if (Platform.OS === 'ios') {
    return IOS_AD_UNIT_ID;
  }
  return ANDROID_AD_UNIT_ID;
}

export function loadInterstitialAd(pdfId: string): Promise<void> {
  if (watchedPdfIds.has(pdfId)) {
    return Promise.resolve();
  }

  if (currentPdfId === pdfId && loadPromise) {
    return loadPromise;
  }

  lastAdError = null;
  currentPdfId = pdfId;

  const AdUnitId = getAdUnitId();
  interstitial = InterstitialAd.createForAdRequest(AdUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  loadPromise = new Promise<void>((resolve, reject) => {
    interstitial!.addAdEventListener(AdEventType.LOADED, () => {
      if (currentPdfId !== pdfId) return;
      interstitialLoaded = true;
      console.log('Interstitial ad loaded');
      resolve();
    });

    interstitial!.addAdEventListener(AdEventType.ERROR, (error: any) => {
      if (currentPdfId !== pdfId) return;
      const msg = error?.message || JSON.stringify(error) || 'Unknown ad error';
      lastAdError = msg;
      console.error('Ad load failed:', msg);
      interstitialLoaded = false;
      currentPdfId = null;
      loadPromise = null;
      reject(new Error(msg));
    });

    interstitial!.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Interstitial ad closed');
      watchedPdfIds.add(pdfId);
      interstitialLoaded = false;
      interstitial = null;
      currentPdfId = null;
      loadPromise = null;
    });

    interstitial!.load();
    interstitialLoaded = false;
  });

  return loadPromise;
}

export async function showInterstitialAd(
  pdfId: string
): Promise<{ success: boolean; canViewPdf: boolean; error?: string }> {
  if (watchedPdfIds.has(pdfId)) {
    return { success: true, canViewPdf: true };
  }

  try {
    await loadInterstitialAd(pdfId);

    if (interstitial && interstitialLoaded) {
      await interstitial.show();
      return { success: true, canViewPdf: true };
    } else {
      const err = lastAdError || 'Ad could not be loaded. Please restart app.';
      return { success: false, canViewPdf: false, error: err };
    }
  } catch (e: any) {
    const msg = e?.message || lastAdError || 'Ad could not be loaded.';
    return { success: false, canViewPdf: false, error: msg };
  }
}

export function hasWatchedAd(pdfId: string): boolean {
  return watchedPdfIds.has(pdfId);
}

export function clearWatchedAds(): void {
  watchedPdfIds.clear();
}
