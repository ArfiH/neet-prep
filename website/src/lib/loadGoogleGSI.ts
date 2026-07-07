let loaded = false;

export function loadGoogleGSI(): Promise<void> {
  if (loaded) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      loaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}
