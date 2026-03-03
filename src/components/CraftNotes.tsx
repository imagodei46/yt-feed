"use client";

import { useState, useEffect, useMemo } from "react";
import { Video } from "@/types";

interface CraftNote {
  title: string;
  keywords: string[];
}

interface CraftFolder {
  name: string;
  description?: string;
  notes: (string | CraftNote)[];
}

interface CraftNotesData {
  folders: CraftFolder[];
}

interface ScoredNote {
  title: string;
  folder: string;
  keywords: string[];
  score: number;
  matchedKeywords: string[];
}

interface CraftNotesProps {
  videos: Video[];
}

export default function CraftNotes({ videos }: CraftNotesProps) {
  const [notesData, setNotesData] = useState<CraftNotesData | null>(null);

  useEffect(() => {
    fetch("/craft-notes.json")
      .then((res) => res.json())
      .then((data: CraftNotesData) => setNotesData(data))
      .catch(() => {});
  }, []);

  const recommended = useMemo(() => {
    if (!notesData || videos.length === 0) return [];

    // Build a searchable text from all video titles + descriptions
    const videoText = videos
      .map((v) => `${v.title} ${v.description}`)
      .join(" ")
      .toLowerCase();

    // Score each note by keyword matches against video content
    const scored: ScoredNote[] = notesData.folders.flatMap((folder) =>
      folder.notes.map((note) => {
        const n = typeof note === "string"
          ? { title: note, keywords: [] as string[] }
          : note;

        const matched = n.keywords.filter((kw) =>
          videoText.includes(kw.toLowerCase())
        );

        return {
          title: n.title,
          folder: folder.name,
          keywords: n.keywords,
          score: matched.length,
          matchedKeywords: matched,
        };
      })
    );

    return scored
      .filter((n) => n.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [notesData, videos]);

  const [expanded, setExpanded] = useState(false);

  if (!notesData || recommended.length === 0) return null;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900 p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-bold text-white">
          My Notes × This Week
          <span className="ml-2 text-xs font-normal text-slate-500">
            내 Craft 노트 중 이번 주 영상과 관련된 것
          </span>
        </h3>
        <span className="ml-2 flex items-center gap-1 text-xs text-slate-500">
          {recommended.length}개
          <svg
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {expanded && (
        <div className="mt-4 flex-1 space-y-2.5">
          {recommended.map((note, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-2.5"
            >
              <span className="mt-0.5 text-xs text-slate-500">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200 leading-snug">
                  {note.title}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                    {note.folder}
                  </span>
                  {note.matchedKeywords.slice(0, 2).map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-400"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
