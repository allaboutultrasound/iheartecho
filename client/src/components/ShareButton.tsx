/**
 * ShareButton — Reusable social sharing component
 *
 * Renders a "Share" button that opens a popover with sharing options:
 * Twitter/X, Facebook, LinkedIn, and copy-to-clipboard.
 *
 * Props:
 *   url      — the URL to share (defaults to current page URL)
 *   title    — the text to pre-fill in the share message
 *   hashtags — optional array of hashtags for Twitter (no # prefix)
 *   variant  — button style variant (default: "outline")
 *   size     — button size (default: "sm")
 *   className — extra classes for the trigger button
 */

import { useState, useRef, useEffect } from "react";
import { Share2, Twitter, Facebook, Linkedin, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  url?: string;
  title?: string;
  hashtags?: string[];
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  /** If true, renders as a compact icon-only button */
  iconOnly?: boolean;
}

export function ShareButton({
  url,
  title = "Check this out on iHeartEcho!",
  hashtags = ["iHeartEcho", "echocardiography", "POCUS"],
  variant = "outline",
  size = "sm",
  className = "",
  iconOnly = false,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const hashtagStr = hashtags.join(",");

  // Close popover when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const openWindow = (url: string) => {
    window.open(url, "_blank", "width=600,height=500,noopener,noreferrer");
    setOpen(false);
  };

  const shareLinks = [
    {
      label: "Twitter / X",
      icon: Twitter,
      color: "text-black dark:text-white",
      bg: "hover:bg-gray-100",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${hashtagStr}`,
    },
    {
      label: "Facebook",
      icon: Facebook,
      color: "text-[#1877f2]",
      bg: "hover:bg-blue-50",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      color: "text-[#0a66c2]",
      bg: "hover:bg-blue-50",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  return (
    <div className="relative inline-block" ref={ref}>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen((v) => !v)}
        aria-label="Share"
      >
        <Share2 className={iconOnly ? "w-4 h-4" : "w-4 h-4 mr-2"} />
        {!iconOnly && "Share"}
      </Button>

      {open && (
        <div
          className="absolute z-50 right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
          style={{ minWidth: "180px" }}
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
            Share via
          </div>
          {shareLinks.map(({ label, icon: Icon, color, bg, href }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 ${bg} transition-colors`}
              onClick={() => openWindow(href)}
            >
              <Icon className={`w-4 h-4 ${color}`} />
              {label}
            </button>
          ))}
          <div className="border-t border-gray-100">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Link2 className="w-4 h-4 text-gray-500" />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
