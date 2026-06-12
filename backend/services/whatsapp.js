const crypto = require('crypto');
const { pool } = require('../config/db');

const GRAPH_API_VERSION = 'v19.0';
const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 3;
const RESEND_COOLDOWN_SECONDS = 60;

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtp(phone) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'otp_message';
  const templateLang = process.env.WHATSAPP_OTP_TEMPLATE_LANG || 'en';

  if (!accessToken || !phoneNumberId) {
    throw new Error('WhatsApp service is not configured. Please contact support.');
  }

  const [existing] = await pool.query(
    'SELECT created_at FROM whatsapp_otps WHERE phone = ?',
    [phone]
  );

  if (existing.length > 0) {
    const createdAt = new Date(existing[0].created_at);
    const secondsElapsed = (Date.now() - createdAt.getTime()) / 1000;
    if (secondsElapsed < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsElapsed);
      throw new Error(`Please wait ${wait} seconds before requesting another OTP.`);
    }
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  await pool.query(
    `INSERT INTO whatsapp_otps (phone, otp_hash, attempts, created_at)
     VALUES (?, ?, 0, NOW())
     ON DUPLICATE KEY UPDATE
       otp_hash   = VALUES(otp_hash),
       attempts   = 0,
       created_at = NOW()`,
    [phone, otpHash]
  );

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: otp }],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: otp }],
        },
      ],
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('[whatsapp] Send OTP failed:', err);
    throw new Error('Failed to send WhatsApp OTP. Please try again.');
  }
}

async function verifyOtp(phone, code) {
  const [rows] = await pool.query(
    'SELECT otp_hash, created_at, attempts FROM whatsapp_otps WHERE phone = ?',
    [phone]
  );

  if (rows.length === 0) {
    throw new Error('OTP not found. Please request a new one.');
  }

  const { otp_hash, created_at, attempts } = rows[0];
  const createdAt = new Date(created_at);

  if (attempts >= MAX_ATTEMPTS) {
    await pool.query('DELETE FROM whatsapp_otps WHERE phone = ?', [phone]);
    throw new Error('Too many incorrect attempts. Please request a new OTP.');
  }

  if ((Date.now() - createdAt.getTime()) > OTP_EXPIRY_MINUTES * 60 * 1000) {
    await pool.query('DELETE FROM whatsapp_otps WHERE phone = ?', [phone]);
    throw new Error('OTP has expired. Please request a new one.');
  }

  const inputHash = hashOtp(String(code).trim());
  if (inputHash !== otp_hash) {
    await pool.query(
      'UPDATE whatsapp_otps SET attempts = attempts + 1 WHERE phone = ?',
      [phone]
    );
    const remaining = MAX_ATTEMPTS - (attempts + 1);
    throw new Error(
      remaining > 0
        ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Please request a new OTP.'
    );
  }

  await pool.query('DELETE FROM whatsapp_otps WHERE phone = ?', [phone]);
}

module.exports = { sendOtp, verifyOtp };
