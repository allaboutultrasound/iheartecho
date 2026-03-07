/**
 * CaseLibrary.tsx — Echo Case Library
 *
 * Browse, search, and filter approved echo cases.
 * Users can submit their own cases (with HIPAA warning).
 * Clicking a case opens CaseDetail.tsx.
 */

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Search,
  Plus,
  Eye,
  ChevronRight,
  Filter,
  Stethoscope,
  ImageIcon,
  PlayCircle,
  Tag,
  Clock,
  Star,
} from "lucide-react";
import { getLoginUrl } from "@/const";

const MODALITY_COLORS: Record<string, string> = {
  TTE: "bg-blue-100 text-blue-700",
  TEE: "bg-purple-100 text-purple-700",
  Stress: "bg-orange-100 text-orange-700",
  Pediatric: "bg-pink-100 text-pink-700",
  Fetal: "bg-rose-100 text-rose-700",
  HOCM: "bg-red-100 text-red-700",
  POCUS: "bg-teal-100 text-teal-700",
  Other: "bg-gray-100 text-gray-600",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

const MODALITIES = ["All", "TTE", "TEE", "Stress", "Pediatric", "Fetal", "HOCM", "POCUS", "Other"];
const DIFFICULTIES = ["All", "beginner", "intermediate", "advanced"];

export default function CaseLibrary() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [modality, setModality] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, error } = trpc.caseLibrary.listCases.useQuery(
    {
      modality: modality !== "All" ? (modality as any) : undefined,
      difficulty: difficulty !== "All" ? (difficulty as any) : undefined,
      search: search.trim() || undefined,
      page,
      limit,
    },
    {}
  );

  const cases = data?.cases ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleModality = (val: string) => {
    setModality(val);
    setPage(1);
  };

  const handleDifficulty = (val: string) => {
    setDifficulty(val);
    setPage(1);
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#189aa1" }}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>
                Echo Case Library
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-11">
              {total > 0 ? `${total} approved cases` : "Browse clinical echo cases"}
            </p>
          </div>
          {isAuthenticated ? (
            <Link href="/case-library/submit">
              <Button style={{ background: "#189aa1" }} className="text-white gap-2">
                <Plus className="w-4 h-4" /> Submit a Case
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button variant="outline" className="gap-2 border-[#189aa1] text-[#189aa1]">
                <Plus className="w-4 h-4" /> Sign In to Submit
              </Button>
            </a>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search cases, diagnoses, tags…"
              value={search}
              onChange={handleSearch}
              className="pl-9"
            />
          </div>
          <Select value={modality} onValueChange={handleModality}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="Modality" />
            </SelectTrigger>
            <SelectContent>
              {MODALITIES.map((m) => (
                <SelectItem key={m} value={m}>{m === "All" ? "All Modalities" : m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={handleDifficulty}>
            <SelectTrigger className="w-full sm:w-40">
              <Star className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d === "All" ? "All Levels" : d.charAt(0).toUpperCase() + d.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cases grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse h-52" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Failed to load cases. Please refresh.</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {search || modality !== "All" || difficulty !== "All"
                ? "No cases match your filters."
                : "No cases available yet. Be the first to submit one!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((c: any) => {
              const tags: string[] = c.tags ? JSON.parse(c.tags) : [];
              const teachingPoints: string[] = c.teachingPoints ? JSON.parse(c.teachingPoints) : [];
              return (
                <Link key={c.id} href={`/case-library/${c.id}`}>
                  <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-[#189aa1]/30 transition-all cursor-pointer group h-full flex flex-col">
                    {/* Media preview indicator */}
                    {c.mediaCount > 0 && (
                      <div className="flex items-center gap-1.5 mb-3">
                        {c.hasVideo ? (
                          <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                            <PlayCircle className="w-3 h-3" /> Video
                          </span>
                        ) : null}
                        {c.imageCount > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                            <ImageIcon className="w-3 h-3" /> {c.imageCount} Image{c.imageCount !== 1 ? "s" : ""}
                          </span>
                        ) : null}
                      </div>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MODALITY_COLORS[c.modality] ?? "bg-gray-100 text-gray-600"}`}>
                        {c.modality}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[c.difficulty] ?? ""}`}>
                        {c.difficulty}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-800 text-sm leading-snug mb-2" style={{ fontFamily: "Merriweather, serif" }}>
                      {c.title}
                    </h3>

                    <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1 line-clamp-3">
                      {c.summary}
                    </p>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                        {tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Eye className="w-3 h-3" />
                        {c.viewCount ?? 0}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-[#189aa1] group-hover:gap-2 transition-all">
                        View Case <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center text-sm text-gray-500 px-3">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
