import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

interface NoteInput {
  folder: string;
  title: string;
  keywords: string[];
}

interface MatchRequestBody {
  videos: Array<{
    id: string;
    title: string;
    channelName: string;
    description: string;
  }>;
  notes: NoteInput[];
}

export interface CraftMatch {
  videoId: string;
  videoTitle: string;
  noteTitle: string;
  noteFolder: string;
  reason: string;
  matchedKeywords: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: MatchRequestBody = await request.json();
    const { videos, notes } = body;

    if (!videos?.length || !notes?.length) {
      return NextResponse.json(
        { error: "videos and notes arrays are required" },
        { status: 400 }
      );
    }

    const videoText = videos
      .map(
        (v) =>
          `id=${v.id} | ${v.channelName}: ${v.title}\n  설명: ${v.description.slice(0, 80)}`
      )
      .join("\n");

    const noteText = notes
      .map((n) => `[${n.folder}] ${n.title} — 키워드: ${n.keywords.join(", ")}`)
      .join("\n");

    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      system:
        "You are a knowledge connector specializing in Japanese business content. " +
        "Match YouTube videos with personal study notes based on thematic and keyword similarity. " +
        "Return ONLY valid JSON, no markdown fences.",
      prompt: `아래 YouTube 영상과 개인 노트를 비교해서, 주제가 관련 있는 쌍을 찾아주세요.

규칙:
- 노트의 키워드와 영상 제목/설명의 주제가 겹치는 것을 매칭
- 같은 산업(반도체, AI, 경제 등), 같은 개념(리더십, 경영 등), 같은 키워드로 연결
- 최대 5개 매칭, 가장 관련성 높은 순서로
- reason은 한국어 10자 이내로 간결하게
- matchedKeywords는 1~2개만

JSON 형식 (간결하게):
[{"videoId":"id","videoTitle":"제목(20자이내)","noteTitle":"노트","noteFolder":"폴더","reason":"이유","matchedKeywords":["kw"]}]

=== YouTube 영상 ===
${videoText}

=== 개인 노트 (키워드 포함) ===
${noteText}`,
      maxOutputTokens: 800,
    });

    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();

    // Try to parse; if truncated, attempt to fix by closing brackets
    let matches: CraftMatch[];
    try {
      matches = JSON.parse(cleaned);
    } catch {
      // Try to salvage truncated JSON by finding the last complete object
      const lastBrace = cleaned.lastIndexOf("}");
      if (lastBrace > 0) {
        const salvaged = cleaned.slice(0, lastBrace + 1) + "]";
        matches = JSON.parse(salvaged);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Craft match error:", error);
    return NextResponse.json(
      { error: "Failed to match videos with notes" },
      { status: 500 }
    );
  }
}
