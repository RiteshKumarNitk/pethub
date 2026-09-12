# PawStore 🐾

A production pet-care platform — not just an ecommerce store. PawStore combines a pet products shop, a **business-verified & community pet marketplace**, **service bookings**, customer **pet profiles**, inquiries, and a full **admin panel** with moderation workflows, built for a physical pet-care shop.

## Product Areas

| Area | What it does |
|---|---|
| **Shop** | Products with categories/brands/variants, server-side cart (guest + user), coupons, Razorpay checkout, order tracking |
| **Pets** | Explore pets with two clearly distinguished listing types: **Business-verified** (from the shop) and **Community** (user-submitted, admin-moderated) |
| **Sell / Rehome** | Customer listing submission → mandatory admin review → published |
| **Services & Bookings** | Grooming/care services with conflict-free slot booking, blockouts, working hours, deposits |
| **My Pets** | Customer pet profiles with vaccinations & grooming notes (used for one-tap bookings) |
| **Account** | Orders, bookings, listings, wishlist, addresses, notifications, settings |
| **Inquiries** | Unified contact system for pets/products/services/general with admin thread replies |
| **Admin** | Dashboard with action queues, listing moderation, bookings calendar, services CRUD, inquiries inbox, reviews moderation, coupons, banners/FAQs, site settings |

## Tech Stack

- **Next.js 14 (App Router)** — frontend + API routes in one deployable app
- **Neon Postgres + Drizzle ORM**
- **Auth**: phone OTP (DB-backed, rate-limited) → JWT httpOnly cookie
- **Payments**: Razorpay (order + signature verify + webhook as source of truth)
- **Uploads**: Cloudinary (with dev fallback)
- **Flutter app** in `flutter_app/` consumes the same API

## Project Structure

```
backend/
├── app/
│   ├── (main)/        # Storefront: shop, pets, services, account, pet-care, legal…
│   ├── (admin)/       # Admin panel
│   ├── (auth)/        # Login
│   └── api/           # REST API
├── src/
│   ├── components/    # Shared UI components
│   ├── db/            # Drizzle schema, client, seed
│   └── lib/           # auth, settings, notifications, utils, razorpay…
└── flutter_app/       # Mobile app (same API)
```

## Setup

```bash
cd backend
npm install
cp .env.example .env.local   # fill in DATABASE_URL, JWT_SECRET, Razorpay keys…
npm run db:push              # push schema to Neon
npm run db:seed              # seed admin, categories, products, services, pets…
npm run dev                  # http://localhost:3000
```

### Roles & access

- **Customer**: `/login` (phone OTP) → `/account`
- **Admin**: seed phone `+911234567890` → `/admin`
- In development the OTP is returned in the send-otp response and logged to the console (no master OTP exists — OTPs are DB-backed with attempt limits and rate limiting).

## Key API Endpoints

### Auth
`POST /api/auth/send-otp` · `POST /api/auth/verify-otp` · `POST /api/auth/logout` · `GET|PUT /api/mobile/me`

### Catalog
`GET /api/products` (filters: category, petType, brand, search, price, inStock, sort) · `GET /api/products/[id|slug]` · `GET /api/categories`

### Cart & Orders
`GET|POST|PUT|DELETE /api/cart` · `POST /api/orders` · `POST /api/orders/verify` · `POST /api/webhooks/razorpay` · `GET|DELETE /api/orders`

### Pets marketplace
`GET /api/pet-listings` (public, approved only) · `GET /api/pet-listings/[slug]` · `POST /api/pet-listings/submit` · `GET|DELETE /api/pet-listings/mine` · `POST /api/pet-listings/report`

### Services & bookings
`GET /api/services` · `GET /api/services/[slug]` · `GET /api/bookings/slots?date=` · `GET|POST /api/bookings` · `DELETE /api/bookings/[id]`

### Misc
`GET|POST /api/inquiries` · `GET|POST /api/wishlist` · `GET|POST /api/notifications` · `POST /api/upload` · `GET /api/home`

### Admin (`/api/admin/*`, admin role required)
`stats` · `listings` (moderation) · `bookings` (+blockouts) · `services` · `inquiries` · `reviews` · `coupons` · `categories` · `banners` · `settings`

## Trust & Safety Model

- **Business listings** are created by admins and marked `Verified by our shop`
- **Community listings** always start as `pending_review` and are never auto-published; rejected listings show the reason to the owner
- Listing lifecycle: `draft → pending_review → approved → sold/adopted/closed` (+ `rejected`, `suspended`)
- Report endpoint with rate limiting and auto-suspension after repeated reports
- All order totals, coupons and stock are computed server-side; payments are verified by signature + webhook

## Documentation

See [PRODUCT_AUDIT_AND_PLAN.md](./PRODUCT_AUDIT_AND_PLAN.md) for the full audit of the original codebase, feature mapping, and the phase roadmap (Phase 2: loyalty, subscriptions, advanced records; Phase 3: AI, CRM).
