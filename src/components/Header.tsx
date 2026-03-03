import Link from "next/link";

interface HeaderProps {
  videoCount?: number;
  weekLabel?: string;
}

export default function Header({ videoCount, weekLabel }: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="block">
          <h1 className="text-xl font-bold text-white">YT Feed</h1>
          <p className="text-sm text-slate-400">
            일본 YouTube 채널 AI 요약 대시보드
          </p>
        </Link>
        {(weekLabel || videoCount !== undefined) && (
          <p className="text-sm text-slate-500">
            {weekLabel && <span>{weekLabel}</span>}
            {weekLabel && videoCount !== undefined && <span> · </span>}
            {videoCount !== undefined && <span>{videoCount}개 영상</span>}
          </p>
        )}
      </div>
    </header>
  );
}
