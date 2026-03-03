"use client";

import { useState } from "react";
import { SummarizeResponse } from "@/types";

interface SummarySectionProps {
  videoId: string;
  title: string;
  description: string;
}

export default function SummarySection({
  videoId,
  title,
  description,
}: SummarySectionProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  async function handleSummarize() {
    setStatus("loading");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, title, description }),
      });

      if (!res.ok) throw new Error("Summarization failed");

      const data: SummarizeResponse = await res.json();
      setSummary(data.summary);
      setSource(data.source);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "idle") {
    return (
      <button
        onClick={handleSummarize}
        className="mt-3 flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
          />
        </svg>
        AI 요약 보기
      </button>
    );
  }

  if (status === "loading") {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
        요약 생성 중...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-3 space-y-1">
        <p className="text-sm text-red-400">요약 생성에 실패했습니다.</p>
        <button
          onClick={handleSummarize}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg bg-blue-500/10 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-blue-400">
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
          />
        </svg>
        AI 요약 {source === "description" && "(설명 기반)"}
      </div>
      <p className="text-sm leading-relaxed text-slate-300">{summary}</p>
    </div>
  );
}
