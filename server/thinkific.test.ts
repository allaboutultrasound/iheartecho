/**
 * Thinkific API helper tests.
 *
 * These use a mocked fetch so regular unit-test runs do not depend on live
 * Thinkific credentials or third-party API availability.
 */
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { getUserByEmail, getVisibleProducts, parseCreditHoursFromName, getThinkificMemberCount } from "./thinkific";

function paginatedResponse<T>(items: T[]) {
  return {
    items,
    meta: {
      pagination: {
        current_page: 1,
        next_page: null,
        total_pages: 1,
        total_items: items.length,
      },
    },
  };
}

function mockJsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("Thinkific API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should fetch visible products successfully", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      mockJsonResponse(
        paginatedResponse([
          {
            id: 1,
            productable_id: 101,
            productable_type: "Course",
            name: "Visible Course",
            slug: "visible-course",
            description: null,
            price: "0.00",
            status: "published",
            hidden: false,
            private: false,
            has_certificate: false,
            card_image_url: null,
            instructor_names: null,
            collection_ids: [],
          },
          {
            id: 2,
            productable_id: 102,
            productable_type: "Course",
            name: "Hidden Course",
            slug: "hidden-course",
            description: null,
            price: "0.00",
            status: "published",
            hidden: true,
            private: false,
            has_certificate: false,
            card_image_url: null,
            instructor_names: null,
            collection_ids: [],
          },
          {
            id: 3,
            productable_id: 103,
            productable_type: "Course",
            name: "Draft Course",
            slug: "draft-course",
            description: null,
            price: "0.00",
            status: "draft",
            hidden: false,
            private: false,
            has_certificate: false,
            card_image_url: null,
            instructor_names: null,
            collection_ids: [],
          },
          {
            id: 4,
            productable_id: 104,
            productable_type: "Course",
            name: "ARCHIVE Old Course",
            slug: "archive-old-course",
            description: null,
            price: "0.00",
            status: "published",
            hidden: false,
            private: false,
            has_certificate: false,
            card_image_url: null,
            instructor_names: null,
            collection_ids: [],
          },
        ])
      )
    );

    const products = await getVisibleProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products).toHaveLength(1);
    // All returned products should be published and not hidden
    for (const p of products) {
      expect(p.status).toBe("published");
      expect(p.hidden).toBe(false);
      expect(p.name.toUpperCase().startsWith("ARCHIVE")).toBe(false);
    }
  });

  it("should parse SDMS credit hours from course names", () => {
    expect(parseCreditHoursFromName("All About Venous Insufficiency - 2 SDMS CME")).toEqual({
      hours: "2",
      type: "SDMS",
    });
    expect(parseCreditHoursFromName("All About Upper Extremity Duplex - 2.5 SDMS CME")).toEqual({
      hours: "2.5",
      type: "SDMS",
    });
    expect(parseCreditHoursFromName("All About Sonographer Ergonomics - 1 SDMS FREE CME")).toEqual({
      hours: "1",
      type: "SDMS",
    });
    expect(parseCreditHoursFromName("Registry Review Quiz - No Credits")).toBeNull();
  });

  it("should fetch Thinkific member count from API", async () => {
    // Set env vars so the function doesn't bail early
    const origKey = process.env.THINKIFIC_API_KEY;
    const origSub = process.env.THINKIFIC_SUBDOMAIN;
    process.env.THINKIFIC_API_KEY = "test-api-key";
    process.env.THINKIFIC_SUBDOMAIN = "test-subdomain";

    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      mockJsonResponse({
        items: [{ id: 1, email: "user@test.com", first_name: "Test", last_name: "User", full_name: "Test User" }],
        meta: { pagination: { current_page: 1, next_page: null, total_pages: 50, total_items: 12538 } },
      })
    );

    const count = await getThinkificMemberCount();
    expect(count).toBe(12538);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    // Second call should use cache (no additional fetch)
    const count2 = await getThinkificMemberCount();
    expect(count2).toBe(12538);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    process.env.THINKIFIC_API_KEY = origKey;
    process.env.THINKIFIC_SUBDOMAIN = origSub;
  });

  it("should return null for unknown user email", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      mockJsonResponse(
        paginatedResponse([
          {
            id: 1,
            email: "somebody-else@example.com",
            first_name: "Somebody",
            last_name: "Else",
            full_name: "Somebody Else",
          },
        ])
      )
    );

    const result = await getUserByEmail("nonexistent-user-xyz-12345@nowhere.invalid");
    expect(result).toBeNull();
  });
});
