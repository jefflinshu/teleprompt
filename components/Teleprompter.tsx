"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Minus,
  Plus,
  Mic,
  MicOff,
  Settings,
  Maximize,
  Minimize,
  FlipHorizontal,
  X,
  AudioLines,
  Gauge,
  ChevronDown,
  SkipBack,
  SkipForward,
  Download,
  Timer,
  Clock,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useTeleprompterStore } from "@/lib/store";
import type { ScrollMode } from "@/lib/store";
import {
  useSpeechRecognition,
  findMatchPosition,
} from "@/hooks/use-speech-recognition";
import { cn } from "@/lib/utils";
import { formatTimer, toEditJSON, hasRewinds, downloadFile } from "@/lib/export-utils";
import { t, detectSpeechLang } from "@/lib/i18n";

// ── Text Display ────────────────────────────────────────────────
// Renders as TWO spans only: already-read portion + remaining.
// This avoids creating thousands of individual DOM nodes (one per char),
// which caused React to be extremely slow when updating highlight position.
// Now also supports a click handler for repositioning.
function TextDisplay({
  text,
  recognizedUpTo,
  textColor,
  highlightColor,
  highlightRef,
  onClickPosition,
}: {
  text: string;
  recognizedUpTo: number;
  textColor: string;
  highlightColor: string;
  highlightRef?: React.RefObject<HTMLSpanElement | null>;
  onClickPosition?: (charIndex: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Click handler: determine which character was clicked via Range API
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!onClickPosition || !containerRef.current) return;
    const x = e.clientX;
    const y = e.clientY;

    // Use caretPositionFromPoint (standard) or caretRangeFromPoint (webkit)
    let offset = -1;
    if (document.caretPositionFromPoint) {
      const pos = document.caretPositionFromPoint(x, y);
      if (pos?.offsetNode) {
        offset = getAbsoluteOffset(containerRef.current, pos.offsetNode, pos.offset);
      }
    } else if (document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(x, y);
      if (range) {
        offset = getAbsoluteOffset(containerRef.current, range.startContainer, range.startOffset);
      }
    }

    if (offset >= 0 && offset <= text.length) {
      onClickPosition(offset);
    }
  }, [onClickPosition, text.length]);

  const cutoff = Math.max(0, Math.min(recognizedUpTo, text.length));

  if (cutoff <= 0) {
    return (
      <div
        ref={containerRef}
        onClick={handleClick}
        style={{ cursor: onClickPosition ? "pointer" : undefined }}
      >
        <span style={{ color: textColor }}>{text}</span>
      </div>
    );
  }
  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{ cursor: onClickPosition ? "pointer" : undefined }}
    >
      <span style={{ color: highlightColor, transition: "color 0.4s" }}>
        {text.slice(0, cutoff)}
      </span>
      <span ref={highlightRef} style={{ color: textColor }}>
        {text.slice(cutoff)}
      </span>
    </div>
  );
}

/** Walk DOM text nodes to compute absolute character offset from a container */
function getAbsoluteOffset(container: Node, targetNode: Node, nodeOffset: number): number {
  let offset = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node === targetNode) {
      return offset + nodeOffset;
    }
    offset += (node.textContent?.length ?? 0);
    node = walker.nextNode();
  }
  return -1;
}

// ── Mode Toggle ─────────────────────────────────────────────────
function ModeToggle({ mode, onChange }: { mode: ScrollMode; onChange: (m: ScrollMode) => void }) {
  return (
    <div className="flex items-center rounded-lg bg-white/5 p-0.5">
      <button onClick={() => onChange("follow")} className={cn("flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all", mode === "follow" ? "bg-[#00ff88]/20 text-[#00ff88]" : "text-white/40 hover:text-white/70")} title={t.followMode}>
        <AudioLines size={12} /><span>{t.follow}</span>
      </button>
      <button onClick={() => onChange("fixed")} className={cn("flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all", mode === "fixed" ? "bg-blue-500/20 text-blue-400" : "text-white/40 hover:text-white/70")} title={t.fixedMode}>
        <Gauge size={12} /><span>{t.fixed}</span>
      </button>
    </div>
  );
}

// ── Settings Panel ──────────────────────────────────────────────
const BG_SWATCHES = ["#0a0a0a", "#0a1628", "#1a0a0a", "#0a1a0a"];
const TEXT_SWATCHES = ["#e8ffe8", "#ffffff", "#ffe8e8", "#e8e8ff"];
const HL_SWATCHES = ["#00ff88", "#00aaff", "#ffaa00", "#ff4488"];

function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, updateSettings } = useTeleprompterStore();
  return (
    <>
      {open && <div className="fixed inset-0 z-[59] bg-black/50 sm:hidden" onClick={onClose} />}
      <div className={cn(
        "fixed z-[60] bg-black/95 backdrop-blur-lg overflow-y-auto border-white/10 transition-transform duration-300 ease-in-out",
        "inset-x-0 bottom-0 max-h-[75vh] rounded-t-2xl border-t p-5 pb-8",
        open ? "translate-y-0" : "translate-y-full",
        "sm:inset-y-0 sm:left-auto sm:right-0 sm:bottom-auto sm:w-[300px] sm:max-h-none sm:rounded-none sm:border-t-0 sm:border-l sm:p-6",
        open ? "sm:translate-x-0 sm:translate-y-0" : "sm:translate-x-full sm:translate-y-0"
      )}>
        <div className="flex justify-center mb-4 sm:hidden"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white text-lg font-semibold">{t.settingsTitle}</h2>
          <button onClick={onClose} className="size-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center sm:hidden">
            <ChevronDown size={20} />
          </button>
        </div>
        <div className="space-y-5">
          <div className="space-y-2">
            <span className="text-white/50 text-sm">{t.scrollMode}</span>
            <ModeToggle mode={settings.scrollMode} onChange={(m) => updateSettings({ scrollMode: m })} />
          </div>
          <SliderRow label={t.fontSize} value={settings.fontSize} min={24} max={80} step={1} unit="px" onChange={(v) => updateSettings({ fontSize: v })} />
          {settings.scrollMode === "fixed" && <SliderRow label={t.scrollSpeed} value={settings.scrollSpeed} min={20} max={200} step={1} unit=" px/s" onChange={(v) => updateSettings({ scrollSpeed: v })} />}
          <SliderRow label={t.lineHeight} value={settings.lineHeight} min={1.2} max={3} step={0.1} unit="" onChange={(v) => updateSettings({ lineHeight: v })} />
          <ColorSection label={t.bgColor} colors={BG_SWATCHES} active={settings.backgroundColor} onChange={(c) => updateSettings({ backgroundColor: c })} />
          <ColorSection label={t.textColor} colors={TEXT_SWATCHES} active={settings.textColor} onChange={(c) => updateSettings({ textColor: c })} />
          <ColorSection label={t.highlightColor} colors={HL_SWATCHES} active={settings.highlightColor} onChange={(c) => updateSettings({ highlightColor: c })} />
        </div>
      </div>
    </>
  );
}

function ColorSection({ label, colors, active, onChange }: { label: string; colors: string[]; active: string; onChange: (c: string) => void }) {
  return (
    <div className="space-y-2">
      <span className="text-white/50 text-sm">{label}</span>
      <div className="flex gap-2.5">
        {colors.map((c) => (
          <button key={c} onClick={() => onChange(c)} className={cn("size-8 sm:size-7 rounded-full border-2 transition-transform hover:scale-110", active === c ? "border-white scale-110" : "border-white/20")} style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, unit, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between text-sm">
        <span className="text-white/50">{label}</span>
        <span className="text-white/80 font-mono">{step < 1 ? value.toFixed(1) : value}{unit}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} className="touch-none" />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────
export function Teleprompter() {
  const {
    sections,
    isPlaying, setIsPlaying, togglePlaying,
    isTeleprompterOpen, setTeleprompterOpen,
    recognizedUpTo, setRecognizedUpTo,
    jumpToParagraph, jumpToPosition,
    timerMode, countdownTarget,
    events, recordingStartTime, beforeRewindPos, addEvent, clearEvents,
    settings, updateSettings,
  } = useTeleprompterStore();

  const text = sections[0]?.content ?? "";
  const isFollowMode = settings.scrollMode === "follow";

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const allRecognizedRef = useRef("");
  const recognizedUpToRef = useRef(recognizedUpTo);
  // Keep text in a ref so the onSpeechResult callback always sees the latest
  // text without needing to be recreated (which would restart speech recognition).
  const textRef = useRef(text);
  textRef.current = text;
  // Ref pointing to the boundary between highlighted and remaining text,
  // used for smooth scroll-to-position without querying individual <span> nodes.
  const highlightBoundaryRef = useRef<HTMLSpanElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const userScrollingRef = useRef(false);
  const userScrollTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // ── Timer state ──
  const [elapsed, setElapsed] = useState(0); // ms
  const timerIntervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const [countdownAlert, setCountdownAlert] = useState(false);
  // 3-2-1 countdown overlay
  const [countdownOverlay, setCountdownOverlay] = useState<number | null>(null);

  // ── Dynamic speech language based on current reading position ──
  const currentSpeechLang = (() => {
    const pos = Math.max(0, recognizedUpTo);
    const window = text.slice(pos, pos + 100);
    return detectSpeechLang(window || text.slice(0, 100));
  })();
  const currentSpeechLangRef = useRef(currentSpeechLang);

  useEffect(() => { recognizedUpToRef.current = recognizedUpTo; }, [recognizedUpTo]);

  // ── Speech recognition ──
  const onSpeechResult = useCallback((candidates: string[], isFinal: boolean) => {
    if (userScrollingRef.current) return;
    const currentPos = recognizedUpToRef.current;
    const currentText = textRef.current;

    const newPos = findMatchPosition(currentText, candidates, currentPos, allRecognizedRef.current, isFinal);

    if (newPos > currentPos) {
      recognizedUpToRef.current = newPos;
      setRecognizedUpTo(newPos);
    }

    if (isFinal && candidates[0]) {
      allRecognizedRef.current = (allRecognizedRef.current + " " + candidates[0]).slice(-300);
    }
  }, [setRecognizedUpTo]);

  const { isListening, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition({ lang: currentSpeechLang, onResult: onSpeechResult });

  // ── Restart recognition when speech language changes ──
  useEffect(() => {
    if (currentSpeechLangRef.current === currentSpeechLang) return;
    currentSpeechLangRef.current = currentSpeechLang;
    if (isListening) {
      const timer = setTimeout(() => startListening(), 150);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSpeechLang]);

  // ── Timer tick (always runs once started — must stay in sync with real recording) ──
  useEffect(() => {
    if (recordingStartTime > 0) {
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const ms = now - recordingStartTime;
        setElapsed(ms);
        // Countdown alert
        if (timerMode === "countdown") {
          const remaining = countdownTarget * 1000 - ms;
          if (remaining <= 0 && !countdownAlert) {
            setCountdownAlert(true);
          }
        }
      }, 200);
      return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, [recordingStartTime, timerMode, countdownTarget, countdownAlert]);

  // ── Recover detection: when position passes the pre-rewind position ──
  useEffect(() => {
    if (beforeRewindPos > 0 && recognizedUpTo >= beforeRewindPos) {
      addEvent("recover", recognizedUpTo);
      useTeleprompterStore.setState({ beforeRewindPos: -1 });
    }
  }, [recognizedUpTo, beforeRewindPos, addEvent]);

  // ── Handlers ──
  const handleClose = useCallback(() => {
    if (isPlaying) {
      addEvent("end", Math.max(0, recognizedUpToRef.current));
    }
    setIsPlaying(false);
    stopListening();
    setTeleprompterOpen(false);
    setSettingsOpen(false);
    setCountdownAlert(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (window.history.state?.teleprompter) window.history.back();
  }, [setIsPlaying, stopListening, setTeleprompterOpen, addEvent, isPlaying]);

  // Browser history
  useEffect(() => {
    if (!isTeleprompterOpen) return;
    window.history.pushState({ teleprompter: true }, "");
    const onPop = () => { setIsPlaying(false); stopListening(); setTeleprompterOpen(false); setSettingsOpen(false); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isTeleprompterOpen, setIsPlaying, stopListening, setTeleprompterOpen]);

  // ── Play/pause with event recording & 3-2-1 countdown ──
  const handleTogglePlay = useCallback(() => {
    const store = useTeleprompterStore.getState();
    if (!store.isPlaying) {
      // Starting — show 3-2-1 countdown
      setCountdownOverlay(3);
      let count = 3;
      const interval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdownOverlay(count);
        } else {
          clearInterval(interval);
          setCountdownOverlay(null);

          // Play sync beep — this sound is picked up by the phone's mic
          // so AI can find the exact time-zero in the recording audio.
          try {
            const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            oscillator.connect(gain);
            gain.connect(audioCtx.destination);
            oscillator.frequency.value = 1000; // 1kHz tone — easy to detect
            oscillator.type = "sine";
            gain.gain.value = 0.5;
            oscillator.start();
            // Short beep: 150ms
            oscillator.stop(audioCtx.currentTime + 0.15);
            // Clean up after beep
            setTimeout(() => audioCtx.close(), 300);
          } catch {
            // Audio not available — continue silently
          }

          // Actually start
          const now = Date.now();
          if (store.recordingStartTime === 0) {
            useTeleprompterStore.setState({ recordingStartTime: now });
          }
          addEvent("start", Math.max(0, store.recognizedUpTo));
          setElapsed(now - (store.recordingStartTime || now));
          setCountdownAlert(false);
          togglePlaying();
        }
      }, 1000);
    } else {
      // Pausing
      addEvent("pause", Math.max(0, store.recognizedUpTo));
      togglePlaying();
    }
  }, [togglePlaying, addEvent]);

  const handleReset = useCallback(() => {
    if (isPlaying) {
      addEvent("end", Math.max(0, recognizedUpToRef.current));
    }
    setIsPlaying(false);
    stopListening();
    setRecognizedUpTo(-1);
    resetTranscript();
    allRecognizedRef.current = "";
    setElapsed(0);
    setCountdownAlert(false);
    clearEvents();
    if (containerRef.current) containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [setIsPlaying, stopListening, setRecognizedUpTo, resetTranscript, addEvent, clearEvents, isPlaying]);

  // ── Click-to-reposition handler (records rewind event) ──
  const handleClickReposition = useCallback((charIndex: number) => {
    const currentPos = recognizedUpToRef.current;
    if (charIndex < currentPos && recordingStartTime > 0) {
      // Going backward — this is a rewind
      addEvent("rewind", charIndex, currentPos);
      useTeleprompterStore.setState({ beforeRewindPos: currentPos });
    }
    jumpToPosition(charIndex);
    recognizedUpToRef.current = charIndex;
    allRecognizedRef.current = "";
  }, [jumpToPosition, addEvent, recordingStartTime]);

  // ── Sentence jump handlers (records rewind if going backward) ──
  const handlePrevParagraph = useCallback(() => {
    const currentPos = Math.max(0, recognizedUpToRef.current);
    jumpToParagraph("prev");
    const newPos = useTeleprompterStore.getState().recognizedUpTo;
    recognizedUpToRef.current = newPos;
    allRecognizedRef.current = "";
    if (newPos < currentPos && recordingStartTime > 0) {
      addEvent("rewind", newPos, currentPos);
      useTeleprompterStore.setState({ beforeRewindPos: currentPos });
    }
  }, [jumpToParagraph, addEvent, recordingStartTime]);

  const handleNextParagraph = useCallback(() => {
    jumpToParagraph("next");
    const newPos = useTeleprompterStore.getState().recognizedUpTo;
    recognizedUpToRef.current = newPos;
    allRecognizedRef.current = "";
  }, [jumpToParagraph]);

  // ── Export handler ──
  const handleExport = useCallback(() => {
    const content = toEditJSON(events);
    downloadFile(content, "teleprompt-edit-log.json");
  }, [events]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  // ── Auto-scroll (fixed mode only) ──
  useEffect(() => {
    if (!isPlaying || isFollowMode) { lastTimestampRef.current = null; cancelAnimationFrame(rafRef.current); return; }
    const step = (ts: number) => {
      if (lastTimestampRef.current !== null && !userScrollingRef.current) {
        const delta = (ts - lastTimestampRef.current) / 1000;
        if (containerRef.current) containerRef.current.scrollTop += settings.scrollSpeed * delta;
      }
      lastTimestampRef.current = ts;
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, isFollowMode, settings.scrollSpeed]);

  // ── Scroll to recognized position ──
  // Reads the boundary span's position directly and scrolls synchronously.
  // No RAF needed — the effect already runs after paint.
  const lastScrollTargetRef = useRef<number>(0);

  useEffect(() => {
    if (recognizedUpTo <= 0 || !containerRef.current || userScrollingRef.current) return;

    // Scroll synchronously — no RAF, no queuing.
    const boundary = highlightBoundaryRef.current;
    const container = containerRef.current;
    if (!boundary || !container) return;

    const cr = container.getBoundingClientRect();
    const sr = boundary.getBoundingClientRect();
    const targetTop = container.scrollTop + sr.top - cr.top - cr.height / 3;

    // Small incremental movements use smooth scroll (feels natural).
    // Large jumps use instant scroll to avoid queuing slow animations.
    const distance = Math.abs(targetTop - lastScrollTargetRef.current);
    lastScrollTargetRef.current = targetTop;

    // Only scroll if the boundary has actually moved a meaningful amount
    // (> 10px) to avoid jitter from tiny position updates.
    if (distance < 10) return;

    container.scrollTo({
      top: targetTop,
      behavior: distance > cr.height ? "auto" : "smooth",
    });
  }, [recognizedUpTo]);

  // ── Manual scroll detection ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      userScrollingRef.current = true;
      if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current);
      userScrollTimerRef.current = setTimeout(() => { userScrollingRef.current = false; }, 3000);
    };
    el.addEventListener("wheel", onScroll, { passive: true });
    el.addEventListener("touchmove", onScroll, { passive: true });
    return () => { el.removeEventListener("wheel", onScroll); el.removeEventListener("touchmove", onScroll); if (userScrollTimerRef.current) clearTimeout(userScrollTimerRef.current); };
  }, [isTeleprompterOpen]);

  // ── Speech recognition start/stop ──
  useEffect(() => {
    const shouldListen = isPlaying && isSupported && (isFollowMode || settings.speechRecognitionEnabled);
    if (shouldListen) startListening(); else stopListening();
  }, [isPlaying, isFollowMode, settings.speechRecognitionEnabled, isSupported, startListening, stopListening]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    if (!isTeleprompterOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); handleTogglePlay(); }
      else if (e.key === "Escape") handleClose();
      else if (e.key === "ArrowLeft") { e.preventDefault(); handlePrevParagraph(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); handleNextParagraph(); }
      else if (e.key === "ArrowUp" && !isFollowMode) { e.preventDefault(); updateSettings({ scrollSpeed: Math.max(20, settings.scrollSpeed - 10) }); }
      else if (e.key === "ArrowDown" && !isFollowMode) { e.preventDefault(); updateSettings({ scrollSpeed: Math.min(200, settings.scrollSpeed + 10) }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isTeleprompterOpen, isFollowMode, settings.scrollSpeed, handleTogglePlay, handleClose, updateSettings, handlePrevParagraph, handleNextParagraph]);

  // ── Controls auto-hide ──
  useEffect(() => {
    if (!isTeleprompterOpen) return;
    const show = () => { setControlsVisible(true); if (hideTimerRef.current) clearTimeout(hideTimerRef.current); hideTimerRef.current = setTimeout(() => setControlsVisible(false), 4000); };
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show, { passive: true });
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 4000);
    return () => { window.removeEventListener("mousemove", show); window.removeEventListener("touchstart", show); if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [isTeleprompterOpen]);

  // ── Fullscreen change ──
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  if (!isTeleprompterOpen) return null;

  const { backgroundColor, textColor, highlightColor, fontSize, lineHeight, isMirrored } = settings;
  const mobileFontSize = Math.min(fontSize, 36);

  return (
    <div className="fixed inset-0 z-50" style={{ backgroundColor }}>
      {/* Text area */}
      <div ref={containerRef} className="absolute inset-0 overflow-y-auto scrollbar-hide" style={{ transform: isMirrored ? "scaleX(-1)" : undefined }}>
        <div className="mx-auto max-w-4xl px-5 sm:px-12" style={{ paddingTop: "35vh", paddingBottom: "60vh", lineHeight, fontWeight: 500, wordBreak: "break-word" }}>
          <div className="teleprompter-text" style={{ fontSize: `${fontSize}px` }}>
            <TextDisplay text={text} recognizedUpTo={recognizedUpTo} textColor={textColor} highlightColor={highlightColor} highlightRef={highlightBoundaryRef} onClickPosition={handleClickReposition} />
          </div>
        </div>
      </div>

      {/* Gradient overlays */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 h-24 sm:h-32 z-[51]" style={{ background: `linear-gradient(to bottom, ${backgroundColor}, transparent)` }} />
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 h-24 sm:h-32 z-[51]" style={{ background: `linear-gradient(to top, ${backgroundColor}, transparent)` }} />

      {/* Timer — always visible once recording has started */}
      {recordingStartTime > 0 && (
        <div className="fixed top-3 sm:top-4 right-4 sm:right-6 z-[53] select-none">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono border",
            timerMode === "countdown" && countdownAlert
              ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
              : "bg-black/60 backdrop-blur-sm border-white/20 text-white/90"
          )}>
            {timerMode === "countdown" ? <Clock size={13} /> : <Timer size={13} />}
            <span>
              {timerMode === "countdown"
                ? formatTimer(Math.max(0, countdownTarget * 1000 - elapsed))
                : formatTimer(elapsed)
              }
            </span>
          </div>
        </div>
      )}

      {/* Top indicators (auto-hide with controls) */}
      <div className={cn("fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[52] flex items-center gap-2 select-none transition-all duration-300", controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none")}>
        {isMirrored && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00ff88]/15 border border-[#00ff88]/30 text-[#00ff88] text-xs">
            <FlipHorizontal size={12} /><span>{t.mirrorIndicator}</span>
          </div>
        )}
        {isFollowMode && isPlaying && (
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs", isListening ? "bg-[#00ff88]/15 border border-[#00ff88]/30 text-[#00ff88]" : "bg-yellow-500/15 border border-yellow-500/30 text-yellow-400")}>
            <AudioLines size={12} className={isListening ? "animate-pulse" : ""} />
            <span>{isListening ? t.voiceFollowing : t.waitingVoice}</span>
          </div>
        )}
      </div>

      {/* Control bar */}
      <div className={cn(
        "fixed z-[52] transition-all duration-300 ease-in-out",
        "bottom-0 left-0 right-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2",
        "sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:px-0 sm:pb-0 sm:pt-0",
        controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        <div className="bg-black/85 backdrop-blur-md border border-white/10 rounded-xl p-2.5 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1">
              <CtrlBtn icon={isPlaying ? <Pause size={18} /> : <Play size={18} />} onClick={handleTogglePlay} label={isPlaying ? t.pause : t.play} />
              <CtrlBtn icon={<RotateCcw size={16} />} onClick={handleReset} label={t.reset} />
              <CtrlBtn icon={<SkipBack size={16} />} onClick={handlePrevParagraph} label={t.prevParagraph} />
              <CtrlBtn icon={<SkipForward size={16} />} onClick={handleNextParagraph} label={t.nextParagraph} />
            </div>

            <ModeToggle mode={settings.scrollMode} onChange={(m) => updateSettings({ scrollMode: m })} />

            <div className="flex items-center gap-1">
              {/* Export button — only show when there are rewind events and paused */}
              {events.length > 0 && !isPlaying && hasRewinds(events) && (
                <CtrlBtn icon={<Download size={16} />} onClick={handleExport} label={t.download} />
              )}
              {!isFollowMode && (
                <CtrlBtn icon={isListening ? <Mic size={16} className="text-green-400" /> : <MicOff size={16} />} onClick={() => updateSettings({ speechRecognitionEnabled: !settings.speechRecognitionEnabled })} active={settings.speechRecognitionEnabled} />
              )}
              <CtrlBtn icon={<Settings size={16} />} onClick={() => setSettingsOpen((v) => !v)} active={settingsOpen} />
              <CtrlBtn icon={<FlipHorizontal size={16} />} onClick={() => updateSettings({ isMirrored: !isMirrored })} active={isMirrored} />
              <div className="hidden sm:block">
                <CtrlBtn icon={isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />} onClick={toggleFullscreen} />
              </div>
              <CtrlBtn icon={<X size={16} />} onClick={handleClose} />
            </div>
          </div>

          {!isFollowMode && (
            <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-white/5">
              <span className="text-white/40 text-xs">{t.speed}</span>
              <CtrlBtn icon={<Minus size={14} />} onClick={() => updateSettings({ scrollSpeed: Math.max(20, settings.scrollSpeed - 10) })} small />
              <span className="w-14 text-center font-mono text-white/90 text-xs">{settings.scrollSpeed}px/s</span>
              <CtrlBtn icon={<Plus size={14} />} onClick={() => updateSettings({ scrollSpeed: Math.min(200, settings.scrollSpeed + 10) })} small />
            </div>
          )}
        </div>
      </div>

      {/* 3-2-1 Countdown overlay */}
      {countdownOverlay !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="text-[120px] sm:text-[180px] font-bold text-white/90 animate-ping" style={{ animationDuration: "0.8s" }}>
            {countdownOverlay}
          </div>
        </div>
      )}

      {/* Countdown alert flash */}
      {countdownAlert && isPlaying && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[55] pointer-events-none">
          <div className="px-6 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-lg font-bold animate-bounce">
            {t.countdownDone}
          </div>
        </div>
      )}

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <style jsx global>{`
        @media (max-width: 640px) {
          .teleprompter-text { font-size: ${mobileFontSize}px !important; }
        }
      `}</style>
    </div>
  );
}

// ── Control Button ──────────────────────────────────────────────
function CtrlBtn({ icon, onClick, label, small, active }: { icon: React.ReactNode; onClick: () => void; label?: string; small?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} title={label} className={cn("flex items-center justify-center rounded-lg transition-colors text-white/70 active:text-white active:bg-white/10 hover:text-white hover:bg-white/10", small ? "size-8 sm:size-7" : "size-10 sm:size-9", active && "text-white bg-white/10")}>
      {icon}
    </button>
  );
}
