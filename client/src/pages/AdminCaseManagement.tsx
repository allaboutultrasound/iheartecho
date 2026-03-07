/**
 * AdminCaseManagement.tsx — Admin panel for reviewing and approving/rejecting user-submitted cases.
 *
 * Shows pending submissions by default, with a tab to browse all cases.
 * Admins can preview case details, approve, or reject with a reason.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Badge,
} from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  PlayCircle,
  Shield,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type TabType = "pending" | "all";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-600",
  intermediate: "bg-blue-50 text-blue-600",
  advanced: "bg-purple-50 text-purple-600",
};

export default function AdminCaseManagement() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [tab, setTab] = useState<TabType>("pending");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected" | "all">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Preview dialog
  const [previewCase, setPreviewCase] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<{ id: number; title: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Pending cases
  const pendingQuery = trpc.caseLibrary.listPendingCases.useQuery(undefined, {
    enabled: tab === "pending",
  });

  // All cases
  const allQuery = trpc.caseLibrary.listAllCases.useQuery(
    {
      page,
      limit: 20,
      status: statusFilter === "all" ? undefined : statusFilter,
      search: search || undefined,
    },
    { enabled: tab === "all" }
  );

  const approveMutation = trpc.caseLibrary.approveCase.useMutation({
    onSuccess: () => {
      toast.success("Case approved and published.");
      utils.caseLibrary.listPendingCases.invalidate();
      utils.caseLibrary.listAllCases.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to approve case."),
  });

  const rejectMutation = trpc.caseLibrary.rejectCase.useMutation({
    onSuccess: () => {
      toast.success("Case rejected.");
      setRejectTarget(null);
      setRejectReason("");
      utils.caseLibrary.listPendingCases.invalidate();
      utils.caseLibrary.listAllCases.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to reject case."),
  });

  const deleteMutation = trpc.caseLibrary.adminDeleteCase.useMutation({
    onSuccess: () => {
      toast.success("Case deleted.");
      utils.caseLibrary.listAllCases.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to delete case."),
  });

  // Guard: admin only
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-2 font-semibold">Admin Access Required</p>
          <p className="text-sm text-gray-400">You must be an admin to view this page.</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate("/cases")}>
            Back to Case Library
          </Button>
        </div>
      </Layout>
    );
  }

  const pendingCases = pendingQuery.data ?? [];
  const allCases = allQuery.data?.cases ?? [];
  const totalPages = Math.ceil((allQuery.data?.total ?? 0) / 20);

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id });
  };

  const handleRejectSubmit = () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 5) {
      toast.error("Please provide a rejection reason (at least 5 characters).");
      return;
    }
    rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason.trim() });
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const CaseRow = ({ c, showActions = true }: { c: any; showActions?: boolean }) => (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-[#189aa1]/30 transition-all">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
        {c.mediaCount > 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-[#189aa1]/10">
            <ImageIcon className="w-6 h-6 text-[#189aa1]/60" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-gray-300" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-sm leading-snug truncate">{c.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status] ?? ""}`}>
                {c.status}
              </span>
              <span className="text-xs text-gray-400">{c.modality}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${DIFFICULTY_COLORS[c.difficulty] ?? ""}`}>
                {c.difficulty}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.summary}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
          <span>By {c.submitterName}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(c.submittedAt), { addSuffix: true })}</span>
          {c.mediaCount > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <ImageIcon className="w-3 h-3" /> {c.mediaCount}
              </span>
            </>
          )}
        </div>
        {c.rejectionReason && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
            Rejection reason: {c.rejectionReason}
          </div>
        )}
      </div>

      {showActions && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-400 hover:text-[#189aa1]"
            onClick={() => { setPreviewCase(c); setPreviewOpen(true); }}
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {c.status === "pending" && (
            <>
              <Button
                size="sm"
                className="h-8 px-3 text-xs bg-green-500 hover:bg-green-600 text-white gap-1"
                onClick={() => handleApprove(c.id)}
                disabled={approveMutation.isPending}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 gap-1"
                onClick={() => { setRejectTarget({ id: c.id, title: c.title }); setRejectReason(""); }}
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            </>
          )}
          {c.status === "approved" && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 gap-1"
              onClick={() => {
                if (confirm(`Delete "${c.title}"? This cannot be undone.`)) {
                  deleteMutation.mutate({ id: c.id });
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <XCircle className="w-3.5 h-3.5" /> Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/cases")} className="text-gray-400 hover:text-[#189aa1] transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                Case Management
              </h1>
              <p className="text-xs text-gray-400">Review and approve user-submitted echo cases</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCases.length > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                {pendingCases.length} pending
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {(["pending", "all"] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === t ? "bg-white text-[#189aa1] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "pending" ? "Pending Review" : "All Cases"}
              {t === "pending" && pendingCases.length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {pendingCases.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Pending Tab ──────────────────────────────────────────────────── */}
        {tab === "pending" && (
          <div>
            {pendingQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : pendingCases.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p className="text-gray-500 font-medium">No pending submissions</p>
                <p className="text-sm text-gray-400 mt-1">All cases have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCases.map((c: any) => (
                  <CaseRow key={c.id} c={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── All Cases Tab ─────────────────────────────────────────────────── */}
        {tab === "all" && (
          <div>
            {/* Filters */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by title or diagnosis…"
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleSearch} className="gap-1.5">
                <Search className="w-4 h-4" /> Search
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => utils.caseLibrary.listAllCases.invalidate()}
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </Button>
            </div>

            {allQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : allCases.length === 0 ? (
              <div className="text-center py-16">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 font-medium">No cases found</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {allCases.map((c: any) => (
                    <CaseRow key={c.id} c={c} />
                  ))}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Preview Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base leading-snug pr-6">{previewCase?.title}</DialogTitle>
          </DialogHeader>
          {previewCase && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[previewCase.status] ?? ""}`}>
                  {previewCase.status}
                </span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{previewCase.modality}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLORS[previewCase.difficulty] ?? ""}`}>
                  {previewCase.difficulty}
                </span>
                <span className="text-xs text-gray-400">by {previewCase.submitterName}</span>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Summary</p>
                <p className="text-gray-700 leading-relaxed">{previewCase.summary}</p>
              </div>

              {previewCase.clinicalHistory && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Clinical History</p>
                  <p className="text-gray-700 leading-relaxed">{previewCase.clinicalHistory}</p>
                </div>
              )}

              {previewCase.diagnosis && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Diagnosis</p>
                  <p className="text-gray-700 font-medium">{previewCase.diagnosis}</p>
                </div>
              )}

              {previewCase.teachingPoints && (() => {
                try {
                  const pts = JSON.parse(previewCase.teachingPoints);
                  if (pts.length > 0) return (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Teaching Points</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {pts.map((pt: string, i: number) => (
                          <li key={i} className="text-gray-700 text-xs">{pt}</li>
                        ))}
                      </ul>
                    </div>
                  );
                } catch {}
                return null;
              })()}

              {previewCase.tags && (() => {
                try {
                  const tags = JSON.parse(previewCase.tags);
                  if (tags.length > 0) return (
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t: string) => (
                        <span key={t} className="text-xs bg-[#189aa1]/10 text-[#189aa1] px-2 py-0.5 rounded-full">#{t}</span>
                      ))}
                    </div>
                  );
                } catch {}
                return null;
              })()}

              {previewCase.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"
                    onClick={() => {
                      handleApprove(previewCase.id);
                      setPreviewOpen(false);
                    }}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve Case
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-2"
                    onClick={() => {
                      setPreviewOpen(false);
                      setRejectTarget({ id: previewCase.id, title: previewCase.title });
                      setRejectReason("");
                    }}
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Reject Case
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              You are rejecting: <strong className="text-gray-800">{rejectTarget?.title}</strong>
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this case is being rejected (e.g. contains PHI, insufficient de-identification, incomplete information)…"
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-gray-400 mt-1">{rejectReason.length}/1000</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white gap-2"
              onClick={handleRejectSubmit}
              disabled={rejectMutation.isPending || rejectReason.trim().length < 5}
            >
              <XCircle className="w-4 h-4" />
              {rejectMutation.isPending ? "Rejecting…" : "Reject Case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
