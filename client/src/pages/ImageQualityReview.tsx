/*
  ImageQualityReview — Placeholder
  The full IQR form has been removed. A new external link will be provided.
*/
import Layout from "@/components/Layout";
import { ClipboardList, ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const BRAND = "#189aa1";
const EXTERNAL_LINK = ""; // TODO: replace with the new IQR external link

interface Props {
  embedded?: boolean;
}

export default function ImageQualityReview({ embedded = false }: Props) {
  const content = (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: BRAND + "18" }}
      >
        <ClipboardList className="w-8 h-8" style={{ color: BRAND }} />
      </div>

      {/* Heading */}
      <h2
        className="text-2xl font-black text-gray-800 mb-2"
        style={{ fontFamily: "Merriweather, serif" }}
      >
        Image Quality Review
      </h2>
      <p className="text-gray-500 text-sm max-w-md mb-8 leading-relaxed">
        The Image Quality Review form is being updated. A new link will be provided shortly.
      </p>

      {/* CTA button — shown only when external link is available */}
      {EXTERNAL_LINK ? (
        <a
          href={EXTERNAL_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90"
          style={{ background: BRAND }}
        >
          <ExternalLink className="w-4 h-4" />
          Open Image Quality Review
        </a>
      ) : (
        <div
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm opacity-50 cursor-not-allowed"
          style={{ background: BRAND }}
        >
          <ClipboardList className="w-4 h-4" />
          Coming Soon
        </div>
      )}

      {!embedded && (
        <Link href="/diy-accreditation">
          <button className="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to DIY Accreditation
          </button>
        </Link>
      )}
    </div>
  );

  if (embedded) return content;

  return <Layout>{content}</Layout>;
}
