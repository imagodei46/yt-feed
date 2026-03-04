import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { SummarizeResponse } from "@/types";
import { fetchTranscript } from "./transcript";

export async function summarizeVideo(
  videoId: string,
  title: string,
  description: string
): Promise<SummarizeResponse> {
  const transcript = await fetchTranscript(videoId);

  // No transcript and no meaningful description — skip AI call
  const trimmedDesc = description?.trim() ?? "";
  if (!transcript && trimmedDesc.length < 30) {
    return {
      summary: `제목: ${title}\n\n설명이 부족하여 AI 요약을 생성할 수 없습니다.`,
      source: "unavailable",
    };
  }

  const source: "transcript" | "description" = transcript
    ? "transcript"
    : "description";

  const contentToSummarize = transcript
    ? `[자막]\n${transcript}`
    : `[제목] ${title}\n\n[설명]\n${trimmedDesc}`;

  const { text } = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system:
      "당신은 일본 YouTube 영상을 한국어로 요약하는 전문가입니다. " +
      "핵심 내용을 3~5개 포인트로 간결하게 요약하되, " +
      "한국 독자가 이해하기 쉽게 작성해주세요. " +
      "자연스러운 한국어로 작성하고, 불필요한 인사말이나 장식 없이 바로 요약을 시작하세요. " +
      "마크다운 기호(#, **, *, -, ```)를 절대 사용하지 마세요. 순수한 일반 텍스트로만 작성하세요. " +
      "반드시 모든 문장을 끝까지 완결하세요. 문장이 중간에 잘리지 않도록 하세요.",
    prompt: `다음 일본 YouTube 영상을 한국어로 요약해주세요.\n\n${contentToSummarize}`,
    maxOutputTokens: 800,
  });

  return { summary: text, source };
}
