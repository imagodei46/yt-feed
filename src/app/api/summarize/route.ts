import { NextRequest, NextResponse } from "next/server";
import { summarizeVideo } from "@/lib/summarize";
import { SummarizeRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json();
    const { videoId, title, description } = body;

    if (!videoId || !title) {
      return NextResponse.json(
        { error: "videoId and title are required" },
        { status: 400 }
      );
    }

    const result = await summarizeVideo(videoId, title, description || "");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: "Failed to summarize video" },
      { status: 500 }
    );
  }
}
