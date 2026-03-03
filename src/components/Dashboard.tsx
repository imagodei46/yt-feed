"use client";

import { useState, useMemo, useCallback } from "react";
import { Video } from "@/types";
import ChannelFilter from "./ChannelFilter";
import VideoGrid from "./VideoGrid";
import ChannelTop3 from "./ChannelTop3";
import KeywordTrends from "./KeywordTrends";
import WeeklyBriefing from "./WeeklyBriefing";
import CraftNotes from "./CraftNotes";
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshStart = useCallback(() => setIsRefreshing(true), []);
  const handleRefreshEnd = useCallback(() => setIsRefreshing(false), []);

  const sortedVideos = useMemo(() => {
    let filtered = selectedChannel
      ? videos.filter((v) => v.channelId === selectedChannel)
      : videos;

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
  }, [videos, selectedChannel, sortMode, keywordVideoIds]);

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
          {/* Top section: briefing + notes side by side */}
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <WeeklyBriefing videos={videos} />
            </div>
            <div className="lg:col-span-2">
              <CraftNotes videos={videos} />
            </div>
          </div>

          {/* Filter area: channel → keywords → sort */}
          <ChannelFilter
            selected={selectedChannel}
            onSelect={setSelectedChannel}
          />
          <KeywordTrends videos={videos} onKeywordSelect={setKeywordVideoIds} />
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {sortedVideos.length}개의 영상
            </p>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 text-sm">
                <button
                  onClick={() => setSortMode("date")}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    sortMode === "date"
                      ? "bg-white text-slate-900"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  최신순
                </button>
                <button
                  onClick={() => setSortMode("views")}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    sortMode === "views"
                      ? "bg-white text-slate-900"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
                >
                  조회수순
                </button>
              </div>
              <RefreshButton onRefreshStart={handleRefreshStart} onRefreshEnd={handleRefreshEnd} />
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
              채널별 조회수 기준 인기 영상
            </p>
            <RefreshButton onRefreshStart={handleRefreshStart} onRefreshEnd={handleRefreshEnd} />
          </div>
          <ChannelTop3 videos={videos} />
        </>
      )}
    </div>
  );
}
