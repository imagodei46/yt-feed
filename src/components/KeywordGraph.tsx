"use client";

import { useState, useMemo, useCallback } from "react";
import { Keyword } from "@/types";

interface KeywordGraphProps {
  keywords: Keyword[];
  loading: boolean;
  error?: boolean;
  onRetry?: () => void;
  selectedKeyword: string | null;
  onKeywordSelect: (word: string | null, videoIds: string[] | null) => void;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
}

type ViewMode = "network" | "bubble";

function computeEdges(keywords: Keyword[]): Edge[] {
  const videoToKws = new Map<string, string[]>();
  for (const kw of keywords) {
    for (const vid of kw.videoIds) {
      const existing = videoToKws.get(vid) ?? [];
      existing.push(kw.word);
      videoToKws.set(vid, existing);
    }
  }

  const pairCount = new Map<string, number>();
  for (const [, kws] of videoToKws) {
    for (let i = 0; i < kws.length; i++) {
      for (let j = i + 1; j < kws.length; j++) {
        const key = [kws[i], kws[j]].sort().join("||");
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
      }
    }
  }

  return [...pairCount.entries()].map(([key, weight]) => {
    const [from, to] = key.split("||");
    return { from, to, weight };
  });
}

// Estimate text width (CJK chars ~10px, latin ~6px at font-size 9)
function estimateTextWidth(word: string, fontSize: number): number {
  let w = 0;
  for (const ch of word) {
    w += ch.charCodeAt(0) > 255 ? fontSize * 1.1 : fontSize * 0.6;
  }
  return w;
}

// Bubble layout: pack circles using golden-angle spiral for even distribution
function computeBubblePositions(
  keywords: Keyword[],
  width: number,
  height: number
) {
  const cx = width / 2;
  const cy = height / 2;
  const maxCount = Math.max(...keywords.map((k) => k.count), 1);
  const positions: { word: string; x: number; y: number; r: number; textW: number }[] = [];

  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

  const sorted = [...keywords].sort((a, b) => b.count - a.count);
  for (let idx = 0; idx < sorted.length; idx++) {
    const kw = sorted[idx];
    const r = 12 + (kw.count / maxCount) * 16;
    const fontSize = r > 25 ? 10 : r > 18 ? 9 : 8;
    const textW = estimateTextWidth(kw.word, fontSize);
    // Collision radius: max of circle radius and half text width, plus padding
    const collisionR = Math.max(r, textW / 2 + 4);

    if (idx === 0) {
      positions.push({ word: kw.word, x: cx, y: cy, r, textW });
      continue;
    }

    let placed = false;
    const startAngle = idx * GOLDEN_ANGLE;
    for (let dist = 0; dist < 180 && !placed; dist += 3) {
      for (let step = 0; step < 12 && !placed; step++) {
        const angle = startAngle + (step * Math.PI * 2) / 12;
        const x = cx + dist * Math.cos(angle);
        const y = cy + dist * Math.sin(angle);
        const overlaps = positions.some((p) => {
          const pCollisionR = Math.max(p.r, p.textW / 2 + 4);
          return Math.hypot(p.x - x, p.y - y) < pCollisionR + collisionR + 6;
        });
        if (
          !overlaps &&
          x - collisionR > 2 &&
          x + collisionR < width - 2 &&
          y - r > 2 &&
          y + r < height - 2
        ) {
          positions.push({ word: kw.word, x, y, r, textW });
          placed = true;
        }
      }
    }
    if (!placed) {
      positions.push({ word: kw.word, x: cx, y: cy, r, textW });
    }
  }
  return positions;
}

const BUBBLE_COLORS = [
  { fill: "rgba(6,182,212,0.35)", stroke: "rgba(6,182,212,0.75)" },
  { fill: "rgba(139,92,246,0.35)", stroke: "rgba(139,92,246,0.75)" },
  { fill: "rgba(244,63,94,0.35)", stroke: "rgba(244,63,94,0.75)" },
  { fill: "rgba(245,158,11,0.35)", stroke: "rgba(245,158,11,0.75)" },
  { fill: "rgba(16,185,129,0.35)", stroke: "rgba(16,185,129,0.75)" },
  { fill: "rgba(59,130,246,0.35)", stroke: "rgba(59,130,246,0.75)" },
  { fill: "rgba(236,72,153,0.35)", stroke: "rgba(236,72,153,0.75)" },
  { fill: "rgba(168,85,247,0.35)", stroke: "rgba(168,85,247,0.75)" },
];

export default function KeywordGraph({
  keywords,
  loading,
  error,
  onRetry,
  selectedKeyword,
  onKeywordSelect,
}: KeywordGraphProps) {
  const [hoveredKw, setHoveredKw] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("bubble");

  const displayKws = useMemo(() => keywords.slice(0, 10), [keywords]);
  const edges = useMemo(() => computeEdges(displayKws), [displayKws]);

  const connectedTo = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const edge of edges) {
      const setA = map.get(edge.from) ?? new Set();
      setA.add(edge.to);
      map.set(edge.from, setA);

      const setB = map.get(edge.to) ?? new Set();
      setB.add(edge.from);
      map.set(edge.to, setB);
    }
    return map;
  }, [edges]);

  const handleNodeClick = useCallback(
    (kw: Keyword) => {
      if (selectedKeyword === kw.word) {
        onKeywordSelect(null, null);
      } else {
        onKeywordSelect(kw.word, kw.videoIds);
      }
    },
    [selectedKeyword, onKeywordSelect]
  );

  const WIDTH = 280;
  const HEIGHT = 200;
  const RADIUS = 75;
  const maxCount = Math.max(...displayKws.map((k) => k.count), 1);

  const nodePositions = useMemo(() => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    const positions = new Map<string, { x: number; y: number; angle: number }>();
    displayKws.forEach((kw, i) => {
      const angle = (2 * Math.PI * i) / displayKws.length - Math.PI / 2;
      positions.set(kw.word, {
        x: cx + RADIUS * Math.cos(angle),
        y: cy + RADIUS * Math.sin(angle),
        angle,
      });
    });
    return positions;
  }, [displayKws]);

  const bubblePositions = useMemo(
    () => computeBubblePositions(displayKws, WIDTH, HEIGHT),
    [displayKws]
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-l-2 border-cyan-400 bg-gradient-to-r from-cyan-500/5 to-slate-900 p-4">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />
        <p className="mt-2 text-[10px] text-slate-500">키워드 분석 중...</p>
      </div>
    );
  }

  // Error state with retry
  if (error || displayKws.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-l-2 border-cyan-400 bg-gradient-to-r from-cyan-500/5 to-slate-900 p-4">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
          <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-xs font-medium text-slate-400">키워드 분석 실패</p>
        <p className="mt-1 text-[10px] text-slate-600">AI 서버가 일시적으로 바쁩니다</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 rounded-full bg-cyan-400/20 px-3 py-1 text-[10px] font-medium text-cyan-400 transition-colors hover:bg-cyan-400/30"
          >
            다시 시도
          </button>
        )}
      </div>
    );
  }

  const activeKw = hoveredKw ?? selectedKeyword;

  const isHighlighted = (word: string) => {
    if (!activeKw) return true;
    return word === activeKw || (connectedTo.get(activeKw)?.has(word) ?? false);
  };

  const isEdgeHighlighted = (edge: Edge) => {
    if (!activeKw) return true;
    return edge.from === activeKw || edge.to === activeKw;
  };

  return (
    <div className="flex flex-col rounded-xl border-l-2 border-cyan-400 bg-gradient-to-r from-cyan-500/5 to-slate-900 p-4">
      {/* Header with view toggle */}
      <div className="mb-1 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium tracking-wide text-cyan-400/80 uppercase">
            Keyword Map
          </p>
          <p className="text-xs font-bold text-white">핵심 키워드</p>
        </div>
        <div className="flex rounded-md bg-slate-800 p-0.5">
          <button
            onClick={() => setViewMode("bubble")}
            className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
              viewMode === "bubble"
                ? "bg-slate-700 text-white"
                : "text-slate-500 hover:text-slate-400"
            }`}
            title="버블 차트"
          >
            ●
          </button>
          <button
            onClick={() => setViewMode("network")}
            className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
              viewMode === "network"
                ? "bg-slate-700 text-white"
                : "text-slate-500 hover:text-slate-400"
            }`}
            title="관계도"
          >
            ◈
          </button>
        </div>
      </div>
      <p className="mb-2 text-[10px] text-slate-500">
        클릭하면 해당 키워드 영상만 필터링
      </p>

      <div className="flex flex-1 items-center justify-center">
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="max-h-full max-w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {viewMode === "network" ? (
            <>
              {/* Network: Edges */}
              {edges
                .filter(
                  (e) => nodePositions.has(e.from) && nodePositions.has(e.to)
                )
                .map((edge) => {
                  const from = nodePositions.get(edge.from)!;
                  const to = nodePositions.get(edge.to)!;
                  const highlighted = isEdgeHighlighted(edge);
                  return (
                    <line
                      key={`${edge.from}-${edge.to}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={
                        highlighted
                          ? "rgba(6,182,212,0.3)"
                          : "rgba(6,182,212,0.06)"
                      }
                      strokeWidth={Math.min(edge.weight, 3)}
                      className="transition-all duration-200"
                    />
                  );
                })}

              {/* Network: Nodes */}
              {displayKws.map((kw) => {
                const pos = nodePositions.get(kw.word);
                if (!pos) return null;
                const highlighted = isHighlighted(kw.word);
                const isSelected = selectedKeyword === kw.word;
                const isHovered = hoveredKw === kw.word;
                const nodeSize = 8 + (kw.count / maxCount) * 8;

                const labelBelow =
                  (pos.angle < Math.PI * 0.4 && pos.angle > -Math.PI * 0.4) ||
                  pos.angle < -Math.PI * 0.6;
                const labelY = labelBelow
                  ? pos.y + nodeSize + 12
                  : pos.y - nodeSize - 5;

                return (
                  <g
                    key={kw.word}
                    onMouseEnter={() => setHoveredKw(kw.word)}
                    onMouseLeave={() => setHoveredKw(null)}
                    onClick={() => handleNodeClick(kw)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={nodeSize + 4}
                        fill="none"
                        stroke="rgba(6,182,212,0.5)"
                        strokeWidth={2}
                        strokeDasharray="3 2"
                      />
                    )}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={nodeSize}
                      fill={
                        isSelected
                          ? "rgba(6,182,212,0.5)"
                          : highlighted
                            ? "rgba(6,182,212,0.25)"
                            : "rgba(6,182,212,0.08)"
                      }
                      stroke={
                        isSelected
                          ? "rgba(6,182,212,1)"
                          : highlighted
                            ? "rgba(6,182,212,0.7)"
                            : "rgba(6,182,212,0.2)"
                      }
                      strokeWidth={isSelected ? 2 : 1.5}
                      className="transition-all duration-200"
                    />
                    <text
                      x={pos.x}
                      y={labelY}
                      textAnchor="middle"
                      fill={
                        isSelected || isHovered
                          ? "rgba(255,255,255,1)"
                          : highlighted
                            ? "rgba(203,213,225,0.9)"
                            : "rgba(100,116,139,0.5)"
                      }
                      fontSize={10}
                      fontWeight={isSelected || isHovered ? 600 : 400}
                      className="pointer-events-none transition-all duration-200"
                    >
                      {kw.word}
                    </text>
                    {(isHovered || isSelected) && (
                      <text
                        x={pos.x}
                        y={pos.y + 3.5}
                        textAnchor="middle"
                        fill="white"
                        fontSize={9}
                        fontWeight={700}
                        className="pointer-events-none"
                      >
                        {kw.count}
                      </text>
                    )}
                  </g>
                );
              })}
            </>
          ) : (
            <>
              {/* Bubble chart */}
              {bubblePositions.map((bp, i) => {
                const kw = displayKws.find((k) => k.word === bp.word);
                if (!kw) return null;
                const isSelected = selectedKeyword === bp.word;
                const isHovered = hoveredKw === bp.word;
                const highlighted = isHighlighted(bp.word);
                const color = BUBBLE_COLORS[i % BUBBLE_COLORS.length];

                return (
                  <g
                    key={bp.word}
                    onMouseEnter={() => setHoveredKw(bp.word)}
                    onMouseLeave={() => setHoveredKw(null)}
                    onClick={() => handleNodeClick(kw)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle
                        cx={bp.x}
                        cy={bp.y}
                        r={bp.r + 3}
                        fill="none"
                        stroke={color.stroke}
                        strokeWidth={2}
                        strokeDasharray="3 2"
                        opacity={0.8}
                      />
                    )}
                    <circle
                      cx={bp.x}
                      cy={bp.y}
                      r={bp.r}
                      fill={isSelected ? color.stroke : color.fill}
                      stroke={color.stroke}
                      strokeWidth={isSelected ? 2 : 1}
                      opacity={highlighted ? 1 : 0.3}
                      className="transition-all duration-200"
                    />
                    <text
                      x={bp.x}
                      y={bp.y - (bp.r > 20 ? 4 : 0)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={
                        isSelected || isHovered
                          ? "white"
                          : highlighted
                            ? "rgba(226,232,240,0.9)"
                            : "rgba(100,116,139,0.5)"
                      }
                      fontSize={bp.r > 25 ? 10 : bp.r > 18 ? 9 : 8}
                      fontWeight={isSelected || isHovered ? 700 : 500}
                      className="pointer-events-none"
                    >
                      {kw.word}
                    </text>
                    {bp.r > 20 && (
                      <text
                        x={bp.x}
                        y={bp.y + 8}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={
                          isSelected || isHovered
                            ? "rgba(255,255,255,0.8)"
                            : "rgba(148,163,184,0.6)"
                        }
                        fontSize={8}
                        className="pointer-events-none"
                      >
                        {kw.count}편
                      </text>
                    )}
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      {selectedKeyword && (
        <button
          onClick={() => onKeywordSelect(null, null)}
          className="mt-2 self-center rounded-full bg-cyan-400/20 px-3 py-1 text-[10px] font-medium text-cyan-400 transition-colors hover:bg-cyan-400/30"
        >
          &quot;{selectedKeyword}&quot; 필터 해제
        </button>
      )}
    </div>
  );
}
