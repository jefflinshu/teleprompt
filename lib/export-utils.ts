/**
 * Export utilities for teleprompter event logs.
 * Generates a single JSON file that clearly marks which time segments
 * should be CUT from the recording. An AI agent can read this file
 * and call FFmpeg to automatically edit the video.
 */

export interface TeleprompterEvent {
  type: "start" | "pause" | "resume" | "rewind" | "recover" | "end";
  /** Milliseconds since recording started */
  timestamp: number;
  /** ISO wall-clock time */
  wallClock: string;
  /** Character position in the script text */
  textPosition: number;
  /** For rewind events: the position BEFORE rewind */
  beforePosition?: number;
}

export interface CutSegment {
  /** Start time in HH:MM:SS.mmm format */
  start: string;
  /** End time in HH:MM:SS.mmm format */
  end: string;
  /** Duration in seconds */
  durationSec: number;
  /** Reason for cutting */
  reason: string;
}

// ── Time formatting ──────────────────────────────────────────────

/** Format ms as HH:MM:SS.mmm */
export function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const millis = Math.floor(ms % 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

/** Format ms as MM:SS for display */
export function formatTimer(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// ── Cut segment extraction ───────────────────────────────────────

/**
 * Extract CUT segments from events.
 * A cut segment spans from a "rewind" event to its matching "recover" event.
 * These are the time ranges that should be DELETED from the recording.
 */
function extractCutSegments(events: TeleprompterEvent[]): CutSegment[] {
  const cuts: CutSegment[] = [];
  let cutStartMs = -1;

  const endEvent = events.findLast((e) => e.type === "end" || e.type === "pause");
  const totalDuration = endEvent?.timestamp ?? (events.length > 0 ? events[events.length - 1].timestamp : 0);

  for (const event of events) {
    if (event.type === "rewind" && cutStartMs < 0) {
      cutStartMs = event.timestamp;
    } else if (event.type === "recover" && cutStartMs >= 0) {
      const durationMs = event.timestamp - cutStartMs;
      cuts.push({
        start: formatTimestamp(cutStartMs),
        end: formatTimestamp(event.timestamp),
        durationSec: Math.round(durationMs / 100) / 10,
        reason: "用户回退重读 / User rewound to re-read",
      });
      cutStartMs = -1;
    }
  }

  // If still cutting at the end (user never recovered)
  if (cutStartMs >= 0) {
    const durationMs = totalDuration - cutStartMs;
    cuts.push({
      start: formatTimestamp(cutStartMs),
      end: formatTimestamp(totalDuration),
      durationSec: Math.round(durationMs / 100) / 10,
      reason: "用户回退后未恢复 / User rewound but did not recover",
    });
  }

  return cuts;
}

// ── Export ────────────────────────────────────────────────────────

/**
 * Generate the single JSON export file.
 * This file is designed to be read by an AI agent that will
 * call FFmpeg to automatically remove the "cut" segments.
 *
 * The JSON structure:
 * - instruction: tells the AI what to do
 * - totalDuration: total recording time
 * - cutSegments: array of time ranges to DELETE
 * - events: raw event log for reference
 */
export function toEditJSON(events: TeleprompterEvent[]): string {
  const cuts = extractCutSegments(events);
  const endEvent = events.findLast((e) => e.type === "end" || e.type === "pause");
  const durationMs = endEvent?.timestamp ?? 0;

  return JSON.stringify({
    version: 1,
    instruction: [
      "1. 在视频音频轨中找到一声短促的 1kHz 蜂鸣声（约 150ms），这是时间同步信号。蜂鸣声的位置 = 时间零点（00:00:00.000）。",
      "2. 根据下方 cutSegments 中的时间段，使用 FFmpeg 从视频中删除这些片段。这些是用户朗读出错后回退重读的部分。",
      "3. 保留所有其他片段，按顺序拼接为最终视频。",
      "",
      "English: 1. Find a short 1kHz beep (~150ms) in the audio track — this is the sync signal. The beep position = time zero (00:00:00.000).",
      "2. Use FFmpeg to remove the time segments listed in cutSegments. These are retake sections where the user made mistakes.",
      "3. Keep all remaining segments and concatenate them into the final video.",
    ].join("\n"),
    syncMethod: "1kHz sine beep (~150ms) played at time zero via computer speakers. Find this beep in the recording audio to establish the time reference.",
    totalDuration: formatTimestamp(durationMs),
    totalDurationMs: durationMs,
    totalRewinds: cuts.length,
    cutSegments: cuts,
    events,
  }, null, 2);
}

/**
 * Check if there are any rewind events worth exporting.
 */
export function hasRewinds(events: TeleprompterEvent[]): boolean {
  return events.some((e) => e.type === "rewind");
}

// ── Download helper ──────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string = "application/json") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
