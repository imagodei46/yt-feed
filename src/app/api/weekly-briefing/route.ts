import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { Video } from "@/types";
import {
  readBriefings,
  saveBriefings,
  getLastWeekRange,
  isMonday,
  hasEntryForCurrentWeek,
} from "@/lib/briefing-store";
import { fetchAllChannelVideos } from "@/lib/youtube";
import { CHANNELS } from "@/lib/channels";

async function generateBriefingEntry(videos: Video[]) {
  const { weekStart, weekEnd } = getLastWeekRange();

  // Build video list with IDs for reference
  const videoIdMap = new Map<number, string>(); // 1-indexed number → video ID
  const videoText = videos
    .map((v, i) => {
      videoIdMap.set(i + 1, v.id);
      return `[${i + 1}] ${v.channelName}: ${v.title}\n${v.description.slice(0, 80)}`;
    })
    .join("\n\n");

  const { text } = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system:
      "You are a Japanese business trend analyst writing for a Korean audience. " +
      "Synthesize cross-channel themes into a concise briefing. " +
      "Write in Korean. Be direct and insightful. " +
      "마크다운 기호(#, **, *, -, ```)를 절대 사용하지 마세요. 순수한 일반 텍스트로만 작성하세요.",
    prompt: `다음은 ${weekStart} ~ ${weekEnd} 기간의 일본 비즈니스/뉴스 YouTube 영상 목록입니다.

채널을 넘나드는 공통 트렌드와 핵심 인사이트를 3가지로 요약해주세요.

형식 (각 트렌드 끝에 해당 영상 번호를 반드시 표기):
1. [트렌드 제목] — 설명 (1~2문장) [영상: 1,3,7]
2. [트렌드 제목] — 설명 (1~2문장) [영상: 2,5,8]
3. [트렌드 제목] — 설명 (1~2문장) [영상: 4,6,9]

그리고 마지막 줄에 이 주의 핵심 키워드를 5~8개, 쉼표로 구분하여 나열해주세요.
키워드: AI, 경제, 교육 ...

영상 목록:
${videoText}`,
    maxOutputTokens: 800,
  });

  // Parse keywords and video references from AI response
  const lines = text.trim().split("\n");
  let keywords: string[] = [];
  const trendVideoIds: string[][] = [];

  const keywordLinePattern =
    /^(키워드|핵심\s*키워드|주요\s*키워드|주목할\s*키워드)\s*[:：]/i;
  const keywordContextPattern =
    /(?:SNS\s*버즈|핵심\s*키워드|주요\s*키워드|주목할\s*키워드|이\s*주의\s*키워드)/;
  // Match [영상: 1,3,7] or [1,3,7] at end of trend lines
  const videoRefPattern = /\[영상[:：]?\s*([\d,\s]+)\]\s*$/;

  const contentLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (keywordLinePattern.test(trimmed)) {
      const kwText = trimmed.replace(keywordLinePattern, "");
      keywords = kwText
        .split(/[,，、]/)
        .map((k) => k.trim())
        .filter(Boolean);
    } else if (keywordContextPattern.test(trimmed) && !trimmed.match(/^\d+[.)]/)) {
      const kwMatch = trimmed.match(/[:：]\s*(.+)$/);
      if (kwMatch && keywords.length === 0) {
        keywords = kwMatch[1]
          .split(/[,，、]/)
          .map((k) => k.trim())
          .filter(Boolean);
      }
    } else {
      // Extract video references from trend lines
      const refMatch = trimmed.match(videoRefPattern);
      if (refMatch && trimmed.match(/^\d+[.)]/)) {
        const nums = refMatch[1]
          .split(/[,\s]+/)
          .map((n) => parseInt(n.trim()))
          .filter((n) => !isNaN(n));
        const ids = nums
          .map((n) => videoIdMap.get(n))
          .filter((id): id is string => !!id);
        trendVideoIds.push(ids);
        // Remove the [영상: ...] tag from the display text
        contentLines.push(trimmed.replace(videoRefPattern, "").trim());
      } else {
        contentLines.push(trimmed);
      }
    }
  }

  const briefingText = contentLines.join("\n");

  return {
    weekStart,
    weekEnd,
    briefing: briefingText,
    keywords,
    videoCount: videos.length,
    createdAt: new Date().toISOString(),
    trendVideoIds,
  };
}

export async function GET() {
  try {
    let entries = await readBriefings();
    let generated = false;

    const shouldGenerate =
      entries.length === 0 ||
      (isMonday() && !hasEntryForCurrentWeek(entries));

    if (shouldGenerate) {
      const videos = await fetchAllChannelVideos(CHANNELS);
      const newEntry = await generateBriefingEntry(videos);

      entries = entries.filter((e) => e.weekStart !== newEntry.weekStart);
      entries.unshift(newEntry);
      await saveBriefings(entries);
      generated = true;
    }

    return NextResponse.json({ briefings: entries, generated });
  } catch (error) {
    console.error("Weekly briefing error:", error);
    return NextResponse.json(
      { error: "Failed to load briefings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const regenerate = url.searchParams.get("regenerate") === "true";

    if (!regenerate) {
      return NextResponse.json(
        { error: "Use ?regenerate=true" },
        { status: 400 }
      );
    }

    const videos = await fetchAllChannelVideos(CHANNELS);
    const newEntry = await generateBriefingEntry(videos);

    let entries = await readBriefings();
    entries = entries.filter((e) => e.weekStart !== newEntry.weekStart);
    entries.unshift(newEntry);
    await saveBriefings(entries);

    return NextResponse.json({ briefings: entries, generated: true });
  } catch (error) {
    console.error("Weekly briefing regenerate error:", error);
    return NextResponse.json(
      { error: "Failed to regenerate briefing" },
      { status: 500 }
    );
  }
}
