"use client";

import { useState, useEffect } from "react";
import { Video } from "@/types";

interface WeeklyBriefingProps {
  videos: Video[];
}

export default function WeeklyBriefing({ videos }: WeeklyBriefingProps) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (videos.length === 0) return;

    setLoading(true);
    setError(false);

    fetch("/api/weekly-briefing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videos: videos.map((v) => ({
          title: v.title,
          channelName: v.channelName,
          description: v.description,
          viewCount: v.viewCount,
        })),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.briefing) {
          setBriefing(data.briefing);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [videos]);

  if (error) return null;

  if (loading) {
    return (
      <div className="rounded-xl border-l-2 border-amber-400 bg-gradient-to-r from-amber-500/5 to-slate-900 p-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
          주간 인사이트 분석 중...
        </div>
      </div>
    );
  }

  if (!briefing) return null;

  // Parse insights: drop the top-level title (# ...), keep everything else
  const lines = briefing.split("\n").filter((line) => line.trim());
  const contentLines = lines.filter((l) => !l.match(/^#\s/)); // remove only "# title", keep "## N."

  // Group: each "## N." header + following body lines = one insight
  const insights: string[] = [];
  for (const line of contentLines) {
    if (line.match(/^##\s*\d+\./)) {
      // Start of a new insight — strip the "## N." prefix
      insights.push(line.replace(/^##\s*\d+\.\s*/, ""));
    } else if (insights.length > 0) {
      // Continuation of current insight
      insights[insights.length - 1] += " " + line;
    } else {
      // Standalone line before any numbered insight
      insights.push(line);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border-l-2 border-amber-400 bg-gradient-to-r from-amber-500/5 to-slate-900 p-5">
      <p className="mb-1 text-xs font-medium tracking-wide text-amber-400/80 uppercase">
        Weekly Trend Radar
      </p>
      <h3 className="mb-4 text-sm font-bold text-white">
        주간 인사이트 요약
      </h3>
      <div className="flex-1 space-y-3 text-sm leading-relaxed text-slate-300">
        {insights.map((text, i) => {
          const formatted = text
            .replace(/\*\*(.+?)\*\*/g, "<strong class='text-white'>$1</strong>")
            .trim();
          return formatted ? (
            <div key={i} className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-400">
                {i + 1}
              </span>
              <p className="line-clamp-2" dangerouslySetInnerHTML={{ __html: formatted }} />
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
}
