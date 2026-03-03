import { useMemo } from "react";
import Image from "next/image";
import { Video } from "@/types";
import { formatCount } from "@/lib/utils";

interface ChannelTop3Props {
  videos: Video[];
}

interface ChannelGroup {
  channelId: string;
  channelName: string;
  topVideos: Video[];
}

export default function ChannelTop3({ videos }: ChannelTop3Props) {
  const channelGroups = useMemo(() => {
    const grouped = new Map<string, Video[]>();

    for (const video of videos) {
      const existing = grouped.get(video.channelId) ?? [];
      existing.push(video);
      grouped.set(video.channelId, existing);
    }

    const groups: ChannelGroup[] = [];
    for (const [channelId, channelVideos] of grouped) {
      const sorted = [...channelVideos].sort(
        (a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)
      );
      groups.push({
        channelId,
        channelName: sorted[0].channelName,
        topVideos: sorted.slice(0, 3),
      });
    }

    // Sort channels by their top video's view count (most popular channel first)
    groups.sort(
      (a, b) =>
        (b.topVideos[0]?.viewCount ?? 0) - (a.topVideos[0]?.viewCount ?? 0)
    );

    return groups;
  }, [videos]);

  if (channelGroups.length === 0) {
    return (
      <div className="py-20 text-center text-slate-500">
        표시할 영상이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {channelGroups.map((group) => (
        <div
          key={group.channelId}
          className="rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <h3 className="mb-4 text-base font-bold text-white">
            {group.channelName}
          </h3>
          <div className="space-y-3">
            {group.topVideos.map((video, index) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-slate-800"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
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
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    {video.viewCount !== undefined && (
                      <span>&#9655; {formatCount(video.viewCount)}회</span>
                    )}
                    {video.likeCount !== undefined && (
                      <span>&#9829; {formatCount(video.likeCount)}</span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
