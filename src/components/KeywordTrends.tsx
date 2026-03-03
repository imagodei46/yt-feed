"use client";

import { Keyword } from "@/types";

interface KeywordTrendsProps {
  keywords: Keyword[];
  loading: boolean;
  selectedKeyword: string | null;
  onKeywordSelect: (word: string | null, videoIds: string[] | null) => void;
}

export default function KeywordTrends({
  keywords,
  loading,
  selectedKeyword,
  onKeywordSelect,
}: KeywordTrendsProps) {
  const handleClick = (keyword: Keyword) => {
    if (selectedKeyword === keyword.word) {
      onKeywordSelect(null, null);
    } else {
      onKeywordSelect(keyword.word, keyword.videoIds);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />
        키워드 분석 중...
      </div>
    );
  }

  if (keywords.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-400">이번 주 키워드</p>
      <div
        className="pb-1 scrollbar-hide"
        style={{
          display: "flex",
          flexWrap: "nowrap",
          overflowX: "auto",
          gap: "0.5rem",
          scrollbarWidth: "none",
          WebkitMaskImage: "linear-gradient(to right, black 80%, transparent 100%)",
          maskImage: "linear-gradient(to right, black 80%, transparent 100%)",
        }}
      >
        {keywords.map((kw) => (
          <button
            key={kw.word}
            onClick={() => handleClick(kw)}
            aria-pressed={selectedKeyword === kw.word}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
              selectedKeyword === kw.word
                ? "bg-white text-slate-900 shadow-sm"
                : "border border-slate-700 bg-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200"
            }`}
          >
            {kw.word}
            <span
              className={`rounded-full px-1.5 text-xs ${
                selectedKeyword === kw.word
                  ? "bg-slate-200 text-slate-700"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {kw.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
