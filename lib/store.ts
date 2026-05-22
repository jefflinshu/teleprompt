"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getTemplates } from "./templates";

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
            // Convert text to a single section for playback
            set({
              sections: [createSection({ title: "", content: text })],
              recognizedUpTo: -1,
              isTeleprompterOpen,
            });
            return;
          }
        }
        set({ isTeleprompterOpen, recognizedUpTo: -1 });
      },

      recognizedUpTo: -1,
      setRecognizedUpTo: (recognizedUpTo) => set({ recognizedUpTo }),

      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      reset: () =>
        set({
          isPlaying: false,
          recognizedUpTo: -1,
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
