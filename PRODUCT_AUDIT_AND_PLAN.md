# PawStore → Pet-Care Ecosystem: Audit & Implementation Plan

## 1. Audit Summary (existing codebase)

**Stack:** Next.js 14 App Router (frontend + API in one app), Neon Postgres + Drizzle ORM, JWT (jose) httpOnly cookies, phone-OTP auth, Cloudinary uploads, Razorpay payments, Tailwind CSS 4, Flutter mobile app consuming the same API.

### What works
- Phone OTP login → JWT cookie; middleware guards `/admin`, `/dashboard`, `/api/*`; roles `user`/`admin`
- Products CRUD (admin), product list API with category/search/price filters
- localStorage cart → order creation → Razorpay order → signature-verified payment confirmation
- Addresses CRUD, coupons API (validated, applied in checkout UI)
- Personal pet profiles (name/species/breed/age/weight/photo)
- Support tickets with admin replies, blogs with categories, admin dashboard stats
- Cloudinary upload endpoint with dev fallback

### Problems found (what / why / fix)

| # | Problem | Why it matters | Fix |
|---|---|---|---|
| 1 | Hardcoded master OTP `123456` in verify-otp | Anyone can log in as any account incl. admin. Critical hole. | Remove; DB-backed OTP; rate-limit verify |
| 2 | `POST /api/orders` ignores coupon/address/shipping/tax | UI shows discounted total; DB stores full total. Money-integrity bug | Recompute server-side; persist all components |
| 3 | No stock validation/decrement | Overselling; inventory drift | Transactional check + decrement on payment success |
| 4 | `/api/orders/verify` no ownership check; no payments table, no webhook | Wrong-user confirmation; lost callbacks | Ownership check, payments table, Razorpay webhook |
| 5 | Cart & wishlist only in localStorage | Guest loss, fake wishlist, stale prices | Server cart (guest+user), wishlist table |
| 6 | Two middleware files; only `src/middleware.ts` is active | Dead code misleads audits | Delete dead one |
| 7 | `otps` table defined but unused; in-memory OTP store | OTPs vanish on serverless cold start | Persist OTPs |
| 8 | No product detail page, services, bookings, pet marketplace, notifications, settings, search, SEO | Core of target product | Build (Phase 1) |
| 9 | Reviews auto-published, no moderation | Trust risk | Moderation status + admin queue |
| 10 | Homepage hardcodes brands/FAQs/reviews; fake "originalPrice" computed client-side (+25%) | Misleading pricing = legal/trust problem; unmanageable content | DB-driven data, real prices |
| 11 | Order status vocabulary inconsistent | Broken tracking UX | Canonical enum |
| 12 | Dashboard links to `/dashboard/bookings` which doesn't exist | Dead nav | Implement bookings |

## 2. Feature mapping

| Existing Feature | Verdict | Notes |
|---|---|---|
| OTP auth, JWT cookies, middleware guards | Keep | Remove master OTP; DB OTPs; rate-limit |
| Products API + admin CRUD | Improve | categories/brands entities, galleries, variants, specs, featured flags |
| Product list filters | Improve | pet type, brand, availability, sort, pagination |
| Razorpay integration | Improve | payments table, webhook, ownership, transactional stock |
| Coupons | Improve | server-side application; admin CRUD |
| Addresses | Keep | snapshot on orders |
| Personal pet profiles | Keep | extend fields |
| Support tickets | Replace | generalized Inquiries |
| Blogs | Keep | SEO metadata |
| Admin dashboard | Improve | bookings, moderation, inquiries, reviews queues |
| Flutter app | Keep | additive API changes |
| Cart (localStorage) | Replace | server cart with guest support |
| Reviews | Improve | moderation |
| Services/Bookings | Missing | full build |
| Business pet listings | Missing | full build |
| Community listings + moderation | Missing | full build |
| Wishlist, Notifications, Settings, Search, SEO | Missing | full build |

## 3. Sitemap (Phase 1)

```
/                        Home
/shop                    Product listing (pet type, category, brand, price, availability, sort)
/shop/[slug]             Product detail (+related, frequently bought together)
/cart                    Cart
/checkout                Address → Delivery → Payment
/order/[id]/confirmation Order confirmation & tracking
/pets                    Explore Pets (Business-verified | Community tabs)
/pets/[slug]             Pet profile page (enquiry CTA, report)
/sell-rehome             Sell/Rehome submission (moderated)
/services                Services directory
/services/[slug]         Service detail
/services/[slug]/book    Booking flow (pet → date → slot → confirm)
/pet-care                Content hub
/pet-care/[slug]         Article
/about · /contact        Business info + inquiry form
/login                   OTP login
/account/*               Dashboard, pets, orders, bookings, listings, wishlist, addresses, notifications, settings
/legal/*                 Terms, privacy, shipping, refund policies
/admin/*                 Dashboard, products, orders, pets, listings, bookings, services, inquiries, customers, reviews, coupons, content, settings
```

## 4. Core user journeys

**Shop:** Home → filtered listing → product page (real prices/stock) → server cart → checkout (address, delivery, coupon) → Razorpay → confirmation/tracking.

**Pet enquiry:** Explore Pets (clearly split Business-Verified vs Community) → pet profile → Enquire → inquiry thread → admin response.

**Rehome:** Sell/Rehome form (moderation notice) → Pending Review → admin approves/rejects → published Community Listing → Adopted/Sold transitions.

**Book service:** Services → service → My Pet (or add) → date → conflict-free slot → confirm (deposit if required) → status updates + reminders.

## 5. Admin journey

Daily: Dashboard → moderate listings → manage bookings → answer inquiries → process orders. Weekly: products/inventory, coupons, reviews, content, settings.

## 6. Entity model

`users · addresses · categories · brands · products · product_images · product_variants · carts · cart_items · coupons · orders · order_items · payments · services · service_bookings · pets (personal) · pet_listings · listing_media · listing_vaccinations · inquiries · inquiry_messages · wishlist · notifications · reviews · blog_categories · blogs · site_settings · banners · otps · audit_log`

## 7. Key workflows

- Order: cart → server-computed totals (coupon validated server-side) → Razorpay order → signature verify (ownership-checked) → payment row + status paid → stock decrement transactionally → webhook as source of truth.
- Booking: slot availability = working hours − blockouts − existing bookings; claim in transaction; statuses pending→confirmed→completed/cancelled/no-show.
- Listing: submit → pending_review → approved/rejected(reason) → sold/adopted/closed; community listings never marked verified.
- Inquiries: type + related entity + thread; guest contact allowed.
- Notifications: rows generated on order/booking/listing/inquiry events.

## 8. Phases

- **Phase 1 (this implementation):** commerce, pets marketplace + moderation, services/bookings, inquiries, notifications, admin, settings, SEO.
- **Phase 2:** loyalty, subscriptions/repeat ordering, advanced pet health records, offers engine.
- **Phase 3:** AI recommendations, personalized nutrition, CRM, membership.
