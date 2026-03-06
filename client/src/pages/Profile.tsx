/*
  Profile Page — iHeartEcho
  Allows logged-in users to edit their display name, email, and profile photo,
  and view their active subscriptions with links to manage them.
*/
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { User, Mail, Edit3, Save, X, CheckCircle, ExternalLink, Award, Shield, Star, ClipboardList, Camera, Upload } from "lucide-react";
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

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type AcceptedMime = (typeof ACCEPTED_TYPES)[number];

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  // Avatar upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarDataUri, setAvatarDataUri] = useState<string | null>(null);
  const [avatarMime, setAvatarMime] = useState<AcceptedMime | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

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

  const uploadAvatar = trpc.auth.uploadAvatar.useMutation({
    onSuccess: (data) => {
      toast.success("Profile photo updated.");
      setAvatarPreview(null);
      setAvatarDataUri(null);
      setAvatarMime(null);
      setAvatarUploading(false);
      utils.auth.me.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to upload photo.");
      setAvatarUploading(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type as AcceptedMime)) {
      toast.error("Please select a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUri = ev.target?.result as string;
      setAvatarPreview(dataUri);
      setAvatarDataUri(dataUri);
      setAvatarMime(file.type as AcceptedMime);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleAvatarUpload = () => {
    if (!avatarDataUri || !avatarMime) return;
    setAvatarUploading(true);
    uploadAvatar.mutate({ dataUri: avatarDataUri, mimeType: avatarMime });
  };

  const handleAvatarCancel = () => {
    setAvatarPreview(null);
    setAvatarDataUri(null);
    setAvatarMime(null);
  };

  // Current avatar: preview (pending upload) > saved avatarUrl > initials fallback
  const currentAvatarUrl = (user as any).avatarUrl as string | undefined;
  const displayAvatar = avatarPreview || currentAvatarUrl;
  const initials = (user.displayName || user.name || "?").charAt(0).toUpperCase();

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

          {/* Avatar section */}
          <div className="flex flex-col items-center px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="relative group mb-3">
              {/* Avatar circle */}
              <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-[#189aa1]/30"
                style={{ background: displayAvatar ? undefined : "linear-gradient(135deg, #189aa1, #4ad9e0)" }}>
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Profile photo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white">{initials}</span>
                )}
              </div>
              {/* Camera overlay button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Change profile photo"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Upload / cancel controls — shown only when a new image is selected */}
            {avatarPreview ? (
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleAvatarUpload}
                  disabled={avatarUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #189aa1, #4ad9e0)" }}
                >
                  {avatarUploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {avatarUploading ? "Uploading…" : "Save Photo"}
                </button>
                <button
                  onClick={handleAvatarCancel}
                  disabled={avatarUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-[#189aa1] hover:underline"
              >
                <Camera className="w-3.5 h-3.5" />
                {currentAvatarUrl ? "Change Photo" : "Add Profile Photo"}
              </button>
            )}

            <p className="text-[10px] text-gray-400 mt-1">JPEG, PNG, WebP or GIF · max 4 MB</p>
          </div>

          {/* Card header — name + edit button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <div className="font-semibold text-gray-800 text-sm">
                {user.displayName || user.name || "Account"}
              </div>
              <div className="text-xs text-gray-400">{user.email}</div>
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
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
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
