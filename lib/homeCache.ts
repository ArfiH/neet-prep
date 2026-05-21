import AsyncStorage from '@react-native-async-storage/async-storage';

const HOME_CACHE_KEY = 'home_cache';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 60 minutes

export type CachedHomeData = {
  featuredPdfs: any[];
  topColleges: any[];
  recentlyViewedPdfs: any[];
  timestamp: number;
};

export async function getCachedHomeData(): Promise<CachedHomeData | null> {
  try {
    const data = await AsyncStorage.getItem(HOME_CACHE_KEY);
    if (data) {
      const parsed: CachedHomeData = JSON.parse(data);
      const now = Date.now();
      if (now - parsed.timestamp < CACHE_EXPIRY_MS) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error fetching cached home data:', e);
  }
  return null;
}

export async function setCachedHomeData(data: CachedHomeData): Promise<void> {
  try {
    await AsyncStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error caching home data:', e);
  }
}

export async function clearHomeCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HOME_CACHE_KEY);
  } catch (e) {
    console.error('Error clearing home cache:', e);
  }
}