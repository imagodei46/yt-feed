# Weekly Briefing Persistence Design

## Goal

Accumulate weekly insights with keywords in a timeline. Generate once on Monday (covering last week's videos), persist for the entire week, and keep up to 4 weeks. Separate "last week summary" from "this week keywords."

## Current Problem

- WeeklyBriefing regenerates AI on every page load — previous insights lost
- No temporal distinction between last week's analysis and this week's live keywords
- Wastes API tokens by regenerating the same content repeatedly

## Requirements

- Rename "주간 인사이트" to "지난주 인사이트 요약"
- Generate new insight only on Mondays (previous week's videos)
- Persist for the entire week (Tue–Sun shows same content)
- Each saved entry includes: AI briefing + keywords from that week
- Up to 4 weeks of history (oldest auto-removed on 5th week)
- Latest week expanded, older weeks collapsed
- "이번 주 키워드" section stays live (real-time extraction from new videos)
- "새로 생성하기" button to manually regenerate current week

## Data Storage

JSON file at `data/briefings.json`.

```json
[
  {
    "weekStart": "2026-02-24",
    "weekEnd": "2026-03-02",
    "briefing": "1. **Trend A** — explanation...",
    "keywords": ["AI", "경제", "교육", "스타트업"],
    "videoCount": 30,
    "createdAt": "2026-03-03T09:00:00Z"
  }
]
```

Array sorted newest-first. Max 4 entries.

## Logic Flow

```
Page load → GET /api/weekly-briefing

Server:
  1. Read data/briefings.json (create if missing)
  2. Is today Monday AND no entry for this week?
     → Yes: Fetch videos, generate AI briefing + extract keywords, save, return all
     → No: Return existing entries
  3. First-ever load with no entries? Generate one immediately (bootstrap)

Client:
  - Render timeline of saved entries
  - Latest = expanded, older = collapsed
  - "새로 생성하기" button → POST /api/weekly-briefing?regenerate=true
```

## Week Calculation

- weekStart = previous Monday (start of week being summarized)
- weekEnd = previous Sunday
- Example: today Monday 3/3 → weekStart=2/24, weekEnd=3/2
- "This week's entry" = entry whose creation week matches current week

## API Changes

### GET /api/weekly-briefing (new)

Returns all saved briefings. If Monday and current week missing, auto-generates.

```json
{
  "briefings": [
    {
      "weekStart": "2026-02-24",
      "weekEnd": "2026-03-02",
      "briefing": "...",
      "keywords": ["AI", "경제", "교육"],
      "videoCount": 30,
      "createdAt": "2026-03-03T09:00:00Z"
    }
  ],
  "generated": true
}
```

### POST /api/weekly-briefing?regenerate=true (modified)

Force-regenerates current week's entry. Replaces existing if present.

### Briefing generation (internal)

Reuses existing AI prompt but adds keyword extraction in the same call:

```
"3가지 트렌드를 요약하고, 그 아래에 이 주의 핵심 키워드 5~8개를 JSON 배열로 제시하세요."
```

## UI Layout

```
┌─────────────────────────────────────────┐
│  지난주 인사이트 요약                      │
│                                         │
│  ● 2/24 ~ 3/2 (이번 주)                 │
│  1. 트렌드 A — 설명...                   │
│  2. 트렌드 B — 설명...                   │
│  3. 트렌드 C — 설명...                   │
│  [AI] [경제] [교육] [스타트업] ← 지난주 KW│
│                                         │
│  ▸ 2/17 ~ 2/23                          │
│  ▸ 2/10 ~ 2/16                          │
│  ▸ 2/3 ~ 2/9                            │
│                                         │
│            [새로 생성하기]                │
└─────────────────────────────────────────┘

(Below, in filter area — unchanged)
┌─────────────────────────────────────────┐
│  이번 주 키워드  ← 실시간 추출           │
│  [반도체] [M&A] [규제] [자동화] ...      │
└─────────────────────────────────────────┘
```

## Component Changes

### WeeklyBriefing.tsx

- Rename header: "주간 인사이트 요약" → "지난주 인사이트 요약"
- Fetch from GET /api/weekly-briefing (no POST body)
- Render timeline: latest expanded, older collapsed
- Each entry shows: date range + briefing text + keyword tags
- "새로 생성하기" button at bottom

### KeywordTrends.tsx

- No structural change — stays as live "이번 주 키워드"
- Already works correctly with current videos

### Dashboard.tsx

- Pass videos to WeeklyBriefing only for regeneration trigger
- No layout changes needed

## Edge Cases

- First load (no JSON file): create file + generate first entry
- Non-Monday with no entries: generate immediately (bootstrap)
- JSON corrupted: recreate with empty array, generate fresh
- No videos available for generation: skip, return existing entries
- 5th week added: remove oldest entry before saving
