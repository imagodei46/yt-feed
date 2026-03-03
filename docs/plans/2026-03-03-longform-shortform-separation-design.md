# Longform / Shortform Video Separation Design

## Goal

Separate videos into longform (top) and shortform (bottom) sections within the same feed page, so users can browse each format naturally without switching tabs.

## Requirements

- Longform = videos longer than 60 seconds (horizontal 16:9 cards, 3 per row)
- Shortform = videos 60 seconds or shorter (vertical 9:16 cards, 4-5 per row)
- Channel filter, keyword filter, and sort controls apply to both sections
- Section headers ("longform" / "shortform") to label each group
- Video count in header reflects filtered total

## Approach: YouTube API duration detection

Fetch `contentDetails` alongside `statistics` from the YouTube Videos API to get each video's `duration` (ISO 8601 format). Parse it to seconds, and classify as shortform if <= 60s.

### Why not keyword-based detection?

Title/description `#Shorts` tags are unreliable — not all Shorts include the tag, and some longform videos include it incorrectly.

## Data Changes

### `types/index.ts` — Video interface

Add two fields:

```typescript
duration?: number;    // seconds
isShorts?: boolean;   // true if duration <= 60
```

### `lib/youtube.ts` — API fetch

- Change `fetchVideoStatistics` to also request `contentDetails` part
- Parse ISO 8601 duration (`PT1M30S` -> 90 seconds)
- Return duration alongside statistics
- Set `isShorts` based on duration <= 60

## UI Changes

### `Dashboard.tsx` — Section split

Split `sortedVideos` into two arrays:

```
longformVideos = sortedVideos.filter(v => !v.isShorts)
shortformVideos = sortedVideos.filter(v => v.isShorts)
```

Render longform section first, then shortform section. Each with a section header.

### `VideoGrid.tsx` — Grid variant

Accept a `variant` prop: `"longform"` (default) or `"shortform"`.

- Longform: `grid-cols-3` with existing `VideoCard`
- Shortform: `grid-cols-4 lg:grid-cols-5` with compact vertical cards

### `VideoCard.tsx` — Shortform variant

When `isShorts` is true:

- Thumbnail aspect ratio changes from `aspect-video` (16:9) to `aspect-[9/16]` (vertical)
- Compact info: title (1 line), channel badge, view count
- No AI summary button (Shorts transcripts are rarely available)
- Link goes to `youtube.com/shorts/{id}` instead of `watch?v={id}`

### Skeleton loading

Add shortform skeleton variant: vertical cards with matching aspect ratio.

## Layout

```
┌──────────────────────────────────────────┐
│  [Existing filters and controls]         │
│  N개의 영상                최신순|조회수순│
├──────────────────────────────────────────┤
│  롱폼 영상 (M개)                         │
│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ 16:9   │ │ 16:9   │ │ 16:9   │       │
│  └────────┘ └────────┘ └────────┘       │
├──────────────────────────────────────────┤
│  숏폼 영상 (N개)                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐        │
│  │9:16│ │9:16│ │9:16│ │9:16│ │9:16│       │
│  └───┘ └───┘ └───┘ └───┘ └───┘        │
└──────────────────────────────────────────┘
```

## Edge Cases

- No shortform videos after filtering: hide shortform section entirely
- No longform videos after filtering: hide longform section, show only shortform
- Duration unavailable from API: default to longform (safer assumption)
