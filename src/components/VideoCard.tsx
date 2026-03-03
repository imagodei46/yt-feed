import Image from "next/image";
import { Video } from "@/types";
import { formatDate, formatCount } from "@/lib/utils";
import SummarySection from "./SummarySection";

const CHANNEL_COLORS: Record<string, string> = {
  PIVOT: "bg-blue-500/20 text-blue-400",
  "TBS CrossDIG": "bg-fuchsia-500/20 text-fuchsia-400",
  "新R25": "bg-amber-500/20 text-amber-400",
  "The Solutions": "bg-emerald-500/20 text-emerald-400",
  "Forbes JP": "bg-orange-500/20 text-orange-400",
  NewsPicks: "bg-indigo-500/20 text-indigo-400",
  ReHacQ: "bg-red-500/20 text-red-400",
  "テレ東BIZ": "bg-teal-500/20 text-teal-400",
};

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50">
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
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 scale-75">
              <svg
                className="ml-0.5 h-5 w-5 text-slate-900"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </a>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-400">
          <span
            className={`rounded px-2 py-0.5 font-medium ${CHANNEL_COLORS[video.channelName] ?? "bg-slate-700 text-slate-300"}`}
          >
            {video.channelName}
          </span>
          <span>{formatDate(video.publishedAt)}</span>
        </div>

        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group/title block"
          title={video.title}
        >
          <h3 className="line-clamp-3 text-sm font-semibold leading-snug text-slate-100 transition-colors group-hover/title:text-blue-400">
            {video.title}
          </h3>
        </a>

        {video.description && (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500 max-lg:opacity-100 lg:opacity-0 lg:transition-opacity lg:duration-200 lg:group-hover:opacity-100">
            {video.description.slice(0, 120)}
          </p>
        )}

        {(video.viewCount !== undefined || video.likeCount !== undefined) && (
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            {video.viewCount !== undefined && (
              <span>&#9655; {formatCount(video.viewCount)}회</span>
            )}
            {video.likeCount !== undefined && (
              <span>&#9829; {formatCount(video.likeCount)}</span>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-slate-800">
        <SummarySection
          videoId={video.id}
          title={video.title}
          description={video.description}
        />
      </div>
    </article>
  );
}
