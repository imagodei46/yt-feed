import { BriefingEntry } from "@/types";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "briefings.json");
const MAX_ENTRIES = 4;

export function getLastWeekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const daysToLastMonday = dayOfWeek === 0 ? 8 : dayOfWeek + 6;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysToLastMonday);
  lastMonday.setHours(0, 0, 0, 0);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { weekStart: fmt(lastMonday), weekEnd: fmt(lastSunday) };
}

export function isMonday(): boolean {
  return new Date().getDay() === 1;
}

export async function readBriefings(): Promise<BriefingEntry[]> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveBriefings(entries: BriefingEntry[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const trimmed = entries.slice(0, MAX_ENTRIES);
  await writeFile(FILE_PATH, JSON.stringify(trimmed, null, 2), "utf-8");
}

export function hasEntryForCurrentWeek(entries: BriefingEntry[]): boolean {
  const { weekStart } = getLastWeekRange();
  return entries.some((e) => e.weekStart === weekStart);
}
