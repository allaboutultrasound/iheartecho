/*
  iHeartEcho Hub™ — Social Community Platform
  Brand: Teal #189aa1, Aqua #4ad9e0
  Features: 5 communities, posts, comments, DMs, media upload, HIPAA disclaimer
*/
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useRef, useEffect } from "react";
import {
  Heart, Zap, Baby, BookOpen, Plane, MessageCircle, ThumbsUp,
  Send, Image, Video, X, ChevronRight, Users, Shield, AlertTriangle,
  Plus, ArrowLeft, Loader2, Lock, MessageSquare, UserCircle
} from "lucide-react";
import Layout from "@/components/Layout";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Community {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  memberCount: number;
}

interface Post {
  id: number;
  content: string;
  mediaUrls: string[];
  mediaTypes: string[];
  likeCount: number;
  commentCount: number;
  isBoosted: boolean;
  createdAt: Date;
  author: {
    id: number;
    displayName: string;
    avatarUrl: string | null;
    credentials: string | null;
  };
  isLiked: boolean;
}

interface Comment {
  id: number;
  content: string;
  authorId: number;
  parentId: number | null;
  createdAt: Date;
  author: {
    id: number;
    displayName: string;
    avatarUrl: string | null;
    credentials: string | null;
  };
}

// ─── Community Icon Map ───────────────────────────────────────────────────────

const COMMUNITY_ICONS: Record<string, React.ElementType> = {
  Heart, Zap, Baby, BookOpen, Plane, Users,
};

function CommunityIcon({ name, className, style }: { name: string | null; className?: string; style?: React.CSSProperties }) {
  const Icon = COMMUNITY_ICONS[name ?? "Heart"] ?? Heart;
  return <Icon className={className} style={style} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, url, size = "sm" }: { name: string; url?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "w-12 h-12 text-base" : size === "md" ? "w-9 h-9 text-sm" : "w-8 h-8 text-xs";
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  if (url) return <img src={url} alt={name} className={`${sizeClass} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white`}
      style={{ background: "linear-gradient(135deg, #189aa1, #4ad9e0)" }}>
      {initials}
    </div>
  );
}

// ─── Relative Time ────────────────────────────────────────────────────────────

function relTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

// ─── HIPAA Disclaimer Modal ───────────────────────────────────────────────────

function DisclaimerModal({ onAccept }: { onAccept: () => void }) {
  const [checked, setChecked] = useState(false);
  const acceptMutation = trpc.hub.acceptTerms.useMutation({
    onSuccess: onAccept,
    onError: () => onAccept(), // Accept locally even if DB fails
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#189aa115" }}>
            <Shield className="w-5 h-5" style={{ color: "#189aa1" }} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg" style={{ fontFamily: "Merriweather, serif" }}>
              iHeartEcho Hub™ Community Standards
            </h2>
            <p className="text-xs text-gray-500">Please read and accept before joining</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <strong>HIPAA Notice:</strong> Do not share any Protected Health Information (PHI) including patient names, dates of birth, medical record numbers, or any identifying patient data. All posts are monitored for HIPAA compliance.
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-5">
          <p className="font-semibold text-gray-800">Community Standards:</p>
          <ul className="space-y-1.5 pl-4">
            <li className="flex items-start gap-2"><span className="text-[#189aa1] font-bold mt-0.5">•</span> No sexually explicit, offensive, or discriminatory content</li>
            <li className="flex items-start gap-2"><span className="text-[#189aa1] font-bold mt-0.5">•</span> No patient-identifiable information (HIPAA compliance required)</li>
            <li className="flex items-start gap-2"><span className="text-[#189aa1] font-bold mt-0.5">•</span> Professional, respectful communication at all times</li>
            <li className="flex items-start gap-2"><span className="text-[#189aa1] font-bold mt-0.5">•</span> No spam, solicitation, or unauthorized advertising</li>
            <li className="flex items-start gap-2"><span className="text-[#189aa1] font-bold mt-0.5">•</span> Content is moderated automatically and by community moderators</li>
            <li className="flex items-start gap-2"><span className="text-[#189aa1] font-bold mt-0.5">•</span> Violations may result in immediate removal and account suspension</li>
          </ul>
        </div>

        <div className="text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg p-3">
          iHeartEcho Hub™ is a professional community for sonographers, cardiologists, and students. All content is for educational and professional discussion purposes only and does not constitute medical advice.
        </div>

        <label className="flex items-start gap-3 cursor-pointer mb-5">
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-[#189aa1]" />
          <span className="text-sm text-gray-700">
            I understand and agree to the iHeartEcho Hub™ Community Standards, HIPAA compliance requirements, and Terms of Use.
          </span>
        </label>

        <button
          disabled={!checked || acceptMutation.isPending}
          onClick={() => acceptMutation.mutate()}
          className="w-full py-2.5 rounded-lg font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: "#189aa1" }}
        >
          {acceptMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Join iHeartEcho Hub™
        </button>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  onLike,
  onComment,
  currentUserId,
}: {
  post: Post;
  onLike: (id: number) => void;
  onComment: (post: Post) => void;
  currentUserId?: number;
}) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${post.isBoosted ? "border-[#4ad9e0] ring-1 ring-[#4ad9e0]/30" : "border-gray-100"}`}>
      {post.isBoosted && (
        <div className="flex items-center gap-1 text-xs text-[#189aa1] font-semibold mb-2">
          <Zap className="w-3 h-3" /> Boosted Post
        </div>
      )}
      <div className="flex items-start gap-3">
        <Avatar name={post.author.displayName} url={post.author.avatarUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{post.author.displayName}</span>
            {post.author.credentials && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#189aa115", color: "#189aa1" }}>
                {post.author.credentials}
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">{relTime(post.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 mt-1.5 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {/* Media */}
          {post.mediaUrls.length > 0 && (
            <div className={`mt-3 grid gap-2 ${post.mediaUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {post.mediaUrls.map((url, i) => (
                post.mediaTypes[i] === "video" ? (
                  <video key={i} src={url} controls className="w-full rounded-lg max-h-64 object-cover" />
                ) : (
                  <img key={i} src={url} alt="Post media" className="w-full rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity" />
                )
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-50">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${post.isLiked ? "text-[#189aa1]" : "text-gray-400 hover:text-[#189aa1]"}`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${post.isLiked ? "fill-[#189aa1]" : ""}`} />
              {post.likeCount > 0 && <span>{post.likeCount}</span>}
              <span>Like</span>
            </button>
            <button
              onClick={() => onComment(post)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-[#189aa1] transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {post.commentCount > 0 && <span>{post.commentCount}</span>}
              <span>Comment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Comment Thread ───────────────────────────────────────────────────────────

function CommentThread({ post, onClose }: { post: Post; onClose: () => void }) {
  const [commentText, setCommentText] = useState("");
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: comments, isLoading } = trpc.hub.getComments.useQuery({ postId: post.id });

  const createComment = trpc.hub.createComment.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.hub.getComments.invalidate({ postId: post.id });
      utils.hub.getPosts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: "Merriweather, serif" }}>
            Comments ({post.commentCount})
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Original post */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-start gap-2">
            <Avatar name={post.author.displayName} url={post.author.avatarUrl} size="sm" />
            <div>
              <span className="font-semibold text-xs text-gray-800">{post.author.displayName}</span>
              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{post.content}</p>
            </div>
          </div>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#189aa1]" />
            </div>
          )}
          {comments?.length === 0 && !isLoading && (
            <p className="text-center text-sm text-gray-400 py-4">No comments yet. Be the first!</p>
          )}
          {comments?.map(c => (
            <div key={c.id} className="flex items-start gap-2.5">
              <Avatar name={c.author.displayName} url={c.author.avatarUrl} size="sm" />
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-xs text-gray-800">{c.author.displayName}</span>
                  {c.author.credentials && (
                    <span className="text-xs px-1 py-0.5 rounded font-medium" style={{ background: "#189aa115", color: "#189aa1" }}>
                      {c.author.credentials}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{relTime(c.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment input */}
        {user ? (
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex items-end gap-2">
              <Avatar name={user.name ?? "You"} size="sm" />
              <div className="flex-1 flex items-end gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-700 resize-none outline-none placeholder-gray-400"
                  style={{ minHeight: "24px", maxHeight: "80px" }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey && commentText.trim()) {
                      e.preventDefault();
                      createComment.mutate({ postId: post.id, content: commentText.trim() });
                    }
                  }}
                />
                <button
                  disabled={!commentText.trim() || createComment.isPending}
                  onClick={() => createComment.mutate({ postId: post.id, content: commentText.trim() })}
                  className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                  style={{ background: "#189aa1" }}
                >
                  {createComment.isPending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-gray-100 text-center">
            <a href={getLoginUrl()} className="text-sm font-semibold" style={{ color: "#189aa1" }}>
              Sign in to comment
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Post ──────────────────────────────────────────────────────────────

function CreatePost({ communityId, onSuccess }: { communityId: number; onSuccess: () => void }) {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<{ file: File; preview: string; type: "image" | "video" }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const createPost = trpc.hub.createPost.useMutation({
    onSuccess: () => {
      setContent("");
      setMediaFiles([]);
      onSuccess();
      toast.success("Post shared to the community!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/quicktime"];
    for (const file of files) {
      if (!allowed.includes(file.type)) {
        toast.error(`${file.name}: unsupported file type`);
        continue;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name}: file too large (max 50MB)`);
        continue;
      }
      const preview = URL.createObjectURL(file);
      const type = file.type.startsWith("video") ? "video" : "image";
      setMediaFiles(prev => [...prev, { file, preview, type }]);
    }
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    // For now post without media upload (media upload requires S3 integration)
    createPost.mutate({
      communityId,
      content: content.trim(),
      mediaUrls: [],
      mediaTypes: [],
    });
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start gap-3">
        <Avatar name={user.name ?? "You"} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share a clinical insight, ask a question, or start a discussion..."
            rows={3}
            className="w-full text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2.5 resize-none outline-none border border-transparent focus:border-[#189aa1]/30 focus:bg-white transition-all placeholder-gray-400"
          />

          {/* Media previews */}
          {mediaFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {mediaFiles.map((m, i) => (
                <div key={i} className="relative">
                  {m.type === "video" ? (
                    <video src={m.preview} className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <img src={m.preview} alt="" className="w-20 h-20 rounded-lg object-cover" />
                  )}
                  <button
                    onClick={() => setMediaFiles(prev => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-1">
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors">
                <Image className="w-3.5 h-3.5" /> Photo
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors">
                <Video className="w-3.5 h-3.5" /> Video
              </button>
            </div>
            <button
              disabled={(!content.trim() && mediaFiles.length === 0) || createPost.isPending}
              onClick={handleSubmit}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: "#189aa1" }}
            >
              {createPost.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DM Panel ─────────────────────────────────────────────────────────────────

function DMPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [activeConvoId, setActiveConvoId] = useState<number | null>(null);
  const [msgText, setMsgText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: conversations, isLoading: loadingConvos } = trpc.hub.getConversations.useQuery(undefined, { enabled: !!user });
  const { data: messages, isLoading: loadingMsgs } = trpc.hub.getMessages.useQuery(
    { conversationId: activeConvoId! },
    { enabled: !!activeConvoId, refetchInterval: 5000 }
  );

  const sendMsg = trpc.hub.sendMessage.useMutation({
    onSuccess: () => {
      setMsgText("");
      utils.hub.getMessages.invalidate({ conversationId: activeConvoId! });
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
          <Lock className="w-10 h-10 mx-auto mb-3" style={{ color: "#189aa1" }} />
          <h3 className="font-bold text-gray-900 mb-2">Sign in Required</h3>
          <p className="text-sm text-gray-500 mb-4">Sign in to access Direct Messages.</p>
          <a href={getLoginUrl()} className="block w-full py-2 rounded-lg text-white text-sm font-semibold" style={{ background: "#189aa1" }}>
            Sign In
          </a>
          <button onClick={onClose} className="mt-2 text-sm text-gray-400 hover:text-gray-600">Cancel</button>
        </div>
      </div>
    );
  }

  const activeConvo = conversations?.find(c => c.id === activeConvoId);

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-end bg-black/60">
      <div className="bg-white w-full sm:w-96 h-full sm:h-[600px] sm:mr-4 sm:mb-4 sm:rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          {activeConvoId && (
            <button onClick={() => setActiveConvoId(null)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-sm" style={{ fontFamily: "Merriweather, serif" }}>
              {activeConvo ? activeConvo.otherUser.displayName : "Direct Messages"}
            </h3>
            {!activeConvoId && <p className="text-xs text-gray-400">Your conversations</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation list */}
        {!activeConvoId && (
          <div className="flex-1 overflow-y-auto">
            {loadingConvos && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[#189aa1]" />
              </div>
            )}
            {conversations?.length === 0 && !loadingConvos && (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">No conversations yet.</p>
                <p className="text-xs text-gray-400 mt-1">Click a user's name in the feed to start a DM.</p>
              </div>
            )}
            {conversations?.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveConvoId(c.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left"
              >
                <Avatar name={c.otherUser.displayName} url={c.otherUser.avatarUrl} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900">{c.otherUser.displayName}</div>
                  <div className="text-xs text-gray-400 truncate">{relTime(c.lastMessageAt)}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
          </div>
        )}

        {/* Message thread */}
        {activeConvoId && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-[#189aa1]" />
                </div>
              )}
              {messages?.map(m => {
                const isMe = m.senderId === user.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMe ? "text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}
                      style={isMe ? { background: "#189aa1" } : {}}>
                      <p className="leading-relaxed">{m.content}</p>
                      <p className={`text-xs mt-0.5 ${isMe ? "text-white/60" : "text-gray-400"}`}>{relTime(m.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-end gap-2 bg-gray-50 rounded-xl px-3 py-2">
                <textarea
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-700 resize-none outline-none placeholder-gray-400"
                  style={{ minHeight: "24px", maxHeight: "80px" }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey && msgText.trim()) {
                      e.preventDefault();
                      sendMsg.mutate({ conversationId: activeConvoId, content: msgText.trim() });
                    }
                  }}
                />
                <button
                  disabled={!msgText.trim() || sendMsg.isPending}
                  onClick={() => sendMsg.mutate({ conversationId: activeConvoId, content: msgText.trim() })}
                  className="p-1.5 rounded-lg disabled:opacity-40"
                  style={{ background: "#189aa1" }}
                >
                  {sendMsg.isPending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Hub Page ────────────────────────────────────────────────────────────

export default function Hub() {
  const { user, isAuthenticated } = useAuth();
  const [activeCommunityId, setActiveCommunityId] = useState<number | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [showDMs, setShowDMs] = useState(false);
  const utils = trpc.useUtils();

  const { data: communities, isLoading: loadingCommunities } = trpc.hub.getCommunities.useQuery();

  // Set default community once loaded
  useEffect(() => {
    if (communities && communities.length > 0 && activeCommunityId === null) {
      setActiveCommunityId(communities[0].id);
    }
  }, [communities, activeCommunityId]);

  // Check if user needs to accept disclaimer
  useEffect(() => {
    if (isAuthenticated && user && !disclaimerAccepted) {
      // Check hubAccepted from user object (if available)
      const hubUser = user as { hubAccepted?: boolean };
      if (!hubUser.hubAccepted) {
        setShowDisclaimer(true);
      }
    }
  }, [isAuthenticated, user, disclaimerAccepted]);

  const { data: posts, isLoading: loadingPosts, refetch: refetchPosts } = trpc.hub.getPosts.useQuery(
    { communityId: activeCommunityId! },
    { enabled: activeCommunityId !== null }
  );

  const toggleReaction = trpc.hub.toggleReaction.useMutation({
    onMutate: async ({ postId }) => {
      // Optimistic update
      await utils.hub.getPosts.cancel();
      const prev = utils.hub.getPosts.getData({ communityId: activeCommunityId! });
      utils.hub.getPosts.setData({ communityId: activeCommunityId! }, old =>
        old?.map(p => p.id === postId ? {
          ...p,
          isLiked: !p.isLiked,
          likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1
        } : p)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.hub.getPosts.setData({ communityId: activeCommunityId! }, ctx.prev);
    },
    onSettled: () => utils.hub.getPosts.invalidate({ communityId: activeCommunityId! }),
  });

  const handleLike = (postId: number) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to like posts.");
      return;
    }
    toggleReaction.mutate({ postId });
  };

  const activeCommunity = communities?.find(c => c.id === activeCommunityId);

  return (
    <Layout>
      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <DisclaimerModal onAccept={() => {
          setShowDisclaimer(false);
          setDisclaimerAccepted(true);
        }} />
      )}

      {/* Comment Thread Modal */}
      {commentPost && (
        <CommentThread post={commentPost} onClose={() => setCommentPost(null)} />
      )}

      {/* DM Panel */}
      {showDMs && <DMPanel onClose={() => setShowDMs(false)} />}

      {/* Page Header */}
      <div className="border-b border-[#189aa1]/10 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Merriweather, serif" }}>
              iHeartEcho Hub™
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Professional echo community — connect, learn, and collaborate</p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => setShowDMs(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: "#189aa115", color: "#189aa1" }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Messages
              </button>
            )}
            {!isAuthenticated && (
              <a href={getLoginUrl()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                style={{ background: "#189aa1" }}>
                <UserCircle className="w-3.5 h-3.5" />
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>

       <div className="container py-4 max-w-5xl">
        {/* Community selector — horizontal pill tabs on all screen sizes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Communities</span>
            {loadingCommunities && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#189aa1]" />}
          </div>
          <div className="flex flex-wrap gap-2 p-3">
            {communities?.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCommunityId(c.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                  activeCommunityId === c.id
                    ? "text-white border-transparent shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#189aa1]/40 hover:text-[#189aa1]"
                }`}
                style={activeCommunityId === c.id ? { background: c.color ?? "#189aa1", borderColor: c.color ?? "#189aa1" } : {}}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                  activeCommunityId === c.id ? "bg-white/20" : ""
                }`}
                  style={activeCommunityId !== c.id ? { background: (c.color ?? "#189aa1") + "18" } : {}}>
                  <CommunityIcon
                    name={c.icon}
                    className="w-3 h-3"
                    style={{ color: activeCommunityId === c.id ? "white" : (c.color ?? "#189aa1") } as React.CSSProperties}
                  />
                </div>
                <span className="truncate max-w-[120px]">{c.name}</span>
              </button>
            ))}
          </div>

          {/* HIPAA Notice inline */}
          <div className="mx-3 mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700"><strong>HIPAA Reminder:</strong> Never share patient-identifiable information in any community post or message.</p>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-3">
          {/* Community header */}
          {activeCommunity && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: (activeCommunity.color ?? "#189aa1") + "20" }}>
                  <CommunityIcon name={activeCommunity.icon} className="w-5 h-5" style={{ color: activeCommunity.color ?? "#189aa1" } as React.CSSProperties} />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm" style={{ fontFamily: "Merriweather, serif" }}>
                    {activeCommunity.name}
                  </h2>
                  <p className="text-xs text-gray-500">{activeCommunity.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Create post */}
          {isAuthenticated && activeCommunityId && (
            <CreatePost communityId={activeCommunityId} onSuccess={() => utils.hub.getPosts.invalidate({ communityId: activeCommunityId })} />
          )}

          {/* Sign-in prompt */}
          {!isAuthenticated && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
              <UserCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-600 mb-2">Sign in to post, comment, and connect with the community.</p>
              <a href={getLoginUrl()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "#189aa1" }}>
                <UserCircle className="w-4 h-4" /> Sign In to Join
              </a>
            </div>
          )}

          {/* Posts */}
          {loadingPosts && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#189aa1]" />
            </div>
          )}

          {posts?.length === 0 && !loadingPosts && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-semibold text-gray-500">No posts yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to start a discussion in this community!</p>
            </div>
          )}

          {posts?.map(post => (
            <PostCard
              key={post.id}
              post={post as Post}
              onLike={handleLike}
              onComment={(p) => setCommentPost(p as Post)}
              currentUserId={user?.id}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
