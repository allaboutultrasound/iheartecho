/*
  iHeartEcho — Registry Review Hub
  Displays All About Ultrasound Registry Review courses from the Registry Review collection on Thinkific.
  Course data is fetched live from the Thinkific API via tRPC (cached, refreshed every 6 hours).
  Checkout links are prefilled with the logged-in user's email for fast checkout.
  Brand accent: Indigo #4f46e5 / Purple #7c3aed (distinct from CME Hub teal)
*/
import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { BookOpen, ExternalLink, Star, Clock, Info, RefreshCw, GraduationCap, Award } from "lucide-react";

const BRAND = "#4f46e5";
const BRAND_LIGHT = "#eef2ff";
const BRAND_BORDER = "#c7d2fe";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegistryCourse {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string;
  category: string;
  enrollUrl: string;
  courseUrl: string;
  isFeatured?: boolean;
  isBundle?: boolean;
  isFree?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCheckoutUrl(enrollUrl: string, email?: string | null): string {
  if (!email) return enrollUrl;
  const separator = enrollUrl.includes("?") ? "&" : "?";
  return `${enrollUrl}${separator}prefill_email=${encodeURIComponent(email)}`;
}

/** Map a live Thinkific catalog course to the local RegistryCourse shape */
function mapLiveCourse(c: {
  thinkificProductId: number;
  name: string;
  description: string | null;
  price: string;
  cardImageUrl: string | null;
  enrollUrl: string;
  courseUrl: string;
  hasCertificate: boolean;
}): RegistryCourse {
  const isFree = parseFloat(c.price) === 0;
  const isBundle = c.name.toLowerCase().includes("membership") || c.name.toLowerCase().includes("bundle");

  // Derive category from name keywords
  let category = "Registry Review";
  if (/echo|cardiac|doppler|diastol|stenosis|pericarditis|valve/i.test(c.name)) category = "Echo";
  else if (/vascular|duplex|venous|arterial/i.test(c.name)) category = "Vascular";
  else if (/fetal/i.test(c.name)) category = "Fetal Echo";
  else if (/physics|spi/i.test(c.name)) category = "Physics";
  else if (/abdominal|abdomen/i.test(c.name)) category = "Abdominal";
  else if (/obstetric|ob|gyn/i.test(c.name)) category = "OB/GYN";
  else if (/bundle|membership|pass/i.test(c.name)) category = "Bundle";

  const priceNum = parseFloat(c.price);
  const priceDisplay = isFree ? "Free" : `$${priceNum.toFixed(2)}`;

  return {
    id: `live-${c.thinkificProductId}`,
    title: c.name,
    description: c.description ?? "",
    image: c.cardImageUrl ?? "https://import.cdn.thinkific.com/109594/bBfoeeNT6Sky2NMI5wIg_Ultrasound%20Fundamenta%3Bs.png",
    price: priceDisplay,
    category,
    enrollUrl: c.enrollUrl,
    courseUrl: c.courseUrl,
    isFeatured: isBundle,
    isBundle,
    isFree,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegistryReviewHub() {
  const { user } = useAuth();
  const [category, setCategory] = useState("All");

  // Fetch live courses from Thinkific (via DB cache, refreshed every 6h)
  const { data: liveCatalog, isLoading, isError } = trpc.cmeCatalog.getRegistryCatalog.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const allCourses: RegistryCourse[] = liveCatalog && liveCatalog.length > 0
    ? liveCatalog.map(mapLiveCourse)
    : [];

  const isLiveData = liveCatalog && liveCatalog.length > 0;

  // Derive available categories from live data
  const availableCategories = ["All", ...Array.from(new Set(allCourses.map(c => c.category))).sort()];

  const filtered = category === "All"
    ? allCourses
    : allCourses.filter(c => c.category === category);

  const featured = filtered.find(c => c.isFeatured);
  const regular = filtered.filter(c => !c.isFeatured);

  return (
    <Layout>
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)" }}
      >
        <div className="relative container py-10 md:py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-4">
              <Award className="w-3.5 h-3.5 text-indigo-300" />
              <span className="text-xs text-white/80 font-medium">Registry Exam Preparation</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2" style={{ fontFamily: "Merriweather, serif" }}>
              Registry Review Hub
            </h1>
            <p className="text-indigo-300 font-semibold text-base mb-3">All About Ultrasound — Registry Review Courses</p>
            <p className="text-white/70 text-sm leading-relaxed max-w-lg">
              Prepare for your registry exams with comprehensive review courses from All About Ultrasound. Click "Learn More" to view course details or "Enroll" to go directly to checkout — your email is pre-filled.
            </p>
            {user && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-xs text-white/80">Logged in as <span className="text-white font-medium">{user.email}</span> — checkout links are pre-filled</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container py-8">

        {/* Live data indicator */}
        {isLiveData && (
          <div className="flex items-center gap-1.5 text-xs mb-4" style={{ color: BRAND }}>
            <RefreshCw className="w-3 h-3" />
            <span>Live course data from Thinkific — auto-refreshes every 6 hours</span>
          </div>
        )}
        {isError && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Could not reach Thinkific — showing cached course list. Refresh to retry.</span>
          </div>
        )}

        {/* Category Filter */}
        {availableCategories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === cat
                    ? "text-white shadow-sm"
                    : "bg-white border text-indigo-600 hover:bg-indigo-50"
                }`}
                style={
                  category === cat
                    ? { background: BRAND }
                    : { borderColor: BRAND_BORDER }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-indigo-100 animate-pulse">
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Featured Bundle — shown when "All" or "Bundle" selected */}
        {!isLoading && featured && (
          <div className="mb-8">
            <div
              className="block rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-72 h-48 md:h-auto overflow-hidden flex-shrink-0">
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                </div>
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Best Value</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200">Bundle</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2" style={{ fontFamily: "Merriweather, serif" }}>
                    {featured.title}
                  </h2>
                  <p className="text-white/70 text-sm leading-relaxed mb-4 max-w-lg">{featured.description}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl font-black text-white">{featured.price}</span>
                    <a
                      href={featured.courseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-white/30 text-white hover:bg-white/10 transition-all"
                    >
                      Learn More <Info className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={buildCheckoutUrl(featured.enrollUrl, user?.email)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: BRAND }}
                    >
                      Enroll Now <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Course Grid */}
        {!isLoading && regular.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: "Merriweather, serif" }}>
              {category === "All" ? "Registry Review Courses" : `${category} Courses`}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {regular.map(course => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-indigo-100 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 overflow-hidden bg-[#1e1b4b] flex-shrink-0">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300"
                    />
                    {/* Free badge */}
                    {course.isFree && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white">FREE</span>
                      </div>
                    )}
                    {/* Category tag */}
                    <div className="absolute bottom-2 left-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/50 text-white/90">
                        {course.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-gray-800 text-sm leading-snug mb-2" style={{ fontFamily: "Merriweather, serif" }}>
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-3">
                      {course.description.length > 120 ? course.description.substring(0, 117) + "..." : course.description}
                    </p>

                    {/* Footer — price + two action buttons */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-base font-black ${course.isFree ? "text-green-600" : "text-gray-800"}`}>
                          {course.price}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {/* Learn More — links to Thinkific product page */}
                        <a
                          href={course.courseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 px-2 rounded-lg border transition-all hover:bg-indigo-50"
                          style={{ borderColor: BRAND, color: BRAND }}
                          onClick={e => e.stopPropagation()}
                        >
                          Learn More <Info className="w-3 h-3" />
                        </a>
                        {/* Enroll — links to Thinkific checkout */}
                        <a
                          href={buildCheckoutUrl(course.enrollUrl, user?.email)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold py-1.5 px-2 rounded-lg text-white transition-all hover:opacity-90"
                          style={{ background: BRAND }}
                          onClick={e => e.stopPropagation()}
                        >
                          Enroll <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty state — shown when no courses loaded yet */}
        {!isLoading && regular.length === 0 && !featured && (
          <div className="text-center py-16 text-gray-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No registry review courses found in this category.</p>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-10 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-3" style={{ background: BRAND_LIGHT, borderColor: BRAND_BORDER }}>
          <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" style={{ color: BRAND }} />
          <p className="text-xs text-gray-600 leading-relaxed">
            All courses are hosted on <strong>All About Ultrasound</strong> via Thinkific. "Learn More" opens the course details page; "Enroll" opens the checkout page
            {user?.email ? ` with your email (${user.email}) pre-filled` : " — log in to iHeartEcho to have your email pre-filled automatically"}.
          </p>
          <a
            href="https://member.allaboutultrasound.com/collections/registry-review"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold hover:underline"
            style={{ color: BRAND }}
          >
            View all on site <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </Layout>
  );
}
