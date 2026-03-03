import { YoutubeTranscript } from "youtube-transcript";

export async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    // Try Japanese first (these are Japanese channels)
    const segments = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "ja",
    });

    if (segments.length === 0) return null;

    // Combine all transcript text segments
    const text = segments.map((s) => s.text).join(" ");

    // Truncate if too long (Claude context limit consideration)
    const maxChars = 8000;
    if (text.length > maxChars) {
      return text.slice(0, maxChars) + "...";
    }

    return text;
  } catch {
    // Transcript might not be available — this is expected for many videos
    return null;
  }
}
