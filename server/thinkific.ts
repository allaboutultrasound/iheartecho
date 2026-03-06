/**
 * Thinkific API helper — wraps the Thinkific Admin REST API v1.
 *
 * All requests use the API key + subdomain header auth.
 * Rate limit: 120 req/min — we cache aggressively to stay well under.
 *
 * Reference: https://developers.thinkific.com/api/api-documentation/
 */

import { ENV } from "./_core/env";

const BASE_URL = "https://api.thinkific.com/api/public/v1";

function thinkificHeaders() {
  return {
    "X-Auth-API-Key": ENV.thinkificApiKey,
    "X-Auth-Subdomain": ENV.thinkificSubdomain,
    "Content-Type": "application/json",
  };
}

async function thinkificFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: thinkificHeaders(),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Thinkific API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThinkificProduct {
  id: number;
  productable_id: number; // course ID
  productable_type: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  status: string; // "published" | "draft"
  hidden: boolean;
  private: boolean;
  has_certificate: boolean;
  card_image_url: string | null;
  instructor_names: string | null;
  collection_ids: number[];
}

export interface ThinkificEnrollment {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  course_id: number;
  course_name: string;
  percentage_completed: string; // "0.0" – "1.0"
  completed: boolean;
  completed_at: string | null;
  started_at: string | null;
  expiry_date: string | null;
  expired: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThinkificUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface PaginatedResponse<T> {
  items: T[];
  meta: {
    pagination: {
      current_page: number;
      next_page: number | null;
      total_pages: number;
      total_items: number;
    };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fetch all pages of a paginated endpoint */
async function fetchAllPages<T>(basePath: string, limit = 250): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  while (true) {
    const sep = basePath.includes("?") ? "&" : "?";
    const data = await thinkificFetch<PaginatedResponse<T>>(
      `${basePath}${sep}page=${page}&limit=${limit}`
    );
    results.push(...data.items);
    if (!data.meta.pagination.next_page) break;
    page++;
  }
  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch all visible, published, non-archived products from Thinkific.
 * Filters out: hidden=true, status!="published", name starts with "ARCHIVE".
 */
export async function getVisibleProducts(): Promise<ThinkificProduct[]> {
  const all = await fetchAllPages<ThinkificProduct>("/products");
  return all.filter(
    (p) =>
      !p.hidden &&
      p.status === "published" &&
      !p.name.toUpperCase().startsWith("ARCHIVE")
  );
}

/**
 * Fetch all products (including hidden/archived) — for admin sync.
 */
export async function getAllProducts(): Promise<ThinkificProduct[]> {
  return fetchAllPages<ThinkificProduct>("/products");
}

/**
 * Look up a Thinkific user by email address.
 * Returns null if not found.
 */
export async function getUserByEmail(email: string): Promise<ThinkificUser | null> {
  try {
    const data = await thinkificFetch<PaginatedResponse<ThinkificUser>>(
      `/users?query=${encodeURIComponent(email)}&page=1&limit=10`
    );
    // The query param does a broad search — find exact email match
    const match = data.items.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    return match ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch all enrollments for a specific Thinkific user ID.
 */
export async function getEnrollmentsByUserId(
  thinkificUserId: number
): Promise<ThinkificEnrollment[]> {
  return fetchAllPages<ThinkificEnrollment>(
    `/enrollments?user_id=${thinkificUserId}`
  );
}

/**
 * Parse CME credit hours from a course name.
 * Looks for patterns like "2.5 SDMS CME", "1 SDMS FREE CME", "2 SDMS Credits"
 * Returns null if no match found.
 */
export function parseCreditHoursFromName(name: string): {
  hours: string;
  type: "SDMS" | "AMA_PRA_1" | "ANCC" | "OTHER";
} | null {
  const sdmsMatch = name.match(/(\d+\.?\d*)\s*SDMS/i);
  if (sdmsMatch) return { hours: sdmsMatch[1], type: "SDMS" };

  const amaMatch = name.match(/(\d+\.?\d*)\s*AMA\s*PRA/i);
  if (amaMatch) return { hours: amaMatch[1], type: "AMA_PRA_1" };

  const anccMatch = name.match(/(\d+\.?\d*)\s*ANCC/i);
  if (anccMatch) return { hours: anccMatch[1], type: "ANCC" };

  return null;
}

// ─── Collections ─────────────────────────────────────────────────────────────

export interface ThinkificCollection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  product_ids: number[];
}

/**
 * Fetch all collections (categories) from Thinkific.
 */
export async function getCollections(): Promise<ThinkificCollection[]> {
  return fetchAllPages<ThinkificCollection>("/collections");
}

/**
 * Build the direct course URL on Thinkific.
 */
export function buildCourseUrl(slug: string): string {
  return `https://${ENV.thinkificSubdomain}.thinkific.com/courses/${slug}`;
}

/**
 * Build the enrollment/checkout URL for a product.
 */
export function buildEnrollUrl(productSlug: string): string {
  return `https://${ENV.thinkificSubdomain}.thinkific.com/products/${productSlug}`;
}
