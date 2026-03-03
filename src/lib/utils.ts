export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "방금 전";
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}달 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
}

export function formatCount(count: number): string {
  if (count >= 10000) {
    const val = (count / 10000).toFixed(1);
    return `${val.endsWith(".0") ? val.slice(0, -2) : val}만`;
  }
  if (count >= 1000) {
    const val = (count / 1000).toFixed(1);
    return `${val.endsWith(".0") ? val.slice(0, -2) : val}천`;
  }
  return String(count);
}
