"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Video, Keyword } from "@/types";
import { CHANNELS } from "@/lib/channels";
import ChannelFilter from "./ChannelFilter";
import VideoGrid from "./VideoGrid";
import ChannelTop3 from "./ChannelTop3";
import KeywordTrends from "./KeywordTrends";
import WeeklyBriefing from "./WeeklyBriefing";
import ChannelScoreboard from "./ChannelScoreboard";
import KeywordGraph from "./KeywordGraph";
import RefreshButton from "./RefreshButton";

type SortMode = "date" | "views";
type ViewMode = "feed" | "top3";

interface DashboardProps {
  videos: Video[];
}

export default function Dashboard({ videos }: DashboardProps) {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("date");
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [keywordVideoIds, setKeywordVideoIds] = useState<string[] | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(true);
  const [keywordsError, setKeywordsError] = useState(false);

  // Filter out channel names (and partial names) from keywords
  const channelNameSet = useMemo(() => {
    const set = new Set<string>();
    for (const ch of CHANNELS) {
      set.add(ch.name.toLowerCase());
      set.add(ch.name.toLowerCase().replace(/\s+/g, ""));
      // Add individual words from channel names (e.g. "News" from "NewsPicks")
      for (const part of ch.name.split(/[\s\-_]|(?=[A-Z])/)) {
        if (part.length >= 3) set.add(part.toLowerCase());
      }
    }
    return set;
  }, []);

  const filterChannelNames = useCallback(
    (kws: Keyword[]) =>
      kws.filter(
        (k) =>
          !channelNameSet.has(k.word.toLowerCase()) &&
          !channelNameSet.has(k.word.toLowerCase().replace(/\s+/g, ""))
      ),
    [channelNameSet]
  );

  const handleRefreshStart = useCallback(() => setIsRefreshing(true), []);
  const handleRefreshEnd = useCallback(() => setIsRefreshing(false), []);

  const handleKeywordSelect = useCallback((word: string | null, videoIds: string[] | null) => {
    setSelectedKeyword(word);
    setKeywordVideoIds(videoIds);
  }, []);

  // Filter to recent videos (shared by keywords + video grid)
  const recentVideos = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return videos.filter((v) => new Date(v.publishedAt) >= cutoff);
  }, [videos]);

  // Local keyword extraction fallback (no AI needed)
  const extractLocalKeywords = useCallback((): Keyword[] => {
    // Common stop words to filter out
    const stopWords = new Set([
      "the", "a", "an", "is", "are", "was", "were", "be", "been",
      "to", "of", "in", "for", "on", "with", "at", "by", "from",
      "it", "this", "that", "and", "or", "but", "not", "no",
      "what", "which", "who", "how", "when", "where", "why",
      "can", "will", "do", "does", "did", "has", "have", "had",
      "its", "his", "her", "our", "your", "their", "my",
      "all", "each", "every", "both", "more", "most", "some",
      "than", "too", "very", "just", "about", "into", "over",
      // Japanese particles / common words
      "の", "に", "は", "を", "が", "で", "と", "も", "か", "な",
      "する", "した", "して", "です", "ます", "ない", "ある", "いる",
      "から", "まで", "より", "へ", "という", "こと", "もの", "ため",
      "など", "これ", "それ", "あの", "この", "その",
      // Common YouTube title noise
      "【", "】", "「", "」", "｜", "|", "!", "?", "…", "、", "。",
      "#", "vol", "ep", "part",
    ]);

    const wordVideos = new Map<string, Set<string>>();

    for (const v of recentVideos) {
      // Split title into meaningful tokens (2+ chars, not stop words)
      const tokens = v.title
        .replace(/[【】「」｜|（）()《》〈〉\[\]#!?！？…、。.,]/g, " ")
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(
          (t) =>
            t.length >= 2 &&
            !stopWords.has(t.toLowerCase()) &&
            !/^\d+$/.test(t)
        );

      for (const token of tokens) {
        const set = wordVideos.get(token) ?? new Set();
        set.add(v.id);
        wordVideos.set(token, set);
      }
    }

    return [...wordVideos.entries()]
      .filter(([, ids]) => ids.size >= 2) // appears in 2+ videos
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 12)
      .map(([word, ids]) => ({
        word,
        count: ids.size,
        videoIds: [...ids],
      }));
  }, [recentVideos]);

  // Fetch keywords once, share with KeywordTrends + KeywordGraph
  const fetchKeywords = useCallback(() => {
    if (recentVideos.length === 0) return;

    setKeywordsLoading(true);
    setKeywordsError(false);
    fetch("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videos: recentVideos.map((v) => ({
          id: v.id,
          title: v.title,
          description: v.description,
        })),
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        if (data.keywords && data.keywords.length > 0) {
          setKeywords(filterChannelNames(data.keywords));
        } else {
          // API returned empty — use local fallback
          setKeywords(filterChannelNames(extractLocalKeywords()));
        }
      })
      .catch(() => {
        // API failed — use local fallback instead of showing error
        const local = filterChannelNames(extractLocalKeywords());
        if (local.length > 0) {
          setKeywords(local);
        } else {
          setKeywordsError(true);
        }
      })
      .finally(() => setKeywordsLoading(false));
  }, [recentVideos, extractLocalKeywords, filterChannelNames]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const sortedVideos = useMemo(() => {
    let filtered = selectedChannel
      ? recentVideos.filter((v) => v.channelId === selectedChannel)
      : recentVideos;

    if (keywordVideoIds) {
      const idSet = new Set(keywordVideoIds);
      filtered = filtered.filter((v) => idSet.has(v.id));
    }

    return [...filtered].sort((a, b) => {
      if (sortMode === "views") {
        return (b.viewCount ?? 0) - (a.viewCount ?? 0);
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }, [recentVideos, selectedChannel, sortMode, keywordVideoIds]);

  return (
    <div className="space-y-6">
      {/* View mode tabs */}
      <div className="flex items-center gap-1 border-b border-slate-700">
        <button
          onClick={() => setViewMode("feed")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            viewMode === "feed"
              ? "border-b-2 border-white text-white"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          피드
        </button>
        <button
          onClick={() => setViewMode("top3")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${
            viewMode === "top3"
              ? "border-b-2 border-white text-white"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          채널별 TOP
        </button>
      </div>

      {viewMode === "feed" ? (
        <>
          {/* Top section: 3-column intelligence panel */}
          <div className="grid gap-4 lg:grid-cols-3">
            <WeeklyBriefing videos={videos} />
            <KeywordGraph keywords={keywords} loading={keywordsLoading} error={keywordsError} onRetry={fetchKeywords} selectedKeyword={selectedKeyword} onKeywordSelect={handleKeywordSelect} />
            <ChannelScoreboard videos={recentVideos} />
          </div>

          {/* Sticky filter bar */}
          <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-[#0b1120]/95 px-4 pb-3 pt-2 backdrop-blur-sm">
            <ChannelFilter
              selected={selectedChannel}
              onSelect={setSelectedChannel}
            />
            <KeywordTrends keywords={keywords} loading={keywordsLoading} selectedKeyword={selectedKeyword} onKeywordSelect={handleKeywordSelect} />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-400">
                  {sortedVideos.length === recentVideos.length ? (
                    <>최근 30일 {recentVideos.length}개의 영상</>
                  ) : (
                    <>최근 30일 {recentVideos.length}개 중 <span className="font-medium text-white">{sortedVideos.length}개</span> 표시 중</>
                  )}
                </p>
                <RefreshButton onRefreshStart={handleRefreshStart} onRefreshEnd={handleRefreshEnd} />
              </div>
              <div className="inline-flex rounded-lg bg-slate-800 p-0.5 text-sm">
                <button
                  onClick={() => setSortMode("date")}
                  aria-pressed={sortMode === "date"}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                    sortMode === "date"
                      ? "bg-slate-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  최신순
                </button>
                <button
                  onClick={() => setSortMode("views")}
                  aria-pressed={sortMode === "views"}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${
                    sortMode === "views"
                      ? "bg-slate-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  조회수순
                </button>
              </div>
            </div>
          </div>
          {isRefreshing ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                  <div className="aspect-video w-full animate-pulse bg-slate-800" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-700" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 animate-pulse rounded bg-slate-800" />
                      <div className="h-5 w-12 animate-pulse rounded bg-slate-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <VideoGrid videos={sortedVideos} />
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              채널별 인기 영상 <span className="text-slate-600">· 최근 30일 · 조회수 기준</span>
            </p>
            <RefreshButton onRefreshStart={handleRefreshStart} onRefreshEnd={handleRefreshEnd} />
          </div>
          <ChannelTop3 videos={videos} />
        </>
      )}
    </div>
  );
}
