/*
  Profile Page — iHeartEcho
  Allows logged-in users to edit their display name and email,
  and view their active subscriptions with links to manage them.
*/
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { User, Mail, Edit3, Save, X, CheckCircle, ExternalLink, Award, Shield, Star, ClipboardList } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ROLE_CONFIG: Record<string, {
  label: string;
  description: string;
  color: string;
  icon: React.ElementType;
  manageUrl?: string;
  manageLabel?: string;
}> = {
  premium_user: {
    label: "Premium",
    description: "Access to TEE, ICE, Strain & Device Navigators and premium EchoAssist modules.",
    color: "#189aa1",
    icon: Star,
    manageUrl: "https://member.allaboutultrasound.com/bundles/premium",
    manageLabel: "Manage Premium Subscription",
  },
  diy_user: {
    label: "DIY Accreditation",
    description: "Access to the DIY Accreditation Tool for lab accreditation preparation.",
    color: "#f59e0b",
    icon: Award,
    manageUrl: "https://member.allaboutultrasound.com/bundles/diy-accreditation",
    manageLabel: "Manage DIY Subscription",
  },
  diy_admin: {
    label: "Lab Admin",
    description: "Lab administrator access — manage staff, cases, and accreditation readiness.",
    color: "#f97316",
    icon: ClipboardList,
  },
  platform_admin: {
    label: "Platform Admin",
    description: "Full platform administration access.",
    color: "#a78bfa",
    icon: Shield,
  },
};

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  // Populate form when user loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully.");
      setEditMode(false);
      utils.auth.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile.");
    },
  });

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (loading || !user) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#189aa1] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const roles = (user as any).appRoles as string[] | undefined ?? [];
  const activeSubscriptions = roles.filter(r => ROLE_CONFIG[r]);

  const handleSave = () => {
    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) { toast.error("Display name cannot be empty."); return; }
    updateProfile.mutate({
      displayName: trimmedName !== (user.displayName || user.name || "") ? trimmedName : undefined,
      email: trimmedEmail !== (user.email || "") ? trimmedEmail : undefined,
    });
  };

  const handleCancel = () => {
    setDisplayName(user.displayName || user.name || "");
    setEmail(user.email || "");
    setEditMode(false);
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
            My Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account details and subscriptions.</p>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-6"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #189aa1, #4ad9e0)" }}>
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">
                  {user.displayName || user.name || "Account"}
                </div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
            </div>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#189aa1] border border-[#189aa1]/30 hover:bg-[#f0fbfc] transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #189aa1, #4ad9e0)" }}
                >
                  {updateProfile.isPending ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Form fields */}
          <div className="px-6 py-5 space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Display Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#189aa1]/40 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#189aa1]/30 bg-[#f0fbfc]"
                  placeholder="Your display name"
                />
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700">
                  <User className="w-3.5 h-3.5 text-[#189aa1]" />
                  {user.displayName || user.name || <span className="text-gray-400 italic">Not set</span>}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
              {editMode ? (
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#189aa1]/40 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#189aa1]/30 bg-[#f0fbfc]"
                  placeholder="your@email.com"
                />
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-700">
                  <Mail className="w-3.5 h-3.5 text-[#189aa1]" />
                  {user.email || <span className="text-gray-400 italic">Not set</span>}
                </div>
              )}
              {editMode && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Updating your email here changes it in iHeartEcho only. Your Thinkific account email is managed separately on allaboutultrasound.com.
                </p>
              )}
            </div>

            {/* Account ID (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account ID</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-400 font-mono">
                #{user.id}
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
              My Subscriptions
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Your active access levels and plans.</p>
          </div>

          <div className="px-6 py-5">
            {activeSubscriptions.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Award className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-1">No active subscriptions</p>
                <p className="text-xs text-gray-400 mb-4">Unlock premium features and DIY accreditation tools.</p>
                <a
                  href="https://member.allaboutultrasound.com/collections/cme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #189aa1, #4ad9e0)" }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Browse Plans
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSubscriptions.map(roleKey => {
                  const config = ROLE_CONFIG[roleKey];
                  const Icon = config.icon;
                  return (
                    <div key={roleKey}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                      style={{ borderColor: config.color + "30", background: config.color + "08" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: config.color + "20" }}>
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold" style={{ color: config.color }}>{config.label}</span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                            <CheckCircle className="w-2.5 h-2.5" /> Active
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{config.description}</p>
                        {config.manageUrl && (
                          <a
                            href={config.manageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold hover:underline"
                            style={{ color: config.color }}
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {config.manageLabel}
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Upgrade prompt if no premium */}
                {!roles.includes("premium_user") && !roles.includes("diy_user") && !roles.includes("diy_admin") && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                    <a
                      href="https://member.allaboutultrasound.com/collections/cme"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #189aa1, #4ad9e0)" }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Explore More Plans
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
