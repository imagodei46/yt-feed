import { NextResponse } from "next/server";
import { CHANNELS } from "@/lib/channels";
import { fetchAllChannelVideos } from "@/lib/youtube";

export async function GET() {
  try {
    const videos = await fetchAllChannelVideos(CHANNELS);
    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
