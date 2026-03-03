import Image from "next/image";
import { Video } from "@/types";
import { formatDate, formatCount } from "@/lib/utils";
import SummarySection from "./SummarySection";

const CHANNEL_COLORS: Record<string, string> = {
  PIVOT: "bg-blue-500/20 text-blue-400",
  "TBS CrossDIG": "bg-rose-500/20 text-rose-400",
  "新R25": "bg-purple-500/20 text-purple-400",
  "The Solutions": "bg-emerald-500/20 text-emerald-400",
  "Forbes JP": "bg-amber-500/20 text-amber-400",
  NewsPicks: "bg-cyan-500/20 text-cyan-400",
};

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-shadow hover:shadow-lg hover:shadow-slate-900/50">
      <a
        href={`https://www.youtube.com/watch?v=${video.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform hover:scale-105"
          />
        </div>
      </a>
      <div className="flex flex-1 flex-col p-4">
        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-100 hover:text-blue-400 transition-colors">
            {video.title}
          </h3>
        </a>
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <span className={`rounded px-2 py-0.5 font-medium ${CHANNEL_COLORS[video.channelName] ?? "bg-slate-700 text-slate-300"}`}>
            {video.channelName}
          </span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>
        {(video.viewCount !== undefined || video.likeCount !== undefined) && (
          <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
            {video.viewCount !== undefined && (
              <span>&#9655; {formatCount(video.viewCount)}회</span>
            )}
            {video.likeCount !== undefined && (
              <span>&#9829; {formatCount(video.likeCount)}</span>
            )}
          </div>
        )}
        <div className="mt-auto">
          <SummarySection
            videoId={video.id}
            title={video.title}
            description={video.description}
          />
        </div>
      </div>
    </article>
  );
}
