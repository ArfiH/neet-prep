# NEET Prep App - Architecture Plan

## Overview

A mobile app for NEET exam preparation featuring:
- Study PDFs (free & paid)
- College predictor based on NEET rank
- User authentication
- Payment integration (Phase 2)

---

## Phase 1: MVP (Supabase)

### Architecture
```
┌─────────────────┐     ┌─────────────────┐
│  Android App    │────▶│  Supabase       │
│  (Expo/React)   │     │  • Database     │
│                 │     │  • Auth (Phone) │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

### What's Included
- User registration/login (phone OTP)
- Browse PDFs (free & paid)
- PDF detail view
- College list & details
- College predictor tool
- Recently viewed PDFs
- Payment system **NOT included**

### Technology Stack
- **Frontend**: Expo SDK 54, React Native 0.81, TypeScript
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (phone OTP)
- **State Management**: React hooks + AsyncStorage
- **Navigation**: React Navigation v7 (bottom tabs + stack)

### Cost
- Free tier

---

## Phase 2: Production (MySQL + MilesWeb + Node.js)

### Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Android App    │────▶│  MilesWeb       │────▶│  MySQL          │
│                 │     │  Node.js API    │     │  (75 conn.)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Razorpay       │
                        │  (Payments)     │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  Website        │────▶│  MilesWeb       │
│  (Next.js)      │     │  (same API)     │
└─────────────────┘     └─────────────────┘
```

### What's Added
- Payment integration (Razorpay - one-time purchases)
- Watermarked PDF viewing (username + phone number)
- User purchase tracking

### Technology Stack
- **Backend**: Node.js with Express (on MilesWeb)
- **Database**: MySQL (MilesWeb MAX plan)
- **Payments**: Razorpay
- **Website**: Next.js (hosted on MilesWeb)

### Cost
- MilesWeb MAX plan (~₹500-1000/month)
- Razorpay fees (2% per transaction)

---

## Database Schema

### Tables (Supabase/MySQL)

```sql
-- Users (extends Supabase Auth)
profiles: id, phone, name, created_at

-- PDFs
pdfs: id, title, description, subject, author, price, is_free,
      cover_image_url, file_url, pages_count, tags, downloads, created_at, updated_at

-- Colleges
colleges: id, name, state, city, type, total_seats,
          tuition_fee_annual, hostel_fee_annual, other_charges,
          official_website, contact_phone, established_year,
          accreditation, facilities, image_url, created_at

-- Cutoffs
cutoffs: id, college_id, year, general_rank, obc_rank, sc_rank, st_rank, created_at

-- Purchases (Phase 2)
purchases: id, user_id, pdf_id, razorpay_order_id, amount, status, created_at
```

---

## Migration Path (Phase 1 → Phase 2)

1. **Keep same Razorpay** - works with both Supabase and Node.js
2. **Keep same app code** - just change API endpoint URL
3. **Database migration** - export PostgreSQL → import MySQL
4. **Backend functions → Express** - rewrite in Node.js
5. **Deploy React.js website** - uses same Node.js API

---

## Current Project Structure

```
neet-prep/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Bottom tab screens
│   │   ├── index.tsx      # Home (Featured + Recently Viewed)
│   │   ├── pdfs.tsx       # PDF listing with filters
│   │   ├── colleges.tsx   # College predictor
│   │   └── profile.tsx    # User profile
│   ├── college/[id].tsx   # College detail
│   └── pdf/[id].tsx       # PDF detail
├── backend/               # Backend code (future)
│   └── supabase/          # SQL migrations
├── lib/                   # Utilities
│   └── recentlyViewed.ts  # AsyncStorage for recently viewed
├── constants/
│   └── colors.ts          # Color constants
└── hooks/
    └── useFrameworkReady.ts
```

---

## Next Steps (MVP)

1. Set up Supabase project and configure tables
2. Add user authentication (phone OTP)
3. Test app with Supabase
4. Deploy to Play Store

Payment system will be added in Phase 2.