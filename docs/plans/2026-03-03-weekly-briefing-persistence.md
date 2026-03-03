# Weekly Briefing Persistence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist weekly insights in a JSON file with 4-week timeline, Monday-only generation, and separate last-week keywords from live this-week keywords.

**Architecture:** Server reads/writes `data/briefings.json` for persistence. GET endpoint returns saved entries (auto-generates on Monday if missing). WeeklyBriefing component renders a timeline with expanded latest and collapsed history. KeywordTrends stays unchanged as live "이번 주 키워드."

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Vercel AI SDK, Claude Haiku 4.5

---

### Task 1: Add BriefingEntry type

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add BriefingEntry interface**

Add after the `Keyword` interface:

```typescript
export interface BriefingEntry {
  weekStart: string;
  weekEnd: string;
  briefing: string;
  keywords: string[];
  videoCount: number;
  createdAt: string;
}
```

**Step 2: Verify no type errors**

Run: `cd /Users/JK/ANC/yt-feed && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add BriefingEntry type for persistent weekly insights"
```

---

### Task 2: Create briefing storage utility

**Files:**
- Create: `src/lib/briefing-store.ts`

**Step 1: Write the storage helper**

This module handles reading/writing `data/briefings.json` and week date calculations.

```typescript
import { BriefingEntry } from "@/types";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "briefings.json");
const MAX_ENTRIES = 4;

export function getLastWeekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const daysToLastMonday = dayOfWeek === 0 ? 8 : dayOfWeek + 6;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysToLastMonday);
  lastMonday.setHours(0, 0, 0, 0);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { weekStart: fmt(lastMonday), weekEnd: fmt(lastSunday) };
}

export function isMonday(): boolean {
  return new Date().getDay() === 1;
}

export async function readBriefings(): Promise<BriefingEntry[]> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveBriefings(entries: BriefingEntry[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const trimmed = entries.slice(0, MAX_ENTRIES);
  await writeFile(FILE_PATH, JSON.stringify(trimmed, null, 2), "utf-8");
}

export function hasEntryForCurrentWeek(entries: BriefingEntry[]): boolean {
  const { weekStart } = getLastWeekRange();
  return entries.some((e) => e.weekStart === weekStart);
}
```

**Step 2: Verify no type errors**

Run: `cd /Users/JK/ANC/yt-feed && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/briefing-store.ts
git commit -m "feat: add briefing-store utility for JSON file persistence"
```

---

### Task 3: Rewrite weekly-briefing API route

**Files:**
- Modify: `src/app/api/weekly-briefing/route.ts`

**Step 1: Replace the route with GET + POST handlers**

```typescript
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
      "Write in Korean. Be direct and insightful. " +
      "마크다운 기호(#, **, *, -, ```)를 절대 사용하지 마세요. 순수한 일반 텍스트로만 작성하세요.",
    prompt: `다음은 ${weekStart} ~ ${weekEnd} 기간의 일본 비즈니스/뉴스 YouTube 영상 목록입니다.

채널을 넘나드는 공통 트렌드와 핵심 인사이트를 3가지로 요약해주세요.

형식:
1. [트렌드 제목] — 설명 (1~2문장)
2. [트렌드 제목] — 설명 (1~2문장)
3. [트렌드 제목] — 설명 (1~2문장)

그리고 마지막 줄에 이 주의 핵심 키워드를 5~8개, 쉼표로 구분하여 나열해주세요.
키워드: AI, 경제, 교육 ...

영상 목록:
${videoText}`,
    maxOutputTokens: 800,
  });

  // Parse keywords from last line
  const lines = text.trim().split("\n");
  let keywords: string[] = [];
  let briefingText = text;

  const lastLine = lines[lines.length - 1];
  if (lastLine.startsWith("키워드:") || lastLine.startsWith("키워드 :")) {
    keywords = lastLine
      .replace(/^키워드\s*:\s*/, "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    briefingText = lines.slice(0, -1).join("\n").trim();
  }

  return {
    weekStart,
    weekEnd,
    briefing: briefingText,
    keywords,
    videoCount: videos.length,
    createdAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    let entries = await readBriefings();
    let generated = false;

    const shouldGenerate =
      (entries.length === 0) ||
      (isMonday() && !hasEntryForCurrentWeek(entries));

    if (shouldGenerate) {
      const videos = await fetchAllChannelVideos(CHANNELS);
      const newEntry = await generateBriefingEntry(videos);

      // Replace if same week exists, otherwise prepend
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
      return NextResponse.json({ error: "Use ?regenerate=true" }, { status: 400 });
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
```

**Step 2: Verify the channels import exists**

Check: `src/lib/channels.ts` should export `CHANNELS`. If not, find where channels are defined.

**Step 3: Verify no type errors**

Run: `cd /Users/JK/ANC/yt-feed && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/app/api/weekly-briefing/route.ts
git commit -m "feat: rewrite weekly-briefing API with GET/POST and JSON persistence"
```

---

### Task 4: Rewrite WeeklyBriefing component

**Files:**
- Modify: `src/components/WeeklyBriefing.tsx`

**Step 1: Replace component with timeline UI**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { BriefingEntry } from "@/types";

interface WeeklyBriefingProps {
  videos: unknown[];
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart);
  const e = new Date(weekEnd);
  const fmt = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(s)} ~ ${fmt(e)}`;
}

export default function WeeklyBriefing({ videos }: WeeklyBriefingProps) {
  const [entries, setEntries] = useState<BriefingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  const toggleWeek = useCallback((weekStart: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekStart)) next.delete(weekStart);
      else next.add(weekStart);
      return next;
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetch("/api/weekly-briefing")
      .then((res) => res.json())
      .then((data) => {
        if (data.briefings) {
          setEntries(data.briefings);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [videos]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/weekly-briefing?regenerate=true", {
        method: "POST",
      });
      const data = await res.json();
      if (data.briefings) {
        setEntries(data.briefings);
      }
    } catch {
      // silent fail
    } finally {
      setRegenerating(false);
    }
  };

  if (error) return null;

  if (loading) {
    return (
      <div className="rounded-xl border-l-2 border-amber-400 bg-gradient-to-r from-amber-500/5 to-slate-900 p-5">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
          지난주 인사이트 분석 중...
        </div>
      </div>
    );
  }

  if (entries.length === 0) return null;

  return (
    <div className="flex h-full flex-col rounded-xl border-l-2 border-amber-400 bg-gradient-to-r from-amber-500/5 to-slate-900 p-5">
      <p className="mb-1 text-xs font-medium tracking-wide text-amber-400/80 uppercase">
        Weekly Trend Radar
      </p>
      <h3 className="mb-4 text-sm font-bold text-white">
        지난주 인사이트 요약
      </h3>

      <div className="flex-1 space-y-4">
        {entries.map((entry, idx) => {
          const isLatest = idx === 0;
          const isExpanded = isLatest || expandedWeeks.has(entry.weekStart);
          const dateLabel = formatWeekRange(entry.weekStart, entry.weekEnd);

          return (
            <div key={entry.weekStart}>
              <button
                onClick={() => !isLatest && toggleWeek(entry.weekStart)}
                className={`flex w-full items-center gap-2 text-left text-xs font-medium ${
                  isLatest
                    ? "text-amber-400 cursor-default"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <span>{isExpanded ? "●" : "▸"}</span>
                <span>{dateLabel}</span>
                {isLatest && (
                  <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                    최신
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="mt-2 space-y-2 pl-5">
                  {entry.briefing
                    .split("\n")
                    .filter((l) => l.trim())
                    .map((line, i) => (
                      <p
                        key={i}
                        className="text-sm leading-relaxed text-slate-300"
                      >
                        {line}
                      </p>
                    ))}

                  {entry.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {entry.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs text-amber-400/80"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        className="mt-4 self-center text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
      >
        {regenerating ? "생성 중..." : "새로 생성하기"}
      </button>
    </div>
  );
}
```

**Step 2: Verify no type errors**

Run: `cd /Users/JK/ANC/yt-feed && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/WeeklyBriefing.tsx
git commit -m "feat: rewrite WeeklyBriefing with persistent timeline UI"
```

---

### Task 5: Create data directory and gitignore

**Files:**
- Create: `data/.gitkeep`
- Modify: `.gitignore`

**Step 1: Create data directory with .gitkeep**

```bash
mkdir -p data
touch data/.gitkeep
```

**Step 2: Add briefings.json to .gitignore**

Add to `.gitignore`:
```
data/briefings.json
```

This keeps the data directory in git but excludes the generated data file.

**Step 3: Commit**

```bash
git add data/.gitkeep .gitignore
git commit -m "feat: add data directory for briefing persistence"
```

---

### Task 6: Build and verify

**Step 1: Run production build**

Run: `cd /Users/JK/ANC/yt-feed && npm run build`
Expected: Build succeeds with no errors

**Step 2: Run dev server and verify**

Run: `npm run dev`
Check: http://localhost:3000
- "지난주 인사이트 요약" header should appear
- First load generates and saves an entry
- Page refresh shows saved entry (no AI regeneration)
- "새로 생성하기" button works

**Step 3: Verify data file created**

Run: `cat data/briefings.json`
Expected: JSON array with one entry containing weekStart, weekEnd, briefing, keywords
