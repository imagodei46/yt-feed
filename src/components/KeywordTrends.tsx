"use client";

import { useState, useEffect } from "react";
import { Video, Keyword } from "@/types";

interface KeywordTrendsProps {
  videos: Video[];
  onKeywordSelect: (videoIds: string[] | null) => void;
}

export default function KeywordTrends({
  videos,
  onKeywordSelect,
}: KeywordTrendsProps) {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (videos.length === 0) return;

    setLoading(true);
    setError(false);

    fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videos: videos.map((v) => ({
          id: v.id,
          title: v.title,
          description: v.description,
        })),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.keywords) {
          setKeywords(data.keywords);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [videos]);

  const handleClick = (keyword: Keyword) => {
    if (selected === keyword.word) {
      setSelected(null);
      onKeywordSelect(null);
    } else {
      setSelected(keyword.word);
      onKeywordSelect(keyword.videoIds);
    }
  };

  if (error) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
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
          WebkitMaskImage: "linear-gradient(to right, black 92%, transparent 100%)",
          maskImage: "linear-gradient(to right, black 92%, transparent 100%)",
        }}
      >
        {keywords.map((kw) => (
          <button
            key={kw.word}
            onClick={() => handleClick(kw)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-colors ${
              selected === kw.word
                ? "bg-white text-slate-900"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {kw.word}
            <span className="text-xs text-slate-500">
              {kw.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
