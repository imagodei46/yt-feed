"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { BriefingEntry, Video } from "@/types";
import { formatCount } from "@/lib/utils";

interface WeeklyBriefingProps {
  videos: Video[];
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart);
  const e = new Date(weekEnd);
  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(s)} ~ ${fmt(e)}`;
}

interface ParsedTrend {
  number: number;
  title: string;
  body: string;
}

const TREND_DOT_COLORS = [
  "bg-red-400",
  "bg-amber-400",
  "bg-emerald-400",
  "bg-blue-400",
  "bg-purple-400",
];

// Keyword tag colors matching each trend's dot color
const TREND_TAG_COLORS = [
  { border: "border-red-400/30", bg: "bg-red-400/10", text: "text-red-400" },
  { border: "border-amber-400/30", bg: "bg-amber-400/10", text: "text-amber-400" },
  { border: "border-emerald-400/30", bg: "bg-emerald-400/10", text: "text-emerald-400" },
  { border: "border-blue-400/30", bg: "bg-blue-400/10", text: "text-blue-400" },
  { border: "border-purple-400/30", bg: "bg-purple-400/10", text: "text-purple-400" },
];


const MUTED_TAG = { border: "border-slate-700/40", bg: "bg-transparent", text: "text-slate-600" };

const KEYWORD_LINE_RE =
  /(?:키워드|핵심\s*키워드|주요\s*키워드|SNS\s*버즈|주목할\s*키워드|이\s*주의\s*키워드)/;

function parseTrends(briefing: string): ParsedTrend[] {
  const lines = briefing.split("\n").filter((l) => l.trim());
  const trends: ParsedTrend[] = [];

  for (const line of lines) {
    if (KEYWORD_LINE_RE.test(line) && !line.match(/^\d+[.)]/)) continue;

    const match = line.match(/^(\d+)[.)]\s*(.+)/);
    if (match) {
      const num = parseInt(match[1]);
      const rest = match[2];
      const sepMatch = rest.match(/^(.+?)\s*[—–]\s*(.+)$/);
      if (sepMatch) {
        trends.push({
          number: num,
          title: sepMatch[1].trim(),
          body: sepMatch[2].trim(),
        });
      } else {
        trends.push({ number: num, title: rest.trim(), body: "" });
      }
    } else if (trends.length > 0) {
      trends[trends.length - 1].body += " " + line.trim();
    }
  }

  return trends;
}

export default function WeeklyBriefing({ videos }: WeeklyBriefingProps) {
  const [entries, setEntries] = useState<BriefingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(false);
  const [regenError, setRegenError] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeWeek, setActiveWeek] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenError(false);
    try {
      const res = await fetch("/api/weekly-briefing?regenerate=true", {
        method: "POST",
      });
      const data = await res.json();
      if (data.briefings) {
        setEntries(data.briefings);
      }
    } catch {
      setRegenError(true);
    } finally {
      setRegenerating(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    setActiveSlide(Math.round(scrollLeft / clientWidth));
  }, []);

  const scrollTo = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    scrollRef.current.scrollTo({ left: clientWidth * index, behavior: "smooth" });
  }, []);

  const currentEntry = entries[activeWeek] ?? null;
  const trends = currentEntry ? parseTrends(currentEntry.briefing) : [];

  // Build a video lookup map: id → Video
  const videoMap = useMemo(() => {
    const map = new Map<string, Video>();
    for (const v of videos) map.set(v.id, v);
    return map;
  }, [videos]);

  // Resolve trendVideoIds → actual Video objects per trend
  // Fallback: if old data without trendVideoIds, show top-viewed videos
  const trendVideos = useMemo(() => {
    if (currentEntry?.trendVideoIds && currentEntry.trendVideoIds.length > 0) {
      return currentEntry.trendVideoIds.map((ids) =>
        ids
          .map((id) => videoMap.get(id))
          .filter((v): v is Video => !!v)
          .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
          .slice(0, 2)
      );
    }
    // Fallback for old briefings: distribute top videos round-robin
    const sorted = [...videos].sort(
      (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)
    );
    return trends.map((_, i) =>
      sorted.filter((_, idx) => idx % trends.length === i).slice(0, 2)
    );
  }, [currentEntry, videoMap, videos, trends]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-l-2 border-amber-400 bg-gradient-to-r from-amber-500/5 to-slate-900 p-4">
        <p className="text-xs font-medium text-slate-400">트렌드 로드 실패</p>
        <p className="mt-1 text-[10px] text-slate-600">잠시 후 다시 시도해주세요</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col rounded-xl border-l-2 border-amber-400 bg-gradient-to-r from-amber-500/5 to-slate-900 p-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
          분석 중...
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-l-2 border-amber-400 bg-gradient-to-r from-amber-500/5 to-slate-900 p-4">
        <p className="text-[10px] font-medium tracking-wide text-amber-400/80 uppercase">
          Weekly Trend Radar
        </p>
        <p className="mt-2 text-xs text-slate-500">아직 분석된 트렌드가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border-l-2 border-amber-400 bg-gradient-to-r from-amber-500/5 to-slate-900 p-4">
      {/* Header */}
      <p className="mb-0.5 text-[10px] font-medium tracking-wide text-amber-400/80 uppercase">
        Weekly Trend Radar
      </p>

      {/* Week tabs */}
      <div className="mb-3 flex items-center gap-1.5">
        {entries.map((entry, idx) => {
          const label = formatWeekRange(entry.weekStart, entry.weekEnd);
          return (
            <button
              key={entry.weekStart}
              onClick={() => {
                setActiveWeek(idx);
                setActiveSlide(0);
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
                }
              }}
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                activeWeek === idx
                  ? "bg-amber-400/20 text-amber-400"
                  : "text-slate-500 hover:text-slate-400"
              }`}
            >
              {label}
              {idx === 0 && (
                <span className="ml-1 text-[8px] text-amber-400/60">NEW</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Keywords — colored by matching trend (distributed evenly) */}
      {currentEntry && currentEntry.keywords.length > 0 && trends.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {currentEntry.keywords.map((kw, i) => {
            const trendIdx = i % trends.length;
            const isActive = trendIdx === activeSlide;
            const c = isActive
              ? TREND_TAG_COLORS[trendIdx % TREND_TAG_COLORS.length]
              : MUTED_TAG;
            return (
              <span
                key={kw}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors duration-300 ${c.border} ${c.bg} ${c.text}`}
              >
                # {kw}
              </span>
            );
          })}
        </div>
      )}

      {/* Trend card slider */}
      {trends.length > 0 ? (
        <div>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {trends.map((trend, i) => {
              // Videos tagged by AI for this specific trend
              const relatedVideos = trendVideos[i] ?? [];
              return (
                <div
                  key={trend.number}
                  className="flex w-full shrink-0 snap-start flex-col gap-2 rounded-lg bg-slate-800/50 p-3"
                >
                  {/* Trend text */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${TREND_DOT_COLORS[i % TREND_DOT_COLORS.length]}`}
                    >
                      {trend.number}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {trend.title}
                    </span>
                  </div>
                  {trend.body && (
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      {trend.body}
                    </p>
                  )}

                  {/* Related videos stack (up to 3) */}
                  {relatedVideos.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-medium text-slate-500">
                        관련 인기 영상
                      </p>
                      {relatedVideos.map((vid) => (
                        <a
                          key={vid.id}
                          href={`https://www.youtube.com/watch?v=${vid.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-2 rounded-md bg-slate-900/60 p-1.5 transition-colors hover:bg-slate-900"
                        >
                          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded bg-slate-700">
                            <Image
                              src={vid.thumbnailUrl}
                              alt={vid.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-center">
                            <p className="line-clamp-1 text-[10px] font-medium leading-tight text-slate-300">
                              {vid.title}
                            </p>
                            <p className="text-[9px] text-slate-500">
                              {vid.viewCount !== undefined && (
                                <>&#9655; {formatCount(vid.viewCount)}회 · </>
                              )}
                              {vid.channelName}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-slate-700/50 pt-2">
                    <span className="text-[10px] text-slate-500">
                      {currentEntry?.videoCount ?? 0}편의 영상에서 분석
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {i + 1} / {trends.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation: arrows + dots */}
          {trends.length > 1 && (
            <div className="mt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => scrollTo(Math.max(0, activeSlide - 1))}
                disabled={activeSlide === 0}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700/60 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:invisible"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <div className="flex items-center gap-1.5">
                {trends.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollTo(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      activeSlide === i
                        ? `w-4 ${TREND_DOT_COLORS[i % TREND_DOT_COLORS.length]}`
                        : "w-1.5 bg-slate-600 hover:bg-slate-500"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => scrollTo(Math.min(trends.length - 1, activeSlide + 1))}
                disabled={activeSlide === trends.length - 1}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700/60 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:invisible"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : currentEntry ? (
        <p className="text-xs leading-relaxed text-slate-400">
          {currentEntry.briefing}
        </p>
      ) : null}

      {/* Regenerate button */}
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="mt-4 flex items-center gap-1 self-center text-[10px] text-slate-500 transition-colors hover:text-slate-300 disabled:opacity-50"
        title="최신 영상 데이터로 트렌드를 다시 분석합니다"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.182" />
        </svg>
        {regenerating ? "분석 중..." : "트렌드 재분석"}
      </button>
      {regenError && (
        <p className="mt-1 text-center text-[10px] text-red-400">
          재분석에 실패했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}
    </div>
  );
}
