import Link from "next/link";

interface HeaderProps {
  videoCount?: number;
  weekLabel?: string;
}

export default function Header({ videoCount, weekLabel }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-gradient-to-r from-[#0b1120] via-[#111d3a] to-[#0b1120]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/20">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">YT Feed</h1>
            <p className="text-xs text-slate-400">
              일본 YouTube 채널 AI 요약 대시보드
            </p>
          </div>
        </Link>
        {(weekLabel || videoCount !== undefined) && (
          <div className="flex items-center gap-3">
            {weekLabel && (
              <span className="text-xs text-slate-500">{weekLabel}</span>
            )}
            {videoCount !== undefined && (
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-white">
                {videoCount}
                <span className="ml-1 text-xs font-normal text-slate-400">videos</span>
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
