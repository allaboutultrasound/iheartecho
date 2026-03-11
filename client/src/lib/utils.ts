import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strip HTML tags from a string, returning plain text.
 * Safe to call with plain text (no-op if no tags present).
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  // Use a regex-based approach that works in both browser and SSR
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
