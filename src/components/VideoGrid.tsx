import { Video } from "@/types";
import VideoCard from "./VideoCard";

interface VideoGridProps {
  videos: Video[];
  variant?: "longform" | "shortform";
}

export default function VideoGrid({ videos, variant = "longform" }: VideoGridProps) {
  if (videos.length === 0) {
    return null;
  }

  const gridClass =
    variant === "shortform"
      ? "grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={gridClass}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
