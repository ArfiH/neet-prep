<div align="center">

# 🧬 NEET Zymee

**Master NEET with premium PDFs, college prediction, and offline reading — free with ads or buy outright.**

![Platform](https://img.shields.io/badge/Android-Android%20%26%20iOS-lightgrey?style=flat-square)
![Expo](https://img.shields.io/badge/Expo%20SDK-54-000000?style=flat-square&logo=expo)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat-square&logo=mysql)

🌐 **Live site:** [**neetzymee.com**](https://neetzymee.com)  ·  📱 Mobile app for Android & iOS  ·  🛠️ Admin panel at [neetzymee.com/admin](https://neetzymee.com/admin)

</div>

---

## ✨ About

**NEET Zymee** is a full-stack teaching platform for NEET aspirants that reimagines how study material should work:

- 📖 **Read premium PDFs** — free after watching a short ad, or buy them outright with **Razorpay**.
- 🎯 **Predict your college** — enter your rank, category and state to see which government and private medical colleges you can hope for.
- 📥 **Read offline** — every download is **encrypted with AES-256-GCM** and locked with your device's SecureStore key, so your library stays private even offline.
- 🛡️ **Watermarked everywhere** — PDFs are server-side watermarked with your email + date, so leaks are traceable.
- 🔒 **Screenshot-protected viewer** — native screen-capture blocking keeps paid content safe.
- 📞 **One-tap login** — email/password, Google Sign-In, or **WhatsApp OTP**.
- 📦 **Get physical copies** — request a printed book delivered to your home, straight from the app.

Everything is built feature-by-feature as a **practical teaching project** — clean, simple, and easy to follow.

---

## 🧱 Monorepo Structure

```
neet-prep/
├── app/                  # 📱 Mobile app (Expo Router)
│   ├── (tabs)/           #   Home · PDFs · Colleges · Downloaded · Profile
│   ├── pdf/[id].tsx      #   PDF detail — buy / watch-ad / download / deliver
│   ├── pdf/viewer/[id]   #   Native PDF viewer (watermark + screen-capture lock)
│   ├── login.tsx         #   Email / Google / WhatsApp sign-in
│   └── ...
├── components/           # Reusable RN components (CustomAlert, AlertBanner…)
├── constants/            # Theme colors, subject visuals, image assets
├── lib/                  # api client, auth, downloads, ads, logging…
├── backend/              # 🔌 Express + MySQL API server
│   ├── controllers/      #   auth, pdfs, colleges, admin, notifications…
│   ├── middleware/       #   JWT auth, admin auth
│   ├── routes/           #   API endpoints
│   ├── services/         #   B2 storage, email, WhatsApp OTP
│   ├── web-dist/         #   ⚛️ Built website SPA (served at /)
│   └── admin-dist/       #   🛠️ Built admin SPA (served at /admin)
├── website/              # ⚛️ Website SPA source (Vite + React 19 + react-pdf)
├── admin/                # 🛠️ Admin panel source (Vite + React 19)
└── assets/               # App icons & splash assets
```

Three shared frontends → **one Express + MySQL backend**:

| Frontend | Stack | Where |
|---|---|---|
| 📱 **Mobile App** | Expo SDK 54 · React Native 0.81 | Android & iOS |
| 🌐 **Website** | Vite · React 19 · react-pdf | `neetzymee.com` |
| 🛠️ **Admin Panel** | Vite · React 19 | `neetzymee.com/admin` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **MySQL** 8 (local) or a MilesWeb / cPanel database
- **Expo Go** or an Android/iOS emulator

### 1. Backend API

```bash
cd backend
npm install
cp .env.example .env      # fill in your keys (see below)
npm start                 # → http://localhost:3000
```

Required environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | MySQL connection |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing |
| `EMAIL_USER` / `EMAIL_PASS` | SMTP email verification |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payments |
| `B2_APPLICATION_KEY_ID` / `B2_APPLICATION_KEY` / `B2_BUCKET_ID` | PDF storage on Backblaze B2 |
| `APP_BASE_URL` | Used for reset/verify deep links |

### 2. Mobile App

```bash
npm install
npx expo start
```

Then press `a` for Android or `i` for iOS. Set your API URL:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_LOCAL_IP:3000/api npm start
```

> The app uses `myapp://` deep links for payment callbacks, email verification and password reset.

### 3. Website SPA

```bash
cd website
npm install
npm run build             # → builds to backend/web-dist/
```

### 4. Admin Panel

```bash
cd admin
npm install
npm run build             # → builds to backend/admin-dist/
```

Once both SPAs are built, the backend serves them automatically at **`/`** and **`/admin`**.

---

## 🔑 Authentication

- **Email/password** with a 3-layer email validation (format → disposable-domain blocklist → MX lookup).
- **Google Sign-In** via native module + ID token verification.
- **WhatsApp OTP** login — India-first, zero-friction sign-in.
- **JWT access token** + **`token_version`** for real-time single-session enforcement.
  Logging in on a new device? The old one is signed out instantly (`SESSION_INVALIDATED`).
- **Email verification** required before first login; resend support built in.

---

## 💳 Payments (Razorpay)

- Orders created server-side, HMAC signatures verified before access is granted.
- Mobile uses an in-app web checkout with a deep-link callback (reliable under the New Architecture).
- Website uses the inline Razorpay JS modal.
- After payment you get a notification + an **invoice email**, and the PDF unlocks instantly.

---

## 🛡️ Content Protection

- **Server-side watermarking** (`pdf-lib`) bakes `email · NEET Zymee · date` into every page — survives screenshots, recordings and DevTools.
- **Native screen-capture lock** (`expo-screen-capture`) in the mobile viewer.
- **AES-256-GCM** encryption for offline downloads, keys stored in `expo-secure-store`.
- PDFs live in a **private Backblaze B2 bucket**, served via short-lived signed URLs.

---

## 📐 Architecture Highlights

| Decision | Why |
|---|---|
| Native PDF viewer (`react-native-pdf`) | Sharper rendering than WebView; watermark is a lightweight overlay |
| `expo-web-browser` checkout | Native Razorpay SDK is unreliable on New Architecture |
| Server-side watermarking | CSS overlays are trivially bypassed; baked bytes are traceable |
| `token_version` single-session | No extra table, no cleanup job, same security |
| `optionalAuth` for purchased-list | Unauthenticated users get `[]` instead of a 401 cascade |
| Local PDF.js worker | No CDN dependency — website works offline |

---

## ☁️ Deployment (MilesWeb cPanel)

- **Backend** runs as a Node Passenger app from `public_html/api/`.
- Local `backend/` maps 1:1 to the server `public_html/api/` (FTP `curl -T … --ssl-reqd -k`).
- Build the SPAs locally, upload `web-dist/` + `admin-dist/`, restart the Passenger app.
- Database: `neetzyme1_neet_prep` on MilesWeb MySQL (remote access enabled for the web server IP).

---

## 🧪 Validation

```bash
# From project root (mobile)
npm run lint
npm run typecheck
```

---

## 🧭 Roadmap / Blocked Items

- ☐ **WhatsApp Business API** — blocked on Meta business verification
- ☐ **Push notifications (FCM)** — needs `google-services.json` + Firebase service account
- ☐ **SQL migrations** for phone verification & WhatsApp OTP storage

---

## 📄 License

Private project — all rights reserved. Built as a teaching codebase with clean, simple, maintainable code.

---

<div align="center">

Made with 💚 for NEET aspirants · **[neetzymee.com](https://neetzymee.com)**

</div>