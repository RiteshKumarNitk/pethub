import { pgTable, text, serial, timestamp, integer, boolean, decimal, jsonb, index, uniqueIndex, time } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============ USERS & AUTH ============

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  email: text("email"),
  role: text("role").default("user").notNull(), // user | admin
  isBlocked: boolean("is_blocked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").default("Home").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  street: text("street").notNull(),
  landmark: text("landmark"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  otp: text("otp").notNull(),
  name: text("name"),
  attempts: integer("attempts").default(0).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ CATALOG ============

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  petType: text("pet_type").default("all").notNull(), // dog | cat | small_pet | all
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  mrp: decimal("mrp", { precision: 10, scale: 2 }),
  categoryId: integer("category_id").references(() => categories.id),
  brandId: integer("brand_id").references(() => brands.id),
  petType: text("pet_type").default("all").notNull(),
  stock: integer("stock").default(0).notNull(),
  lowStockThreshold: integer("low_stock_threshold").default(5).notNull(),
  imageUrl: text("image_url"),
  specifications: jsonb("specifications").$type<Record<string, string>>().default({}),
  weightGrams: integer("weight_grams"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isBestSeller: boolean("is_best_seller").default(false).notNull(),
  taxRatePercent: decimal("tax_rate_percent", { precision: 5, scale: 2 }).default("0"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("products_category_idx").on(table.categoryId),
  brandIdx: index("products_brand_idx").on(table.brandId),
  petTypeIdx: index("products_pet_type_idx").on(table.petType),
}));

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g. "2kg", "Large", "Chicken"
  priceDelta: decimal("price_delta", { precision: 10, scale: 2 }).default("0").notNull(),
  stock: integer("stock").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
});

// ============ CART (server-side, guest + user) ============

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  guestToken: text("guest_token").unique(),
  couponId: integer("coupon_id").references(() => coupons.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("carts_user_idx").on(table.userId),
}));

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  cartId: integer("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  qty: integer("qty").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ COUPONS ============

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountPercent: integer("discount_percent").default(0),
  discountFlat: decimal("discount_flat", { precision: 10, scale: 2 }).default("0"),
  maxDiscount: decimal("max_discount", { precision: 10, scale: 2 }),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }).default("0"),
  maxUses: integer("max_uses").default(0),
  usedCount: integer("used_count").default(0).notNull(),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ ORDERS & PAYMENTS ============

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(), // e.g. PS-2025-000123
  userId: integer("user_id").references(() => users.id),
  // Snapshot of items' pricing
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  shippingFee: decimal("shipping_fee", { precision: 10, scale: 2 }).default("0").notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  couponId: integer("coupon_id").references(() => coupons.id),
  couponCode: text("coupon_code"),
  // Address snapshot
  shippingAddress: jsonb("shipping_address").$type<{
    fullName?: string; phone?: string; label?: string; street: string; landmark?: string;
    city: string; state: string; zip: string;
  }>(),
  status: text("status").default("pending").notNull(), // pending | paid | processing | shipped | delivered | cancelled
  paymentStatus: text("payment_status").default("unpaid").notNull(), // unpaid | paid | failed | refunded
  paymentMethod: text("payment_method").default("razorpay"),
  razorpayOrderId: text("razorpay_order_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("orders_user_idx").on(table.userId),
  statusIdx: index("orders_status_idx").on(table.status),
}));

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  variantId: integer("variant_id").references(() => productVariants.id),
  productName: text("product_name").notNull(),
  variantName: text("variant_name"),
  imageUrl: text("image_url"),
  qty: integer("qty").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  bookingId: integer("booking_id"),
  provider: text("provider").default("razorpay").notNull(),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("created").notNull(), // created | captured | failed | refunded
  raw: jsonb("raw"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  rzpOrderIdx: index("payments_rzp_order_idx").on(table.razorpayOrderId),
}));

// ============ PERSONAL PETS (customer profiles) ============

export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  species: text("species").notNull(), // Dog | Cat | Bird | Small Pet | Other
  breed: text("breed"),
  gender: text("gender"), // male | female
  birthDate: text("birth_date"), // ISO date
  ageYears: integer("age_years"),
  weightKg: decimal("weight_kg", { precision: 5, scale: 1 }),
  imageUrl: text("image_url"),
  vaccinations: jsonb("vaccinations").$type<{ name: string; date: string; nextDue?: string }[]>().default([]),
  medicalNotes: text("medical_notes"),
  groomerNotes: text("groomer_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============ PET MARKETPLACE LISTINGS ============

export const petListings = pgTable("pet_listings", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  listingType: text("listing_type").notNull(), // business | community
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }), // null for business listings
  name: text("name").notNull(),
  species: text("species").notNull(), // Dog | Cat | Bird | Small Pet | Other
  breed: text("breed"),
  gender: text("gender"), // male | female
  ageMonths: integer("age_months"),
  ageText: text("age_text"),
  color: text("color"),
  size: text("size"), // small | medium | large
  price: decimal("price", { precision: 10, scale: 2 }),
  priceType: text("price_type").default("fixed").notNull(), // fixed | negotiable | free | adoption_fee
  city: text("city"),
  state: text("state"),
  description: text("description"),
  temperament: text("temperament"),
  healthInfo: text("health_info"),
  vaccinated: boolean("vaccinated").default(false).notNull(),
  vaccinationDetails: text("vaccination_details"),
  videoUrl: text("video_url"),
  // Moderation lifecycle
  status: text("status").default("draft").notNull(), // draft | pending_review | approved | rejected | sold | adopted | closed | suspended
  moderationNote: text("moderation_note"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  isVerified: boolean("is_verified").default(false).notNull(), // business listings verified by the shop
  featured: boolean("featured").default(false).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  reportCount: integer("report_count").default(0).notNull(),
  // Seller contact preference for community listings
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactPreference: text("contact_preference").default("whatsapp").notNull(), // whatsapp | call | email | platform
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("pet_listings_status_idx").on(table.status),
  typeIdx: index("pet_listings_type_idx").on(table.listingType),
  ownerIdx: index("pet_listings_owner_idx").on(table.ownerId),
}));

export const listingMedia = pgTable("listing_media", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => petListings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: text("type").default("image").notNull(), // image | video
  alt: text("alt"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const listingReports = pgTable("listing_reports", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => petListings.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").default("open").notNull(), // open | resolved | dismissed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ SERVICES & BOOKINGS ============

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  longDescription: text("long_description"),
  imageUrl: text("image_url"),
  durationMinutes: integer("duration_minutes").default(60).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  priceNote: text("price_note"), // e.g. "starting at, by pet size"
  petTypes: jsonb("pet_types").$type<string[]>().default(["dog", "cat"]).notNull(),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  requiresDeposit: boolean("requires_deposit").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  bookingRef: text("booking_ref").notNull().unique(), // e.g. BK-000123
  userId: integer("user_id").references(() => users.id),
  serviceId: integer("service_id").notNull().references(() => services.id),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "set null" }),
  // Pet snapshot (works even if pet profile deleted / guest booking)
  petName: text("pet_name").notNull(),
  petSpecies: text("pet_species").notNull(),
  petBreed: text("pet_breed"),
  petNotes: text("pet_notes"),
  bookingDate: text("booking_date").notNull(), // ISO date
  slotTime: time("slot_time").notNull(), // HH:MM
  status: text("status").default("pending").notNull(), // pending | confirmed | completed | cancelled | no_show
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  notes: text("notes"),
  adminNotes: text("admin_notes"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  depositPaid: boolean("deposit_paid").default(false).notNull(),
  paymentStatus: text("payment_status").default("unpaid").notNull(), // unpaid | paid | refunded
  razorpayOrderId: text("razorpay_order_id"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("bookings_date_idx").on(table.bookingDate),
  userIdx: index("bookings_user_idx").on(table.userId),
  statusIdx: index("bookings_status_idx").on(table.status),
}));

export const bookingBlockouts = pgTable("booking_blockouts", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // ISO date
  slotTime: time("slot_time"), // null = whole day blocked
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  dateIdx: index("blockouts_date_idx").on(table.date),
}));

// ============ INQUIRIES (unified contact system) ============

export const inquiries = pgTable("inquiries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: text("type").notNull(), // pet | product | service | booking | general
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  // Related entity
  relatedListingId: integer("related_listing_id").references(() => petListings.id, { onDelete: "set null" }),
  relatedProductId: integer("related_product_id").references(() => products.id, { onDelete: "set null" }),
  relatedServiceId: integer("related_service_id").references(() => services.id, { onDelete: "set null" }),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  status: text("status").default("open").notNull(), // open | responded | closed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inquiryMessages = pgTable("inquiry_messages", {
  id: serial("id").primaryKey(),
  inquiryId: integer("inquiry_id").notNull().references(() => inquiries.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(), // customer | admin
  senderName: text("sender_name"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ WISHLIST ============

export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userProductIdx: uniqueIndex("wishlist_user_product_idx").on(table.userId, table.productId),
}));

// ============ NOTIFICATIONS ============

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // order | booking | listing | inquiry | system
  title: text("title").notNull(),
  body: text("body").notNull(),
  link: text("link"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("notifications_user_idx").on(table.userId),
}));

// ============ REVIEWS ============

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  targetType: text("target_type").notNull(), // product | service
  targetId: integer("target_id").notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  comment: text("comment"),
  status: text("status").default("pending").notNull(), // pending | approved | rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  targetIdx: index("reviews_target_idx").on(table.targetType, table.targetId),
}));

// ============ CONTENT ============

export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

export const blogs = pgTable("blogs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  categoryId: integer("category_id").references(() => blogCategories.id),
  authorId: integer("author_id").references(() => users.id),
  thumbnailUrl: text("thumbnail_url"),
  readMinutes: integer("read_minutes").default(4).notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  ctaLabel: text("cta_label"),
  ctaLink: text("cta_link"),
  imageUrl: text("image_url"),
  placement: text("placement").default("hero").notNull(), // hero | strip | promo
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").default("general").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
});

// ============ SITE SETTINGS (key/value) ============

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============ AUDIT LOG ============

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  actorId: integer("actor_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  pets: many(pets),
  orders: many(orders),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  images: many(productImages),
  variants: many(productVariants),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const cartsRelations = relations(carts, ({ many, one }) => ({
  items: many(cartItems),
  user: one(users, { fields: [carts.userId], references: [users.id] }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const petsRelations = relations(pets, ({ one }) => ({
  user: one(users, { fields: [pets.userId], references: [users.id] }),
}));

export const petListingsRelations = relations(petListings, ({ many, one }) => ({
  media: many(listingMedia),
  owner: one(users, { fields: [petListings.ownerId], references: [users.id] }),
}));

export const listingMediaRelations = relations(listingMedia, ({ one }) => ({
  listing: one(petListings, { fields: [listingMedia.listingId], references: [petListings.id] }),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
  pet: one(pets, { fields: [bookings.petId], references: [pets.id] }),
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
}));

export const inquiriesRelations = relations(inquiries, ({ many }) => ({
  messages: many(inquiryMessages),
}));

export const inquiryMessagesRelations = relations(inquiryMessages, ({ one }) => ({
  inquiry: one(inquiries, { fields: [inquiryMessages.inquiryId], references: [inquiries.id] }),
}));

export const blogsRelations = relations(blogs, ({ one }) => ({
  category: one(blogCategories, { fields: [blogs.categoryId], references: [blogCategories.id] }),
  author: one(users, { fields: [blogs.authorId], references: [users.id] }),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  blogs: many(blogs),
}));

// ============ TYPES ============

export type User = typeof users.$inferSelect;
export type Address = typeof addresses.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Pet = typeof pets.$inferSelect;
export type PetListing = typeof petListings.$inferSelect;
export type ListingMedia = typeof listingMedia.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type InquiryMessage = typeof inquiryMessages.$inferSelect;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Blog = typeof blogs.$inferSelect;
export type BlogCategory = typeof blogCategories.$inferSelect;
export type Banner = typeof banners.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
