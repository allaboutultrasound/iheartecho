/*
  Platform Admin — iHeartEcho
  Accessible only to users with role === "admin" (owner) or "platform_admin" role.
  Features:
  - User list with search/filter
  - Role assignment (User, Premium User, DIY Admin, DIY User, Platform Admin)
  - Role removal
  - DIY seat usage overview
*/

import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { Link } from "wouter";

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

function RoleBadge({ role }: { role: AppRole }) {
  const meta = ROLE_META[role];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
      <meta.icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

type UserWithRoles = {
  id: number;
  name: string | null;
  email: string | null;
  displayName: string | null;
  role: string;
  isPremium: boolean;
  createdAt: Date;
  lastSignedIn: Date;
  roles: AppRole[];
};

export default function PlatformAdmin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [roleToAdd, setRoleToAdd] = useState<AppRole>("premium_user");

  const { data: isAdmin, isLoading: checkingAdmin } = trpc.platformAdmin.isAdmin.useQuery(
    undefined,
    { enabled: isAuthenticated },
  );

  const {
    data: users,
    isLoading: loadingUsers,
    refetch: refetchUsers,
  } = trpc.platformAdmin.listUsers.useQuery(
    { limit: 100, offset: 0 },
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
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const removeRoleMutation = trpc.platformAdmin.removeRole.useMutation({
    onSuccess: () => {
      toast.success("Role removed.");
      refetchUsers();
    },
    onError: (err) => {
      toast.error(err.message);
    },
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
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
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
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
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
              <p className="text-sm text-gray-500">Manage users, roles, and access</p>
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
            {
              label: "Premium Users",
              value: (users ?? []).filter(u => u.roles.includes("premium_user")).length,
              icon: Crown,
              color: "#d97706",
            },
            {
              label: "DIY Admins",
              value: (users ?? []).filter(u => u.roles.includes("diy_admin")).length,
              icon: ClipboardList,
              color: "#0d9488",
            },
            {
              label: "DIY Users",
              value: (users ?? []).filter(u => u.roles.includes("diy_user")).length,
              icon: Stethoscope,
              color: "#2563eb",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: color + "18" }}>
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#189aa1]" />
                Users ({filteredUsers.length})
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
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
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                      style={{ background: "#189aa1" }}>
                      {(u.displayName ?? u.name ?? "?")[0]?.toUpperCase()}
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
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{u.email ?? "No email"}</div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {u.roles.map(role => (
                          <div key={role} className="flex items-center gap-1">
                            <RoleBadge role={role} />
                            {role !== "user" && u.role !== "admin" && (
                              <button
                                onClick={() => handleRemoveRole(u.id, role)}
                                className="text-gray-300 hover:text-red-400 transition-colors"
                                title={`Remove ${ROLE_META[role]?.label} role`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {u.roles.length === 0 && (
                          <span className="text-xs text-gray-400 italic">No roles assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
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

      {/* Add Role Dialog */}
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
              {assignRoleMutation.isPending ? "Assigning..." : "Assign Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
