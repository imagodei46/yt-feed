import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

interface BriefingRequestBody {
  videos: Array<{
    title: string;
    channelName: string;
    description: string;
    viewCount?: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: BriefingRequestBody = await request.json();
    const { videos } = body;

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { error: "videos array is required" },
        { status: 400 }
      );
    }

    const videoText = videos
      .map(
        (v, i) =>
          `[${i + 1}] ${v.channelName}: ${v.title}\n${v.description.slice(0, 80)}`
      )
      .join("\n\n");

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system:
        "You are a Japanese business trend analyst writing for a Korean audience. " +
        "Synthesize cross-channel themes into a concise briefing. " +
        "Write in Korean. Be direct and insightful.",
      prompt: `다음은 이번 주 일본 비즈니스/뉴스 YouTube 영상 목록입니다.
채널을 넘나드는 공통 트렌드와 핵심 인사이트를 3가지로 요약해주세요.

형식:
1. **[트렌드 제목]** — 설명 (1~2문장)
2. **[트렌드 제목]** — 설명 (1~2문장)
3. **[트렌드 제목]** — 설명 (1~2문장)

영상 목록:
${videoText}`,
      maxOutputTokens: 600,
    });

    return NextResponse.json({ briefing: text });
  } catch (error) {
    console.error("Weekly briefing error:", error);
    return NextResponse.json(
      { error: "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
