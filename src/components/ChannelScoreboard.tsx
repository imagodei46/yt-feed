"use client";

import { useMemo } from "react";
import { Video } from "@/types";
import { formatCount } from "@/lib/utils";

interface ChannelScoreboardProps {
  videos: Video[];
}

interface ChannelStats {
  channelId: string;
  channelName: string;
  videoCount: number;
  totalViews: number;
  viewSeries: number[]; // per-video views sorted by date for sparkline
}

// Mini sparkline SVG component
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 48;
  const h = 16;
  const max = Math.max(...data, 1);
  const step = w / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${h - (v / max) * (h - 2) - 1}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke="rgba(16,185,129,0.5)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Highlight last point */}
      {data.length > 0 && (
        <circle
          cx={(data.length - 1) * step}
          cy={h - (data[data.length - 1] / max) * (h - 2) - 1}
          r={2}
          fill="rgb(16,185,129)"
        />
      )}
    </svg>
  );
}

export default function ChannelScoreboard({ videos }: ChannelScoreboardProps) {
  const stats = useMemo(() => {
    const map = new Map<string, ChannelStats>();
    const videosByChannel = new Map<string, Video[]>();

    for (const v of videos) {
      const existing = map.get(v.channelId) ?? {
        channelId: v.channelId,
        channelName: v.channelName,
        videoCount: 0,
        totalViews: 0,
        viewSeries: [],
      };
      existing.videoCount++;
      existing.totalViews += v.viewCount ?? 0;
      map.set(v.channelId, existing);

      const vids = videosByChannel.get(v.channelId) ?? [];
      vids.push(v);
      videosByChannel.set(v.channelId, vids);
    }

    // Build sparkline series: views per video sorted oldest→newest
    for (const [channelId, vids] of videosByChannel) {
      const sorted = [...vids].sort(
        (a, b) =>
          new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );
      const stats_ = map.get(channelId);
      if (stats_) {
        stats_.viewSeries = sorted.map((v) => v.viewCount ?? 0);
      }
    }

    return [...map.values()].sort((a, b) => b.totalViews - a.totalViews);
  }, [videos]);

  if (stats.length === 0) return null;

  const maxViews = stats[0]?.totalViews || 1;

  return (
    <div className="flex flex-col rounded-xl border-l-2 border-emerald-400 bg-gradient-to-r from-emerald-500/5 to-slate-900 p-4">
      <p className="mb-0.5 text-[10px] font-medium tracking-wide text-emerald-400/80 uppercase">
        Channel Scoreboard
      </p>
      <p className="mb-1 text-xs font-bold text-white">
        이번 주 채널별 성과
      </p>
      <p className="mb-3 text-[10px] text-slate-500">
        영상별 조회수 추이
      </p>

      <div className="flex-1 space-y-2.5">
        {stats.map((ch, idx) => (
          <div key={ch.channelId} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-slate-500">
                  {idx + 1}
                </span>
                <span className="text-xs font-medium text-slate-200">
                  {ch.channelName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkline data={ch.viewSeries} />
                <span className="text-[10px] text-slate-500">{ch.videoCount}편</span>
              </div>
            </div>
            <div className="ml-7 flex items-center gap-2">
              <div className="h-1 flex-1 rounded-full bg-slate-800">
                <div
                  className="h-1 rounded-full bg-emerald-500/60 transition-all"
                  style={{ width: `${(ch.totalViews / maxViews) * 100}%` }}
                />
              </div>
              <span className="w-14 text-right text-[10px] tabular-nums text-slate-400">
                {formatCount(ch.totalViews)}회
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
