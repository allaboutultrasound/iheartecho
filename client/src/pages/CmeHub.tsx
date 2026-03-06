/*
  iHeartEcho — CME Hub
  Displays All About Ultrasound CME courses from member.allaboutultrasound.com/collections/cme
  Checkout links are prefilled with the logged-in user's email for fast checkout.
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import Layout from "@/components/Layout";
import { GraduationCap, ExternalLink, Star, BookOpen, Clock } from "lucide-react";

const BRAND = "#189aa1";
const THINKIFIC_BASE = "https://member.allaboutultrasound.com";

interface CmeCourse {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string;
  credits: string;
  creditType: string;
  category: string;
  enrollUrl: string;
  isFeatured?: boolean;
  isBundle?: boolean;
  isFree?: boolean;
}

const CME_COURSES: CmeCourse[] = [
  // --- Featured Bundle ---
  {
    id: "cme-membership",
    title: "CME Membership Bundle",
    description: "Unlimited access for 1 year to all available CME courses. New courses added monthly. Credits backed by SDMS.",
    image: "https://files.cdn.thinkific.com/bundles/bundle_card_image_000/327/490/1765206872.original.png",
    price: "$69.97/yr",
    credits: "All CME",
    creditType: "SDMS",
    category: "Bundle",
    enrollUrl: "https://member.allaboutultrasound.com/enroll/3612790",
    isFeatured: true,
    isBundle: true,
  },
  // --- Individual Courses ---
  {
    id: "sonographer-ergonomics",
    title: "Sonographer Ergonomics",
    description: "Learn correct techniques for performing ultrasound exams with ergonomic approaches to avoid work-related musculoskeletal disorders.",
    image: "https://import.cdn.thinkific.com/109594/mtuwE4AFQQkjy7wK7omQ_2.png",
    price: "Free",
    credits: "1",
    creditType: "SDMS CME",
    category: "Ergonomics",
    enrollUrl: "https://member.allaboutultrasound.com/enroll/603157",
    isFree: true,
  },
  {
    id: "doppler-hemodynamics",
    title: "Mastering Doppler & Hemodynamics",
    description: "Reviews fundamental Doppler principles, hemodynamics, and flow physiology. Learn proper techniques and pitfalls to avoid.",
    image: "https://import.cdn.thinkific.com/109594/ZUOzJ8DJRQDpYUiM2G2i_Course%20Images_Doppler%201%20CME.png",
    price: "$24.97",
    credits: "1",
    creditType: "SDMS CME",
    category: "Adult Echo",
    enrollUrl: "https://member.allaboutultrasound.com/enroll/617498",
  },
  {
    id: "upper-extremity-duplex",
    title: "Mastering Upper Extremity Duplex",
    description: "Learn correct techniques for performing and interpreting upper extremity venous & arterial duplex exams, including hemodialysis access testing.",
    image: "https://import.cdn.thinkific.com/109594/6zYIBjSVuJJ3uslgslQw_3.png",
    price: "$29.97",
    credits: "2.5",
    creditType: "SDMS CME",
    category: "Vascular",
    enrollUrl: "https://member.allaboutultrasound.com/enroll/3512551",
  },
  {
    id: "venous-insufficiency",
    title: "Mastering Venous Insufficiency",
    description: "Approved for 2 SDMS CME Credit Hours. Easy-to-follow audio format covering venous insufficiency exams, venous ablation, and EVLT techniques.",
    image: "https://import.cdn.thinkific.com/109594/R7AgLJ2NTQKFQUGNHLeQ_4.png",
    price: "$29.97",
    credits: "2",
    creditType: "SDMS CME",
    category: "Vascular",
    enrollUrl: "https://member.allaboutultrasound.com/enroll/3512552",
  },
  {
    id: "lv-diastology",
    title: "Mastering LV Diastology",
    description: "Approved for 2 SDMS CME Credit Hours. Correct techniques for evaluating left ventricular diastolic function by echocardiography.",
    image: "https://import.cdn.thinkific.com/109594/52PsIdGQVSIvXcw2WvAm_6.png",
    price: "$29.97",
    credits: "2",
    creditType: "SDMS CME",
    category: "Adult Echo",
    enrollUrl: "https://member.allaboutultrasound.com/enroll/3512545",
  },
  {
    id: "aortic-stenosis",
    title: "All About Aortic Stenosis",
    description: "Learn and review correct techniques for performing and interpreting echocardiography imaging and Doppler ultrasound of aortic stenosis.",
    image: "https://import.cdn.thinkific.com/109594/4nGAZaibQS6AAhRfvt5b_5.png",
    price: "$29.97",
    credits: "2",
    creditType: "SDMS CME",
    category: "Adult Echo",
    enrollUrl: "https://member.allaboutultrasound.com/enroll/3512549",
  },
  {
    id: "determining-situs",
    title: "Determining Situs in Fetal Echo",
    description: "Learn correct techniques for performing fetal echo and determining situs. Includes free preview.",
    image: "https://import.cdn.thinkific.com/109594/suRpX5sfTEyZDZ7xCDez_BANNER_Square_Fetal%20Echo1.png",
    price: "$29.97",
    credits: "2",
    creditType: "SDMS CME",
    category: "Fetal Echo",
    enrollUrl: "https://member.allaboutultrasound.com/enroll/3510863",
  },
  {
    id: "constrictive-pericarditis",
    title: "All About Constrictive Pericarditis",
    description: "Learn correct techniques for evaluating constrictive pericarditis by echocardiography, including scanning techniques and protocols.",
    image: "https://cdn.thinkific.com/courses/course_card_image_000/633/6211643261183.original.png",
    price: "$29.97",
    credits: "2",
    creditType: "SDMS CME",
    category: "Adult Echo",
    enrollUrl: "https://member.allaboutultrasound.com/order?ct=ce76d1e8-7fa8-4e7a-92b0-97c07287581e",
  },
  {
    id: "ultrasound-fundamentals",
    title: "Fundamentals of Ultrasound Imaging",
    description: "A confidence-building starter for new and cross-training sonographers. Build a rock-solid foundation in ultrasound physics and image optimization.",
    image: "https://import.cdn.thinkific.com/109594/bBfoeeNT6Sky2NMI5wIg_Ultrasound%20Fundamenta%3Bs.png",
    price: "$299.97",
    credits: "Course",
    creditType: "Fundamentals",
    category: "Foundations",
    enrollUrl: "https://member.allaboutultrasound.com/enroll/3584663",
  },
  {
    id: "fetal-echo-fundamentals",
    title: "Fetal Echo Fundamentals",
    description: "Learn how to obtain, optimize, and interpret the core fetal echocardiography views used in routine screening and targeted exams.",
    image: "https://import.cdn.thinkific.com/109594/M32SKPpRKe2gHTFHjZig_Fetal%20Echo.png",
    price: "$299.97",
    credits: "Course",
    creditType: "Fundamentals",
    category: "Fetal Echo",
    enrollUrl: "https://member.allaboutultrasound.com/enroll/3523147",
  },
];

const CATEGORIES = ["All", "Bundle", "Adult Echo", "Vascular", "Fetal Echo", "Foundations", "Ergonomics"];

function buildCheckoutUrl(enrollUrl: string, email?: string | null): string {
  if (!email) return enrollUrl;
  // Append email as prefill parameter for Thinkific checkout
  const separator = enrollUrl.includes("?") ? "&" : "?";
  return `${enrollUrl}${separator}prefill_email=${encodeURIComponent(email)}`;
}

export default function CmeHub() {
  const { user } = useAuth();
  const [category, setCategory] = useState("All");

  const filtered = category === "All"
    ? CME_COURSES
    : CME_COURSES.filter(c => c.category === category);

  const featured = filtered.find(c => c.isFeatured);
  const regular = filtered.filter(c => !c.isFeatured);

  return (
    <Layout>
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
      >
        <div className="relative container py-10 md:py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-4">
              <GraduationCap className="w-3.5 h-3.5 text-[#4ad9e0]" />
              <span className="text-xs text-white/80 font-medium">SDMS-Accredited CME Courses</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2" style={{ fontFamily: "Merriweather, serif" }}>
              CME Hub
            </h1>
            <p className="text-[#4ad9e0] font-semibold text-base mb-3">All About Ultrasound — E-Learning & CME</p>
            <p className="text-white/70 text-sm leading-relaxed max-w-lg">
              Browse accredited continuing medical education courses from All About Ultrasound. Click any course to enroll directly — your email is pre-filled for fast checkout.
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
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                category === cat
                  ? "text-white shadow-sm"
                  : "bg-white border border-[#189aa1]/20 text-[#189aa1] hover:bg-[#f0fbfc]"
              }`}
              style={category === cat ? { background: BRAND } : {}}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Bundle — shown when "All" or "Bundle" selected */}
        {featured && (
          <div className="mb-8">
            <a
              href={buildCheckoutUrl(featured.enrollUrl, user?.email)}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl overflow-hidden group transition-transform hover:scale-[1.01]"
              style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-72 h-48 md:h-auto overflow-hidden flex-shrink-0">
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Best Value</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#189aa1]/30 text-[#4ad9e0]">Bundle</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2" style={{ fontFamily: "Merriweather, serif" }}>
                    {featured.title}
                  </h2>
                  <p className="text-white/70 text-sm leading-relaxed mb-4 max-w-lg">{featured.description}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-white">{featured.price}</span>
                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all group-hover:opacity-90"
                      style={{ background: BRAND }}>
                      Enroll Now <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </a>
          </div>
        )}

        {/* Course Grid */}
        {regular.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: "Merriweather, serif" }}>
              {category === "All" ? "Individual Courses" : `${category} Courses`}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {regular.map(course => (
                <a
                  key={course.id}
                  href={buildCheckoutUrl(course.enrollUrl, user?.email)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-white rounded-xl overflow-hidden shadow-sm border border-[#189aa1]/10 hover:shadow-md hover:border-[#189aa1]/30 transition-all flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 overflow-hidden bg-[#0e1e2e] flex-shrink-0">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    />
                    {/* Credit badge */}
                    <div className="absolute top-2 right-2">
                      {course.isFree ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white">FREE</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#189aa1] text-white">
                          {course.credits} {course.creditType}
                        </span>
                      )}
                    </div>
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

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <span className={`text-base font-black ${course.isFree ? "text-green-600" : "text-gray-800"}`}>
                        {course.price}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold group-hover:gap-1.5 transition-all" style={{ color: BRAND }}>
                        Enroll <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {regular.length === 0 && !featured && (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No courses in this category.</p>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-10 p-4 rounded-xl bg-[#f0fbfc] border border-[#189aa1]/20 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Clock className="w-4 h-4 text-[#189aa1] flex-shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs text-gray-600 leading-relaxed">
            All courses are hosted on <strong>All About Ultrasound</strong> via Thinkific. Clicking "Enroll" opens the checkout page in a new tab
            {user?.email ? ` with your email (${user.email}) pre-filled` : " — log in to iHeartEcho to have your email pre-filled automatically"}.
            SDMS CME credits are awarded upon course completion and post-test.
          </p>
          <a
            href="https://member.allaboutultrasound.com/collections/cme"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#189aa1] hover:underline"
          >
            View all on site <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </Layout>
  );
}


