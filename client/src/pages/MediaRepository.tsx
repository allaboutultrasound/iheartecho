/*
  Media Repository — iHeartEcho™ Platform Admin
  ─────────────────────────────────────────────
  Features:
  - Thumbnail grid with visual previews for images/video/audio/documents
  - Folder sidebar for organizing assets by course, module, or topic
  - Upload dialog (base64 → S3 via tRPC)
  - Asset detail panel: metadata, versions, access rules, embed code
  - Analytics panel: view/play counts, daily breakdown chart, recent access log
  - Email invite for private assets
*/
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import {
  Upload,
  Folder,
  FolderPlus,
  FolderOpen,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  File,
  Globe,
  Lock,
  Search,
  Copy,
  Mail,
  Eye,
  Code2,
  X,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Play,
  Download,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type MediaType = "image" | "audio" | "video" | "html" | "scorm" | "zip" | "lms" | "document" | "other";
type AccessMode = "public" | "private";

interface AssetRow {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  mediaType: MediaType;
  originalFilename: string | null;
  tags: string[];
  accessMode: AccessMode;
  folderId: number | null;
  currentVersionId: number | null;
  currentVersionUrl: string | null;
  currentVersionMime: string | null;
  serveUrl: string;
  viewUrl: string;
  downloadUrl: string;
  embedUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FolderRow {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  sortOrder: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BRAND = "#189aa1";

const MEDIA_TYPE_ICONS: Record<MediaType, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
  html: Globe,
  scorm: Globe,
  zip: File,
  lms: Globe,
  document: FileText,
  other: File,
};

const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  html: "HTML",
  scorm: "SCORM",
  zip: "ZIP",
  lms: "LMS",
  document: "Document",
  other: "Other",
};

const MEDIA_TYPE_BG: Record<MediaType, string> = {
  image: "#f0fbfc", video: "#1a2e3b", audio: "#f5f0ff", html: "#f0f9ff",
  scorm: "#f0f9ff", zip: "#fef9f0", lms: "#f0f9ff", document: "#fff5f0", other: "#f8fafc",
};

const MEDIA_TYPE_COLOR: Record<MediaType, string> = {
  image: BRAND, video: "#4ad9e0", audio: "#7c3aed", html: "#0891b2",
  scorm: "#0891b2", zip: "#d97706", lms: "#0891b2", document: "#e05d3a", other: "#64748b",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Thumbnail ─────────────────────────────────────────────────────────────────
function AssetThumbnail({ asset, size = "md" }: { asset: AssetRow; size?: "sm" | "md" | "lg" }) {
  const [imgError, setImgError] = useState(false);
  const Icon = MEDIA_TYPE_ICONS[asset.mediaType];
  const dim = size === "sm" ? "h-14 w-14" : size === "lg" ? "h-32 w-full" : "h-24 w-full";

  if (asset.mediaType === "image" && asset.currentVersionUrl && !imgError) {
    return (
      <div className={`${dim} overflow-hidden bg-gray-100 flex-shrink-0`}>
        <img
          src={asset.currentVersionUrl}
          alt={asset.title}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  if (asset.mediaType === "video" && asset.currentVersionUrl) {
    return (
      <div className={`${dim} overflow-hidden bg-gray-900 flex-shrink-0 relative flex items-center justify-center`}>
        <video
          src={asset.currentVersionUrl}
          className="w-full h-full object-cover opacity-60"
          muted
          preload="metadata"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="w-8 h-8 text-white drop-shadow-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${dim} flex-shrink-0 flex items-center justify-center`}
      style={{ background: MEDIA_TYPE_BG[asset.mediaType] }}
    >
      <Icon className="w-8 h-8" style={{ color: MEDIA_TYPE_COLOR[asset.mediaType] }} />
    </div>
  );
}

// ─── Folder Sidebar ────────────────────────────────────────────────────────────
function FolderSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  assetCounts,
}: {
  folders: FolderRow[];
  selectedFolderId: number | null | undefined;
  onSelectFolder: (id: number | null | undefined) => void;
  onCreateFolder: (name: string) => void;
  onDeleteFolder: (id: number) => void;
  assetCounts: Record<string, number>;
}) {
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const totalCount = Object.values(assetCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Folders</p>
        <button
          onClick={() => onSelectFolder(undefined)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
            selectedFolderId === undefined ? "bg-[#f0fbfc] text-[#189aa1] font-semibold" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Folder className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left truncate">All Assets</span>
          <span className="text-xs text-gray-400">{totalCount}</span>
        </button>
        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
            selectedFolderId === null ? "bg-[#f0fbfc] text-[#189aa1] font-semibold" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <File className="w-4 h-4 flex-shrink-0 text-gray-400" />
          <span className="flex-1 text-left truncate">Unfiled</span>
          <span className="text-xs text-gray-400">{assetCounts["null"] ?? 0}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
              selectedFolderId === folder.id ? "bg-[#f0fbfc] text-[#189aa1] font-semibold" : "text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => onSelectFolder(folder.id)}
          >
            <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: BRAND }} />
            <span className="flex-1 truncate">{folder.name}</span>
            <span className="text-xs text-gray-400">{assetCounts[folder.id] ?? 0}</span>
            <button
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 hover:text-red-500 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete folder "${folder.name}"? Assets will be moved to Unfiled.`)) {
                  onDeleteFolder(folder.id);
                }
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-gray-100">
        {showNewFolder ? (
          <div className="flex gap-1">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  onCreateFolder(newFolderName.trim());
                  setNewFolderName("");
                  setShowNewFolder(false);
                }
                if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); }
              }}
              autoFocus
            />
            <Button
              size="sm"
              className="h-7 px-2"
              style={{ background: BRAND }}
              onClick={() => {
                if (newFolderName.trim()) {
                  onCreateFolder(newFolderName.trim());
                  setNewFolderName("");
                  setShowNewFolder(false);
                }
              }}
            >
              <CheckCircle2 className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-gray-500 hover:text-[#189aa1]"
            onClick={() => setShowNewFolder(true)}
          >
            <FolderPlus className="w-3.5 h-3.5 mr-1" />
            New Folder
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Analytics Chart ──────────────────────────────────────────────────────────
function AnalyticsChart({ data }: { data: { date: string; serve: number; embed: number }[] }) {
  if (!data.length) {
    return <div className="h-24 flex items-center justify-center text-xs text-gray-400">No access data yet</div>;
  }
  const maxVal = Math.max(...data.map((d) => d.serve + d.embed), 1);
  return (
    <div className="flex items-end gap-0.5 h-20 w-full">
      {data.slice(-30).map((d) => {
        const total = d.serve + d.embed;
        const heightPct = (total / maxVal) * 100;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div
              className="w-full rounded-sm"
              style={{ height: `${Math.max(heightPct, 4)}%`, background: BRAND, opacity: 0.8 }}
            />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
              {d.date}: {total} views
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Asset Detail Panel ────────────────────────────────────────────────────────
function AssetDetailPanel({
  assetId,
  onClose,
  folders,
}: {
  assetId: number;
  onClose: () => void;
  folders: FolderRow[];
}) {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<"info" | "versions" | "access" | "analytics" | "embed">("info");
  const [inviteEmail, setInviteEmail] = useState("");
  const [embedWidth, setEmbedWidth] = useState("100%");
  const [embedHeight, setEmbedHeight] = useState("480px");
  const [copiedCode, setCopiedCode] = useState(false);

  const { data, isLoading } = trpc.media.getAsset.useQuery({ assetId });
  const { data: analytics } = trpc.media.getAssetAnalytics.useQuery({ assetId });
  const { data: embedData } = trpc.media.getEmbedCode.useQuery({ assetId, width: embedWidth, height: embedHeight });

  const promoteVersion = trpc.media.promoteVersion.useMutation({
    onSuccess: () => { toast.success("Version promoted"); utils.media.getAsset.invalidate({ assetId }); },
  });
  const inviteMutation = trpc.media.inviteByEmail.useMutation({
    onSuccess: () => { toast.success(`Invite sent to ${inviteEmail}`); setInviteEmail(""); utils.media.getAsset.invalidate({ assetId }); },
    onError: (e) => toast.error(e.message),
  });
  const revokeMutation = trpc.media.revokeAccess.useMutation({
    onSuccess: () => { toast.success("Access revoked"); utils.media.getAsset.invalidate({ assetId }); },
  });
  const updateAsset = trpc.media.updateAsset.useMutation({
    onSuccess: () => { toast.success("Updated"); utils.media.getAsset.invalidate({ assetId }); },
  });

  const copyToClipboard = (text: string, label = "Copied!") => {
    navigator.clipboard.writeText(text);
    toast.success(label);
  };

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#189aa1]" />
      </div>
    );
  }

  const { asset, versions, accessRules, serveUrl, viewUrl, downloadUrl, embedUrl } = data;

  const tabs = [
    { id: "info" as const, label: "Info" },
    { id: "versions" as const, label: `Versions (${versions.length})` },
    { id: "access" as const, label: `Access (${accessRules.length})` },
    { id: "analytics" as const, label: "Analytics" },
    { id: "embed" as const, label: "Embed" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{asset.title}</p>
          <p className="text-xs text-gray-400 capitalize">{asset.mediaType} · {asset.accessMode}</p>
        </div>
        <Badge
          variant="outline"
          className="text-xs flex items-center"
          style={{
            borderColor: asset.accessMode === "public" ? "#10b981" : "#f59e0b",
            color: asset.accessMode === "public" ? "#10b981" : "#f59e0b",
          }}
        >
          {asset.accessMode === "public" ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
          {asset.accessMode}
        </Badge>
      </div>

      {/* Thumbnail */}
      <div className="px-4 pt-3">
        <AssetThumbnail asset={asset as AssetRow} size="lg" />
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-100 px-4 mt-3 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#189aa1] text-[#189aa1]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* INFO */}
        {activeTab === "info" && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Title</p>
              <p className="text-sm font-medium text-gray-800">{asset.title}</p>
            </div>
            {asset.description && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-600">{asset.description}</p>
              </div>
            )}
            {asset.tags && (asset.tags as string[]).length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {(asset.tags as string[]).map((tag) => (
                    <span key={tag} className="text-xs bg-[#f0fbfc] text-[#189aa1] px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-1">Folder</p>
              <Select
                value={(asset.folderId ?? "none").toString()}
                onValueChange={(v) => updateAsset.mutate({ assetId: asset.id, folderId: v === "none" ? null : parseInt(v) })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Unfiled —</SelectItem>
                  {folders.map((f) => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Access Mode</p>
              <Select
                value={asset.accessMode}
                onValueChange={(v) => updateAsset.mutate({ assetId: asset.id, accessMode: v as AccessMode })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public (anyone with link)</SelectItem>
                  <SelectItem value="private">Private (email invite only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">View URL (opens inline in browser)</p>
              <div className="flex gap-1">
                <Input value={viewUrl ?? serveUrl} readOnly className="h-7 text-xs font-mono" />
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => copyToClipboard(viewUrl ?? serveUrl, "View URL copied")}>
                  <Copy className="w-3 h-3" />
                </Button>
                <a href={viewUrl ?? serveUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="h-7 px-2" title="Open in browser"><ExternalLink className="w-3 h-3" /></Button>
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Download URL (forces file download)</p>
              <div className="flex gap-1">
                <Input value={downloadUrl ?? (serveUrl + "/download")} readOnly className="h-7 text-xs font-mono" />
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => copyToClipboard(downloadUrl ?? (serveUrl + "/download"), "Download URL copied")}>
                  <Copy className="w-3 h-3" />
                </Button>
                <a href={downloadUrl ?? (serveUrl + "/download")} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="h-7 px-2" title="Download file"><Download className="w-3 h-3" /></Button>
                </a>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Embed URL</p>
              <div className="flex gap-1">
                <Input value={embedUrl} readOnly className="h-7 text-xs font-mono" />
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => copyToClipboard(embedUrl, "Embed URL copied")}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-400 space-y-0.5">
              <p>Created: {formatDate(asset.createdAt)}</p>
              <p>Updated: {formatDate(asset.updatedAt)}</p>
            </div>
          </div>
        )}

        {/* VERSIONS */}
        {activeTab === "versions" && (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className={`p-3 rounded-lg border text-xs ${
                  v.id === asset.currentVersionId ? "border-[#189aa1] bg-[#f0fbfc]" : "border-gray-100 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-800">
                    v{v.versionNumber}
                    {v.id === asset.currentVersionId && (
                      <span className="ml-2 text-[#189aa1] font-bold">● Active</span>
                    )}
                  </span>
                  <span className="text-gray-400">{formatDate(v.createdAt)}</span>
                </div>
                <p className="text-gray-500 truncate">{v.originalFilename ?? "—"}</p>
                <p className="text-gray-400">{formatBytes(v.fileSizeBytes)}</p>
                {v.changeNote && <p className="text-gray-500 mt-1 italic">{v.changeNote}</p>}
                {v.id !== asset.currentVersionId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 h-6 text-xs"
                    onClick={() => promoteVersion.mutate({ assetId: asset.id, versionId: v.id })}
                  >
                    Promote to Active
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ACCESS */}
        {activeTab === "access" && (
          <div className="space-y-4">
            {asset.accessMode === "private" && (
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Invite by Email</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && inviteEmail) {
                        inviteMutation.mutate({ assetId: asset.id, email: inviteEmail });
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    style={{ background: BRAND }}
                    disabled={!inviteEmail || inviteMutation.isPending}
                    onClick={() => inviteMutation.mutate({ assetId: asset.id, email: inviteEmail })}
                  >
                    <Mail className="w-3 h-3 mr-1" /> Invite
                  </Button>
                </div>
              </div>
            )}
            {accessRules.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {asset.accessMode === "public" ? "Public asset — no invite rules needed" : "No invites sent yet"}
              </p>
            ) : (
              <div className="space-y-2">
                {accessRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                      rule.revokedAt ? "border-red-100 bg-red-50 opacity-60" : "border-gray-100 bg-white"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-700 truncate">{rule.email}</p>
                      <p className="text-gray-400">
                        {rule.revokedAt
                          ? `Revoked ${formatDate(rule.revokedAt)}`
                          : rule.expiresAt
                          ? `Expires ${formatDate(rule.expiresAt)}`
                          : "No expiry"}
                      </p>
                    </div>
                    {!rule.revokedAt && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(`${serveUrl}?token=${rule.accessToken}`, "Private link copied")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                          onClick={() => revokeMutation.mutate({ ruleId: rule.id })}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === "analytics" && analytics && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Total Views", value: analytics.total, icon: Eye },
                { label: "Direct Serves", value: analytics.totalServe, icon: ExternalLink },
                { label: "Embed Loads", value: analytics.totalEmbed, icon: Code2 },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-[#f0fbfc] rounded-lg p-2.5 text-center">
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: BRAND }} />
                  <p className="text-lg font-bold" style={{ color: BRAND }}>{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Last 30 Days</p>
              <AnalyticsChart data={analytics.dailyBreakdown} />
            </div>
            {analytics.recentAccess.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">Recent Access</p>
                <div className="space-y-1">
                  {analytics.recentAccess.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-xs text-gray-500">
                      <span
                        className="px-1.5 py-0.5 rounded text-white text-xs"
                        style={{ background: log.accessType === "embed" ? "#7c3aed" : BRAND }}
                      >
                        {log.accessType}
                      </span>
                      <span className="flex-1 truncate">{log.referer ?? log.ipAddress ?? "—"}</span>
                      <span className="text-gray-400 flex-shrink-0">
                        {new Date(log.accessedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EMBED */}
        {activeTab === "embed" && embedData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Width</p>
                <Input value={embedWidth} onChange={(e) => setEmbedWidth(e.target.value)} className="h-8 text-xs" placeholder="100%" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Height</p>
                <Input value={embedHeight} onChange={(e) => setEmbedHeight(e.target.value)} className="h-8 text-xs" placeholder="480px" />
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Embed Code</p>
              <div className="relative">
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
                  {embedData.code}
                </pre>
                <Button
                  size="sm"
                  className="absolute top-2 right-2 h-6 text-xs"
                  style={{ background: BRAND }}
                  onClick={() => {
                    copyToClipboard(embedData.code, "Embed code copied!");
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                >
                  {copiedCode ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Preview</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50" style={{ height: "200px" }}>
                <iframe
                  src={embedData.embedUrl}
                  width="100%"
                  height="200"
                  frameBorder="0"
                  title="Embed preview"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upload Dialog ─────────────────────────────────────────────────────────────
function UploadDialog({
  open,
  onClose,
  folderId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  folderId?: number | null;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [accessMode, setAccessMode] = useState<AccessMode>("private");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createAsset = trpc.media.createAsset.useMutation({
    onSuccess: () => {
      toast.success("Asset uploaded successfully");
      onSuccess();
      onClose();
      resetForm();
    },
    onError: (e) => { toast.error(e.message); setUploading(false); },
  });

  function resetForm() {
    setTitle(""); setDescription(""); setTags(""); setAccessMode("private"); setFile(null); setUploading(false);
  }

  const handleFile = (f: File) => { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result as string).split(",")[1];
      createAsset.mutate({
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        accessMode,
        folderId: folderId ?? undefined,
        fileBase64: b64,
        mimeType: file.type || undefined,
        fileSizeBytes: file.size,
        originalFilename: file.name,
        changeNote: "Initial upload",
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); resetForm(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" style={{ color: BRAND }} />
            Upload Media Asset
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              dragOver ? "border-[#189aa1] bg-[#f0fbfc]" : "border-gray-200 hover:border-[#189aa1]"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <div className="flex items-center gap-3 justify-center">
                <File className="w-8 h-8" style={{ color: BRAND }} />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                </div>
                <button
                  className="ml-2 p-1 rounded hover:bg-red-50 text-red-400"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-500">Drop a file here or click to browse</p>
                <p className="text-xs text-gray-400 mt-1">Images, video, audio, PDF, HTML, ZIP</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Title *</p>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Asset title" className="h-9" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Description</p>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" className="h-9" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Tags (comma-separated)</p>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. TTE, Adult Echo, Module 3" className="h-9" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Access Mode</p>
            <Select value={accessMode} onValueChange={(v) => setAccessMode(v as AccessMode)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (email invite only)</SelectItem>
                <SelectItem value="public">Public (anyone with link)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); resetForm(); }}>Cancel</Button>
          <Button disabled={!file || !title.trim() || uploading} style={{ background: BRAND }} onClick={handleSubmit}>
            {uploading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading…</>
              : <><Upload className="w-4 h-4 mr-2" />Upload</>
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MediaRepository() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaType | "all">("all");
  const [accessFilter, setAccessFilter] = useState<AccessMode | "all">("all");
  const [selectedFolderId, setSelectedFolderId] = useState<number | null | undefined>(undefined);
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: assetsData, isLoading: assetsLoading, refetch: refetchAssets } = trpc.media.listAssets.useQuery({
    search: debouncedSearch || undefined,
    mediaType: mediaTypeFilter !== "all" ? mediaTypeFilter : undefined,
    accessMode: accessFilter !== "all" ? accessFilter : undefined,
    folderId: selectedFolderId,
    limit: 100,
    offset: 0,
  });

  const { data: folders = [], refetch: refetchFolders } = trpc.media.listFolders.useQuery();
  const { data: analyticsSummary } = trpc.media.getAnalyticsSummary.useQuery();

  const createFolder = trpc.media.createFolder.useMutation({
    onSuccess: () => { refetchFolders(); toast.success("Folder created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteFolder = trpc.media.deleteFolder.useMutation({
    onSuccess: () => { refetchFolders(); refetchAssets(); toast.success("Folder deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const assets: AssetRow[] = (assetsData?.assets ?? []) as AssetRow[];
  const total = assetsData?.total ?? 0;

  // Build per-folder asset counts for the sidebar
  const assetCounts: Record<string, number> = { null: 0 };
  for (const a of assets) {
    if (a.folderId === null || a.folderId === undefined) {
      assetCounts["null"] = (assetCounts["null"] ?? 0) + 1;
    } else {
      assetCounts[a.folderId] = (assetCounts[a.folderId] ?? 0) + 1;
    }
  }

  return (
    <Layout>
      <div className="flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>
        {/* Page header */}
        <div
          className="border-b border-gray-100 px-6 py-4"
          style={{ background: "linear-gradient(135deg, #0e1e2e 0%, #0e4a50 100%)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-white" style={{ fontFamily: "Merriweather, serif" }}>
                Media Repository
              </h1>
              <p className="text-sm text-white/60 mt-0.5">
                {total} asset{total !== 1 ? "s" : ""} · Upload, organize, and share media with embed links
              </p>
            </div>
            <Button className="flex items-center gap-2" style={{ background: "#189aa1" }} onClick={() => setShowUpload(true)}>
              <Upload className="w-4 h-4" />
              Upload Asset
            </Button>
          </div>
        </div>

        {/* Body: sidebar + main */}
        <div className="flex flex-1 overflow-hidden">
          <FolderSidebar
            folders={folders as FolderRow[]}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            onCreateFolder={(name) => createFolder.mutate({ name })}
            onDeleteFolder={(id) => deleteFolder.mutate({ folderId: id })}
            assetCounts={assetCounts}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Asset grid */}
            <div className={`flex flex-col flex-1 overflow-hidden ${selectedAssetId ? "border-r border-gray-100" : ""}`}>
              {/* Filter bar */}
              <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-white flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search assets…"
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <Select value={mediaTypeFilter} onValueChange={(v) => setMediaTypeFilter(v as any)}>
                  <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {(Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((t) => (
                      <SelectItem key={t} value={t}>{MEDIA_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={accessFilter} onValueChange={(v) => setAccessFilter(v as any)}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="All access" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All access</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => refetchAssets()}>
                  <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                </Button>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {assetsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-[#189aa1]" />
                  </div>
                ) : assets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <Upload className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-500">No assets found</p>
                    <p className="text-xs text-gray-400 mt-1">Upload your first asset to get started</p>
                    <Button size="sm" className="mt-3" style={{ background: BRAND }} onClick={() => setShowUpload(true)}>
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Asset
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {assets.map((asset) => {
                      const views = (analyticsSummary as any)?.[asset.id]?.total ?? 0;
                      const isSelected = selectedAssetId === asset.id;
                      return (
                        <div
                          key={asset.id}
                          className={`group rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? "border-[#189aa1] shadow-md ring-1 ring-[#189aa1]/20"
                              : "border-gray-100 hover:border-gray-200"
                          } bg-white overflow-hidden`}
                          onClick={() => setSelectedAssetId(isSelected ? null : asset.id)}
                        >
                          <AssetThumbnail asset={asset} size="lg" />
                          <div className="p-2.5">
                            <p className="text-xs font-semibold text-gray-800 truncate leading-snug">{asset.title}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-400 capitalize">{asset.mediaType}</span>
                              <div className="flex items-center gap-1">
                                {asset.accessMode === "public"
                                  ? <Globe className="w-3 h-3 text-emerald-500" />
                                  : <Lock className="w-3 h-3 text-amber-500" />
                                }
                                {views > 0 && (
                                  <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                    <Eye className="w-2.5 h-2.5" />{views}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Quick-action buttons */}
                            <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                              <a
                                href={asset.viewUrl ?? asset.serveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View in browser"
                                className="flex-1"
                              >
                                <button className="w-full flex items-center justify-center gap-1 text-xs py-1 rounded border border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1] text-gray-500 transition-colors">
                                  <ExternalLink className="w-3 h-3" /> View
                                </button>
                              </a>
                              <a
                                href={asset.downloadUrl ?? (asset.serveUrl + "/download")}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Download file"
                                className="flex-1"
                              >
                                <button className="w-full flex items-center justify-center gap-1 text-xs py-1 rounded border border-gray-200 hover:border-[#189aa1] hover:text-[#189aa1] text-gray-500 transition-colors">
                                  <Download className="w-3 h-3" /> Download
                                </button>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Detail panel */}
            {selectedAssetId && (
              <div className="w-80 flex-shrink-0 bg-white overflow-hidden flex flex-col border-l border-gray-100">
                <AssetDetailPanel
                  assetId={selectedAssetId}
                  onClose={() => setSelectedAssetId(null)}
                  folders={folders as FolderRow[]}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <UploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        folderId={typeof selectedFolderId === "number" ? selectedFolderId : undefined}
        onSuccess={() => refetchAssets()}
      />
    </Layout>
  );
}
