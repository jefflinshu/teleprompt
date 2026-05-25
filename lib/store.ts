"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getTemplates } from "./templates";
import type { TeleprompterEvent } from "./export-utils";

function getDefaultText(): string {
  const tpls = getTemplates();
  if (tpls.length > 0) {
    return tpls[0].sections.map((s) => s.content).join("\n\n");
  }
  return "";
}

export type ScrollMode = "follow" | "fixed";

// ── Section — used internally by teleprompter for playback ──
export interface Section {
  id: string;
  title: string;
  subtitle?: string;
  notes?: string;
  content: string;
  duration?: number;
  color?: string;
}

export function createSection(partial?: Partial<Section>): Section {
  return {
    id: crypto.randomUUID(),
    title: "",
    content: "",
    ...partial,
  };
}

// ── Settings ─────────────────────────────────────────────────
export interface TeleprompterSettings {
  fontSize: number;
  scrollSpeed: number;
  scrollMode: ScrollMode;
  backgroundColor: string;
  textColor: string;
  highlightColor: string;
  isMirrored: boolean;
  speechRecognitionEnabled: boolean;
  lineHeight: number;
}

const defaultSettings: TeleprompterSettings = {
  fontSize: 42,
  scrollSpeed: 80,
  scrollMode: "follow",
  backgroundColor: "#0a0a0a",
  textColor: "#e8ffe8",
  highlightColor: "#00ff88",
  isMirrored: false,
  speechRecognitionEnabled: true,
  lineHeight: 1.8,
};

// ── Sentence/clause break helpers ────────────────────────────────────────
/** Compute break positions based on ALL common punctuation marks.
 *  Includes: ，、。！？!?.,;；：:…—and also \n\n (paragraph breaks).
 *  Returns indices pointing to the START of each clause/sentence. */
export function computeParagraphBreaks(text: string): number[] {
  const breaks: number[] = [0]; // Always include start of text
  // Match all common Chinese + English punctuation and paragraph breaks
  // Chinese: ，、。！？；：…—
  // English: , . ! ? ; : -
  // Also: ellipsis (……/...) and paragraph breaks (\n\n)
  const regex = /[，、。！？；：…—,\.!?;:\-]+|\n\n+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    // Position right after the punctuation (start of next clause)
    let nextStart = match.index + match[0].length;
    // Skip any trailing whitespace/newlines after the punctuation
    while (nextStart < text.length && /[\s\n]/.test(text[nextStart])) {
      nextStart++;
    }
    if (nextStart < text.length && (breaks.length === 0 || breaks[breaks.length - 1] !== nextStart)) {
      breaks.push(nextStart);
    }
  }
  return breaks;
}

/** Find the start of the paragraph containing `pos` */
export function getParagraphStart(breaks: number[], pos: number): number {
  let start = 0;
  for (const b of breaks) {
    if (b <= pos) start = b;
    else break;
  }
  return start;
}

/** Find the start of the previous paragraph relative to `pos` */
export function getPrevParagraphStart(breaks: number[], pos: number): number {
  const currentStart = getParagraphStart(breaks, pos);
  // If we're already at the start of a paragraph, go to the previous one
  let prev = 0;
  for (const b of breaks) {
    if (b < currentStart) prev = b;
    else break;
  }
  return prev;
}

/** Find the start of the next paragraph relative to `pos` */
export function getNextParagraphStart(breaks: number[], pos: number): number {
  for (const b of breaks) {
    if (b > pos) return b;
  }
  return pos; // Already at or past the last paragraph
}

// ── Timer types ──────────────────────────────────────────────
export type TimerMode = "stopwatch" | "countdown";

// ── Store ────────────────────────────────────────────────────
interface TeleprompterState {
  // Simple mode text
  text: string;
  setText: (text: string) => void;

  // Sections — auto-generated from text when teleprompter opens
  sections: Section[];

  // Playback state
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  togglePlaying: () => void;

  // Teleprompter mode
  isTeleprompterOpen: boolean;
  setTeleprompterOpen: (open: boolean) => void;

  // Current reading position
  recognizedUpTo: number;
  setRecognizedUpTo: (index: number) => void;

  // Sentence break points (cached)
  paragraphBreaks: number[];

  // Jump to prev/next sentence
  jumpToParagraph: (direction: "prev" | "next") => void;

  // Jump to arbitrary position (e.g. click-to-reposition)
  jumpToPosition: (pos: number) => void;

  // Timer
  timerMode: TimerMode;
  setTimerMode: (mode: TimerMode) => void;
  countdownTarget: number; // seconds
  setCountdownTarget: (seconds: number) => void;

  // Event log for editing
  events: TeleprompterEvent[];
  recordingStartTime: number; // Date.now() when recording started
  beforeRewindPos: number; // position before last rewind (for recover detection)
  addEvent: (type: TeleprompterEvent["type"], textPosition: number, beforePosition?: number) => void;
  clearEvents: () => void;

  // Settings
  settings: TeleprompterSettings;
  updateSettings: (partial: Partial<TeleprompterSettings>) => void;

  // Reset playback
  reset: () => void;
}

export const useTeleprompterStore = create<TeleprompterState>()(
  persist(
    (set, get) => ({
      text: getDefaultText(),
      setText: (text) => set({ text }),

      sections: [],

      isPlaying: false,
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),

      isTeleprompterOpen: false,
      setTeleprompterOpen: (isTeleprompterOpen) => {
        if (isTeleprompterOpen) {
          const { text } = get();
          if (text.trim()) {
            set({
              sections: [createSection({ title: "", content: text })],
              recognizedUpTo: -1,
              isTeleprompterOpen,
              paragraphBreaks: computeParagraphBreaks(text),
              events: [],
              recordingStartTime: 0,
              beforeRewindPos: -1,
            });
            return;
          }
        }
        set({ isTeleprompterOpen, recognizedUpTo: -1 });
      },

      recognizedUpTo: -1,
      setRecognizedUpTo: (recognizedUpTo) => set({ recognizedUpTo }),

      paragraphBreaks: [],

      jumpToParagraph: (direction) => {
        const { recognizedUpTo, paragraphBreaks } = get();
        const pos = Math.max(0, recognizedUpTo);
        const newPos = direction === "prev"
          ? getPrevParagraphStart(paragraphBreaks, pos)
          : getNextParagraphStart(paragraphBreaks, pos);
        set({ recognizedUpTo: newPos });
      },

      jumpToPosition: (pos) => {
        set({ recognizedUpTo: Math.max(0, pos) });
      },

      // Timer
      timerMode: "stopwatch",
      setTimerMode: (timerMode) => set({ timerMode }),
      countdownTarget: 60,
      setCountdownTarget: (countdownTarget) => set({ countdownTarget }),

      // Event log
      events: [],
      recordingStartTime: 0,
      beforeRewindPos: -1,
      addEvent: (type, textPosition, beforePosition) => {
        const { recordingStartTime, events } = get();
        const now = Date.now();
        const timestamp = recordingStartTime > 0 ? now - recordingStartTime : 0;
        const event: TeleprompterEvent = {
          type,
          timestamp,
          wallClock: new Date(now).toISOString(),
          textPosition,
          ...(beforePosition !== undefined && { beforePosition }),
        };
        set({ events: [...events, event] });
      },
      clearEvents: () => set({ events: [], recordingStartTime: 0, beforeRewindPos: -1 }),

      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      reset: () =>
        set({
          isPlaying: false,
          recognizedUpTo: -1,
          events: [],
          recordingStartTime: 0,
          beforeRewindPos: -1,
        }),
    }),
    {
      name: "teleprompter-storage-v2",
      partialize: (state) => ({
        // text is intentionally NOT persisted — always starts fresh with default template
        settings: state.settings,
      }),
    }
  )
);
