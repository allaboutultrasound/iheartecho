/*
  Lab Admin Portal — iHeartEcho DIY Accreditation Tool™
  Tabs: Overview | Staff | Analytics | Reports | Subscription
  Brand: Teal #189aa1, Aqua #4ad9e0
*/
import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2, Users, BarChart2, FileText, CreditCard, Plus, Trash2,
  Edit2, Check, X, TrendingUp, TrendingDown, Minus, Star, Award,
  Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  Download, RefreshCw, Shield, Zap, Crown
} from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import jsPDF from "jspdf";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

const BRAND = "#189aa1";
const BRAND_DARK = "#0e4a50";
const AQUA = "#4ad9e0";

// ─── Subscription Plans ───────────────────────────────────────────────────────
const PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "$49/mo",
    seats: 5,
    color: "#6b7280",
    icon: Shield,
    popular: false,
    features: ["Up to 5 staff members", "Peer review tracking", "Quality Score engine", "PDF export"],
  },
  {
    id: "professional",
    name: "Professional",
    price: "$149/mo",
    seats: 25,
    color: BRAND,
    icon: Zap,
    popular: true,
    features: ["Up to 25 staff members", "All Basic features", "Staff growth curves", "Monthly analytics reports", "IAC-ready PDF bundles"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$399/mo",
    seats: 999,
    color: "#7c3aed",
    icon: Crown,
    popular: false,
    features: ["Unlimited staff", "All Professional features", "Custom branding", "Dedicated support", "API access"],
  },
] as const;

// ─── Quality Score helpers ────────────────────────────────────────────────────
const IQ_SCORES: Record<string, number> = { excellent: 100, good: 80, adequate: 60, poor: 30 };
const RA_SCORES: Record<string, number> = { accurate: 100, minor_discrepancy: 55, major_discrepancy: 15 };
const TA_SCORES: Record<string, number> = { full: 100, partial: 55, non_adherent: 15 };

function calcQS(iq?: string | null, ra?: string | null, ta?: string | null): number | null {
  const i = iq ? IQ_SCORES[iq] : null;
  const r = ra ? RA_SCORES[ra] : null;
  const t = ta ? TA_SCORES[ta] : null;
  if (i == null || r == null || t == null) return null;
  return Math.round(i * 0.4 + r * 0.35 + t * 0.25);
}

function qsTier(score: number): { tier: string; color: string; bg: string } {
  if (score >= 85) return { tier: "Excellent", color: "#16a34a", bg: "#dcfce7" };
  if (score >= 70) return { tier: "Good", color: "#2563eb", bg: "#dbeafe" };
  if (score >= 50) return { tier: "Adequate", color: "#d97706", bg: "#fef3c7" };
  return { tier: "Needs Improvement", color: "#dc2626", bg: "#fee2e2" };
}

function QsBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-gray-400 text-xs">—</span>;
  const { tier, color, bg } = qsTier(score);
  const Icon = score >= 85 ? TrendingUp : score >= 50 ? Minus : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
      <Icon className="w-3 h-3" />
      QS {score} — {tier}
    </span>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon: Icon, label, badge }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
        active ? "text-white shadow-sm" : "hover:bg-white/80"
      }`}
      style={active ? { background: BRAND } : { color: "#189aa1" }}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge != null && badge > 0 && (
        <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/20">{badge}</span>
      )}
    </button>
  );
}

// ─── Setup Wizard ─────────────────────────────────────────────────────────────
function SetupWizard({ onCreated }: { onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ labName: "", labAddress: "", labPhone: "", plan: "professional" as "basic" | "professional" | "enterprise" });
  const createLab = trpc.lab.createLab.useMutation({
    onSuccess: () => { toast.success("Lab created! Welcome to the Lab Admin Portal."); onCreated(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: BRAND }}>
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: "Merriweather, serif" }}>
          Set Up Your Echo Lab
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Create your lab subscription to manage staff, track peer reviews, and generate accreditation reports.
        </p>
      </div>

      {step === 1 && (
        <Card className="border border-[#189aa1]/20">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-gray-800">Step 1 — Lab Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Lab / Facility Name *</label>
              <Input className="h-9 text-sm" placeholder="e.g. St. Mary's Cardiac Imaging Center" value={form.labName} onChange={e => setForm(f => ({ ...f, labName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Address</label>
              <Input className="h-9 text-sm" placeholder="123 Main St, City, State ZIP" value={form.labAddress} onChange={e => setForm(f => ({ ...f, labAddress: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Phone</label>
              <Input className="h-9 text-sm" placeholder="(555) 000-0000" value={form.labPhone} onChange={e => setForm(f => ({ ...f, labPhone: e.target.value }))} />
            </div>
            <Button className="w-full text-white" style={{ background: BRAND }} onClick={() => { if (!form.labName.trim()) { toast.error("Lab name is required."); return; } setStep(2); }}>
              Continue to Plan Selection →
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map(plan => {
              const Icon = plan.icon;
              const selected = form.plan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setForm(f => ({ ...f, plan: plan.id as typeof form.plan }))}
                  className={`relative rounded-xl p-4 text-left border-2 transition-all ${selected ? "shadow-md" : "border-gray-200 hover:border-gray-300"}`}
                  style={selected ? { borderColor: plan.color, background: plan.color + "08" } : {}}
                >
                  {plan.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: BRAND }}>MOST POPULAR</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5" style={{ color: plan.color }} />
                    <span className="font-bold text-sm text-gray-800">{plan.name}</span>
                  </div>
                  <div className="text-xl font-black mb-1" style={{ color: plan.color }}>{plan.price}</div>
                  <div className="text-xs text-gray-500 mb-3">{plan.seats === 999 ? "Unlimited" : `Up to ${plan.seats}`} staff</div>
                  <ul className="space-y-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
            <Button
              className="flex-1 text-white"
              style={{ background: BRAND }}
              disabled={createLab.isPending}
              onClick={() => createLab.mutate(form)}
            >
              {createLab.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Start 14-Day Free Trial
            </Button>
          </div>
          <p className="text-center text-xs text-gray-400">No credit card required for trial. Cancel anytime.</p>
        </div>
      )}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ lab, members, snapshot }: {
  lab: any; members: any[]; snapshot: any[];
}) {
  const totalReviews = snapshot.reduce((s, r) => s + Number(r.reviewCount ?? 0), 0);
  const avgQs = snapshot.length > 0
    ? Math.round(snapshot.reduce((s, r) => s + Number(r.avgQs ?? 0), 0) / snapshot.length)
    : null;

  const planInfo = PLANS.find(p => p.id === lab.plan) ?? PLANS[1];
  const PlanIcon = planInfo.icon;
  const statusColor = lab.status === "active" ? "#16a34a" : lab.status === "trialing" ? "#2563eb" : "#dc2626";

  return (
    <div className="space-y-5">
      {/* Lab header */}
      <div className="rounded-xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND})` }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 opacity-80" />
              <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Echo Lab</span>
            </div>
            <h2 className="text-xl font-black" style={{ fontFamily: "Merriweather, serif" }}>{lab.labName}</h2>
            {lab.labAddress && <p className="text-xs opacity-60 mt-0.5">{lab.labAddress}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1.5 justify-end mb-1">
              <PlanIcon className="w-4 h-4" style={{ color: AQUA }} />
              <span className="text-sm font-bold capitalize">{lab.plan} Plan</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize" style={{ background: statusColor + "30", color: statusColor === "#16a34a" ? "#86efac" : statusColor === "#2563eb" ? "#93c5fd" : "#fca5a5" }}>
              {lab.status}
            </span>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Staff Members", value: members.length, max: lab.seats, icon: Users, color: BRAND },
          { label: "Total Reviews", value: totalReviews, icon: Star, color: "#7c3aed" },
          { label: "Avg Quality Score", value: avgQs != null ? `${avgQs}/100` : "—", icon: BarChart2, color: avgQs != null ? qsTier(avgQs).color : "#6b7280" },
          { label: "Seats Used", value: `${members.length}/${lab.seats === 999 ? "∞" : lab.seats}`, icon: Award, color: "#d97706" },
        ].map(({ label, value, icon: Icon, color, max }) => (
          <Card key={label} className="border border-gray-100">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
              <div className="text-xl font-black" style={{ color }}>{value}</div>
              {max != null && (
                <div className="mt-1.5 h-1 rounded-full bg-gray-100">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (members.length / max) * 100)}%`, background: color }} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff leaderboard */}
      {snapshot.length > 0 && (
        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-4 h-4" style={{ color: BRAND }} />
              Staff Quality Score Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {snapshot
                .filter(s => s.avgQs != null)
                .sort((a, b) => Number(b.avgQs) - Number(a.avgQs))
                .map((s, idx) => {
                  const member = members.find(m => m.id === s.revieweeId);
                  const qs = Math.round(Number(s.avgQs));
                  const { tier, color, bg } = qsTier(qs);
                  return (
                    <div key={s.revieweeId} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-sm font-black w-5 text-gray-400">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-800 truncate">
                          {member?.displayName ?? `Member #${s.revieweeId}`}
                        </div>
                        <div className="text-xs text-gray-400">{member?.credentials ?? member?.specialty ?? ""}</div>
                      </div>
                      <div className="text-right">
                        <QsBadge score={qs} />
                        <div className="text-xs text-gray-400 mt-0.5">{s.reviewCount} reviews</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Staff Tab ────────────────────────────────────────────────────────────────
function StaffTab({ lab, members, onRefresh }: { lab: any; members: any[]; onRefresh: () => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ inviteEmail: "", displayName: "", credentials: "", role: "sonographer" as "admin" | "reviewer" | "sonographer" | "physician", specialty: "", department: "" });
  const [editForm, setEditForm] = useState<any>({});

  const utils = trpc.useUtils();
  const addMember = trpc.lab.addMember.useMutation({
    onSuccess: () => { toast.success("Staff member added."); utils.lab.getMembers.invalidate(); setAddOpen(false); setForm({ inviteEmail: "", displayName: "", credentials: "", role: "sonographer" as "admin" | "reviewer" | "sonographer" | "physician", specialty: "", department: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const updateMember = trpc.lab.updateMember.useMutation({
    onSuccess: () => { toast.success("Member updated."); utils.lab.getMembers.invalidate(); setEditId(null); },
    onError: (e) => toast.error(e.message),
  });
  const removeMember = trpc.lab.removeMember.useMutation({
    onSuccess: () => { toast.success("Member removed."); utils.lab.getMembers.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const roleColors: Record<string, string> = { admin: "#7c3aed", reviewer: BRAND, sonographer: "#d97706", physician: "#0e4a50" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 font-medium">
          {members.length} of {lab.seats === 999 ? "unlimited" : lab.seats} seats used
        </div>
        <Button size="sm" className="text-white h-8 text-xs gap-1.5" style={{ background: BRAND }} onClick={() => setAddOpen(!addOpen)}>
          <Plus className="w-3.5 h-3.5" />
          Add Staff Member
        </Button>
      </div>

      {addOpen && (
        <Card className="border border-[#189aa1]/20">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Email *</label>
                <Input className="h-8 text-xs" placeholder="staff@hospital.org" value={form.inviteEmail} onChange={e => setForm(f => ({ ...f, inviteEmail: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Display Name</label>
                <Input className="h-8 text-xs" placeholder="Jane Smith" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Credentials</label>
                <Input className="h-8 text-xs" placeholder="RDCS, ACS, FASE" value={form.credentials} onChange={e => setForm(f => ({ ...f, credentials: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Role</label>
                <Select value={form.role} onValueChange={(v: any) => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sonographer">Sonographer</SelectItem>
                    <SelectItem value="physician">Physician</SelectItem>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Specialty</label>
                <Input className="h-8 text-xs" placeholder="Adult Echo, Pediatric..." value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Department</label>
                <Input className="h-8 text-xs" placeholder="Cardiology, ICU..." value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="text-white" style={{ background: BRAND }} disabled={addMember.isPending} onClick={() => addMember.mutate(form)}>
                {addMember.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                Add Member
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {members.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No staff members yet. Add your first team member above.</div>
        ) : members.map(m => (
          <Card key={m.id} className="border border-gray-100">
            <CardContent className="p-3">
              {editId === m.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <Input className="h-7 text-xs" placeholder="Display Name" value={editForm.displayName ?? m.displayName ?? ""} onChange={e => setEditForm((f: any) => ({ ...f, displayName: e.target.value }))} />
                    <Input className="h-7 text-xs" placeholder="Credentials" value={editForm.credentials ?? m.credentials ?? ""} onChange={e => setEditForm((f: any) => ({ ...f, credentials: e.target.value }))} />
                    <Select value={editForm.role ?? m.role} onValueChange={(v: any) => setEditForm((f: any) => ({ ...f, role: v }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sonographer">Sonographer</SelectItem>
                        <SelectItem value="physician">Physician</SelectItem>
                        <SelectItem value="reviewer">Reviewer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input className="h-7 text-xs" placeholder="Specialty" value={editForm.specialty ?? m.specialty ?? ""} onChange={e => setEditForm((f: any) => ({ ...f, specialty: e.target.value }))} />
                    <Input className="h-7 text-xs" placeholder="Department" value={editForm.department ?? m.department ?? ""} onChange={e => setEditForm((f: any) => ({ ...f, department: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs text-white" style={{ background: BRAND }}
                      disabled={updateMember.isPending}
                      onClick={() => updateMember.mutate({ memberId: m.id, ...editForm })}>
                      <Check className="w-3 h-3 mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditId(null)}><X className="w-3 h-3 mr-1" /> Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: roleColors[m.role] ?? BRAND }}>
                    {(m.displayName ?? m.inviteEmail).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800">{m.displayName ?? m.inviteEmail}</span>
                      {m.credentials && <span className="text-xs text-gray-500">{m.credentials}</span>}
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold capitalize" style={{ background: (roleColors[m.role] ?? BRAND) + "18", color: roleColors[m.role] ?? BRAND }}>
                        {m.role}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold capitalize" style={{ background: m.inviteStatus === "accepted" ? "#dcfce7" : "#fef3c7", color: m.inviteStatus === "accepted" ? "#16a34a" : "#d97706" }}>
                        {m.inviteStatus}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {[m.specialty, m.department].filter(Boolean).join(" · ")}
                      {m.inviteEmail && <span className="ml-2">{m.inviteEmail}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => { setEditId(m.id); setEditForm({}); }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      onClick={() => { if (confirm(`Remove ${m.displayName ?? m.inviteEmail}?`)) removeMember.mutate({ memberId: m.id }); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab({ members, snapshot }: { members: any[]; snapshot: any[] }) {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const { data: trend, isLoading: trendLoading } = trpc.lab.getStaffTrend.useQuery(
    { revieweeId: selectedMemberId!, months: 12 },
    { enabled: selectedMemberId != null }
  );

  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Leaderboard chart data
  const leaderboardData = snapshot
    .filter(s => s.avgQs != null)
    .map(s => {
      const member = members.find(m => m.id === s.revieweeId);
      return {
        name: member?.displayName ?? `#${s.revieweeId}`,
        qs: Math.round(Number(s.avgQs)),
        iq: Math.round(Number(s.avgIq ?? 0)),
        ra: Math.round(Number(s.avgRa ?? 0)),
        ta: Math.round(Number(s.avgTa ?? 0)),
        reviews: Number(s.reviewCount),
      };
    })
    .sort((a, b) => b.qs - a.qs);

  // Trend chart data
  const trendData = (trend ?? []).map(t => ({
    month: t.reviewMonth ?? "",
    qs: t.avgQs != null ? Math.round(Number(t.avgQs)) : null,
    iq: t.avgIq != null ? Math.round(Number(t.avgIq)) : null,
    ra: t.avgRa != null ? Math.round(Number(t.avgRa)) : null,
    ta: t.avgTa != null ? Math.round(Number(t.avgTa)) : null,
    reviews: Number(t.reviewCount ?? 0),
  }));

  // Radar data for selected member
  const radarData = selectedMemberId != null ? (() => {
    const s = snapshot.find(x => x.revieweeId === selectedMemberId);
    if (!s) return [];
    return [
      { domain: "Image Quality (40%)", score: Math.round(Number(s.avgIq ?? 0)), fullMark: 100 },
      { domain: "Report Accuracy (35%)", score: Math.round(Number(s.avgRa ?? 0)), fullMark: 100 },
      { domain: "Technical Adherence (25%)", score: Math.round(Number(s.avgTa ?? 0)), fullMark: 100 },
    ];
  })() : [];

  return (
    <div className="space-y-5">
      {/* Lab-wide bar chart */}
      {leaderboardData.length > 0 ? (
        <Card className="border border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" style={{ color: BRAND }} />
              Lab-Wide Quality Score Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leaderboardData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v}/100`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="iq" name="Image Quality" fill="#189aa1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ra" name="Report Accuracy" fill="#4ad9e0" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ta" name="Technical Adherence" fill="#0e4a50" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-10 text-gray-400 text-sm">No review data yet. Submit lab peer reviews to see analytics.</div>
      )}

      {/* Staff drill-down */}
      <Card className="border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: BRAND }} />
            Individual Staff Growth Curves
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Select Staff Member</label>
            <Select value={selectedMemberId?.toString() ?? ""} onValueChange={v => setSelectedMemberId(Number(v))}>
              <SelectTrigger className="h-8 text-xs w-64"><SelectValue placeholder="Choose a staff member..." /></SelectTrigger>
              <SelectContent>
                {members.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.displayName ?? m.inviteEmail}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedMemberId != null && (
            <>
              {trendLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: BRAND }} /></div>
              ) : trendData.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => [`${v}/100`]} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="qs" name="Quality Score" stroke={BRAND} strokeWidth={2.5} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="iq" name="Image Quality" stroke="#4ad9e0" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                      <Line type="monotone" dataKey="ra" name="Report Accuracy" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                      <Line type="monotone" dataKey="ta" name="Technical Adherence" stroke="#d97706" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>

                  {radarData.length > 0 && (
                    <div className="flex justify-center">
                      <div>
                        <p className="text-xs text-gray-500 text-center mb-2 font-semibold">Domain Breakdown — {selectedMember?.displayName}</p>
                        <ResponsiveContainer width={280} height={200}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="domain" tick={{ fontSize: 9 }} />
                            <Radar name="Score" dataKey="score" stroke={BRAND} fill={BRAND} fillOpacity={0.25} />
                            <Tooltip formatter={(v: any) => [`${v}/100`]} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">No review history for this staff member yet.</div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({ lab, members, snapshot }: { lab: any; members: any[]; snapshot: any[] }) {
  const { data: monthly, isLoading } = trpc.lab.getMonthlySummary.useQuery({ months: 12 });

  const chartData = (monthly ?? []).map(m => ({
    month: m.reviewMonth ?? "",
    avgQs: m.avgQs != null ? Math.round(Number(m.avgQs)) : 0,
    reviews: Number(m.reviewCount ?? 0),
    excellent: Number(m.excellentCount ?? 0),
    good: Number(m.goodCount ?? 0),
    adequate: Number(m.adequateCount ?? 0),
    needsImprovement: Number(m.needsImprovementCount ?? 0),
  }));

  const exportLabReport = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const pageW = 215.9, pageH = 279.4, margin = 18, contentW = pageW - margin * 2;
    let y = margin;

    // Header
    doc.setFillColor(14, 74, 80);
    doc.rect(0, 0, pageW, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text("iHeartEcho™ — Lab Accreditation Report", margin, 13);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`${lab.labName}  |  ${lab.plan.charAt(0).toUpperCase() + lab.plan.slice(1)} Plan`, margin, 20);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, 26);
    y = 38;

    // Summary
    const totalReviews = snapshot.reduce((s, r) => s + Number(r.reviewCount ?? 0), 0);
    const avgQs = snapshot.length > 0 ? Math.round(snapshot.reduce((s, r) => s + Number(r.avgQs ?? 0), 0) / snapshot.length) : null;
    doc.setFillColor(240, 251, 252); doc.setDrawColor(24, 154, 161); doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentW, 22, 2, 2, "FD");
    doc.setTextColor(14, 74, 80); doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
    doc.text(`Lab: ${lab.labName}`, margin + 6, y + 7);
    doc.text(`Staff: ${members.length}`, margin + 80, y + 7);
    doc.text(`Total Reviews: ${totalReviews}`, margin + 110, y + 7);
    doc.setFont("helvetica", "normal");
    doc.text(`Plan: ${lab.plan}  |  Status: ${lab.status}  |  Avg Quality Score: ${avgQs != null ? `${avgQs}/100` : "N/A"}`, margin + 6, y + 15);
    y += 28;

    // Staff table
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(14, 74, 80);
    doc.text("Staff Quality Score Summary", margin, y); y += 6;
    doc.setFillColor(24, 154, 161); doc.rect(margin, y, contentW, 7, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    doc.text("Name", margin + 3, y + 5);
    doc.text("Credentials", margin + 55, y + 5);
    doc.text("Avg QS", margin + 100, y + 5);
    doc.text("Tier", margin + 120, y + 5);
    doc.text("Reviews", margin + 155, y + 5);
    y += 9;

    snapshot
      .filter(s => s.avgQs != null)
      .sort((a, b) => Number(b.avgQs) - Number(a.avgQs))
      .forEach((s, idx) => {
        if (y > pageH - margin - 10) { doc.addPage(); y = margin; }
        const member = members.find(m => m.id === s.revieweeId);
        const qs = Math.round(Number(s.avgQs));
        const { tier } = qsTier(qs);
        doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
        doc.rect(margin, y, contentW, 7, "F");
        doc.setTextColor(30, 30, 30); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text(member?.displayName ?? `Member #${s.revieweeId}`, margin + 3, y + 5);
        doc.text(member?.credentials ?? "—", margin + 55, y + 5);
        doc.text(String(qs), margin + 100, y + 5);
        doc.text(tier, margin + 120, y + 5);
        doc.text(String(s.reviewCount), margin + 155, y + 5);
        y += 7;
      });

    y += 8;
    // Monthly trend
    if (chartData.length > 0) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(14, 74, 80);
      doc.text("Monthly Review Summary", margin, y); y += 6;
      doc.setFillColor(24, 154, 161); doc.rect(margin, y, contentW, 7, "F");
      doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
      doc.text("Month", margin + 3, y + 5);
      doc.text("Reviews", margin + 40, y + 5);
      doc.text("Avg QS", margin + 70, y + 5);
      doc.text("Excellent", margin + 100, y + 5);
      doc.text("Good", margin + 130, y + 5);
      doc.text("Adequate", margin + 155, y + 5);
      y += 9;
      chartData.forEach((m, idx) => {
        if (y > pageH - margin - 10) { doc.addPage(); y = margin; }
        doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
        doc.rect(margin, y, contentW, 7, "F");
        doc.setTextColor(30, 30, 30); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text(m.month, margin + 3, y + 5);
        doc.text(String(m.reviews), margin + 40, y + 5);
        doc.text(m.avgQs > 0 ? String(m.avgQs) : "—", margin + 70, y + 5);
        doc.text(String(m.excellent), margin + 100, y + 5);
        doc.text(String(m.good), margin + 130, y + 5);
        doc.text(String(m.adequate), margin + 155, y + 5);
        y += 7;
      });
    }

    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7); doc.setTextColor(150, 150, 150); doc.setFont("helvetica", "normal");
      doc.text("iHeartEcho™ DIY Accreditation Tool™  |  For IAC accreditation preparation use only", margin, pageH - 8);
      doc.text(`Page ${p} of ${totalPages}`, pageW - margin - 20, pageH - 8);
    }

    const dateTag = new Date().toISOString().slice(0, 10);
    doc.save(`iHeartEcho_Lab_Report_${lab.labName.replace(/\s+/g, "_")}_${dateTag}.pdf`);
    toast.success("Lab report PDF downloaded.");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">Lab Performance Reports</h3>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-[#189aa1] text-[#189aa1] hover:bg-[#f0fbfc]" onClick={exportLabReport}>
          <Download className="w-3.5 h-3.5" />
          Export Full Lab Report PDF
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: BRAND }} /></div>
      ) : chartData.length > 0 ? (
        <>
          <Card className="border border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-gray-800">Monthly Average Quality Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [`${v}/100`]} />
                  <Line type="monotone" dataKey="avgQs" name="Avg Quality Score" stroke={BRAND} strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-gray-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-gray-800">Monthly Review Volume by Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="excellent" name="Excellent" stackId="a" fill="#16a34a" />
                  <Bar dataKey="good" name="Good" stackId="a" fill="#2563eb" />
                  <Bar dataKey="adequate" name="Adequate" stackId="a" fill="#d97706" />
                  <Bar dataKey="needsImprovement" name="Needs Improvement" stackId="a" fill="#dc2626" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-10 text-gray-400 text-sm">No monthly data yet. Submit lab peer reviews to generate reports.</div>
      )}
    </div>
  );
}

// ─── Subscription Tab ─────────────────────────────────────────────────────────
function SubscriptionTab({ lab }: { lab: any }) {
  const utils = trpc.useUtils();
  const upgradePlan = trpc.lab.upgradePlan.useMutation({
    onSuccess: () => { toast.success("Plan updated!"); utils.lab.getMyLab.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const planInfo = PLANS.find(p => p.id === lab.plan) ?? PLANS[1];
  const statusColor = lab.status === "active" ? "#16a34a" : lab.status === "trialing" ? "#2563eb" : "#dc2626";

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <Card className="border border-[#189aa1]/20">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Current Plan</div>
              <div className="text-xl font-black capitalize" style={{ color: BRAND }}>{lab.plan} Plan</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize" style={{ background: statusColor + "18", color: statusColor }}>
                  {lab.status}
                </span>
                <span className="text-xs text-gray-500">{lab.seats === 999 ? "Unlimited" : `${lab.seats} seats`}</span>
              </div>
              {lab.trialEndsAt && lab.status === "trialing" && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Trial ends {new Date(lab.trialEndsAt).toLocaleDateString()}
                </div>
              )}
              {lab.billingCycleEnd && (
                <div className="mt-1 text-xs text-gray-400">Next billing: {new Date(lab.billingCycleEnd).toLocaleDateString()}</div>
              )}
            </div>
            <div className="text-2xl font-black" style={{ color: BRAND }}>
              {PLANS.find(p => p.id === lab.plan)?.price ?? "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Change Plan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isCurrent = lab.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-xl p-4 border-2 ${isCurrent ? "shadow-md" : "border-gray-200"}`}
                style={isCurrent ? { borderColor: plan.color, background: plan.color + "08" } : {}}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: BRAND }}>MOST POPULAR</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5" style={{ color: plan.color }} />
                  <span className="font-bold text-sm text-gray-800">{plan.name}</span>
                </div>
                <div className="text-xl font-black mb-1" style={{ color: plan.color }}>{plan.price}</div>
                <div className="text-xs text-gray-500 mb-3">{plan.seats === 999 ? "Unlimited" : `Up to ${plan.seats}`} staff</div>
                <ul className="space-y-1 mb-4">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="text-center text-xs font-semibold py-1.5 rounded-lg" style={{ background: plan.color + "18", color: plan.color }}>
                    Current Plan
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="w-full text-white text-xs"
                    style={{ background: plan.color }}
                    disabled={upgradePlan.isPending}
                    onClick={() => upgradePlan.mutate({ plan: plan.id })}
                  >
                    {upgradePlan.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    {PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === lab.plan) ? "Upgrade" : "Downgrade"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">
          Stripe billing integration coming soon. Contact support for enterprise billing.
        </p>
      </div>
    </div>
  );
}

// ─── Main Lab Admin Page ──────────────────────────────────────────────────────
export default function LabAdmin() {
  const { user, loading, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<"overview" | "staff" | "analytics" | "reports" | "subscription">("overview");

  const { data: lab, isLoading: labLoading, refetch: refetchLab } = trpc.lab.getMyLab.useQuery(undefined, { enabled: isAuthenticated });
  const { data: members = [], refetch: refetchMembers } = trpc.lab.getMembers.useQuery(undefined, { enabled: !!lab });
  const { data: snapshot = [] } = trpc.lab.getStaffSnapshot.useQuery(undefined, { enabled: !!lab });

  const onRefresh = () => { refetchLab(); refetchMembers(); };

  if (loading || labLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: BRAND }} />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Building2 className="w-10 h-10 text-gray-300" />
          <p className="text-gray-500 text-sm">Sign in to access the Lab Admin Portal.</p>
          <Button className="text-white" style={{ background: BRAND }} onClick={() => window.location.href = getLoginUrl()}>
            Sign In
          </Button>
        </div>
      </Layout>
    );
  }

  if (!lab) {
    return (
      <Layout>
        <SetupWizard onCreated={() => refetchLab()} />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-5xl">
        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-black text-gray-900" style={{ fontFamily: "Merriweather, serif" }}>
              Lab Admin Portal
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">{lab.labName}</p>
          </div>
          <button onClick={onRefresh} className="p-2 rounded-lg transition-colors" style={{ color: "#189aa1" }} onMouseEnter={e => (e.currentTarget.style.background = "#f0fbfc")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto" style={{ background: "#e6f7f8" }}>
          <TabBtn active={tab === "overview"} onClick={() => setTab("overview")} icon={Building2} label="Overview" />
          <TabBtn active={tab === "staff"} onClick={() => setTab("staff")} icon={Users} label="Staff" badge={members.length} />
          <TabBtn active={tab === "analytics"} onClick={() => setTab("analytics")} icon={BarChart2} label="Analytics" />
          <TabBtn active={tab === "reports"} onClick={() => setTab("reports")} icon={FileText} label="Reports" />
          <TabBtn active={tab === "subscription"} onClick={() => setTab("subscription")} icon={CreditCard} label="Subscription" />
        </div>

        {/* Tab content */}
        {tab === "overview" && <OverviewTab lab={lab} members={members} snapshot={snapshot} />}
        {tab === "staff" && <StaffTab lab={lab} members={members} onRefresh={onRefresh} />}
        {tab === "analytics" && <AnalyticsTab members={members} snapshot={snapshot} />}
        {tab === "reports" && <ReportsTab lab={lab} members={members} snapshot={snapshot} />}
        {tab === "subscription" && <SubscriptionTab lab={lab} />}
      </div>
    </Layout>
  );
}
