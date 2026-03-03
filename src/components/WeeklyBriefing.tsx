"use client";

import { useState, useEffect, useCallback } from "react";
import { BriefingEntry } from "@/types";
import { Video } from "@/types";

interface WeeklyBriefingProps {
  videos: Video[];
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart);
  const e = new Date(weekEnd);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(s)} ~ ${fmt(e)}`;
}

export default function WeeklyBriefing({ videos }: WeeklyBriefingProps) {
  const [entries, setEntries] = useState<BriefingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  const toggleWeek = useCallback((weekStart: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekStart)) next.delete(weekStart);
      else next.add(weekStart);
      return next;
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetch("/api/weekly-briefing")
      .then((res) => res.json())
      .then((data) => {
        if (data.briefings) {
          setEntries(data.briefings);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [videos]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/weekly-briefing?regenerate=true", {
        method: "POST",
      });
      const data = await res.json();
      if (data.briefings) {
        setEntries(data.briefings);
      }
    } catch {
      // silent fail
    } finally {
      setRegenerating(false);
    }
  };

  if (error) return null;

  if (loading) {
    return (
      <div className="rounded-xl border-l-2 border-amber-400 bg-gradient-to-r from-amber-500/5 to-slate-900 p-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
          지난주 인사이트 분석 중...
        </div>
      </div>
    );
  }

  if (entries.length === 0) return null;

  return (
    <div className="flex h-full flex-col rounded-xl border-l-2 border-amber-400 bg-gradient-to-r from-amber-500/5 to-slate-900 p-5">
      <p className="mb-1 text-xs font-medium tracking-wide text-amber-400/80 uppercase">
        Weekly Trend Radar
      </p>
      <h3 className="mb-4 text-sm font-bold text-white">
        지난주 인사이트 요약
      </h3>

      <div className="flex-1 space-y-4">
        {entries.map((entry, idx) => {
          const isLatest = idx === 0;
          const isExpanded = isLatest || expandedWeeks.has(entry.weekStart);
          const dateLabel = formatWeekRange(entry.weekStart, entry.weekEnd);

          return (
            <div key={entry.weekStart}>
              <button
                onClick={() => !isLatest && toggleWeek(entry.weekStart)}
                className={`flex w-full items-center gap-2 text-left text-xs font-medium ${
                  isLatest
                    ? "text-amber-400 cursor-default"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <span>{isExpanded ? "●" : "▸"}</span>
                <span>{dateLabel}</span>
                {isLatest && (
                  <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                    최신
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="mt-2 space-y-2 pl-5">
                  {entry.briefing
                    .split("\n")
                    .filter((l) => l.trim())
                    .map((line, i) => (
                      <p
                        key={i}
                        className="text-sm leading-relaxed text-slate-300"
                      >
                        {line}
                      </p>
                    ))}

                  {entry.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {entry.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs text-amber-400/80"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="mt-4 self-center text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
      >
        {regenerating ? "생성 중..." : "새로 생성하기"}
      </button>
    </div>
  );
}
