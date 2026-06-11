const B2_API_BASE = 'https://api.backblazeb2.com';

let cachedAuth = null;

async function getAuth() {
  if (cachedAuth && cachedAuth.expiresAt > Date.now()) {
    return cachedAuth;
  }

  const creds = Buffer.from(
    `${process.env.B2_APPLICATION_KEY_ID}:${process.env.B2_APPLICATION_KEY}`
  ).toString('base64');

  const res = await fetch(`${B2_API_BASE}/b2api/v4/b2_authorize_account`, {
    headers: { Authorization: `Basic ${creds}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`B2 auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  // Support both v3 (top-level) and v4 (nested in apiInfo.storageApi) response formats
  const storageApi = data.apiInfo?.storageApi ?? {};

  cachedAuth = {
    apiUrl: storageApi.apiUrl ?? data.apiUrl,
    authorizationToken: data.authorizationToken,
    downloadUrl: storageApi.downloadUrl ?? data.downloadUrl,
    expiresAt: Date.now() + (data.expirationTime || 86400) * 1000 - 60000,
  };

  if (!cachedAuth.apiUrl || !cachedAuth.authorizationToken) {
    console.error('B2 auth response invalid — response keys:', Object.keys(data));
    throw new Error('B2 auth returned invalid response: missing apiUrl or authorizationToken');
  }

  return cachedAuth;
}

async function getDownloadAuthorization(fileNamePrefix, durationSeconds = 3600) {
  const auth = await getAuth();

  const res = await fetch(`${auth.apiUrl}/b2api/v4/b2_get_download_authorization`, {
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

async function uploadFile(fileName, contentType, sha1, fileBuffer) {
  const auth = await getAuth();

  const urlRes = await fetch(`${auth.apiUrl}/b2api/v4/b2_get_upload_url?bucketId=${process.env.B2_BUCKET_ID}`, {
    method: 'GET',
    headers: {
      Authorization: auth.authorizationToken,
    },
  });

  if (!urlRes.ok) {
    const text = await urlRes.text();
    throw new Error(`B2 get upload URL failed: ${urlRes.status} ${text}`);
  }

  const { uploadUrl, authorizationToken: uploadAuthToken } = await urlRes.json();

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: uploadAuthToken,
      'X-Bz-File-Name': encodeURIComponent(fileName),
      'Content-Type': contentType,
      'X-Bz-Content-Sha1': sha1,
      'Content-Length': String(fileBuffer.length),
    },
    body: fileBuffer,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`B2 upload failed: ${uploadRes.status} ${text}`);
  }

  const uploadData = await uploadRes.json();
  const nativeUrl = `${auth.downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${fileName}`;

  return nativeUrl;
}

module.exports = { getAuth, getDownloadAuthorization, uploadFile };
