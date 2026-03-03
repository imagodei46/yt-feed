"use client";

import { CHANNELS } from "@/lib/channels";

const CHANNEL_COLORS: Record<string, string> = {
  PIVOT: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "TBS CrossDIG": "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30",
  "新R25": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "The Solutions": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Forbes JP": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  NewsPicks: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  ReHacQ: "bg-red-500/20 text-red-400 border-red-500/30",
  "テレ東BIZ": "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z" />
        </svg>
        <p className="text-xs font-medium text-slate-400">채널</p>
      </div>
      <div style={scrollFadeStyle} className="scrollbar-hide">
        <button
          onClick={() => onSelect(null)}
          aria-pressed={selected === null}
          className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${
            selected === null
              ? "border-white bg-white text-slate-900"
              : "border-slate-700 bg-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200"
          }`}
        >
          전체
        </button>
        {CHANNELS.map((ch) => {
          const activeColor = CHANNEL_COLORS[ch.name] ?? "bg-slate-700/50 text-slate-300 border-slate-600";
          return (
            <button
              key={ch.id}
              onClick={() => onSelect(ch.id === selected ? null : ch.id)}
              aria-pressed={selected === ch.id}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30 ${
                selected === ch.id
                  ? activeColor
                  : "border-slate-700 bg-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              {ch.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
