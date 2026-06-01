const STORAGE_KEY = 'neet_zyme_recently_viewed';
const MAX_RECENT = 6;

export function getRecentlyViewedIds(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error fetching recently viewed PDFs:', e);
  }
  return [];
}

export function addRecentlyViewed(pdfId: string): void {
  try {
    let ids = getRecentlyViewedIds();
    ids = ids.filter((id) => id !== pdfId);
    ids.unshift(String(pdfId));
    if (ids.length > MAX_RECENT) ids = ids.slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Error adding recently viewed PDF:', e);
  }
}
