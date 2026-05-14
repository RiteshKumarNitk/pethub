# Pet Hub

A full-stack pet platform with Next.js backend and Flutter mobile app.

## Project Structure

```
├── backend/          # Next.js 14 API backend
├── flutter_app/     # Flutter mobile app
├── README.md
```

## Backend Setup

### Prerequisites
- Node.js 18+
- Neon Postgres account
- Razorpay account
- Cloudinary account
- Twilio or MSG91 account for SMS OTP

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

### Database Migrations

Generate and push migrations to Neon:

```bash
npm run db:generate
npm run db:push
```

### Run Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Flutter App Setup

### Prerequisites
- Flutter 3.2+
- Android Studio / Xcode

### Installation

```bash
cd flutter_app
flutter pub get
```

### Environment Variables

Create `lib/config/env.dart` or use `--dart-define` flags:
- `NEXT_PUBLIC_API_URL` - Your backend API URL
- `RAZORPAY_KEY_ID` - Your Razorpay key
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_UPLOAD_PRESET` - Cloudinary upload preset

### Run App

```bash
flutter run
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP, returns JWT

### Pets
- `GET /api/pets` - List user's pets
- `POST /api/pets` - Create pet
- `GET /api/pets/[id]` - Pet details with vaccinations
- `POST /api/pets/[id]/vaccinations` - Add vaccination

### Products
- `GET /api/products` - List products (optional `?category=`)
- `GET /api/products/[id]` - Product details

### Orders
- `GET /api/orders` - User's order history
- `POST /api/orders` - Create order
- `POST /api/orders/verify` - Verify Razorpay payment

### Bookings
- `GET /api/bookings` - User's bookings
- `POST /api/bookings` - Create booking, returns WhatsApp deeplink

### Listings
- `GET /api/listings` - Approved pet listings
- `POST /api/listings` - Submit listing
- `PATCH /api/admin/listings/[id]` - Admin: approve/reject

### Home
- `GET /api/home` - Featured products + shop pets

## Key Rules

1. **No buy buttons for pets** - Only "Request Adoption" via WhatsApp
2. **Listings require approval** - `is_approved=false` by default
3. **Shop listings first** - `source='shop'` appears before `source='user'`
4. **Bookings via WhatsApp** - No calendar API in v1
5. **No in-app chat** - All communication via WhatsApp deeplinks
6. **Admin role required** - Admin routes check `role='admin'` from JWT

## Tech Stack

### Backend
- Next.js 14 (App Router)
- Neon Postgres (serverless)
- Drizzle ORM
- JWT Auth (jose)
- Cloudinary (image uploads)
- Razorpay (payments)
- Twilio/MSG91 (SMS OTP)

### Mobile App
- Flutter 3.2+
- Riverpod (state management)
- Dio (HTTP client)
- go_router (navigation)
- flutter_secure_storage (token storage)
- Razorpay SDK (checkout)
