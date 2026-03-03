"use client";

import { CHANNELS } from "@/lib/channels";

interface ChannelFilterProps {
  selected: string | null;
  onSelect: (channelId: string | null) => void;
}

export default function ChannelFilter({
  selected,
  onSelect,
}: ChannelFilterProps) {
  const scrollFadeStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "nowrap",
    overflowX: "auto",
    gap: "0.5rem",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    WebkitMaskImage: "linear-gradient(to right, black 90%, transparent 100%)",
    maskImage: "linear-gradient(to right, black 90%, transparent 100%)",
  };

  return (
    <div style={scrollFadeStyle} className="scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          selected === null
            ? "bg-white text-slate-900"
            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
        }`}
      >
        전체
      </button>
      {CHANNELS.map((ch) => (
        <button
          key={ch.id}
          onClick={() => onSelect(ch.id === selected ? null : ch.id)}
          className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            selected === ch.id
              ? "bg-white text-slate-900"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          }`}
        >
          {ch.name}
        </button>
      ))}
    </div>
  );
}
