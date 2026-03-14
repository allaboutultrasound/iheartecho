/**
 * EducatorAssist.tsx — Marketing & Pricing Page
 *
 * Visibility gate:
 *   - When `educatorPlatformVisible` flag is false → only platform_admin and
 *     education_manager can view this page.
 *   - When flag is true → visible to all users.
 *
 * The gate is controlled via the Platform Admin panel (toggle one flag).
 */

import { useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Users,
  BookOpen,
  BarChart3,
  CheckCircle2,
  Star,
  Zap,
  Building2,
  Hospital,
  Globe,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Lock,
  ChevronRight,
  Award,
  ClipboardList,
  Video,
  FileQuestion,
  Layers,
  TrendingUp,
} from "lucide-react";

// ─── Pricing tiers ────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: "individual",
    name: "Individual Educator",
    price: "$59.97",
    period: "/ month",
    tagline: "Perfect for independent educators, course creators, and conference instructors",
    icon: GraduationCap,
    color: "#189aa1",
    highlight: false,
    maxEducators: "1 educator",
    maxStudents: "Up to 50 learners",
    includes: [
      "Build challenges",
      "Upload cases",
      "Create modules",
      "Presentations",
      "Quizzes",
      "Flashcards",
      "Analytics",
    ],
    perfectFor: ["Independent educators", "Course creators", "Conference instructors"],
  },
  {
    id: "school",
    name: "School / University",
    price: "$299 – $399",
    period: "/ month",
    tagline: "For sonography schools, echo training programs, and allied health colleges",
    icon: Building2,
    color: "#189aa1",
    highlight: true,
    maxEducators: "Up to 3 educators",
    maxStudents: "Up to 250 students",
    includes: [
      "Student dashboards",
      "Curriculum modules",
      "Case libraries",
      "Daily challenge for classes",
      "Student progress tracking",
      "Exam preparation tools",
      "Presentation builder",
      "Group assignments",
    ],
    addOns: ["Additional students", "Accreditation learning modules"],
    perfectFor: ["Sonography schools", "Echo training programs", "Allied health colleges"],
  },
  {
    id: "hospital",
    name: "Hospital / Echo Lab",
    price: "$599 – $999",
    period: "/ month",
    tagline: "For echo labs, cardiology departments, and hospital ultrasound programs",
    icon: Hospital,
    color: "#0e4a50",
    highlight: false,
    maxEducators: "Up to 5 educators / managers",
    maxStudents: "Up to 500 staff members",
    includes: [
      "Everything in School tier",
      "Competency tracking",
      "Staff education dashboards",
      "Department case review tools",
      "Team leaderboards",
      "Training compliance tracking",
      "Department challenge competitions",
      "Protocol libraries",
      "QA/QI training modules",
    ],
    perfectFor: ["Echo labs", "Cardiology departments", "Hospital ultrasound programs"],
  },
  {
    id: "enterprise",
    name: "Health System / Enterprise",
    price: "$1,999 – $4,999",
    period: "/ month",
    tagline: "For large health systems with multi-site deployment needs",
    icon: Globe,
    color: "#0e1e2e",
    highlight: false,
    maxEducators: "Unlimited educators",
    maxStudents: "Multi-site support",
    includes: [
      "Multi-hospital access",
      "System analytics",
      "Institution branding",
      "Enterprise dashboards",
      "Custom integrations",
      "API support",
      "White label options",
    ],
    perfectFor: ["Large health systems"],
  },
];

const FEATURES = [
  { icon: BookOpen, title: "Course Builder", desc: "Build structured courses with lessons, case studies, challenges, quizzes, and flashcard decks." },
  { icon: ClipboardList, title: "Assignment Engine", desc: "Assign content to individuals, groups, or the entire org with due dates and passing scores." },
  { icon: TrendingUp, title: "Progress Tracking", desc: "Real-time dashboards showing student completion rates, scores, and time spent." },
  { icon: Award, title: "Competency Tracking", desc: "Define and track clinical competencies with level-based assessments and evidence documentation." },
  { icon: FileQuestion, title: "Quiz Builder", desc: "Create MCQ quizzes with images, video, and timed exams. Auto-grade with detailed feedback." },
  { icon: Video, title: "Presentation Builder", desc: "Build and share clinical presentations directly within the platform." },
  { icon: Layers, title: "Flashcard Decks", desc: "Create spaced-repetition flashcard decks for exam prep and protocol review." },
  { icon: BarChart3, title: "Analytics & Reporting", desc: "Org-wide analytics on student engagement, pass rates, and competency achievement." },
];

// ─── Gate component ───────────────────────────────────────────────────────────

function AdminOnlyGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: flagData, isLoading: flagLoading } = trpc.educator.getPlatformVisible.useQuery();

  if (loading || flagLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#189aa1]" />
      </div>
    );
  }

  const isVisible = flagData?.visible === true;
  const isAdmin = user?.appRoles?.includes("platform_admin") || user?.appRoles?.includes("education_manager");

  if (!isVisible && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0e4a50, #189aa1)" }}>
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Merriweather, serif" }}>
              Coming Soon
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              EducatorAssist is currently in private preview. Contact us to learn more about early access.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="w-full gap-2">
              <ArrowRight className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EducatorAssist() {
  const { user } = useAuth();
  const { data: flagData } = trpc.educator.getPlatformVisible.useQuery();

  useEffect(() => {
    document.title = "EducatorAssist — iHeartEcho | Clinical Education Platform";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "EducatorAssist by iHeartEcho — the clinical education platform for sonographers, echo labs, and cardiology programs. Build courses, track competencies, and manage student progress.");
  }, []);

  const isAdmin = user?.appRoles?.includes("platform_admin") || user?.appRoles?.includes("education_manager");
  const isEducatorAdmin = user?.appRoles?.includes("education_admin");
  const isStudent = user?.appRoles?.includes("education_student");

  return (
    <AdminOnlyGate>
      <Layout>
        {/* ── Admin preview banner ─────────────────────────────────────────── */}
        {isAdmin && flagData?.visible === false && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Admin Preview:</strong> EducatorAssist is currently hidden from public users. Only Platform Admins and Education Managers can see this page.
              </span>
            </div>
            <Link href="/platform-admin">
              <Button size="sm" variant="outline" className="text-amber-800 border-amber-300 hover:bg-amber-100 text-xs gap-1">
                Manage Visibility <ChevronRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        )}

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 60%, #189aa1 100%)" }}
        >
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          <div className="relative container py-16 md:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-5">
                <GraduationCap className="w-3.5 h-3.5 text-[#4ad9e0]" />
                <span className="text-xs text-white/80 font-medium">Clinical Education Platform</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4" style={{ fontFamily: "Merriweather, serif" }}>
                EducatorAssist™
              </h1>
              <p className="text-xl text-[#4ad9e0] font-semibold mb-4">
                Build. Teach. Track. Certify.
              </p>
              <p className="text-white/70 text-base leading-relaxed mb-8 max-w-xl">
                The clinical education platform built for echo educators, sonography schools, and hospital training programs. Create courses, track competencies, and manage student progress — all within iHeartEcho.
              </p>
              <div className="flex flex-wrap gap-3">
                {(isEducatorAdmin || isAdmin) ? (
                  <Link href="/educator-admin">
                    <Button className="gap-2 font-semibold" style={{ background: "#189aa1" }}>
                      <GraduationCap className="w-4 h-4" />
                      Go to Educator Dashboard
                    </Button>
                  </Link>
                ) : isStudent ? (
                  <Link href="/educator-student">
                    <Button className="gap-2 font-semibold" style={{ background: "#189aa1" }}>
                      <BookOpen className="w-4 h-4" />
                      Go to My Learning
                    </Button>
                  </Link>
                ) : (
                  <Button className="gap-2 font-semibold" style={{ background: "#189aa1" }}>
                    <Zap className="w-4 h-4" />
                    Get Started
                  </Button>
                )}
                <a href="mailto:support@iheartecho.com">
                  <Button variant="outline" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Contact Sales
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats bar ────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100">
          <div className="container py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Content Types", value: "8+", icon: Layers },
                { label: "Competency Levels", value: "10", icon: Award },
                { label: "Analytics Views", value: "Real-time", icon: BarChart3 },
                { label: "Pricing Tiers", value: "4", icon: Star },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f0fbfc" }}>
                    <Icon className="w-4 h-4" style={{ color: "#189aa1" }} />
                  </div>
                  <div>
                    <div className="text-xl font-bold" style={{ fontFamily: "JetBrains Mono, monospace", color: "#189aa1" }}>{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Features grid ────────────────────────────────────────────────── */}
        <div className="container py-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Merriweather, serif" }}>
              Everything You Need to Educate
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              From course creation to competency sign-off, EducatorAssist covers the full clinical education lifecycle.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-5 border border-gray-100 hover:border-[#189aa1]/30 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "#f0fbfc" }}>
                  <Icon className="w-5 h-5" style={{ color: "#189aa1" }} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-1" style={{ fontFamily: "Merriweather, serif" }}>{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Pricing ──────────────────────────────────────────────────────── */}
        <div className="bg-gray-50 py-14">
          <div className="container">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Merriweather, serif" }}>
                Pricing Plans
              </h2>
              <p className="text-gray-500 text-sm max-w-lg mx-auto">
                Choose the plan that fits your organization. All plans include a 14-day free trial.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {TIERS.map((tier) => {
                const Icon = tier.icon;
                return (
                  <div
                    key={tier.id}
                    className={`relative bg-white rounded-2xl p-6 flex flex-col border-2 transition-all ${tier.highlight ? "border-[#189aa1] shadow-lg shadow-[#189aa1]/10" : "border-gray-100"}`}
                  >
                    {tier.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="text-white text-xs px-3 py-0.5" style={{ background: "#189aa1" }}>
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tier.color + "15" }}>
                        <Icon className="w-5 h-5" style={{ color: tier.color }} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm leading-tight" style={{ fontFamily: "Merriweather, serif" }}>
                          {tier.name}
                        </h3>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-2xl font-black text-gray-900" style={{ fontFamily: "JetBrains Mono, monospace" }}>
                        {tier.price}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">{tier.period}</span>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Users className="w-3.5 h-3.5 text-[#189aa1]" />
                        {tier.maxEducators}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <GraduationCap className="w-3.5 h-3.5 text-[#189aa1]" />
                        {tier.maxStudents}
                      </div>
                    </div>

                    <div className="flex-1 space-y-1.5 mb-5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Includes</p>
                      {tier.includes.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-xs text-gray-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#189aa1] flex-shrink-0 mt-0.5" />
                          {item}
                        </div>
                      ))}
                      {tier.addOns && (
                        <>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3 mb-2">Optional Add-ons</p>
                          {tier.addOns.map((item) => (
                            <div key={item} className="flex items-start gap-2 text-xs text-gray-500">
                              <span className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-center">+</span>
                              {item}
                            </div>
                          ))}
                        </>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Perfect for</p>
                      {tier.perfectFor.map((item) => (
                        <div key={item} className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tier.color }} />
                          {item}
                        </div>
                      ))}
                    </div>

                    <a href="mailto:support@iheartecho.com?subject=EducatorAssist Interest">
                      <Button
                        className="w-full text-sm font-semibold gap-2"
                        style={tier.highlight ? { background: "#189aa1", color: "white" } : {}}
                        variant={tier.highlight ? "default" : "outline"}
                      >
                        Get Started
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              All plans include a 14-day free trial. No credit card required. Contact{" "}
              <a href="mailto:support@iheartecho.com" className="underline" style={{ color: "#189aa1" }}>
                support@iheartecho.com
              </a>{" "}
              for custom enterprise pricing.
            </p>
          </div>
        </div>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <div className="container py-12">
          <div
            className="rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center gap-6"
            style={{ background: "linear-gradient(135deg, #0e1e2e, #0e4a50)" }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-[#4ad9e0]" />
                <span className="text-xs font-semibold text-[#4ad9e0] uppercase tracking-wider">EducatorAssist</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "Merriweather, serif" }}>
                Ready to transform your clinical education program?
              </h3>
              <p className="text-white/60 text-sm">
                Join echo labs, sonography schools, and cardiology departments using iHeartEcho to train the next generation of echo professionals.
              </p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <a href="mailto:support@iheartecho.com?subject=EducatorAssist Demo Request">
                <Button className="gap-2 font-semibold w-full" style={{ background: "#189aa1" }}>
                  Request a Demo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="https://www.iheartecho.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 w-full text-sm">
                  Learn More at iheartecho.com
                </Button>
              </a>
            </div>
          </div>
        </div>
      </Layout>
    </AdminOnlyGate>
  );
}
