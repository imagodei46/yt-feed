import { Video, Channel } from "@/types";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

function parseISO8601Duration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

interface PlaylistItemSnippet {
  title: string;
  description: string;
  publishedAt: string;
  thumbnails: {
    high?: { url: string };
    medium?: { url: string };
    default?: { url: string };
  };
  resourceId: {
    videoId: string;
  };
  channelId: string;
  channelTitle: string;
}

interface PlaylistItemsResponse {
  items: Array<{
    snippet: PlaylistItemSnippet;
  }>;
}

interface VideoStatistics {
  viewCount?: string;
  likeCount?: string;
}

interface VideosResponse {
  items: Array<{
    id: string;
    statistics: VideoStatistics;
    contentDetails?: {
      duration?: string;
    };
  }>;
}

export async function fetchChannelVideos(
  channel: Channel,
  maxResults = 5
): Promise<Video[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY is not set");

  const url = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("playlistId", channel.uploadsPlaylistId);
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `YouTube API error for ${channel.name}: ${res.status} ${errorText}`
    );
  }

  const data: PlaylistItemsResponse = await res.json();

  const videoIds = data.items.map((item) => item.snippet.resourceId.videoId);
  const detailsMap = await fetchVideoDetails(videoIds);

  return data.items.map((item) => {
    const videoId = item.snippet.resourceId.videoId;
    const detail = detailsMap.get(videoId);
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
}

async function fetchVideoDetails(
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

export async function fetchAllChannelVideos(
  channels: Channel[]
): Promise<Video[]> {
  const results = await Promise.allSettled(
    channels.map((ch) => fetchChannelVideos(ch))
  );

  const videos: Video[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      videos.push(...result.value);
    } else {
      console.error("Failed to fetch channel:", result.reason);
    }
  }

  // Sort by publish date (newest first)
  videos.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return videos;
}
