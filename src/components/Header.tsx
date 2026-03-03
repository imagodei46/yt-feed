import Link from "next/link";

interface HeaderProps {
  videoCount?: number;
  weekLabel?: string;
}

export default function Header({ videoCount, weekLabel }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-gradient-to-r from-[#0b1120] via-[#111d3a] to-[#0b1120]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
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
          <div className="flex items-center gap-4">
            {weekLabel && (
              <div className="hidden items-center gap-1.5 sm:flex">
                <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <span className="text-xs font-medium text-slate-400">{weekLabel}</span>
              </div>
            )}
            {videoCount !== undefined && (
              <div className="flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1.5">
                <span className="text-sm font-bold tabular-nums text-white">
                  {videoCount}
                </span>
                <span className="text-[10px] font-medium text-slate-500">videos</span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
