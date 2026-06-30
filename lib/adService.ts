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

const watchedPdfIds = new Set<string>();

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

export function loadInterstitialAd(pdfId: string): void {
  if (watchedPdfIds.has(pdfId)) {
    return;
  }

  const AdUnitId = getAdUnitId();
  interstitial = InterstitialAd.createForAdRequest(AdUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
    console.log('Interstitial ad loaded');
  });

  interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
    console.log('Interstitial ad error:', error);
    interstitialLoaded = false;
  });

  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    console.log('Interstitial ad closed');
    watchedPdfIds.add(pdfId);
    interstitialLoaded = false;
    interstitial = null;
  });

  interstitial.load();
  interstitialLoaded = false;
}

export async function showInterstitialAd(
  pdfId: string
): Promise<{ success: boolean; canViewPdf: boolean }> {
  if (watchedPdfIds.has(pdfId)) {
    return { success: true, canViewPdf: true };
  }

  if (!interstitial) {
    loadInterstitialAd(pdfId);
    
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (interstitialLoaded) break;
    }
  }

  try {
    if (interstitial && interstitialLoaded) {
      await interstitial.show();
      return { success: true, canViewPdf: true };
    } else {
      watchedPdfIds.add(pdfId);
      return { success: false, canViewPdf: true };
    }
  } catch (e) {
    console.log('Show interstitial error:', e);
    return { success: false, canViewPdf: true };
  }
}

export function hasWatchedAd(pdfId: string): boolean {
  return watchedPdfIds.has(pdfId);
}

export function clearWatchedAds(): void {
  watchedPdfIds.clear();
}