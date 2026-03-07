/*
  Platform Admin — iHeartEcho
  Accessible only to users with role === "admin" (owner) or "platform_admin" role.
  Features:
  - Add user by email (search → preview → assign role)
  - User list with search/filter
  - Inline role assignment and removal
  - Stats overview
*/

import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Shield,
  Users,
  Search,
  UserCog,
  Crown,
  Stethoscope,
  ClipboardList,
  User,
  Trash2,
  Plus,
  RefreshCw,
  Lock,
  ChevronRight,
  UserPlus,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
} from "lucide-react";
import { Link } from "wouter";
import BulkCsvUploadPanel, { type BulkResult } from "@/components/BulkCsvUploadPanel";

type AppRole = "user" | "premium_user" | "diy_admin" | "diy_user" | "platform_admin";

const ROLE_META: Record<AppRole, { label: string; color: string; icon: React.ElementType; description: string }> = {
  user: {
    label: "User",
    color: "bg-gray-100 text-gray-700",
    icon: User,
    description: "Default role — basic access to free features",
  },
  premium_user: {
    label: "Premium User",
    color: "bg-amber-100 text-amber-700",
    icon: Crown,
    description: "Access to premium navigator features",
  },
  diy_admin: {
    label: "DIY Admin",
    color: "bg-teal-100 text-teal-700",
    icon: ClipboardList,
    description: "Manages the DIY Accreditation Tool and assigns seats",
  },
  diy_user: {
    label: "DIY User",
    color: "bg-blue-100 text-blue-700",
    icon: Stethoscope,
    description: "Seat-assigned access to the DIY Accreditation Tool",
  },
  platform_admin: {
    label: "Platform Admin",
    color: "bg-purple-100 text-purple-700",
    icon: Shield,
    description: "Full platform management access",
  },
};

function RoleBadge({ role, onRemove }: { role: AppRole; onRemove?: () => void }) {
  const meta = ROLE_META[role];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
      <meta.icon className="w-3 h-3" />
      {meta.label}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
          title={`Remove ${meta.label}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

type UserWithRoles = {
  id: number;
  name: string | null;
  email: string | null;
  displayName: string | null;
  role: string;
  createdAt: Date;
  lastSignedIn: Date;
  isPending: boolean;
  roles: AppRole[];
};

// ─── Add User by Email Panel ─────────────────────────────────────────────────

function AddUserByEmailPanel({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("premium_user");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: foundUser, isFetching, error: findError, refetch } = trpc.platformAdmin.findUserByEmail.useQuery(
    { email: submittedEmail },
    {
      enabled: !!submittedEmail,
      retry: false,
    },
  );

  const assignRoleByEmail = trpc.platformAdmin.assignRoleByEmail.useMutation({
    onSuccess: (data) => {
      if (data.wasPreRegistered) {
        toast.success(`Pre-registered ${data.displayName ?? submittedEmail} with role "${ROLE_META[selectedRole]?.label}" — role will activate on first login.`);
      } else {
        toast.success(`Role "${ROLE_META[selectedRole]?.label}" assigned to ${data.displayName ?? submittedEmail}.`);
      }
      setEmail("");
      setSubmittedEmail("");
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSearch = () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmittedEmail(trimmed);
  };

  const handleAssign = () => {
    if (!submittedEmail || !foundUser) return;
    assignRoleByEmail.mutate({ email: submittedEmail, role: selectedRole });
  };

  const handleClear = () => {
    setEmail("");
    setSubmittedEmail("");
    inputRef.current?.focus();
  };

  const alreadyHasRole = foundUser && foundUser.roles.includes(selectedRole);

  return (
    <Card className="border-0 shadow-sm mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#189aa1]" />
          Add User by Email
        </CardTitle>
        <p className="text-xs text-gray-500 mt-0.5">
          Search for a user by email and assign a role. If the user has not yet signed in, they will be pre-registered — their role will be applied automatically when they first log in.
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Email search row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="pl-9 pr-8"
            />
            {email && (
              <button
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button
            onClick={handleSearch}
            disabled={isFetching || !email.trim()}
            style={{ background: "#189aa1" }}
            className="text-white gap-2 flex-shrink-0"
          >
            {isFetching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </Button>
        </div>

        {/* Result panel */}
        {submittedEmail && !isFetching && (
          <>
            {findError ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {findError.message}
              </div>
            ) : foundUser === null ? (
              <div className="p-4 rounded-xl border border-violet-200 bg-violet-50 space-y-3">
                <div className="flex items-start gap-3">
                  <UserPlus className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-violet-800">No existing account — pre-register?</p>
                    <p className="text-xs text-violet-600 mt-0.5">
                      <strong>{submittedEmail}</strong> has not signed in yet. Select a role below and pre-register them — the role will be applied automatically on their first login.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Role to assign on first login</label>
                    <Select value={selectedRole} onValueChange={v => setSelectedRole(v as AppRole)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(ROLE_META) as [AppRole, typeof ROLE_META[AppRole]][]).map(([role, meta]) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <meta.icon className="w-3.5 h-3.5" />
                              {meta.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ROLE_META[selectedRole] && (
                      <p className="text-xs text-gray-400 mt-1">{ROLE_META[selectedRole].description}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => assignRoleByEmail.mutate({ email: submittedEmail, role: selectedRole })}
                    disabled={assignRoleByEmail.isPending}
                    className="flex-shrink-0 gap-2 text-white"
                    style={{ background: "#7c3aed" }}
                  >
                    {assignRoleByEmail.isPending ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Pre-registering…</>
                    ) : (
                      <><UserPlus className="w-4 h-4" /> Pre-register &amp; Assign</>
                    )}
                  </Button>
                </div>
              </div>
            ) : foundUser ? (
              <div className={`p-4 rounded-xl border space-y-3 ${'isPending' in foundUser && foundUser.isPending ? 'border-orange-200 bg-orange-50' : 'border-[#189aa1]/20 bg-[#189aa1]/08'}`}>
                {/* User preview */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: 'isPending' in foundUser && foundUser.isPending ? '#f97316' : '#189aa1' }}
                  >
                    {(foundUser.displayName ?? foundUser.name ?? "?")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-sm text-gray-900">
                        {foundUser.displayName ?? foundUser.name ?? foundUser.email ?? "Unknown User"}
                      </div>
                      {'isPending' in foundUser && foundUser.isPending && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          <Clock className="w-3 h-3" />
                          Pending Sign-In
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{foundUser.email}</div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {foundUser.roles.length > 0
                        ? foundUser.roles.map(r => <RoleBadge key={r} role={r} />)
                        : <span className="text-xs text-gray-400 italic">No roles yet</span>
                      }
                    </div>
                  </div>
                  {'isPending' in foundUser && foundUser.isPending
                    ? <Clock className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    : <CheckCircle2 className="w-5 h-5 text-[#189aa1] flex-shrink-0" />}
                </div>

                {/* Role selector + assign */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-600 block mb-1">Role to assign</label>
                    <Select value={selectedRole} onValueChange={v => setSelectedRole(v as AppRole)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(ROLE_META) as [AppRole, typeof ROLE_META[AppRole]][]).map(([role, meta]) => (
                          <SelectItem key={role} value={role}>
                            <div className="flex items-center gap-2">
                              <meta.icon className="w-3.5 h-3.5" />
                              {meta.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {ROLE_META[selectedRole] && (
                      <p className="text-xs text-gray-400 mt-1">{ROLE_META[selectedRole].description}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleAssign}
                    disabled={assignRoleByEmail.isPending || !!alreadyHasRole}
                    style={{ background: alreadyHasRole ? undefined : "#189aa1" }}
                    variant={alreadyHasRole ? "outline" : "default"}
                    className={`flex-shrink-0 gap-2 ${!alreadyHasRole ? "text-white" : ""}`}
                  >
                    {assignRoleByEmail.isPending ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Assigning…</>
                    ) : alreadyHasRole ? (
                      <><CheckCircle2 className="w-4 h-4" /> Already assigned</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Assign Role</>
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlatformAdmin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [roleToAdd, setRoleToAdd] = useState<AppRole>("premium_user");
  const [bulkRole, setBulkRole] = useState<AppRole>("premium_user");

  const bulkAssignRoleMutation = trpc.platformAdmin.bulkAssignRole.useMutation({
    onSuccess: () => refetchUsers(),
    onError: (err) => toast.error(err.message),
  });

  const [lastSyncResult, setLastSyncResult] = useState<{ count: number; syncedAt: Date } | null>(null);
  const [lastRegistrySyncResult, setLastRegistrySyncResult] = useState<{ count: number; syncedAt: Date } | null>(null);
  const syncCoursesMutation = trpc.platformAdmin.syncThinkificCourses.useMutation({
    onSuccess: (data) => {
      setLastSyncResult(data);
      toast.success(`Synced ${data.count} CME course${data.count !== 1 ? "s" : ""} from Thinkific.`);
    },
    onError: (err) => toast.error(`Sync failed: ${err.message}`),
  });

  const syncRegistryMutation = trpc.platformAdmin.syncRegistryCourses.useMutation({
    onSuccess: (data) => {
      setLastRegistrySyncResult(data);
      toast.success(`Synced ${data.count} Registry Review course${data.count !== 1 ? "s" : ""}.`);
    },
    onError: (err) => toast.error(`Registry sync failed: ${err.message}`),
  });

  const { data: isAdmin, isLoading: checkingAdmin } = trpc.platformAdmin.isAdmin.useQuery(
    undefined,
    { enabled: isAuthenticated },
  );

  const {
    data: users,
    isLoading: loadingUsers,
    refetch: refetchUsers,
  } = trpc.platformAdmin.listUsers.useQuery(
    { limit: 200, offset: 0 },
    { enabled: !!isAdmin },
  );

  const { data: userCount } = trpc.platformAdmin.userCount.useQuery(
    undefined,
    { enabled: !!isAdmin },
  );

  const assignRoleMutation = trpc.platformAdmin.assignRole.useMutation({
    onSuccess: () => {
      toast.success("Role assigned successfully.");
      refetchUsers();
      setAddRoleDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const removeRoleMutation = trpc.platformAdmin.removeRole.useMutation({
    onSuccess: () => {
      toast.success("Role removed.");
      refetchUsers();
    },
    onError: (err) => toast.error(err.message),
  });

  // Auth checks
  if (loading || checkingAdmin) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#189aa1]" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <Lock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Authentication Required</h2>
          <p className="text-gray-500 mb-4">Please sign in to access the admin panel.</p>
          <Link href="/"><Button variant="outline">Go Home</Button></Link>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">You do not have permission to access the Platform Admin panel.</p>
          <Link href="/"><Button variant="outline">Go Home</Button></Link>
        </div>
      </Layout>
    );
  }

  const filteredUsers = (users ?? []).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.displayName ?? "").toLowerCase().includes(q)
    );
  });

  const handleAddRole = () => {
    if (!selectedUser) return;
    assignRoleMutation.mutate({ userId: selectedUser.id, role: roleToAdd });
  };

  const handleRemoveRole = (userId: number, role: AppRole) => {
    removeRoleMutation.mutate({ userId, role });
  };

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#189aa1" }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Merriweather, serif" }}>
                Platform Admin
              </h1>
              <p className="text-sm text-gray-500">Manage users, roles, and platform access</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchUsers()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: userCount ?? 0, icon: Users, color: "#189aa1" },
            { label: "Premium Users", value: (users ?? []).filter(u => u.roles.includes("premium_user")).length, icon: Crown, color: "#d97706" },
            { label: "DIY Admins", value: (users ?? []).filter(u => u.roles.includes("diy_admin")).length, icon: ClipboardList, color: "#0d9488" },
            { label: "DIY Users", value: (users ?? []).filter(u => u.roles.includes("diy_user")).length, icon: Stethoscope, color: "#2563eb" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add User by Email */}
        <AddUserByEmailPanel onSuccess={refetchUsers} />

        {/* Bulk CSV Role Assignment */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#189aa1]" />
              Bulk Role Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <BulkCsvUploadPanel
              title="Upload a CSV of emails to assign a role in bulk"
              description="Upload a CSV or paste emails — one per line. All emails will receive the selected role. New users will be pre-registered automatically."
              submitLabel="Assign Role to All"
              isPending={bulkAssignRoleMutation.isPending}
              onSubmit={async (emails) => {
                const result = await bulkAssignRoleMutation.mutateAsync({ emails, role: bulkRole });
                return result as unknown as BulkResult;
              }}
              actionSlot={
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Role to assign to all</label>
                  <Select value={bulkRole} onValueChange={v => setBulkRole(v as AppRole)}>
                    <SelectTrigger className="h-9 text-sm w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(ROLE_META) as [AppRole, typeof ROLE_META[AppRole]][]).map(([role, meta]) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <meta.icon className="w-3.5 h-3.5" />
                            {meta.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {ROLE_META[bulkRole] && (
                    <p className="text-xs text-gray-400 mt-1">{ROLE_META[bulkRole].description}</p>
                  )}
                </div>
              }
            />
          </CardContent>
        </Card>

        {/* Sync CME Courses */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              CME Course Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">
                  Manually pull the latest course catalog from Thinkific (E-Learning &amp; CME collection).
                  The catalog also auto-syncs every 6 hours and on webhook events.
                </p>
                {lastSyncResult ? (
                  <p className="text-xs text-[#189aa1] font-medium">
                    Last sync: {lastSyncResult.count} course{lastSyncResult.count !== 1 ? "s" : ""} &mdash;{" "}
                    {new Date(lastSyncResult.syncedAt).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">No sync performed this session.</p>
                )}
              </div>
              <Button
                onClick={() => syncCoursesMutation.mutate()}
                disabled={syncCoursesMutation.isPending}
                className="flex items-center gap-2 flex-shrink-0"
                style={{ background: "#189aa1" }}
              >
                <RefreshCw className={`w-4 h-4 ${syncCoursesMutation.isPending ? "animate-spin" : ""}`} />
                {syncCoursesMutation.isPending ? "Syncing…" : "Sync Now"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Registry Review Courses */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Registry Review Course Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">
                  Manually pull the latest course catalog for the Registry Review collection.
                  The catalog also auto-syncs every 6 hours and on webhook events.
                </p>
                {lastRegistrySyncResult ? (
                  <p className="text-xs text-[#189aa1] font-medium">
                    Last sync: {lastRegistrySyncResult.count} course{lastRegistrySyncResult.count !== 1 ? "s" : ""} &mdash;{" "}
                    {new Date(lastRegistrySyncResult.syncedAt).toLocaleString()}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">No sync performed this session.</p>
                )}
              </div>
              <Button
                onClick={() => syncRegistryMutation.mutate()}
                disabled={syncRegistryMutation.isPending}
                className="flex items-center gap-2 flex-shrink-0"
                style={{ background: "#189aa1" }}
              >
                <RefreshCw className={`w-4 h-4 ${syncRegistryMutation.isPending ? "animate-spin" : ""}`} />
                {syncRegistryMutation.isPending ? "Syncing…" : "Sync Now"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Role Reference */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <UserCog className="w-4 h-4" />
              Role Definitions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.entries(ROLE_META) as [AppRole, typeof ROLE_META[AppRole]][]).map(([role, meta]) => (
                <div key={role} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                  <RoleBadge role={role} />
                  <span className="text-xs text-gray-500 leading-relaxed">{meta.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User List */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#189aa1]" />
                All Users ({filteredUsers.length})
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-5 h-5 animate-spin text-[#189aa1]" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                {search ? "No users match your search." : "No users found."}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="py-3 flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                      style={{ background: (u as UserWithRoles).isPending ? "#9ca3af" : "#189aa1" }}
                    >
                      {(u as UserWithRoles).isPending
                        ? <Clock className="w-4 h-4" />
                        : (u.displayName ?? u.name ?? "?")[0]?.toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">
                          {u.displayName ?? u.name ?? "Unknown User"}
                        </span>
                        {u.role === "admin" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <Crown className="w-3 h-3" />
                            Owner
                          </span>
                        )}
                        {(u as UserWithRoles).isPending && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            <Clock className="w-3 h-3" />
                            Pending Sign-In
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{u.email ?? "No email"}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {u.roles.map(role => (
                          <RoleBadge
                            key={role}
                            role={role}
                            onRemove={
                              role !== "user" && u.role !== "admin"
                                ? () => handleRemoveRole(u.id, role)
                                : undefined
                            }
                          />
                        ))}
                        {u.roles.length === 0 && (
                          <span className="text-xs text-gray-400 italic">No roles assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Add Role button */}
                    {u.role !== "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-shrink-0 h-7 text-xs gap-1"
                        onClick={() => {
                          setSelectedUser(u as UserWithRoles);
                          setRoleToAdd("premium_user");
                          setAddRoleDialogOpen(true);
                        }}
                      >
                        <Plus className="w-3 h-3" />
                        Add Role
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lab Seat Management Link */}
        <Card className="mt-6 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#189aa118" }}>
                  <Stethoscope className="w-4 h-4" style={{ color: "#189aa1" }} />
                </div>
                <div>
                  <div className="font-medium text-gray-800 text-sm">DIY Accreditation Seat Management</div>
                  <div className="text-xs text-gray-500">Manage per-lab seat assignments in Lab Admin</div>
                </div>
              </div>
              <Link href="/lab-admin">
                <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                  Lab Admin <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Role Dialog (from user list) */}
      <Dialog open={addRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-[#189aa1]" />
              Assign Role
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm text-gray-800">
                  {selectedUser.displayName ?? selectedUser.name ?? "Unknown User"}
                </div>
                <div className="text-xs text-gray-500">{selectedUser.email}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedUser.roles.map(r => <RoleBadge key={r} role={r} />)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Select Role to Assign</label>
                <Select value={roleToAdd} onValueChange={(v) => setRoleToAdd(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(ROLE_META) as [AppRole, typeof ROLE_META[AppRole]][])
                      .filter(([role]) => !selectedUser.roles.includes(role))
                      .map(([role, meta]) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            <meta.icon className="w-4 h-4" />
                            {meta.label}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {roleToAdd && ROLE_META[roleToAdd] && (
                  <p className="text-xs text-gray-500 mt-1.5">{ROLE_META[roleToAdd].description}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAddRole}
              disabled={assignRoleMutation.isPending}
              style={{ background: "#189aa1" }}
              className="text-white"
            >
              {assignRoleMutation.isPending ? "Assigning…" : "Assign Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
