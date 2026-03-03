# Longform / Shortform Separation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate the video feed into longform (top, 16:9 cards) and shortform (bottom, 9:16 vertical cards) sections using YouTube API duration data.

**Architecture:** Extend the existing YouTube API call to fetch `contentDetails` (duration). Parse ISO 8601 duration to seconds. Videos <= 60s are shortform. Dashboard splits filtered videos into two sections with distinct grid layouts.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, YouTube Data API v3

---

### Task 1: Add duration fields to Video type

**Files:**
- Modify: `src/types/index.ts:7-17`

**Step 1: Add duration and isShorts to Video interface**

```typescript
export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  channelId: string;
  channelName: string;
  viewCount?: number;
  likeCount?: number;
  duration?: number;
  isShorts?: boolean;
}
```

**Step 2: Verify no type errors**

Run: `cd /Users/JK/ANC/yt-feed && npx tsc --noEmit`
Expected: No errors (new fields are optional)

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add duration and isShorts fields to Video type"
```

---

### Task 2: Fetch duration from YouTube API and classify shorts

**Files:**
- Modify: `src/lib/youtube.ts`

**Step 1: Add ISO 8601 duration parser**

Add this function at the top of `youtube.ts` (after imports):

```typescript
function parseISO8601Duration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}
```

**Step 2: Update VideosResponse and fetchVideoStatistics to include contentDetails**

Change the `VideosResponse` interface:

```typescript
interface VideosResponse {
  items: Array<{
    id: string;
    statistics: VideoStatistics;
    contentDetails?: {
      duration?: string;
    };
  }>;
}
```

Change the API URL part parameter in `fetchVideoStatistics`:

```typescript
url.searchParams.set("part", "statistics,contentDetails");
```

Change the return type and map to include duration:

```typescript
async function fetchVideoStatistics(
  videoIds: string[]
): Promise<Map<string, { statistics: VideoStatistics; duration: number }>> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || videoIds.length === 0) return new Map();

  const url = new URL(`${YOUTUBE_API_BASE}/videos`);
  url.searchParams.set("part", "statistics,contentDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return new Map();

  const data: VideosResponse = await res.json();
  const map = new Map<string, { statistics: VideoStatistics; duration: number }>();
  for (const item of data.items) {
    const duration = item.contentDetails?.duration
      ? parseISO8601Duration(item.contentDetails.duration)
      : 0;
    map.set(item.id, { statistics: item.statistics, duration });
  }
  return map;
}
```

**Step 3: Update fetchChannelVideos to use new duration data**

In `fetchChannelVideos`, update the mapping:

```typescript
return data.items.map((item) => {
  const videoId = item.snippet.resourceId.videoId;
  const detail = statsMap.get(videoId);
  const duration = detail?.duration ?? 0;
  return {
    id: videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl:
      item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium?.url ||
      item.snippet.thumbnails.default?.url ||
      "",
    publishedAt: item.snippet.publishedAt,
    channelId: channel.id,
    channelName: channel.name,
    viewCount: detail?.statistics.viewCount ? Number(detail.statistics.viewCount) : undefined,
    likeCount: detail?.statistics.likeCount ? Number(detail.statistics.likeCount) : undefined,
    duration,
    isShorts: duration > 0 && duration <= 60,
  };
});
```

**Step 4: Verify no type errors**

Run: `cd /Users/JK/ANC/yt-feed && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/lib/youtube.ts
git commit -m "feat: fetch video duration from YouTube API and classify shorts"
```

---

### Task 3: Update VideoCard for shortform variant

**Files:**
- Modify: `src/components/VideoCard.tsx`

**Step 1: Add shortform rendering logic**

The card should:
- Use `aspect-[9/16]` for shorts thumbnail (instead of `aspect-video`)
- Link to `youtube.com/shorts/{id}` for shorts
- Show only 1-line title, channel badge, view count (no AI summary)
- Keep existing card for longform

Replace the component with:

```tsx
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
  const videoUrl = video.isShorts
    ? `https://www.youtube.com/shorts/${video.id}`
    : `https://www.youtube.com/watch?v=${video.id}`;

  if (video.isShorts) {
    return (
      <article className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-shadow hover:shadow-lg hover:shadow-slate-900/50">
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="block">
          <div className="relative aspect-[9/16] w-full overflow-hidden bg-slate-800">
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
        </a>
        <div className="p-3">
          <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="block">
            <h3 className="line-clamp-1 text-xs font-semibold leading-snug text-slate-100 hover:text-blue-400 transition-colors">
              {video.title}
            </h3>
          </a>
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className={`rounded px-1.5 py-0.5 font-medium ${CHANNEL_COLORS[video.channelName] ?? "bg-slate-700 text-slate-300"}`}>
              {video.channelName}
            </span>
            {video.viewCount !== undefined && (
              <span>▷ {formatCount(video.viewCount)}</span>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-shadow hover:shadow-lg hover:shadow-slate-900/50">
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="block">
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
        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="block">
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
```

**Step 2: Verify no type errors**

Run: `cd /Users/JK/ANC/yt-feed && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/VideoCard.tsx
git commit -m "feat: add shortform variant to VideoCard with vertical thumbnail"
```

---

### Task 4: Update VideoGrid to support shortform layout

**Files:**
- Modify: `src/components/VideoGrid.tsx`

**Step 1: Add variant prop for different grid layouts**

```tsx
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
```

**Step 2: Verify no type errors**

Run: `cd /Users/JK/ANC/yt-feed && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/VideoGrid.tsx
git commit -m "feat: add shortform grid variant with 5-column layout"
```

---

### Task 5: Split Dashboard into longform/shortform sections

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Add longform/shortform split and section rendering**

In Dashboard, after computing `sortedVideos`, split into two arrays:

```typescript
const longformVideos = useMemo(
  () => sortedVideos.filter((v) => !v.isShorts),
  [sortedVideos]
);

const shortformVideos = useMemo(
  () => sortedVideos.filter((v) => v.isShorts),
  [sortedVideos]
);
```

Update the video count display:

```tsx
<p className="text-sm text-slate-400">
  {sortedVideos.length}개의 영상
</p>
```

Replace the single `<VideoGrid videos={sortedVideos} />` with:

```tsx
{longformVideos.length > 0 && (
  <div className="space-y-3">
    <h2 className="text-sm font-medium text-slate-300">
      롱폼 영상
      <span className="ml-2 text-slate-500">{longformVideos.length}</span>
    </h2>
    <VideoGrid videos={longformVideos} />
  </div>
)}

{shortformVideos.length > 0 && (
  <div className="space-y-3">
    <h2 className="text-sm font-medium text-slate-300">
      숏폼 영상
      <span className="ml-2 text-slate-500">{shortformVideos.length}</span>
    </h2>
    <VideoGrid videos={shortformVideos} variant="shortform" />
  </div>
)}
```

Also update the skeleton loading section to include a shortform skeleton:

After the existing longform skeleton grid, add:

```tsx
{/* Shortform skeleton */}
<div className="space-y-3">
  <div className="h-4 w-24 animate-pulse rounded bg-slate-700" />
  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={`shorts-${i}`} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="aspect-[9/16] w-full animate-pulse bg-slate-800" />
        <div className="p-3 space-y-1.5">
          <div className="h-3 w-3/4 animate-pulse rounded bg-slate-700" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
        </div>
      </div>
    ))}
  </div>
</div>
```

**Step 2: Verify no type errors**

Run: `cd /Users/JK/ANC/yt-feed && npx tsc --noEmit`
Expected: No errors

**Step 3: Verify visually**

Run: `cd /Users/JK/ANC/yt-feed && npm run dev`
Check: http://localhost:3000 — longform cards on top, shortform vertical cards below

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: split feed into longform and shortform sections"
```

---

### Task 6: Build and final verification

**Step 1: Run production build**

Run: `cd /Users/JK/ANC/yt-feed && npm run build`
Expected: Build succeeds with no errors

**Step 2: Commit (if any remaining changes)**

```bash
git status
# If clean, no commit needed
```
