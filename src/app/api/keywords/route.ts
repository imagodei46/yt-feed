import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { Keyword } from "@/types";

interface KeywordsRequestBody {
  videos: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: KeywordsRequestBody = await request.json();
    const { videos } = body;

    if (!videos || videos.length === 0) {
      return NextResponse.json(
        { error: "videos array is required" },
        { status: 400 }
      );
    }

    // Build a compact text block: title + first 100 chars of description per video
    const videoText = videos
      .map(
        (v, i) =>
          `[${i + 1}] id=${v.id}\n제목: ${v.title}\n설명: ${v.description.slice(0, 100)}`
      )
      .join("\n\n");

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system:
        "You are a keyword extraction expert for Japanese business/news YouTube videos. " +
        "Extract the most important trending keywords and themes. " +
        "Return ONLY valid JSON, no markdown fences or extra text.",
      prompt: `다음은 일본 비즈니스/뉴스 YouTube 영상 목록입니다.
핵심 키워드를 10~15개 추출해주세요.

규칙:
- 키워드는 한국어로 번역 (예: AI, 스타트업, 엔저, 반도체 등)
- 영어 고유명사는 그대로 유지 (예: AI, ChatGPT, Tesla)
- 각 키워드가 등장하는 영상의 id 목록을 포함
- count는 해당 키워드가 관련된 영상 수

JSON 형식:
[{"word":"키워드","count":3,"videoIds":["id1","id2","id3"]}]

영상 목록:
${videoText}`,
      maxOutputTokens: 1000,
    });

    // Parse the JSON response from Claude
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const keywords: Keyword[] = JSON.parse(cleaned);

    return NextResponse.json({ keywords });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Keyword extraction error:", message);
    return NextResponse.json(
      { error: "Failed to extract keywords", detail: message },
      { status: 500 }
    );
  }
}
