import { pgTable, text, serial, timestamp, integer, boolean, pgEnum, decimal } from "drizzle-orm/pg-core";

export const usersEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  role: usersEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  breed: text("breed"),
  dob: text("dob"),
  photoUrl: text("photo_url"),
  notes: text("notes"),
});

export const vaccinations = pgTable("vaccinations", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull().references(() => pets.id, { onDelete: "cascade" }),
  vaccineName: text("vaccine_name").notNull(),
  dateGiven: text("date_given").notNull(),
  nextDue: text("next_due"),
});

export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").references(() => pets.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  remindAt: timestamp("remind_at").notNull(),
  isSent: boolean("is_sent").default(false).notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  stock: integer("stock").default(0).notNull(),
  imageUrl: text("image_url"),
  active: boolean("active").default(true).notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending").notNull(),
  razorpayOrderId: text("razorpay_order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  qty: integer("qty").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  petId: integer("pet_id").references(() => pets.id),
  service: text("service").notNull(),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  status: text("status").default("pending").notNull(),
  notes: text("notes"),
});

export const listingsEnum = pgEnum("source", ["shop", "user"]);
export const listingsEnumApproval = pgEnum("is_approved", ["true", "false"]);

export const petListings = pgTable("pet_listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  source: listingsEnum("source").default("user").notNull(),
  breed: text("breed").notNull(),
  ageMonths: integer("age_months").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  showPrice: boolean("show_price").default(true).notNull(),
  description: text("description"),
  contactPhone: text("contact_phone").notNull(),
  isApproved: text("is_approved").default("false").notNull(),
  images: text("images").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adoptionInterests = pgTable("adoption_interests", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull().references(() => petListings.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").default("pending").notNull(), // pending, contacted, verified, rejected
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Pet = typeof pets.$inferSelect;
export type Vaccination = typeof vaccinations.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type PetListing = typeof petListings.$inferSelect;
export type AdoptionInterest = typeof adoptionInterests.$inferSelect;
export type OTP = typeof otps.$inferSelect;
