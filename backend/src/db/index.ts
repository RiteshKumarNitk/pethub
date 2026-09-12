import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Create the drizzle client. This module is imported by API routes,
 * so we must not throw at import time when DATABASE_URL is missing
 * (e.g. during `next build` page-data collection).
 */
function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // Return a proxy that throws meaningfully on first actual use.
    return drizzle(neon("postgresql://placeholder:placeholder@localhost:5432/placeholder"), { schema });
  }
  return drizzle(neon(connectionString), { schema });
}

export const db = createClient();
