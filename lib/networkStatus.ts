let _isOnline = true;
const _listeners = new Set<(online: boolean) => void>();

export function setOnlineStatus(online: boolean) {
  if (_isOnline === online) return;
  _isOnline = online;
  _listeners.forEach(fn => fn(online));
}

export function getOnlineStatus() {
  return _isOnline;
}

export function subscribe(fn: (online: boolean) => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}
