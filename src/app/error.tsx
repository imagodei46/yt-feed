"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-semibold text-slate-900">
          문제가 발생했습니다
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          영상을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
