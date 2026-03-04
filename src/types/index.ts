export interface Channel {
  id: string;
  name: string;
  uploadsPlaylistId: string;
}

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
}

export interface SummarizeRequest {
  videoId: string;
  title: string;
  description: string;
}

export interface SummarizeResponse {
  summary: string;
  source: "transcript" | "description" | "unavailable";
}

export interface Keyword {
  word: string;
  count: number;
  videoIds: string[];
}

export interface BriefingEntry {
  weekStart: string;
  weekEnd: string;
  briefing: string;
  keywords: string[];
  videoCount: number;
  createdAt: string;
  // Video IDs referenced by each trend (index 0 = trend 1, etc.)
  trendVideoIds?: string[][];
}
