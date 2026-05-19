# PawStore 🐾

A full-stack pet e-commerce platform for premium pet food, accessories, and care products, with expert pet care guides. Built with Next.js backend and Flutter mobile app.

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

### Seed Data

```bash
npm run db:seed
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

### Run App

```bash
flutter run
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP, returns JWT

### Products
- `GET /api/products` - List products (optional `?category=`)
- `GET /api/products/[id]` - Product details

### Orders
- `GET /api/orders` - User's order history
- `POST /api/orders` - Create order with Razorpay
- `POST /api/orders/verify` - Verify Razorpay payment

### Blog
- `GET /api/blogs` - Published blog posts
- `GET /api/blogs/[slug]` - Single blog post

### Home
- `GET /api/home` - Featured products

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





Admin credentials:
- 
Phone: +911234567890
- 
OTP: 123456 (master dev OTP)
Login at /login, then access /admin.