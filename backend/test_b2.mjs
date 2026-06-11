import 'dotenv/config';

const creds = Buffer.from(
  `${process.env.B2_APPLICATION_KEY_ID}:${process.env.B2_APPLICATION_KEY}`
).toString('base64');

const r = await fetch('https://api.backblazeb2.com/b2api/v4/b2_authorize_account', {
  headers: { Authorization: `Basic ${creds}` },
});
const d = await r.json();

console.log('Status:', r.status);
console.log('Top-level keys:', Object.keys(d));
console.log('Has apiInfo.storageApi:', !!d.apiInfo?.storageApi);
console.log('apiUrl:', d.apiInfo?.storageApi?.apiUrl);
console.log('downloadUrl:', d.apiInfo?.storageApi?.downloadUrl);
console.log('Has token:', !!d.authorizationToken);
console.log('Token prefix:', d.authorizationToken?.substring(0, 15));
console.log('Has allowed:', !!d.apiInfo?.storageApi?.allowed);
console.log('Capabilities:', JSON.stringify(d.apiInfo?.storageApi?.allowed?.capabilities));
console.log('Buckets:', JSON.stringify(d.apiInfo?.storageApi?.allowed?.buckets));

const apiUrl = d.apiInfo?.storageApi?.apiUrl;
const token = d.authorizationToken;
const bucketId = process.env.B2_BUCKET_ID;

console.log('\nNow testing b2_get_upload_url...');
const u = await fetch(`${apiUrl}/b2api/v4/b2_get_upload_url?bucketId=${bucketId}`, {
  method: 'GET',
  headers: { Authorization: token },
});
const body = await u.text();
console.log('Upload URL status:', u.status);
console.log('Upload URL response:', body);
