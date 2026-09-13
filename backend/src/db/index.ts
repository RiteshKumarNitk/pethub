import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * DB client selection:
 * - Default: node-postgres driver (full SQL support incl. TRANSACTIONS — required
 *   by checkout, payment verification, webhook capture and booking creation).
 * - If a platform blocks raw TCP to Postgres (e.g. Vercel + Neon), set
 *   DB_DRIVER=neon-http. That driver does NOT support db.transaction(); the
 *   four transactional call-sites (orders create/verify, webhook, bookings)
 *   must be ported off transactions before using that target in production.
 * - No DATABASE_URL (e.g. `next build` page-data collection): a client wired to
 *   a placeholder URL that only throws when actually used.
 */
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return drizzleNode(new Pool({ connectionString: "postgresql://placeholder:placeholder@localhost:5432/placeholder" }), { schema });
  }
  if (process.env.DB_DRIVER === "neon-http") {
    return drizzleHttp(neon(connectionString), { schema });
  }
  return drizzleNode(new Pool({ connectionString }), { schema });
}

export const db = createClient();
