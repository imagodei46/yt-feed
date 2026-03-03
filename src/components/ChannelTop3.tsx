"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Video } from "@/types";
import { formatCount, formatDate } from "@/lib/utils";
import SummarySection from "./SummarySection";

// Shared channel color palette (matches VideoCard)
const CHANNEL_COLORS: Record<string, { chip: string; badge: string }> = {
  PIVOT: { chip: "bg-blue-500/20 text-blue-400 border-blue-500/30", badge: "bg-blue-500 text-white" },
  "TBS CrossDIG": { chip: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30", badge: "bg-fuchsia-500 text-white" },
  "新R25": { chip: "bg-amber-500/20 text-amber-400 border-amber-500/30", badge: "bg-amber-500 text-white" },
  "The Solutions": { chip: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", badge: "bg-emerald-500 text-white" },
  "Forbes JP": { chip: "bg-orange-500/20 text-orange-400 border-orange-500/30", badge: "bg-orange-500 text-white" },
  NewsPicks: { chip: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", badge: "bg-indigo-500 text-white" },
  ReHacQ: { chip: "bg-red-500/20 text-red-400 border-red-500/30", badge: "bg-red-500 text-white" },
  "テレ東BIZ": { chip: "bg-teal-500/20 text-teal-400 border-teal-500/30", badge: "bg-teal-500 text-white" },
};

const DEFAULT_COLOR = { chip: "bg-slate-700/50 text-slate-300 border-slate-600", badge: "bg-slate-600 text-white" };

interface ChannelTop3Props {
  videos: Video[];
}

interface ChannelGroup {
  channelId: string;
  channelName: string;
  topVideos: Video[];
  totalViews: number;
}

export default function ChannelTop3({ videos }: ChannelTop3Props) {
  const DAYS = 30;

  const channelGroups = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DAYS);

    const recent = videos.filter(
      (v) => new Date(v.publishedAt) >= cutoff
    );

    const grouped = new Map<string, Video[]>();
    for (const video of recent) {
      const existing = grouped.get(video.channelId) ?? [];
      existing.push(video);
      grouped.set(video.channelId, existing);
    }

    const groups: ChannelGroup[] = [];
    for (const [channelId, channelVideos] of grouped) {
      const sorted = [...channelVideos].sort(
        (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)
      );
      const topVideos = sorted.slice(0, 3);
      groups.push({
        channelId,
        channelName: sorted[0].channelName,
        topVideos,
        totalViews: topVideos.reduce((sum, v) => sum + (v.viewCount ?? 0), 0),
      });
    }

    groups.sort(
      (a, b) =>
        (b.topVideos[0]?.viewCount ?? 0) - (a.topVideos[0]?.viewCount ?? 0)
    );

    return groups;
  }, [videos]);

  const [activeChannel, setActiveChannel] = useState<string | null>(null);

  // Default to first channel
  const selectedId = activeChannel ?? channelGroups[0]?.channelId ?? null;
  const activeGroup = channelGroups.find((g) => g.channelId === selectedId) ?? null;

  if (channelGroups.length === 0) {
    return (
      <div className="py-20 text-center text-slate-500">
        표시할 영상이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Channel selector chips */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {channelGroups.map((group) => {
          const color = CHANNEL_COLORS[group.channelName] ?? DEFAULT_COLOR;
          const isActive = group.channelId === selectedId;
          return (
            <button
              key={group.channelId}
              onClick={() => setActiveChannel(group.channelId)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? color.chip
                  : "border-slate-700 bg-transparent text-slate-500 hover:border-slate-600 hover:text-slate-400"
              }`}
            >
              {group.channelName}
            </button>
          );
        })}
      </div>

      {/* Selected channel's top videos */}
      {activeGroup && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="mb-4 flex items-baseline gap-2">
            <h3 className={`text-base font-bold ${(CHANNEL_COLORS[activeGroup.channelName] ?? DEFAULT_COLOR).chip.split(" ").find((c) => c.startsWith("text-")) ?? "text-white"}`}>
              {activeGroup.channelName}
            </h3>
            <span className="text-xs font-normal text-slate-500">
              TOP 3 · 총 {formatCount(activeGroup.totalViews)}회
            </span>
          </div>
          <div className="space-y-3">
            {activeGroup.topVideos.map((video, index) => {
              const badgeColor = (CHANNEL_COLORS[activeGroup.channelName] ?? DEFAULT_COLOR).badge;
              const engagement =
                video.viewCount && video.likeCount
                  ? (video.likeCount / video.viewCount) * 100
                  : null;
              const isHotEngagement = engagement !== null && engagement >= 5;
              return (
                <div
                  key={video.id}
                  className="overflow-hidden rounded-lg border border-slate-800 transition-colors hover:border-slate-700"
                >
                  <a
                    href={`https://www.youtube.com/watch?v=${video.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3 p-2"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeColor}`}>
                        {index + 1}
                      </span>
                      <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-md bg-slate-800">
                        <Image
                          src={video.thumbnailUrl}
                          alt={video.title}
                          fill
                          sizes="144px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-200">
                        {video.title}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span>{formatDate(video.publishedAt)}</span>
                        {video.viewCount !== undefined && (
                          <span>&#9655; {formatCount(video.viewCount)}회</span>
                        )}
                        {video.likeCount !== undefined && (
                          <span>&#9829; {formatCount(video.likeCount)}</span>
                        )}
                        {engagement !== null && (
                          <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${
                            isHotEngagement
                              ? "bg-orange-500/20 text-orange-400"
                              : "text-slate-600"
                          }`}>
                            {isHotEngagement && "HOT "}
                            {engagement.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                  <div className="border-t border-slate-800">
                    <SummarySection
                      videoId={video.id}
                      title={video.title}
                      description={video.description}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
