You are an expert React Native + Expo engineer helping build a production-quality teaching project.

You write clean, simple, maintainable code. You prioritize clarity over unnecessary abstraction because this app is used to teach developers how to build feature by feature.

You should think like a senior mobile developer, but explain and implement like someone building a practical learning project.

---

## Project Overview

We are building a PDF reading and PDF buying platform with three frontends:

1. **Mobile App** (Expo + React Native) — primary app for students on Android
2. **Website SPA** (Vite + React 19 + react-pdf) — public-facing site at `neetzymee.com` with PDF viewing, college prediction, auth
3. **Admin Panel SPA** (Vite + React 19) — admin area at `neetzymee.com/admin` for CRUD on PDFs, colleges, cutoffs, users

The app shows PDFs to users for free if they watch an ad. Users can buy PDFs to view paid PDFs. Users can view colleges based on their rank and category. All three frontends share the same Express + MySQL backend.

---

## Tech Stack

### Mobile Frontend (Expo SDK 54)

| Technology | Purpose |
|---|---|
| **Expo (SDK 54)** | Build & deployment platform |
| **React Native (0.81.5)** | Mobile UI framework |
| **TypeScript** | Type safety |
| **Expo Router** | File-based routing |
| **lucide-react-native** | Icons |
| **react-native-reanimated** | Animations |
| **react-native-safe-area-context** | Safe area insets |
| **expo-linear-gradient** | Gradient backgrounds |
| **react-native-pdf** + **react-native-blob-util** | Native PDF rendering (NOT WebView) |
| **@config-plugins/react-native-pdf** + **@config-plugins/react-native-blob-util** | Expo config plugins for native PDF |
| **react-native-google-mobile-ads** | AdMob interstitials |
| **expo-web-browser** | In-app browser for payments |
| **expo-linking** | Deep link handling |
| **@react-navigation/bottom-tabs** | Bottom tab navigator |
| **@react-native-async-storage/async-storage** | Local persistence |
| **react-native-toast-message** | Toast notifications for payment success/failure |
| **@react-native-google-signin/google-signin** | Native Google Sign-In (dev build + config plugin) |
| **expo-screen-capture** | Block native screen recording on Android |

### Website Frontend (Vite + React 19)

| Technology | Purpose |
|---|---|
| **Vite** | Build tool |
| **React 19** | UI framework |
| **react-router-dom v7** | Client-side routing |
| **react-pdf v10** | PDF rendering via pdf.js (web only) |
| **pdfjs-dist** (bundled inside react-pdf) | PDF.js worker for web rendering |
| **Razorpay JS SDK** | Inline payment modal |

### Admin Panel Frontend (Vite + React 19)

| Technology | Purpose |
|---|---|
| **Vite** | Build tool |
| **React 19** | UI framework |
| **react-router-dom v7** | Client-side routing |
| **Hallmark OKLCH Quiet theme** | Styling via `tokens.css` with CSS utility classes |

### Backend

| Technology | Purpose |
|---|---|
| **Express.js** | HTTP server |
| **MySQL** (via mysql2/promise) | Database |
| **JWT** (jsonwebtoken) | Auth tokens (access + refresh) |
| **bcryptjs** | Password hashing |
| **nodemailer** | Email (verification + password reset + invoice) |
| **razorpay** | Payment gateway |
| **google-auth-library** | Google Sign-In ID token verification |
| **pdf-lib** | Server-side PDF watermarking (pure JS, no native deps) |
| **disposable-email-domains** | Block disposable emails during registration |
| **cors, dotenv** | Middleware |

### Infrastructure

| Technology | Purpose |
|---|---|
| **MilesWeb cPanel** | Server hosting with Node.js Passenger app |
| **Backblaze B2** | Private PDF file storage |
| **Razorpay** | Payment processing |
| **mail.neetzymee.com SMTP** | Sending emails |

Do not introduce new major libraries unless there is a strong reason.

---

## Project Structure

```
neet-prep/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Bottom tab screens
│   │   ├── _layout.tsx     # Tab navigator (Home, PDFs, Colleges, Profile)
│   │   ├── index.tsx       # Home — recently viewed, subject grid, featured PDFs
│   │   ├── pdfs.tsx        # Browse PDFs with category filter, OWNED badge
│   │   ├── colleges.tsx    # College predictor with rank/category/state
│   │   └── profile.tsx     # Profile with menu cards, notification badge, admin link
│   ├── pdf/                # PDF routes
│   │   ├── [id].tsx        # PDF detail — buy/watch-ad/free actions + payment flow
│   │   └── viewer/[id].tsx # Native PDF viewer (react-native-pdf) with watermark
│   ├── college/[id].tsx    # College detail with info, cutoffs, courses
│   ├── _layout.tsx         # Root layout: AuthProvider, Toast, AdMob init, deep link handler, onboarding gate
│   ├── +not-found.tsx      # 404 fallback
│   ├── login.tsx           # Email/password login + Google Sign-In + session conflict dialog
│   ├── register.tsx        # Register with format validation → redirect to verify-email
│   ├── forgot-password.tsx # Forgot password with always-success response
│   ├── reset-password.tsx  # Reset password via deep link token
│   ├── verify-email.tsx    # Post-registration + deep-link auto-verify + manual token input
│   ├── onboarding.tsx      # 3-slide swipeable onboarding carousel (first launch only)
│   ├── razorpay-callback.tsx  # Cold-start fallback for payment deep link
│   ├── notifications.tsx   # Notifications list with unread dots, mark-all-read
│   ├── purchased.tsx       # Purchased PDFs grid with subject tiles
│   ├── about.tsx           # App info (name, version, contact)
│   ├── help.tsx            # FAQ accordion screen
│   └── privacy.tsx         # Privacy & security info screen
├── backend/                # Express API server
│   ├── config/db.js        # MySQL connection pool
│   ├── controllers/        # Business logic
│   │   ├── auth.js         # Register, login, googleAuth, logout, refresh, profile, verifyEmail
│   │   ├── pdfs.js         # CRUD, purchase, payment callback, view URL, watermarked serving
│   │   ├── colleges.js     # List, predict, detail
│   │   ├── notifications.js # List, mark read, mark all read, createNotification helper
│   │   ├── passwordReset.js # Forgot/reset with both mobile + web HTML flows
│   │   └── admin.js        # Dashboard stats, PDF/College/Cutoff/User CRUD
│   ├── middleware/
│   │   ├── auth.js         # auth (required) + optionalAuth — JWT verify, token_version check
│   │   └── adminAuth.js    # adminAuth — JWT from header or ?token=, role='admin' check
│   ├── routes/
│   │   ├── auth.js         # /api/auth endpoints
│   │   ├── pdfs.js         # /api/pdfs endpoints
│   │   ├── colleges.js     # /api/colleges endpoints
│   │   ├── notifications.js # /api/notifications endpoints
│   │   ├── passwordReset.js # /api/auth forgot/reset (web + mobile)
│   │   ├── admin.js        # /api/admin endpoints (all adminAuth-protected)
│   │   └── redirect.js     # /api/redirect/verify-email + reset-password HTML pages
│   ├── services/
│   │   ├── email.js        # Nodemailer via mail.neetzymee.com SMTP
│   │   └── b2.js           # Backblaze B2 auth + download authorization
│   ├── web-dist/           # Built website SPA (served at /)
│   └── admin-dist/         # Built admin SPA (served at /admin)
├── components/             # Reusable React Native components
│   ├── AlertBanner.tsx     # Alert card (error/success/info) with icon + action button
│   ├── CustomAlert.tsx     # Animated modal dialog with icon circle + up to 3 buttons
│   ├── GoogleSignInButton.tsx  # Google Sign-In button with FontAwesome icon
│   └── Skeleton.tsx        # Loading skeleton placeholder
├── constants/
│   ├── colors.ts           # Theme colors: primary, muted, tile*, glyph*, border, success
│   ├── images.ts           # Centralized image asset imports
│   └── subjectVisuals.ts   # getTileBg, getGlyphColor, getGlyphLetter for subjects
├── hooks/                  # (empty — custom hooks used inline in screens)
├── lib/
│   ├── api.ts              # Mobile API client class — all endpoints, token mgmt, formatPrice
│   ├── authContext.tsx     # AuthProvider + useAuth — user state, login/logout/register/verify
│   ├── googleAuth.ts       # Google Sign-In configuration and sign-in helper
│   ├── onboardingStorage.ts # AsyncStorage onboarding completion flag
│   ├── paymentSession.ts   # Module-level paymentHandled guard for race condition prevention
│   ├── homeCache.ts        # AsyncStorage cache for home screen data (60-min expiry)
│   ├── adService.ts        # AdMob interstitial ad init + show
│   └── recentlyViewed.ts   # AsyncStorage-backed list of up to 6 recently viewed PDF IDs
├── website/                # Vite + React 19 website SPA (source, builds to backend/web-dist/)
│   ├── src/
│   │   ├── pages/          # 12 pages: Home, PDFs, PDFDetail, PDFViewer, Colleges, CollegeDetail,
│   │   │                   #   Login, Register, ForgotPassword, ResetPassword, Profile, Purchased
│   │   ├── lib/api.ts      # Web API client with localStorage JWT + session-invalidation dispatch
│   │   ├── lib/auth.tsx    # Web AuthContext — login/register/logout/verify/reset
│   │   └── tokens.css      # Hallmark OKLCH Quiet theme tokens + utility classes
│   ├── public/pdf.worker.min.mjs  # Local PDF.js worker (no CDN dependency)
│   └── vite.config.ts      # Builds to ../backend/web-dist/
├── admin/                  # Vite + React 19 admin SPA (source, builds to backend/admin-dist/)
│   ├── src/
│   │   ├── pages/          # 9 pages: Dashboard, Login, PdfList/Form, CollegeList/Form, CutoffList/Form, UserList
│   │   ├── components/     # ConfirmDialog, DataTable, Layout, StatsCard
│   │   ├── lib/api.ts      # Admin API client with sessionStorage JWT
│   │   └── tokens.css      # Hallmark OKLCH Quiet theme
│   └── vite.config.ts      # Builds to ../backend/admin-dist/
└── assets/                 # Mobile app images (mascot, mascot-logo, etc.)
```

---

## Features Implemented

### Authentication (JWT Access + Refresh Tokens)

- **Register** (`POST /api/auth/register`): Creates user with `email_verified = false`, issues verification token, sends verification email. Returns `{ message, email }` — NO auto-login.
- **3-layer email validation** during register:
  1. Format regex check (frontend + backend)
  2. Disposable domain blocklist (via `disposable-email-domains`)
  3. MX record DNS lookup (try/catch — non-blocking on failure)
- **Login** (`POST /api/auth/login`): Validates credentials, checks `password_hash` exists (not Google-only), checks `email_verified`. Returns access + refresh tokens. If not verified, returns `{ error, email, needs_verification: true }`.
- **Google Sign-In** (`POST /api/auth/google`): Verifies Google ID token via `google-auth-library`. Links existing users by email, creates new users with `email_verified=true`. Null `password_hash` for Google-only accounts.
- **Refresh** (`POST /api/auth/refresh`): Validates stored refresh token against DB, issues new access token.
- **Verify Email** (`POST /api/auth/verify-email`): Validates verification token, sets `email_verified = true`, returns access + refresh tokens (auto-login).
- **Verify Email Web** (`GET /api/auth/verify-email-web?token=`): Same logic, returns styled HTML success/failure page with "Open NEET Zyme" link.
- **Resend Verification** (`POST /api/auth/resend-verification`): Generates new verification token, re-sends email.
- **Forgot Password** (`POST /api/auth/forgot-password`): Generates reset token (30-min expiry), stores in `password_resets` table, sends email. Always returns success (prevents email enumeration).
- **Forgot Password Web** (`GET /api/auth/forgot-password`): Renders HTML form for entering email.
- **Reset Password** (`POST /api/auth/reset-password`): Validates token, hashes new password, updates user, marks token used.
- **Reset Password Web** (`GET /api/auth/reset-password-web?token=` + `POST /api/auth/reset-password-web-submit`): Renders HTML form, submits with same logic, returns styled HTML success/failure page.
- **Logout** (`POST /api/auth/logout`, auth required): Sets `has_active_session = FALSE`, increments `token_version` to invalidate all existing tokens.
- **Profile** (`GET/PUT /api/auth/profile`): Get/update user name, category. `GET` also returns `purchases_count` (aggregate of completed purchases). No `neet_rank` — column removed.
- **Auth Middleware** (`middleware/auth.js`):
  - `auth` (required): Decodes JWT, compares `tokenVersion` against DB `token_version` — mismatch returns `401 SESSION_INVALIDATED`. Sets `req.userId`, `req.userEmail`.
  - `optionalAuth`: Same logic but silently continues if no/invalid token. Sets `req.userId` or null.
  - Differentiates `TokenExpiredError` ("Token expired") from `JsonWebTokenError` ("Invalid token").
- **Admin Auth Middleware** (`middleware/adminAuth.js`): JWT from `Authorization` header or `?token=` query param. Verifies `role = 'admin'`. Sets `req.adminUserId`, `req.adminEmail`.

### Single-Session Enforcement

- `token_version` column on `users` table — incremented on every login/logout
- `has_active_session` column — set to TRUE on login, FALSE on logout
- **Login**: Checks `has_active_session` — if TRUE and `forceLogin` not set, returns `409 ACTIVE_SESSION_EXISTS`
- **Logout**: Sets `has_active_session = FALSE`, increments `token_version`
- **Middleware**: Compares JWT's `tokenVersion` against DB — mismatch = `401 SESSION_INVALIDATED`
- **Mobile**: `onSessionInvalidated` callback in `api.ts` → authContext clears user immediately → AuthRouter redirects to login. `SESSION_INVALIDATED` response stores flag in AsyncStorage → login screen shows AlertBanner.
- **Website**: `api.ts` dispatches `window CustomEvent('session-invalidated')` → auth listener clears state.
- **ACTIVE_SESSION_EXISTS**: Mobile shows `CustomAlert` confirmation dialog with Cancel/Continue. Website shows modal overlay. Retries login with `forceLogin: true`.

### Google Sign-In (Mobile)

- Uses `@react-native-google-signin/google-signin` native module (dev build + config plugin)
- `lib/googleAuth.ts`: Configures with `webClientId` + `iosClientId` from env vars
- `components/GoogleSignInButton.tsx`: Reusable button with FontAwesome Google icon
- `lib/authContext.tsx`: `loginWithGoogle()` — calls `signInWithGoogle()`, sends `idToken` to backend `/api/auth/google`
- Google-only users have `password_hash = NULL` — login returns clear error with AlertBanner action button linking to Google Sign-In

### Onboarding

- `lib/onboardingStorage.ts`: AsyncStorage-backed flag (`isOnboardingComplete`, `markOnboardingComplete`, `resetOnboarding`)
- `app/onboarding.tsx`: 3-slide FlatList horizontal swiper with:
  - Per-slide gradient background circles (LinearGradient)
  - Animated dot pagination indicator
  - Skip/Next/Get Started buttons
- `app/_layout.tsx`: AuthRouter checks `isOnboardingComplete` → shows `/onboarding` for first launch
- Dev-only reset button in `app/(tabs)/profile.tsx`

### Email System

- Nodemailer via `mail.neetzymee.com` SMTP (not Gmail)
- Two email templates: verification and password reset
- Invoice email (`sendInvoiceEmail`) sent on successful payment (fire-and-forget)
- Deep link URLs use HTTPS redirect pages (not raw `myapp://` scheme)
- Emails sent fire-and-forget (`.catch(() => {})` — never block the response)

### Notifications

- **Backend routes** (`/api/notifications`, all `auth`-protected):
  - `GET /` — list last 50 notifications for user, newest first
  - `POST /read-all` — mark all as read
  - `POST /:id/read` — mark single as read
- Internal `createNotification(userId, title, body)` helper in `controllers/notifications.js`
- Called by `verifyPayment` and `paymentCallback` after successful purchase: `"Purchase Successful — You now have access to 'PDF Title'"`
- **Mobile** (`app/notifications.tsx`):
  - Unread indicator dot, mark-all-read button with `CheckCheck` icon
  - Individual mark-as-read on tap
  - Empty state with `Bell` icon
  - `timeAgo` helper ("just now", "5m ago", "3h ago", "2d ago")
- Profile bell icon fetches unread count on every focus

### Subject Visuals

- `constants/subjectVisuals.ts` — centralized functions for subject-based theming:
  - `getTileBg(subject)` — returns tile background color from `COLORS.tile*`
  - `getGlyphColor(subject)` — returns glyph accent color from `COLORS.glyph*`
  - `getGlyphLetter(subject)` — returns single-letter/abbreviation (B, P, C, Z, A, PY, Que)
- Extracted from 4 files (index.tsx, pdfs.tsx, purchased.tsx, pdf/[id].tsx) — 11 duplicated function definitions removed

### Recently Viewed

- `lib/recentlyViewed.ts` — AsyncStorage-backed list of up to 6 recently viewed PDF IDs
- `addRecentlyViewed(pdfId)` called when opening a PDF detail page
- `getRecentlyViewedIds()` returns ordered array, newest first
- Used in `app/(tabs)/index.tsx` to show horizontally scrollable row with animated scroll indicator

### Mobile PDF System

- **Backend routes** (`/api/pdfs`):
  - `GET /` — list all PDFs
  - `GET /:id` — get single PDF (also increments downloads counter)
  - `GET /:id/check` — check purchase status
  - `GET /user/purchased` — user's purchased PDFs (uses `optionalAuth`, returns `[]` for unauthenticated)
  - `GET /:id/view` — signed URL + auth headers for B2 private bucket
  - `POST /create-order` — create Razorpay order
  - `POST /verify-payment` — HMAC signature verification
  - `POST+GET /payment-callback/:pdfId` — dual-purpose callback with pdfId in URL path
  - `GET /:id/watermarked` — server-side watermarked PDF bytes (used by website, not mobile)
- `parsePdf` parses `tags`, `details` (JSON arrays) and converts `is_free` to Boolean
- PDF response includes `details: string[]` rendered as MetaPills on detail screen
- PDF response includes `category: string | null` for filtering in Browse
- **PDF Viewer** (`app/pdf/viewer/[id].tsx`): Native `react-native-pdf` component with:
  - `renderActivityIndicator` prop for built-in loading spinner
  - Watermark overlay: `StyleSheet.absoluteFill`, red 20% opacity, 40px font, -45° rotation, `pointerEvents="none"`
  - `trustAllCerts={false}` (required by Android `react-native-blob-util` 0.24.9 crash fix)
  - `usePreventScreenCapture()` from `expo-screen-capture` to block native screen recording
  - Ad interstitial before access for free/ad-based PDFs
  - User-friendly error state: "This PDF file could not be loaded. It may be corrupted or unavailable."
- **OWNED Badge**: Fetches purchased PDF IDs on screen focus, shows "OWNED" tag on list items
- **Price formatting**: `formatPrice(price)` helper in `api.ts` — integer string if no decimals (`₹299` not `₹299.00`), `toFixed(2)` otherwise

### Mobile Payment Flow (Razorpay)

- **Checkout approach**: `expo-web-browser` (NOT `react-native-razorpay` — blocked by New Architecture in SDK 54)
- Backend creates order → frontend opens checkout URL in system browser → Razorpay POSTs to `/payment-callback` → HMAC verified → DB updated → redirects to `myapp://razorpay-callback?success=true`
- `lib/paymentSession.ts`: module-level guard (`paymentHandled` flag) prevents race between warm-start return and cold-start deep link
- `app/pdf/[id].tsx` uses `WebBrowser.openAuthSessionAsync` with inline result parsing:
  - `WebBrowser.dismissBrowser()` clears Custom Tab from Android activity stack
  - `hasStartedPayment` ref + `useFocusEffect` resets spinner on screen regain (fixes infinite loader on cold-start failure)
  - Success: `Toast.show` + `router.replace('/pdf/viewer/[id]')`
  - Failure: `Toast.show` with error, user stays on detail screen to retry
- `router.replace()` on success, `router.back()` on failure (prevents duplicate stack entries)
- `app/razorpay-callback.tsx` acts as cold-start fallback:
  - `WebBrowser.dismissBrowser()` at top of useEffect
  - Guard check: skip if warm start already handled
  - Failure: `router.back()` when `canGoBack()`, else `router.replace('/pdf/[pdfId]')`

### Backblaze B2 Integration

- `services/b2.js`: `b2_authorize_account` + master auth token caching, `getDownloadAuthorization` for expiring tokens
- `GET /api/pdfs/:id/view` returns `{ url, headers, is_free, title }` with master auth token in headers
- Native URL format with master auth token (simpler than `b2_get_download_authorization`)
- Server-side proxy via `GET /api/pdfs/:id/watermarked` uses `getAuth()` to fetch PDF bytes from B2 (no CORS issues)

### Server-Side PDF Watermarking (Website)

- `GET /api/pdfs/:id/watermarked` (auth required):
  1. Checks auth + purchase for non-free PDFs
  2. Fetches original PDF bytes from B2
  3. Uses `pdf-lib` to load PDF and embed Helvetica font
  4. On every page: draws diagonal watermark text — `user.email • NEET Zyme • date`
  5. Returns watermarked PDF bytes as `application/pdf`
- Watermark survives screenshots, screen recordings, DevTools inspection
- Website loads PDF via `fetch()` to this endpoint with JWT → `arrayBuffer()` → `{ data: buffer }` to `react-pdf`
- PDF.js worker served locally from `/pdf.worker.min.mjs` (no CDN dependency)

### College Predictor

- `app/(tabs)/colleges.tsx`: Rank input, category pills, state search dropdown
- Predictions display with probability badges (High/Medium/Low), cutoff rank, margin info
- Backend: `GET /api/colleges/predict?rank=&category=&state=`
- Website also has college predictor at `/colleges`

### Deep Link Handling

- **Route-based** (Expo Router auto-routes `myapp://path` to `app/path.tsx`)
- **Custom `_layout.tsx` handler** — manually parses deep links for `reset-password` and `verify-email` paths, routes with `router.replace`. Handles both warm (listener) and cold-start (`getInitialURL`) scenarios.
- **HTTPS redirect pages** for cross-device compatibility:
  - Email buttons link to `https://neetzymee.com/api/redirect/verify-email?token=...`
  - Server serves HTML page at `/api/redirect/verify-email` and `/api/redirect/reset-password`
  - HTML page has JS that tries `myapp://` deep link, falls back to Play Store after 2s
  - "Try Opening App Again" button for retry

### Reusable Mobile Components

- **`components/AlertBanner.tsx`**: 3 alert types (error/success/info), icon, action button, dismiss button. Used by 7 auth screens (login, register, verify-email, forgot-password, reset-password, etc.)
- **`components/CustomAlert.tsx`**: Animated modal dialog with icon circle (check/x/alert), up to 3 action buttons with different styles (primary/cancel/destructive). Used by profile sign-out, pdf/[id] unavailable, login session conflict (ACTIVE_SESSION_EXISTS)
- **`components/GoogleSignInButton.tsx`**: Reusable Google Sign-In button with FontAwesome Google icon
- **`components/Skeleton.tsx`**: Loading placeholder component

### Website SPA

- 12 pages at `website/src/pages/`: Home, PDFs, PDFDetail, PDFViewer, Colleges, CollegeDetail, Login, Register, ForgotPassword, ResetPassword, Profile, Purchased
- Auth via `localStorage` (persists across tabs)
- `api.ts`: Full API client with `request()` helper, localStorage token, `SESSION_INVALIDATED` → `CustomEvent('session-invalidated')`, `ACTIVE_SESSION_EXISTS` → thrown as error caught by Login modal
- `auth.tsx` (AuthContext): `AuthProvider` + `useAuth()`, auto-fetches profile on mount, logout clears state
- PDF rendering: `react-pdf` v10 with local worker, `{ data: arrayBuffer }` source from watermarked endpoint, right-click prevention, print blocking, text selection prevention
- Payment: Razorpay JS SDK inline modal (no deep link callbacks, no `paymentHandled` guard)
- Styling: `tokens.css` with Hallmark OKLCH Quiet theme — utility classes (`container`, `btn`, `pill`, `card`, `spinner`, `form-input`)
- Builds to `backend/web-dist/` via Vite, served by Express at `/` with SPA fallback

### Admin Panel SPA

- 9 pages: Dashboard, Login, PdfList, PdfForm, CollegeList, CollegeForm, CutoffList, CutoffForm, UserList
- 4 components: ConfirmDialog, DataTable (sortable/searchable), Layout (sidebar+header), StatsCard
- `api.ts`: API client with sessionStorage JWT, `?token=` query param fallback for direct browser access
- Auth: Dedicated login page (email login) OR `?token=` from mobile app "Admin Panel" link
- CRUD: Full create/edit/delete for PDFs (with dynamic `details` list), colleges (with facilities), cutoffs (with duplicate check)
- User management: List users, update role (`admin` / `user`)
- Styling: `tokens.css` with Hallmark OKLCH Quiet theme
- Builds to `backend/admin-dist/` via Vite, served by Express at `/admin` with SPA fallback

### UI/UX Conventions (Mobile)

- `StyleSheet.create()` always — never NativeWind/Tailwind classes
- `SafeAreaView` from `react-native-safe-area-context`
- Colors from `constants/colors.ts`:
  - `COLORS.placeholder` (`#9CA3AF`) for all placeholder text
  - `COLORS.muted` (`#5F6570`) for secondary text
  - `COLORS.primary` (`#2ea86e`) for actions
  - `COLORS.tile*` and `COLORS.glyph*` for subject-themed tiles and icons
- Subject visuals centralized in `constants/subjectVisuals.ts`
- Form inputs: icon prefix, rounded `12px` container, border color `COLORS.border`
- Buttons: rounded `14px`, primary background, white bold text

---

## Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **Native PDF over WebView** | `react-native-pdf` renders sharper, watermark is a simple RN View overlay (`pointerEvents="none"`), no DPR scaling workaround needed |
| **Web checkout over native Razorpay** | `react-native-razorpay` returns `null` at runtime under New Architecture. `expo-web-browser` + HTTPS callback works reliably |
| **JWT refresh tokens stored in DB** | Enables server-side invalidation of refresh tokens |
| **Email verification before login** | Standard security practice, prevents unverified account use |
| **HTTPS redirect for deep links** | Raw `myapp://` scheme only works on same-device email. HTTPS redirect page works everywhere (desktop, web mail, etc.) |
| **B2 Native URL format** | Simpler than `b2_get_download_authorization` — user stores the Native URL in `file_url`, server signs with master auth token |
| **Server-side PDF watermark (pdf-lib)** | CSS overlays are trivially removed via DevTools. Baking user email + date into PDF bytes makes leaks traceable and survives screenshots |
| **`token_version` over `user_sessions` table** | No new table, no cleanup job, same security. Incremented on login/logout. Middleware checks version match |
| **`has_active_session` flag** | More reliable than `token_version > 0` — resets to 0 on explicit logout. Login returns 409 `ACTIVE_SESSION_EXISTS` |
| **`onSessionInvalidated` callback pattern** | `api.ts` holds a callback, `authContext.tsx` registers it on mount → immediate `setUser(null)` → AuthRouter redirects to login |
| **401 handler removed from mobile api.ts** | Navigating to `/(auth)/login` inside the API client caused `+not-found.tsx` because route wasn't in current navigation stack. Existing `loadStoredAuth()` in AuthContext handles expired tokens on cold start |
| **`optionalAuth` for `/user/purchased`** | Returns `[]` for unauthenticated instead of 401, preventing cascade of token-clearing and broken navigation |
| **`trustAllCerts={false}`** | Required because `react-native-blob-util` 0.24.9 on Android crashes with missing trust manager when `true` |
| **`openAuthSessionAsync` over `Linking.openURL`** | Custom Tab runs in separate process (survives app kill), `dismissBrowser()` clears Android task stack |
| **Module-level `paymentHandled` guard** | Prevents double-handling from `openAuthSessionAsync` return AND Expo Router deep-link firing simultaneously |
| **`router.back()` on failure, `router.replace()` on success** | Failure returns to existing `pdf/[id]` without duplication; success removes payment screen from stack |
| **`forceLogin` flow** | Backend returns `409 ACTIVE_SESSION_EXISTS`, frontend shows confirmation dialog (CustomAlert), retries with `forceLogin: true` |
| **`adminAuth` middleware with `?token=` support** | Admin panel SPA accessed directly from browser — JWT passed via query param instead of `Authorization` header |
| **Website pre-fetch ArrayBuffer approach** | `fetch(url, { headers })` → `arrayBuffer()` → `{ data: buffer }` to react-pdf — bypasses CORS preflight issues with B2 + Authorization header |
| **Local PDF.js worker** | `pdf.worker.min.mjs` served from web-dist root — no CDN dependency, works offline |
| **Website Razorpay inline modal** | Simpler than mobile's `openAuthSessionAsync` — no deep link callbacks, no `paymentHandled` guard needed |
| **Graceful missing-dist serving** | `server.js` checks `fs.existsSync()` for web-dist/admin-dist — skips SPA serving if missing, logs warning. Prevents crash during incremental deploys |

---

## Deployment

- **Backend**: MilesWeb cPanel → Node.js app at `public_html/api/` (working directory), proxy path `/`
- **Server directory layout**: Passenger runs from `public_html/api/` — **there is no `backend/` subdirectory on the server.** The local `backend/` directory maps directly into `public_html/api/`:
  - Local `backend/server.js` → FTP to `public_html/api/server.js`
  - Local `backend/routes/admin.js` → FTP to `public_html/api/routes/admin.js`
  - Local `backend/controllers/admin.js` → FTP to `public_html/api/controllers/admin.js`
  - Local `backend/middleware/auth.js` → FTP to `public_html/api/middleware/auth.js`
  - Local `backend/services/b2.js` → FTP to `public_html/api/services/b2.js`
  - Local `backend/config/db.js` → FTP to `public_html/api/config/db.js`
  - Local `backend/web-dist/` → FTP to `public_html/api/web-dist/`
  - Local `backend/admin-dist/` → FTP to `public_html/api/admin-dist/`
- **Website SPA**: Vite build → `backend/web-dist/` → FTP to `public_html/api/web-dist/` → served by Express at `/`
- **Admin SPA**: Vite build → `backend/admin-dist/` → FTP to `public_html/api/admin-dist/` → served by Express at `/admin`
- **Domain**: `https://neetzymee.com/` (website), `https://neetzymee.com/api/...` (API), `https://neetzymee.com/admin` (admin)
- **DB**: `neetzyme1_neet_prep` on `103.191.209.159:3306`, user `neetzyme1_appuser`
- **DB remote access**: Enabled for web server IP `10.169.3.143`
- **Server restart**: Required after every backend file upload (via cPanel Passenger restart)
- **npm install**: Run via cPanel (do NOT upload node_modules via FTP)
- **FTP**: `103.191.209.159`, user `Ahmad@neetzymee.com`, password: `Ahmadd@12345`, TLS required (`--ssl-reqd -k`)
- **SSH**: `neetzyme1` / port 22, password: "Ahmadd@123"
- **SSH Command**: `ssh -p 22 neetzyme1@103.191.209.159`
- **Node.js**: v26.4.0, Express, Passenger-managed
- **FTP deploy command template**: `curl -T <local-file> ftp://103.191.209.159/public_html/api/<server-path> -u Ahmad@neetzymee.com:Ahmadd@12345 --ssl-reqd -k --ftp-create-dirs`
  - Backend file: `curl -T "backend\routes\admin.js" "ftp://103.191.209.159/public_html/api/routes/admin.js" -u Ahmad@neetzymee.com:Ahmadd@12345 --ssl-reqd -k --ftp-create-dirs`
  - Admin SPA: `curl -T "backend\admin-dist\index.html" "ftp://103.191.209.159/public_html/api/admin-dist/index.html" -u Ahmad@neetzymee.com:Ahmadd@12345 --ssl-reqd -k --ftp-create-dirs`
  - Website SPA: `curl -T "backend\web-dist\index.html" "ftp://103.191.209.159/public_html/api/web-dist/index.html" -u Ahmad@neetzymee.com:Ahmadd@12345 --ssl-reqd -k --ftp-create-dirs`

---

## Database Schema Notes

- `users` table columns:
  - `email_verified` (TINYINT(1), default 0)
  - `verification_token` (TEXT, nullable)
  - `refresh_token` (TEXT, nullable)
  - `token_version` (INT, default 0) — incremented on login/logout for single-session enforcement
  - `has_active_session` (TINYINT(1), default 0) — set to 1 on login, 0 on logout
  - `role` (VARCHAR(20), default 'user') — 'user' or 'admin' for admin access
  - `password_hash` (TEXT, nullable) — NULL for Google-only accounts
- `pdfs` table:
  - `details` (LONGTEXT) — JSON array of short display strings, parsed by `parsePdf` on backend
  - `file_url` (TEXT) — B2 native URL
  - `is_free` (TINYINT(1)) — Boolean parsed by `parsePdf`
  - `tags` (TEXT) — JSON array
  - `category` (VARCHAR, nullable)
- `notifications` table:
  ```sql
  CREATE TABLE `notifications` (
    `id` int(11) NOT NULL,
    `user_id` int(11) NOT NULL,
    `title` varchar(255) NOT NULL,
    `body` text DEFAULT '',
    `is_read` tinyint(1) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp()
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  ```
- `password_resets` table — stores reset tokens with expiry timestamps
- `purchases` table — tracks payment orders with `razorpay_order_id`, `status` (pending/completed)
- BOOLEAN in MySQL is `TINYINT(1)` — equivalent, works correctly in JavaScript (truthy/falsy)

---

## Development Philosophy

Build feature by feature.

For every feature:

1. Understand the user request.
2. Check this file before coding.
3. Keep the implementation simple.
4. Avoid overengineering.
5. Prefer readable code over clever code.
6. Build the smallest useful version first.
7. Refactor only when repetition or complexity appears.

---

## Decision Making & Clarifications

If something is unclear or could be improved:

- Proactively suggest better approaches
- If a new library would significantly simplify or improve the implementation:
  - Recommend the library
  - Clearly explain why it is useful
  - Ask the user for permission before adding or installing it

Example:

> "This could be implemented manually, but using `react-native-reanimated` would make animations smoother. Do you want me to add it?"

Do not install or use new libraries without user approval.

---

## UI Implementation Rules (VERY IMPORTANT)

For any UI-related task:

- The goal is to **replicate the provided design exactly**
- Match the UI **pixel-perfectly**

When the user provides a design image:

You MUST:

- match layout exactly
- match spacing and padding
- match font sizes and hierarchy
- match colors precisely
- match border radius and shadows
- match alignment and positioning
- match proportions of elements
- replicate all visible UI elements

Do not approximate. Do not simplify unless explicitly asked.
Ask when in doubt. For example:
> Should this UI be extracted into a reusable component, or should I keep it inside the current screen for now?

---

### SafeAreaView Example

```tsx
// ✅ CORRECT - Use inline styles or StyleSheet
import { SafeAreaView } from "react-native-safe-area-context";

function MyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* content */}
    </SafeAreaView>
  );
}

// ❌ INCORRECT - Do not use NativeWind/tailwindcss classes
function MyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">{/* content */}</SafeAreaView>
  );
}
```

And similar for the above mentioned exception components. **Always use `StyleSheet.create()` for all styles.** Do not use NativeWind or Tailwind CSS classes.

---

## UI Quality Bar

The app should feel:

- playful
- polished
- friendly
- mobile-first
- visually close to the provided design references

Use:

- rounded cards
- soft shadows
- clear spacing
- progress indicators
- friendly empty states
- large touch targets
- simple animations when useful

---

## Image Rule

Use centralized image imports.

Before using any image asset:

1. Check if `constants/images.ts` exists. If it does not, create it.
2. Import and export all app images from `constants/images.ts`.
3. Use images through the centralized object.

Example:

```ts
import mascot from "@/assets/images/mascot.png";
import mascotLogo from "@/assets/images/mascot-logo.png";

export const images = {
  mascot,
  mascotLogo,
};
```

Use images like this,

```tsx
<Image source={images.mascot} />
```

Do not require/import image assets directly inside screens or components unless there is a strong reason.

---

## Feature Implementation Rules

When the user asks to build a feature:

1. Read this file first.
2. Identify files to change.
3. Keep changes focused.
4. Do not rewrite unrelated code.
5. Follow existing patterns.
6. Ensure feature works end-to-end.
7. Fix errors before finishing.
8. Do not upload node modules, ask user to run "npm install" using the MilesWebHosting Admin Panel.

---

## Code Simplicity Rules

Avoid overengineering.

Refactor only when needed.

---

## Component Creation Rule

Only create reusable components when necessary.

Ask if unsure.

---

## Linting and Validation

Run:

```bash
npm run lint
npm run typecheck
```

Fix errors.

---

## Communication Style

Be concise.

Explain what changed and how to test.

---

## Final Reminder

Before every feature implementation:

- Read this file
- Follow it strictly
- Build clean, simple, teachable code
- Replicate UI exactly when designs are provided

---

## Admin Panel — PDF Details Input

When building the admin panel's PDF upload/edit form, use a **dynamic list** for the `details` column:

- `details` is a `LONGTEXT` JSON array of short display strings (parsed by `parsePdf` on the backend)
- Render a list of `<TextInput>` rows, each bound to an index in `details: string[]` state
- Each row has an `✕` button to remove via `.filter((_, i) => i !== idx)`
- `+ Add detail` button appends an empty string to the array
- Empty rows are auto-removed on blur for clean data
- On submit: `JSON.stringify(details)` → stored in `details` column
- No backend changes needed — `parsePdf` and the INSERT/UPDATE spread already handle it

---

## Website SPA Conventions

- Build output goes to `backend/web-dist/` via `vite.config.ts` (`outDir: '../backend/web-dist'`)
- Express serves from `path.join(__dirname, 'web-dist')` at `/` with SPA fallback for non-API, non-admin routes
- PDF viewer uses server-side watermarked endpoint (`/api/pdfs/:id/watermarked`) with `pdf-lib`
- PDF.js worker loaded locally from `/pdf.worker.min.mjs` (copied to web-dist root)
- JWT stored in `localStorage` (not sessionStorage) — persists across tabs
- Session invalidation uses `window.dispatchEvent(new CustomEvent('session-invalidated'))`
- `ACTIVE_SESSION_EXISTS` error → modal overlay with Cancel/Continue (up to user)
- Styling via `tokens.css` utility classes (not CSS modules or CSS-in-JS)

---

## Admin Panel SPA Conventions

- Build output goes to `backend/admin-dist/` via `vite.config.ts`
- Express serves from `path.join(__dirname, 'admin-dist')` at `/admin` with SPA fallback
- JWT stored in `sessionStorage` (tab-scoped — admin session doesn't persist)
- API calls use `Authorization` header for `fetch()` requests
- Browser direct access (bookmark, refresh) uses `?token=` query param support in `adminAuth` middleware
- Login page: email/password login OR paste JWT token from mobile app
- Styling via `tokens.css` utility classes (Hallmark OKLCH Quiet theme)

---

## Progress & Status

### Completed
- **Website Google Sign-In OAuth** — Added `https://neetzymee.com` to Authorized JavaScript origins in Google Cloud Console. Login works (COOP console warning is cosmetic).

### In Progress
- (none)

### Blocked
- **WhatsApp Business API** — Meta verification not completed
- **Push notification FCM init** — needs `google-services.json` + FCM V1 service account
- **SQL migrations `005_add_phone_verification.sql`, `006_create_whatsapp_otps.sql`** — not yet run
