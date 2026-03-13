/*
  Accreditation Manager — Reporting Dashboard
  Cross-org metrics: KPI cards, IQR trend, peer review concordance trend,
  case mix distribution, readiness progress, org comparison table.
  Brand: Teal #189aa1, Aqua #4ad9e0, Dark Navy #0e1e2e
*/
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, CheckCircle, ClipboardList, BarChart2, Activity } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const BRAND = "#189aa1";
const AQUA = "#4ad9e0";
const NAVY = "#0e1e2e";

const ORG_COLORS = [BRAND, AQUA, "#f59e0b", "#8b5cf6", "#ef4444", "#10b981", "#3b82f6", "#f97316"];

const MODALITY_LABELS: Record<string, string> = {
  ATTE: "Adult TTE",
  ATEE: "Adult TEE",
  STRESS: "Stress Echo",
  PTTE: "Pediatric TTE",
  PTEE: "Pediatric TEE",
  FETAL: "Fetal Echo",
};

const MODALITY_COLORS: Record<string, string> = {
  ATTE: BRAND,
  ATEE: AQUA,
  STRESS: "#f59e0b",
  PTTE: "#8b5cf6",
  PTEE: "#3b82f6",
  FETAL: "#ec4899",
};

function scoreColor(score: number | null) {
  if (score === null) return "text-gray-400";
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(score: number | null) {
  if (score === null) return "bg-gray-100 text-gray-400";
  if (score >= 90) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 75) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  title, value, subtitle, icon: Icon, color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof TrendingUp;
  color: string;
}) {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
            <p className="text-3xl font-black" style={{ color, fontFamily: "JetBrains Mono, monospace" }}>
              {value}
            </p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AccreditationReportingDashboard() {
  const { data: kpis, isLoading: kpisLoading } = trpc.accreditationManager.reportingKpis.useQuery();
  const { data: orgTable, isLoading: orgTableLoading } = trpc.accreditationManager.reportingOrgTable.useQuery();
  const { data: iqrTrend, isLoading: iqrLoading } = trpc.accreditationManager.reportingIqrTrend.useQuery();
  const { data: pprTrend, isLoading: pprLoading } = trpc.accreditationManager.reportingPprTrend.useQuery();
  const { data: caseMix, isLoading: caseMixLoading } = trpc.accreditationManager.reportingCaseMix.useQuery();

  // Build org name map from orgTable
  const orgNameMap = useMemo(() => {
    const m = new Map<number, string>();
    orgTable?.forEach((o) => m.set(o.id, o.name));
    return m;
  }, [orgTable]);

  // Build unique org IDs from IQR trend
  const iqrOrgIds = useMemo(() => {
    const ids = new Set<number>();
    iqrTrend?.forEach((r) => { if (r.labId) ids.add(r.labId); });
    return Array.from(ids);
  }, [iqrTrend]);

  // Build unique org IDs from PPR trend
  const pprOrgIds = useMemo(() => {
    const ids = new Set<number>();
    pprTrend?.forEach((r) => { if (r.labId) ids.add(r.labId); });
    return Array.from(ids);
  }, [pprTrend]);

  // Pivot IQR trend: [{ month, orgId: score, ... }]
  const iqrChartData = useMemo(() => {
    if (!iqrTrend) return [];
    const months = Array.from(new Set(iqrTrend.map((r) => r.month))).sort();
    return months.map((month) => {
      const row: Record<string, string | number> = { month };
      iqrTrend.filter((r) => r.month === month).forEach((r) => {
        if (r.labId) row[`org_${r.labId}`] = r.avgQualityScore;
      });
      return row;
    });
  }, [iqrTrend]);

  // Pivot PPR trend
  const pprChartData = useMemo(() => {
    if (!pprTrend) return [];
    const months = Array.from(new Set(pprTrend.map((r) => r.month))).sort();
    return months.map((month) => {
      const row: Record<string, string | number> = { month };
      pprTrend.filter((r) => r.month === month).forEach((r) => {
        if (r.labId) row[`org_${r.labId}`] = r.avgConcordanceScore;
      });
      return row;
    });
  }, [pprTrend]);

  // Case mix aggregate donut data
  const caseMixDonut = useMemo(() => {
    if (!caseMix) return [];
    const totals: Record<string, number> = {};
    caseMix.forEach((r) => {
      totals[r.modality] = (totals[r.modality] ?? 0) + r.count;
    });
    return Object.entries(totals).map(([modality, count]) => ({
      name: MODALITY_LABELS[modality] ?? modality,
      value: count,
      color: MODALITY_COLORS[modality] ?? "#94a3b8",
    }));
  }, [caseMix]);

  // Case mix per org stacked bar
  const caseMixBarData = useMemo(() => {
    if (!caseMix || !orgTable) return [];
    const orgIds = Array.from(new Set(caseMix.map((r) => r.labId).filter(Boolean))) as number[];
    return orgIds.map((orgId) => {
      const row: Record<string, string | number> = { org: orgNameMap.get(orgId) ?? `Lab ${orgId}` };
      caseMix.filter((r) => r.labId === orgId).forEach((r) => {
        row[MODALITY_LABELS[r.modality] ?? r.modality] = r.count;
      });
      return row;
    });
  }, [caseMix, orgTable, orgNameMap]);

  const modalitiesInData = useMemo(() => {
    if (!caseMix) return [];
    return Array.from(new Set(caseMix.map((r) => r.modality)));
  }, [caseMix]);

  const isLoading = kpisLoading || orgTableLoading || iqrLoading || pprLoading || caseMixLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: BRAND }} />
        <span className="ml-3 text-gray-500 text-sm">Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── KPI Summary ─────────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Platform Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            title="Total Orgs"
            value={kpis?.totalOrgs ?? 0}
            subtitle="DIY organizations"
            icon={Users}
            color={BRAND}
          />
          <KpiCard
            title="Avg Quality Score"
            value={kpis?.avgQualityScore ? `${kpis.avgQualityScore}%` : "—"}
            subtitle="IQR across all labs"
            icon={TrendingUp}
            color={kpis?.avgQualityScore && kpis.avgQualityScore >= 90 ? "#10b981" : kpis?.avgQualityScore && kpis.avgQualityScore >= 75 ? "#f59e0b" : "#ef4444"}
          />
          <KpiCard
            title="Avg Readiness"
            value={kpis?.avgReadinessPct ? `${kpis.avgReadinessPct}%` : "—"}
            subtitle="Checklist completion"
            icon={CheckCircle}
            color={kpis?.avgReadinessPct && kpis.avgReadinessPct >= 80 ? "#10b981" : "#f59e0b"}
          />
          <KpiCard
            title="Open Tasks"
            value={kpis?.openTasks ?? 0}
            subtitle="Pending / in-progress"
            icon={ClipboardList}
            color={kpis?.openTasks && kpis.openTasks > 0 ? "#f59e0b" : "#10b981"}
          />
          <KpiCard
            title="IQR Reviews"
            value={kpis?.totalIqrReviews ?? 0}
            subtitle="Total submitted"
            icon={BarChart2}
            color={BRAND}
          />
          <KpiCard
            title="Peer Reviews"
            value={kpis?.totalPeerReviews ?? 0}
            subtitle="Total submitted"
            icon={Activity}
            color={AQUA}
          />
        </div>
      </section>

      {/* ── IQR Quality Score Trend ──────────────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          IQR Quality Score — Monthly Trend (Last 12 Months)
        </h3>
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            {iqrChartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No IQR data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={iqrChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Legend formatter={(value) => value} />
                  {iqrOrgIds.map((orgId, i) => (
                    <Line
                      key={orgId}
                      type="monotone"
                      dataKey={`org_${orgId}`}
                      name={orgNameMap.get(orgId) ?? `Lab ${orgId}`}
                      stroke={ORG_COLORS[i % ORG_COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Peer Review Concordance Trend ───────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Physician Peer Review Concordance — Monthly Trend (Last 12 Months)
        </h3>
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            {pprChartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No peer review data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={pprChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Legend />
                  {pprOrgIds.map((orgId, i) => (
                    <Line
                      key={orgId}
                      type="monotone"
                      dataKey={`org_${orgId}`}
                      name={orgNameMap.get(orgId) ?? `Lab ${orgId}`}
                      stroke={ORG_COLORS[i % ORG_COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Case Mix ────────────────────────────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Case Mix Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aggregate donut */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">All Orgs — Aggregate</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {caseMixDonut.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No case mix data</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={caseMixDonut}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {caseMixDonut.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    />
                    <Legend formatter={(value) => value} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Per-org stacked bar */}
          <Card className="border border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">Per Organization</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {caseMixBarData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No case mix data</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={caseMixBarData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="org" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                    <Legend />
                    {modalitiesInData.map((mod) => (
                      <Bar
                        key={mod}
                        dataKey={MODALITY_LABELS[mod] ?? mod}
                        stackId="a"
                        fill={MODALITY_COLORS[mod] ?? "#94a3b8"}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Readiness Progress ──────────────────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Accreditation Readiness by Organization</h3>
        <Card className="border border-gray-100 shadow-sm">
          <CardContent className="p-5">
            {!orgTable || orgTable.length === 0 ? (
              <div className="flex items-center justify-center h-20 text-gray-400 text-sm">No readiness data</div>
            ) : (
              <div className="space-y-4">
                {[...orgTable]
                  .filter((o) => o.readinessPct !== null)
                  .sort((a, b) => (b.readinessPct ?? 0) - (a.readinessPct ?? 0))
                  .map((org) => (
                    <div key={org.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{org.name}</span>
                        <span
                          className={`text-sm font-bold tabular-nums ${scoreColor(org.readinessPct)}`}
                          style={{ fontFamily: "JetBrains Mono, monospace" }}
                        >
                          {org.readinessPct ?? 0}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${org.readinessPct ?? 0}%`,
                            background:
                              (org.readinessPct ?? 0) >= 90
                                ? "#10b981"
                                : (org.readinessPct ?? 0) >= 75
                                ? "#f59e0b"
                                : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                {orgTable.filter((o) => o.readinessPct === null).map((org) => (
                  <div key={org.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-400 truncate max-w-xs">{org.name}</span>
                      <span className="text-xs text-gray-400">Not started</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Org Comparison Table ────────────────────────────────────────────── */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Organization Comparison</h3>
        <Card className="border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Organization</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Plan</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Members</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">IQR Reviews</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Avg Quality</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Peer Reviews</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Avg Concordance</th>
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Readiness</th>
                </tr>
              </thead>
              <tbody>
                {orgTable?.map((org, i) => (
                  <tr key={org.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{org.name}</div>
                      {org.city && (
                        <div className="text-xs text-gray-400">{org.city}{org.state ? `, ${org.state}` : ""}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {org.plan ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                          style={{ background: BRAND + "15", color: BRAND }}>
                          {org.plan}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-gray-700">{org.memberCount}</td>
                    <td className="px-3 py-3 text-center font-mono text-gray-700">{org.iqrCount}</td>
                    <td className="px-3 py-3 text-center">
                      {org.avgQualityScore !== null ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${scoreBg(org.avgQualityScore)}`}
                          style={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {org.avgQualityScore}%
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-gray-700">{org.peerReviewCount}</td>
                    <td className="px-3 py-3 text-center">
                      {org.avgConcordanceScore !== null ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${scoreBg(org.avgConcordanceScore)}`}
                          style={{ fontFamily: "JetBrains Mono, monospace" }}>
                          {org.avgConcordanceScore}%
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {org.readinessPct !== null ? (
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${org.readinessPct}%`,
                                background: org.readinessPct >= 90 ? "#10b981" : org.readinessPct >= 75 ? "#f59e0b" : "#ef4444",
                              }}
                            />
                          </div>
                          <span className={`text-xs font-bold tabular-nums ${scoreColor(org.readinessPct)}`}
                            style={{ fontFamily: "JetBrains Mono, monospace" }}>
                            {org.readinessPct}%
                          </span>
                        </div>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
