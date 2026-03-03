# YT Feed Dashboard Plan

> "일본 비즈니스 트렌드 레이더" — 4가지 기능 + Craft 연결

## Feature 1: Keyword Trends (이번 주 핵심 키워드)

All video titles/descriptions from the week → Claude AI extracts top keywords → display as clickable tags with frequency counts.

- Source: existing video data (title + description)
- New: `/api/keywords` endpoint — Claude analyzes all videos and returns top keywords
- UI: keyword chips at top of dashboard, click to filter related videos

## Feature 2: Weekly Insight Summary (주간 인사이트 요약)

All videos from the week → Claude generates a 3-point briefing summarizing the key themes across channels.

- Source: existing video data + summaries
- New: `/api/weekly-briefing` endpoint — Claude synthesizes cross-channel themes
- UI: briefing card at top of dashboard, auto-generated weekly

## Feature 3: Craft Notes Connection (내 노트와 연결)

Match new videos with existing Craft notes using keyword similarity.

- Source: Craft MCP tools (`mcp__craft__documents_list`, `mcp__craft__blocks_get`)
- Target folders:
  - `Daily Journal` (8C731A4A) — 11 docs (AI 시대 사고법, 커리어 성찰)
  - `Study` (96EC30AB) — Digging, VC, Coding 등 하위 폴더 포함
  - `Book` (9BFC4D55) — Read Books 19 docs (독서 노트)
  - `Share` (AC516A98) — 2 docs (외부 공유)
- Flow: fetch note titles → Claude matches videos to notes → display connections
- Note: Craft MCP is local — this feature works in Claude Code, not in deployed web app
- Alternative: save matched results as JSON, load in dashboard

## Feature 4: Channel Top 3 (채널별 인기 영상 TOP 3)

Sort videos by view count per channel, show top 3 for each.

- Source: existing video data with viewCount (already added)
- New: group videos by channel, sort by viewCount, take top 3
- UI: channel cards showing top 3 videos with view counts

## Implementation Order

1. Feature 4 (Channel Top 3) — simplest, uses existing data
2. Feature 1 (Keywords) — needs new API endpoint + Claude call
3. Feature 2 (Weekly Briefing) — needs new API endpoint + Claude call
4. Feature 3 (Craft Connection) — most complex, needs Craft MCP integration

## Craft Folder IDs

```
Daily Journal:  8C731A4A-E087-4537-A6D2-CD80C8E4AC0F
Study:          96EC30AB-BF5A-4314-BE11-4619E26F9D4D
Book:           9BFC4D55-BF24-4FCB-A978-E6AE59D25A40
Share:          AC516A98-4B2C-4F3E-819C-B07E06133396
```
