# PawStore — Product Audit & Product Plan (v2)

Date: 2026-09-12 · Basis: live app at localhost:3000 + full code trace + adversarial security/UX review

---

## 1. PRODUCT DIAGNOSIS

### What is genuinely good (verified, not assumed)

| Area | Evidence |
|---|---|
| Payment integrity | `/api/orders` recomputes totals server-side; `/api/orders/verify` decrements stock + increments coupon usage in one transaction; idempotent (re-verify returns `alreadyProcessed`); webhook endpoint exists for source-of-truth |
| Cart correctness | Server-side cart with guest `cart_token` adoption on login; prices never trusted from client |
| Listing moderation | Community listings cannot publish without admin approval; "Verified by our shop" vs "Community Listing" labels are enforced in data (`listingType`), not just CSS |
| Booking basics | Working hours, lead time, max advance, blockouts, service-species fit all validated server-side; admin can't accidentally break slot logic (no direct inserts) |
| Homepage hierarchy | Hero → 4 quadrant CTAs → categories → featured → pets → services → best sellers → trust → guides → FAQ → store card. Matches the brief's funnel. Verified rendering via live screenshot |

### What is broken or risky (found by adversarial review — 2 fixed today, 1 accepted-risk)

1. **[FIXED TODAY] Complete authentication bypass.** The app directory is `backend/app/`, so Next.js loads middleware only from `backend/middleware.ts`. The middleware lived at `src/middleware.ts` — dead code. Result verified on the live server: `GET /api/admin/stats` and `/api/admin/listings` returned **200 with no cookie**, and every route trusted a forgeable `x-user-id` header (`curl -H "x-user-id: 1" /api/admin/stats` → 200). Also `/account/*` pages were unguarded because `/account` was missing from the matcher. Fix: real root middleware that strips any incoming `x-user-id`, sets it only from a verified JWT, and hard-blocks `/api/admin/*` to role=admin. Re-tested: admin APIs 401, forged headers rejected, guest flows unaffected.
2. **[FIXED TODAY] Booking double-booking race.** The "double-booking safe" transaction was check-then-insert with no unique constraint — two concurrent requests could both win the same slot under READ COMMITTED. Fix: partial unique index `bookings_slot_unique ON bookings (booking_date, slot_time) WHERE status <> 'cancelled'` (applied to live DB + schema), with the DB violation mapped to a friendly 409 in the API.
3. **[ACCEPTED RISK] Guest checkout identity gap.** Guest orders have `userId = null` and `/api/orders/verify` only enforces ownership when the caller is signed in. A guest holding a Razorpay order id can't do damage beyond confirming their own payment (signature still required), but paid guest orders are unclaimable later — no way to attach them to an account. Mitigation for launch: capture guest email/phone on order (exists in address) and let account creation match by phone. Tracked in roadmap.

### What is missing (full list in §10)

The skeleton of every pillar exists; the **connective tissue of a pet-care ecosystem does not**: no real taxonomy (flat categories), no "shop by need", no reorder, no store-availability signal, no reminders, no personalization, no recently-viewed, SEO metadata on zero commercial pages, no admin "what needs my attention" surface (stats are only totals).

---

## 2. PRODUCT POSITIONING

> **The trusted pet-care destination for [city] — a real shop, online.**

Not a marketplace. Not a dropship catalog. The digital front door of a physical shop that: sells products (online + in-store), places pets responsibly (business-verified), moderates a community rehoming board, provides grooming services, and knows your pet by name.

Every feature must serve at least one of: **acquire · sell · book · place pets responsibly · retain · build trust · bring people to the store.** Features serving none are cut (see §11).

---

## 3. TARGET USERS

| User | Goal | Success metric |
|---|---|---|
| **Pet owner (Ritika, 32, labrador)** | Buy food/supplies fast; reorder | Reorder in ≤2 taps |
| **New pet parent (Arjun, 26, first puppy)** | "What does my puppy need?" | Guided checklist → first basket |
| **Service customer (Meera, 41, 2 cats)** | Book grooming, be remembered | Book in ≤3 steps; rebooking from history |
| **Pet buyer (families)** | See business's pets, trust health claims | Enquire CTA, verified badge understood |
| **Community seller (rehomer)** | List pet safely, be reviewed | Submit <5 min; clear status visibility |
| **Store visitor (walk-in)** | Check stock before visiting | See "available in store" per product |
| **Owner/staff (admin)** | Today's work in one screen | Action-queue dashboard; <1 min to confirm a booking / approve a listing |

---

## 4. SITEMAP

```
/                        Home (personalized when pets exist)
/shop                    Product listing (filters: pet, need, category, brand, price, life stage, availability, rating)
/shop/[slug]             Product detail (variants, reviews, related, FBT, store availability)
/c/[categorySlug]        Category landing (SEO)
/pets                    Explore pets (tabs: Our Pets | Community)
/pets/[slug]             Pet profile (enquiry CTA, report)
/sell-rehome             Listing submission (+ /sell-rehome/how-it-works explainer)
/services                Service discovery
/services/[slug]         Service detail → booking
/book/[serviceSlug]?     Unified booking wizard (pet → date → time → confirm)
/pet-care                Guides hub (categories: nutrition, grooming, training, health, breeds, new-pet)
/pet-care/[slug]         Article
/store                   Visit Our Store (address, map, hours, pickup, WhatsApp, in-store highlights)
/login · /account/*      Auth + account (dashboard, orders, bookings, listings, pets, wishlist, addresses, notifications, settings)
/legal/[slug]            Terms, privacy, shipping & returns, trust & safety
/admin/*                 Admin (see §8)
/checkout · /cart · /order/[id]/confirmation
/sitemap.xml · /robots.txt
```

---

## 5. NAVIGATION

**Desktop:** Logo · Shop (dropdown: Shop by Dog/Cat/Small Pet → top needs) · Pets · Services · Sell/Rehome · Pet Care · Store · [search 🔍 centered] · Wishlist · Cart · Account
**Mobile (bottom tab bar, thumb-zone):** Home · Shop · **Book** (center, accent) · Pets · Account. Sell/Rehome + Pet Care live in the account sheet and home page. Top bar: logo, search, cart.

Rationale: the five mobile actions match the brief; "Book" as the center action reflects the physical-shop business (bookings are the highest-margin retention loop).

---

## 6. PRODUCT TAXONOMY (Pet → Need → Category → Product)

Three pet types: **Dogs · Cats · Small Pets**. Two orthogonal facets: **Need** (job-to-be-done) and **Life Stage** (puppy/kitten · adult · senior, where applicable).

### Dogs
- **Food & Nutrition:** Dry · Wet · Puppy · Adult · Senior · Grain-free/Special · Veterinary diets
- **Treats:** Biscuits · Dental · Training · Meaty · Puppy
- **Toys:** Chew · Interactive/Puzzle · Plush · Fetch · Rope/Tug
- **Grooming & Hygiene:** Shampoo · Conditioner · Tools/Brushes · Wipes · Paw care · Deodorizing
- **Health & Wellness:** Supplements · Vitamins · Tick & flea · Dental care
- **Walk & Outdoor:** Collars · Harnesses · Leashes · Name tags
- **Beds & Comfort · Bowls & Feeding · Travel · Clothing & Accessories**

### Cats (own tree, never dog's)
- **Food:** Dry · Wet · Kitten · Adult · Senior · Special/Veterinary
- **Treats · Toys (+catnip) · Litter (+ trays, mats, deodorizers) · Scratchers & Trees · Grooming · Health & Wellness (+flea, dental) · Bowls · Carriers · Beds · Accessories**

### Small Pets
- **Food · Treats · Housing (cages/hutches) · Bedding · Hay & Chews · Toys · Accessories · Care**

### Shop by Need (cross-pet, for problem-first shoppers)
New Pet Essentials · Food & Nutrition · Grooming · Health & Wellness · Tick & Flea · Dental · Walk & Outdoor · Travel · Beds & Comfort · Toys & Play

Implementation note: current `categories` table is flat with a `petType` column — sufficient to model the tree via `parentId` (add one column) or via a `needs` mapping table. Seed data must be replaced with this taxonomy; products tagged with `petType`, `categoryId`, `lifeStage[]`, `needSlugs[]`.

---

## 7. USER JOURNEYS (target state)

1. **Shop (Ritika):** Home → Shop → filter Dog › Food › Adult → PDP → subscribe-or-once → checkout with saved address → tracked. *Reorder:* Account › Buy Again → one tap.
2. **New parent (Arjun):** Home banner "New puppy?" → New Pet Essentials need-page (curated checklist, bundles) → guide cross-links → first basket.
3. **Booking (Meera):** Services → Cat Grooming → pick saved pet → date strip → slots → confirm. Reminder notification T-24h. Rebook card on account home.
4. **Pet buyer:** Pets (Our Pets tab default) → pet profile with vaccination/temperament → **Enquire About This Pet** → prefilled inquiry → admin inbox → WhatsApp/call. Never a cart.
5. **Community seller:** Sell/Rehome → form with clear "reviewed within 24h, no guaranteed sale" copy → submit → status "Pending Review" visible in account → approved/rejected with reason.
6. **Store visitor:** PDP shows **"In stock at our store"** / pickup option → Store page → hours/map/WhatsApp.
7. **Reorder:** Account dashboard "Buy again" rail from `orderItems` history; PDP "Buy again" badge for previously purchased.

---

## 8. ADMIN JOURNEYS

**Admin home = Today Queue:** bookings today (confirm/no-show), listings awaiting review (approve/reject+reason), new inquiries (reply), orders to process (paid→shipped), low stock, recent reviews to moderate. One screen, every row actionable inline.

Workflows wired to real operations:
- **Order received:** notification + queue → staff marks packed/shipped/delivered → customer notified each step.
- **Booking:** pending → confirmed (slot locked) → completed/no-show; cancellable with reason; reschedule = cancel+create with fee rule later.
- **Listing approval:** side-by-side photos/health claims → approve/reject with mandatory reason → seller notified; suspend at any time.
- **Inventory:** decrement on payment (done), manual adjust + audit note; low-stock threshold per product; CSV import later.
- **Customers:** profile with LTV = orders + bookings; block/spam toggle.
- **Content:** guides CRUD, homepage banners, FAQs (exists), category/need management (needs UI).

---

## 9. DESIGN RECOMMENDATIONS

Verified via live screenshots — overall direction is warm/correct (teal+amber, rounded cards, pet-friendly). Changes needed to feel premium rather than generic:

1. **Typography personality:** current geometric sans everywhere is fine but flat. Add a warm display face for headings (e.g. Plus Jakarta/Bricolage) over Inter for body; tighten hero letterspacing.
2. **Badge system unification:** one `Badge` component — Verified (solid green), Community (outline), Sale (amber), New, Low stock. Currently sale/discount labels are ad-hoc spans.
3. **Card discipline:** single ProductCard + PetCard with identical padding/radius/shadow tokens; some sections differ today.
4. **Color tokens:** commit to CSS variables (`--brand`, `--brand-soft`, `--accent`, `--ink`, `--paper`); today several hex literals drift.
5. **Imagery ratio lock:** product images 1:1, pet portraits 4:5, guides 16:9 — `next/image` with fixed aspect wrappers (also fixes today's `fill` warnings).
6. **Empty/loading/error states:** standardized (illustration + one line + CTA). Several lists currently blank-stare when empty.
7. **Forms:** shared input/error pattern; booking + sell-rehome + contact should feel like one family.
8. **Motion restraint:** only hover lift + skeleton shimmer; no parallax/counters.

Avoid: cartoon clip-art, gradient soup, generic SaaS dashboard look in admin (aim "calm operations console").

---

## 10. WHAT YOUR CURRENT APP IS MISSING

### Critical (before launch)
1. **Real taxonomy + seed replacement** (flat categories can't express Pet→Need→Category; shop-by-need impossible) — drives nav, filters, SEO.
2. **SEO metadata on all commercial pages** — shop, PDP, pets, pet profile, services, service detail have none (verified: only about/legal/auth have metadata). Titles/descriptions/OG/canonical + JSON-LD (Product, Offer, LocalBusiness, PetStore, Article).
3. **Admin Today Queue** — stats page has totals but not "what needs my attention"; staff can't operate from it.
4. **Reorder / Buy Again** — no route or UI; retention loop #1 for a shop.
5. **Store availability & pickup signal** on PDP (schema has no store-stock concept; physical-shop story is invisible where it matters most).
6. **Search UX** — search exists as a query param but no autocomplete dropdown, zero-results guidance, or cross-type results presentation (products/pets/services/guides).

### Important (fast follow)
7. Reminders engine: grooming follow-up (T+21d), vaccination due (from pet profile), booking T-24h — cron + notifications table (already exists).
8. Personalized account/home: greeting with pet, next booking, buy-again rail, recommended (simple rules first).
9. Recently viewed (cookie/localStorage is enough to start).
10. Guest-order claiming by phone on signup (closes today's accepted risk).
11. Reviews: moderation exists; add verified-purchase badge + rating filter on PLP (rating data is displayed but not filterable).
12. Banners/promos UI on storefront (admin CRUD exists; homepage renders only FAQs).
13. WhatsApp deep-links everywhere (already used in footer — extend to order/booking confirmations).

### Enhancement (phase 2+)
Loyalty points, subscriptions (food auto-ship), referral, advanced pet health records, breed guides content program, analytics dashboards beyond basics, shipping partner integration, multi-store.

### Remove
Legacy `supportTickets` remnants are already gone. Nothing else warrants removal; the codebase is lean.

### Rework (exists but poorly designed)
- Admin stats → action-queue-first (above).
- Categories admin → tree management with needs mapping.
- Homepage FAQ/banners static → settings-driven (backend ready).
- `next/image` warnings (priority + aspect wrappers) — cosmetic but signals polish.

---

## 11. FEATURE PRIORITIZATION

**MUST (launch):** taxonomy + shop-by-need · SEO pack · admin Today Queue · reorder · store-availability badge + Store page polish · search autocomplete · reminders (booking T-24h at minimum) · guest-order claiming · state polish (empty/loading/error).
**SHOULD (30 days):** personalization rails · reviews enhancement · banners on storefront · recently viewed · WhatsApp notifications via provider.
**NICE (60–90):** subscriptions · loyalty · referral · advanced analytics.
**FUTURE:** AI recommendations · personalized nutrition · CRM · membership.

Explicitly rejected (fails the business question §MOST-IMPORTANT): gamification, social feed, chat rooms, multi-vendor marketplace tools, ad system.

---

## 12. EXISTING CODE AUDIT (keep / improve / replace / remove)

| Module | Verdict |
|---|---|
| Auth (OTP + JWT) | **Keep** (DB-backed OTP, rate limits, dev-OTP guard are right); add phone-based guest-order claiming |
| Middleware (new root) | **Keep** — today's fix is the identity contract; add integration test |
| Schema | **Improve** — add `parentId`/`needs` to categories, `lifeStage[]`, `storeStock`, `productViews` (recently-viewed), reminder fields on pets; keep everything else |
| Orders/payments/webhook | **Keep** — verified transactional + idempotent |
| Bookings | **Keep** — now race-safe; add reschedule + reminder cron |
| Pet listings + moderation | **Keep** |
| Cart | **Keep** |
| Categories API | **Replace** seed data + extend model (tree/needs) |
| Home API | **Improve** — add personalized rails, banners, reorder hint |
| Storefront pages | **Improve** per §9; add metadata to all (§10-2) |
| `src/` stragglers | Components/db/libs correctly live in `src/`; only middleware needed the move (done). Delete nothing else today |

---

## 13. IMPLEMENTATION ROADMAP

**Sprint 1 (launch-blocking):**
1. Taxonomy migration + reseed (tree categories, needs, life stages) + PLP filters + category landing pages.
2. SEO pack: metadata + OG + JSON-LD on shop/PDP/pets/pet profile/services/guides; sitemap completeness.
3. Admin Today Queue (replaces stats landing) + inline actions.
4. Buy Again rail (account + PDP badge) + reorder-to-cart API.
5. Store availability: `storeStock` on products, PDP badge, Store page polish, pickup note at checkout.
6. Search autocomplete overlay (products/pets/services/guides, debounced).
7. Booking reminder cron (T-24h) + guest-order phone claiming.
8. State polish pass (skeletons/empty/errors) + image aspect fixes.

**Sprint 2 (30d):** personalization (greeting, next booking, recommendations) · reviews verified-purchase + rating filter · banners on storefront · recently viewed · WhatsApp notify provider.
**Sprint 3 (60–90d):** subscriptions, loyalty, referral, analytics v2.

**Definition of done per feature:** server-side validation · ownership checks · notification emitted · empty/loading/error states · mobile check at 360px · metadata where public.

---

## DECISIONS LOCKED (owner, 2026-09-12)

1. **Store availability = separate `storeStock` count** per product (not shared inventory). PDP shows In stock at our store / Low stock / Online only; admin manages store stock per item; checkout offers pickup only when `storeStock > 0`.
2. **Community listings = one flow with an intent field** — `for sale` or `for adoption`. Same submission/moderation flow; adoption listings render "Free to good home" instead of price and keep the enquiry-first CTA.

## APPENDIX — Live verification log (today)

- `GET /api/admin/stats` unauth → was **200 (critical)** → now **401** ✔
- `GET /api/admin/listings` with forged `x-user-id: 1` → was **200** → now **401** ✔
- `/admin`, `/account/orders` unauth → **307 → login** ✔ (was 200)
- `POST /api/notifications` with forged header → **401** ✔
- Guest flows re-tested green: products, pet-listings, cart, slots, inquiry submit, webhook-unconfigured path ✔
- Booking slot uniqueness: DB index live; API maps 23505 → 409 friendly message ✔
- `tsc --noEmit` clean ✔; preview console shows no new errors ✔
