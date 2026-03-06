/**
 * Thinkific API integration test — validates the API key and subdomain are working.
 * This test makes a live API call to Thinkific to confirm credentials are valid.
 */
import { describe, it, expect } from "vitest";
import { getVisibleProducts, parseCreditHoursFromName } from "./thinkific";

describe("Thinkific API", () => {
  it("should fetch visible products successfully", async () => {
    const products = await getVisibleProducts();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
    // All returned products should be published and not hidden
    for (const p of products) {
      expect(p.status).toBe("published");
      expect(p.hidden).toBe(false);
      expect(p.name.toUpperCase().startsWith("ARCHIVE")).toBe(false);
    }
  }, 30_000);

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

  it("should return null for unknown user email", async () => {
    const { getUserByEmail } = await import("./thinkific");
    const result = await getUserByEmail("nonexistent-user-xyz-12345@nowhere.invalid");
    expect(result).toBeNull();
  }, 15_000);
});
