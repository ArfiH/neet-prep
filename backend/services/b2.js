const B2_API_BASE = 'https://api.backblazeb2.com';

let cachedAuth = null;

async function getAuth() {
  if (cachedAuth && cachedAuth.expiresAt > Date.now()) {
    return cachedAuth;
  }

  const creds = Buffer.from(
    `${process.env.B2_APPLICATION_KEY_ID}:${process.env.B2_APPLICATION_KEY}`
  ).toString('base64');

  const res = await fetch(`${B2_API_BASE}/b2api/v3/b2_authorize_account`, {
    headers: { Authorization: `Basic ${creds}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`B2 auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  cachedAuth = {
    apiUrl: data.apiUrl,
    authorizationToken: data.authorizationToken,
    downloadUrl: data.downloadUrl,
    expiresAt: Date.now() + (data.expirationTime || 86400) * 1000 - 60000,
  };

  return cachedAuth;
}

async function getDownloadAuthorization(fileNamePrefix, durationSeconds = 3600) {
  const auth = await getAuth();

  const res = await fetch(`${auth.apiUrl}/b2api/v3/b2_get_download_authorization`, {
    method: 'POST',
    headers: {
      Authorization: auth.authorizationToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucketId: process.env.B2_BUCKET_ID,
      fileNamePrefix,
      validDurationInSeconds: durationSeconds,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`B2 download auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.authorizationToken;
}

module.exports = { getAuth, getDownloadAuthorization };
