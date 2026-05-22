"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Clock,
  Check,
  Sparkles,
  Upload,
  Settings2,
  ChevronDown,
  ChevronUp,
  AudioLines,
  Gauge,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useTeleprompterStore } from "@/lib/store";
import { Teleprompter } from "@/components/Teleprompter";
import { getTemplates, type ScriptTemplate } from "@/lib/templates";
import { t } from "@/lib/i18n";

/* ───────── helpers ───────── */

function estimateDuration(content: string) {
  if (!content.trim()) return { minutes: 0, seconds: 0 };
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const totalSec = (words / 160) * 60;
  return { minutes: Math.floor(totalSec / 60), seconds: Math.round(totalSec % 60) };
}

/* ═══════════ PAGE ═══════════ */

export default function HomePage() {
  const { text, setText, isTeleprompterOpen, setTeleprompterOpen, settings, updateSettings } =
    useTeleprompterStore();

  const templates = getTemplates();
  const [activeId, setActiveId] = useState<string | null>("product-launch");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const initDone = useRef(false);

  // Single init — fill first template
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    if (templates.length > 0) {
      const first = templates[0];
      const joined = first.sections.map((s) => s.content).join("\n\n");
      setText(joined);
      setActiveId(first.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── handlers ── */
  const handleTemplate = useCallback((tmpl: ScriptTemplate) => {
    if (activeId === tmpl.id) {
      setActiveId(null);
      setText("");
    } else {
      const joined = tmpl.sections.map((s) => s.content).join("\n\n");
      setText(joined);
      setActiveId(tmpl.id);
    }
  }, [activeId, setText]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const inputEl = e.target;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === "string") {
        setText(ev.target.result);
        setActiveId(null);
      }
      inputEl.value = "";
    };
    reader.onerror = () => { inputEl.value = ""; };
    reader.readAsText(file, "utf-8");
  };

  const est = estimateDuration(text);

  return (
    <>
      <div className="flex min-h-dvh flex-col">
        {/* ═══ HEADER ═══ */}
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="TelePrompt logo"
              width={36}
              height={36}
              className="size-9 object-contain"
              priority
            />
            <div>
              <h1 className="text-base font-bold sm:text-lg">{t.appTitle}</h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block">{t.appSubtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen((v) => !v)}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground hover:border-[#00ff88]/30 transition-colors"
            title={t.quickSettings}
          >
            <Settings2 className="size-4" />
          </button>
        </header>

        {/* ═══ MAIN CONTENT ═══ */}
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-8 sm:py-8">
          {/* Templates */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="size-3.5 text-[#00ff88]/60" />
              <span className="text-xs font-medium text-muted-foreground">{t.templateSection}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:-mx-8 sm:px-8">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleTemplate(tmpl)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                    activeId === tmpl.id
                      ? "border-[#00ff88]/50 bg-[#00ff88]/10 text-[#00ff88]"
                      : "border-border text-muted-foreground hover:border-[#00ff88]/30 hover:text-foreground"
                  )}
                >
                  <span className="text-base">{tmpl.emoji}</span>
                  <span>{tmpl.title}</span>
                  {activeId === tmpl.id && <Check className="size-3" />}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative flex-1">
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setActiveId(null); }}
              placeholder={t.textareaPlaceholder}
              className={cn(
                "w-full rounded-xl border bg-card p-4 text-sm leading-relaxed text-card-foreground",
                "placeholder:text-muted-foreground/50",
                "outline-none transition-colors border-border focus:border-[#00ff88]/40 focus:ring-1 focus:ring-[#00ff88]/20",
                "resize-y min-h-[240px] sm:min-h-[340px] sm:text-base"
              )}
            />
            <div className="absolute bottom-3 right-4 flex items-center gap-3 select-none">
              {est.minutes > 0 || est.seconds > 0 ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                  <Clock className="size-3" />
                  ~{est.minutes > 0 ? `${est.minutes}${t.estMinutes} ` : ""}{est.seconds}{t.estSeconds}
                </span>
              ) : null}
              <span className="text-xs font-mono text-muted-foreground/40">{text.length} {t.charCount}</span>
            </div>
          </div>

          {/* Upload */}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-xs text-muted-foreground hover:border-[#00ff88]/30 hover:text-foreground transition-colors"
          >
            <Upload className="size-3.5" />
            {t.uploadButton}
          </button>
          <input ref={fileRef} type="file" accept=".txt,text/plain" className="hidden" onChange={handleFile} />

          {/* Start button */}
          <Button
            onClick={() => setTeleprompterOpen(true)}
            disabled={!text.trim()}
            className="h-12 w-full rounded-xl bg-[#00ff88] text-base font-bold text-black shadow-[0_0_20px_rgba(0,255,136,0.2)] hover:bg-[#00ff88]/90 disabled:opacity-30 disabled:shadow-none sm:h-14 sm:text-lg"
          >
            <Play className="size-4 fill-current mr-1.5" />
            {t.startButton}
          </Button>

          {/* Quick settings — collapsible */}
          <div className="rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => setSettingsOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="size-4" />
                {t.quickSettings}
              </div>
              {settingsOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>

            <div className={cn(
              "overflow-hidden transition-all duration-300",
              settingsOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="border-t border-border px-4 py-4 sm:px-5 space-y-5">
                {/* Scroll mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{t.scrollMode}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{settings.scrollMode === "follow" ? t.followDesc : t.fixedDesc}</p>
                  </div>
                  <div className="flex gap-1 rounded-lg bg-card border border-border p-0.5">
                    <button onClick={() => updateSettings({ scrollMode: "follow" })} className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all", settings.scrollMode === "follow" ? "bg-[#00ff88]/15 text-[#00ff88]" : "text-muted-foreground hover:text-foreground")}>
                      <AudioLines className="size-3" />{t.followMode}
                    </button>
                    <button onClick={() => updateSettings({ scrollMode: "fixed" })} className={cn("flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all", settings.scrollMode === "fixed" ? "bg-[#00ff88]/15 text-[#00ff88]" : "text-muted-foreground hover:text-foreground")}>
                      <Gauge className="size-3" />{t.fixedMode}
                    </button>
                  </div>
                </div>

                {/* Mirror */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">{t.mirrorMode}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.mirrorDesc}</p>
                  </div>
                  <Switch checked={settings.isMirrored} onCheckedChange={(v) => updateSettings({ isMirrored: v })} />
                </div>

                {/* Font size */}
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-sm">{t.fontSize}</p>
                    <span className="text-xs text-muted-foreground font-mono">{settings.fontSize}px</span>
                  </div>
                  <Slider value={[settings.fontSize]} min={24} max={72} step={2} onValueChange={([v]) => updateSettings({ fontSize: v })} />
                </div>

                {/* Speed */}
                {settings.scrollMode === "fixed" && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <p className="text-sm">{t.scrollSpeed}</p>
                      <span className="text-xs text-muted-foreground font-mono">{settings.scrollSpeed} px/s</span>
                    </div>
                    <Slider value={[settings.scrollSpeed]} min={20} max={200} step={5} onValueChange={([v]) => updateSettings({ scrollSpeed: v })} />
                  </div>
                )}

                {/* Speech recognition */}
                {settings.scrollMode === "fixed" && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">{t.speechRecognition}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.speechRecognitionDesc}</p>
                    </div>
                    <Switch checked={settings.speechRecognitionEnabled} onCheckedChange={(v) => updateSettings({ speechRecognitionEnabled: v })} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground/50">
          <p>{t.footerHint}</p>
        </footer>
      </div>

      {isTeleprompterOpen && <Teleprompter />}
    </>
  );
}
