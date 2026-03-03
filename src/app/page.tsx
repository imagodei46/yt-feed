import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import { CHANNELS } from "@/lib/channels";
import { fetchAllChannelVideos } from "@/lib/youtube";

export const revalidate = 3600; // Revalidate every 1 hour

function getWeekLabel(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const week = Math.ceil(now.getDate() / 7);
  return `${year}년 ${month}월 ${week}주`;
}

export default async function Home() {
  const videos = await fetchAllChannelVideos(CHANNELS);

  return (
    <div className="min-h-screen bg-[#0b1120]">
      <Header videoCount={videos.length} weekLabel={getWeekLabel()} />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Dashboard videos={videos} />
      </main>
    </div>
  );
}
