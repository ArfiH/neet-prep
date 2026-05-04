import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENTLY_VIEWED_KEY = 'recently_viewed_pdfs';
const MAX_RECENT = 6;

export async function getRecentlyViewedIds(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(RECENTLY_VIEWED_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error fetching recently viewed PDFs:', e);
  }
  return [];
}

export async function addRecentlyViewed(pdfId: string): Promise<void> {
  try {
    let ids = await getRecentlyViewedIds();
    ids = ids.filter((id) => id !== pdfId);
    ids.unshift(String(pdfId));
    if (ids.length > MAX_RECENT) {
      ids = ids.slice(0, MAX_RECENT);
    }
    await AsyncStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Error adding recently viewed PDF:', e);
  }
}