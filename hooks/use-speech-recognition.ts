"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface UseSpeechRecognitionOptions {
  lang?: string;
  /** Called with up to `maxAlts` candidate transcripts per event */
  onResult?: (candidates: string[], isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { lang = "en-US", onResult, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const shouldRestartRef = useRef(false);
  // Use refs for callbacks so the recognition instance always calls the latest
  // version without needing to be restarted when callbacks change.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  // Keep lang in a ref so startListening always uses the latest lang without
  // needing to be recreated (which would restart recognition unnecessarily).
  const langRef = useRef(lang);
  langRef.current = lang;
  // Track already-confirmed text length so we can extract only the NEW portion
  // from interim transcripts. Web Speech API in continuous mode accumulates
  // everything within a recognition segment — interim transcripts grow to
  // include ALL text from the start of the current segment, not just the
  // latest few words. Without this diff, the candidate passed to the matcher
  // grows to hundreds of characters and can never exact-match anything.
  const confirmedLenRef = useRef(0);
  // Store the last interim text so we can extract a meaningful diff
  const lastInterimRef = useRef("");

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setIsSupported(supported);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      onErrorRef.current?.("Speech recognition not supported. Please use Chrome.");
      return;
    }

    // Stop and discard any existing recognition instance before creating a new one.
    // Without this, calling startListening() twice creates two concurrent instances
    // that race against each other via shouldRestartRef.
    if (recognitionRef.current) {
      shouldRestartRef.current = false;
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    // Use langRef so we always get the current language without recreating this callback
    recognition.lang = langRef.current;
    // Request up to 3 alternatives so we can pick the best-matching one
    recognition.maxAlternatives = 3;

    // Reset tracking on each fresh start
    confirmedLenRef.current = 0;
    lastInterimRef.current = "";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalCandidates: string[] = [];
      let interimCandidates: string[] = [];

      // Only process results from resultIndex onward — earlier ones are already
      // confirmed finals from previous callbacks and must not be re-emitted.
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        // Collect all alternatives for this result
        const alts: string[] = [];
        for (let j = 0; j < result.length; j++) {
          const t = result[j].transcript.trim();
          if (t) alts.push(t);
        }
        if (result.isFinal) {
          finalCandidates = finalCandidates.concat(alts);
        } else {
          interimCandidates = interimCandidates.concat(alts);
        }
      }

      if (finalCandidates.length > 0) {
        setTranscript((prev) => prev + finalCandidates[0]);
        // When a final result arrives, advance the confirmed length so the
        // next interim diff starts fresh from after this confirmed text.
        confirmedLenRef.current += finalCandidates[0].length;
        lastInterimRef.current = "";
        // For final results, send the full final text — it represents the
        // complete recognized segment and is used for context accumulation.
        onResultRef.current?.(finalCandidates, true);
      }

      // For interim results, prioritise the SHORTEST recent window first.
      // The full interim is cumulative (grows as the user keeps speaking), so
      // matching against the full string always lags by seconds.
      // Instead we extract progressively larger tails so the matcher anchors
      // on the most-recently-spoken words and advances position immediately.
      if (interimCandidates.length > 0) {
        const fullInterim = interimCandidates[0];
        setInterimTranscript(fullInterim);

        const newCandidates: string[] = [];

        // ── Tail diff: only the words added since the last interim event ──
        // This is the freshest signal — typically 1-3 new words, zero lag.
        const lastLen = lastInterimRef.current.length;
        if (fullInterim.length > lastLen) {
          const tail = fullInterim.slice(lastLen).trim();
          if (tail && tail.length >= 2) newCandidates.push(tail);
        }

        // ── Short rolling window (~25 chars, ~3-5 words) ──
        // Catches cases where the diff alone is too short to match uniquely.
        const w25 = fullInterim.slice(-25).trim();
        if (w25 && w25.length >= 4 && !newCandidates.includes(w25)) {
          newCandidates.push(w25);
        }

        // ── Medium window (~55 chars) — for denser CJK or longer pauses ──
        if (fullInterim.length > 30) {
          const w55 = fullInterim.slice(-55).trim();
          if (w55 && !newCandidates.includes(w55)) newCandidates.push(w55);
        }

        // ── Full interim only when it is still short (< 60 chars) ──
        // Avoids using the accumulated blob once it grows large.
        if (fullInterim.length <= 60 && !newCandidates.includes(fullInterim)) {
          newCandidates.push(fullInterim);
        }

        lastInterimRef.current = fullInterim;

        if (newCandidates.length > 0) {
          onResultRef.current?.(newCandidates, false);
        }
      } else {
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      onErrorRef.current?.(event.error);
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;

    try {
      recognition.start();
    } catch {
      onErrorRef.current?.("无法启动语音识别");
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  findMatchPosition
//  Given a full script text, one or more recognized candidate strings, and a
//  current position, return the furthest plausible new position.
//
//  Design goals
//  ────────────
//  1. Punctuation / whitespace auto-skipped (users never read them aloud)
//  2. Tolerant of ASR errors — allows character-level mismatches / substitutions
//  3. Supports skip-reading — user may jump forward by a sentence or paragraph
//  4. Multiple ASR candidates are all tried; the best-scoring one wins
//  5. CJK vs English tuned separately (CJK chars are information-dense)
//  6. Always moves forward, never backward
//  7. O(1) setup thanks to caching: normFull + origMap computed only once per text
//
//  Performance contract
//  ────────────────────
//  Called ~10x/second during speech recognition. Must complete in < 5 ms.
//  Strategy A (exact) and B (suffix) are O(window) — fast.
//  Strategy C (fuzzy) is O(window × recLen) — capped by NEAR_WINDOW and
//  limited needle length (MAX_NEEDLE_FOR_FUZZY) to stay within budget.
// ─────────────────────────────────────────────────────────────────────────────

// Characters that count as "punctuation / whitespace" — user never reads these
const SKIP_REGEX =
  /[\s\u3000\n\r\t，。！？、；：""''（）《》【】…—\-·,.!?;:'"()\[\]{}\u200b\u00a0]/;

function isPunctuation(ch: string): boolean {
  return SKIP_REGEX.test(ch);
}

/** Lowercase + strip punctuation/whitespace */
function normalize(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i].toLowerCase();
    if (!isPunctuation(c)) out += c;
  }
  return out;
}

/**
 * origMap[k] = index in the original text of the k-th non-punctuation char.
 * This lets us convert a normalized-space index back to original-space quickly.
 * NOTE: The map does NOT include entries for \x00 boundary markers in normalized
 * text — those are synthetic markers, not original characters.
 */
function buildIndexMap(text: string): number[] {
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (!isPunctuation(text[i])) map.push(i);
  }
  return map;
}

/** Skip trailing punctuation/whitespace after a match so highlight looks clean */
function skipPunctuation(text: string, pos: number): number {
  let i = pos;
  while (i < text.length && isPunctuation(text[i])) i++;
  return i;
}

function hasCJK(s: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(s);
}

/** Proportion of CJK chars in a string (0–1) */
function cjkRatio(s: string): number {
  if (!s.length) return 0;
  const cjk = (s.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  return cjk / s.length;
}

/**
 * For pure-English matches: enforce word boundary on both sides so "a" doesn't
 * match inside "class" and "and" doesn't match inside "sandbox".
 *
 * IMPORTANT: `norm` is the normalized string where all spaces/punctuation have
 * been stripped, so consecutive letters from different words are adjacent.
 * We CANNOT reliably check boundaries in normalized space. Instead, we use
 * origMap to check whether the match boundaries correspond to word breaks
 * in the original text (i.e. there's a gap in origMap indices, meaning
 * punctuation/spaces existed between the chars in the original).
 */
function isWordBoundaryViaOrigMap(origMap: number[], normStart: number, normLen: number): boolean {
  // Check left boundary
  if (normStart > 0 && normStart < origMap.length) {
    const origIdx = origMap[normStart];
    const prevOrigIdx = origMap[normStart - 1];
    // If adjacent in original text (no space/punct between), not a boundary
    if (prevOrigIdx + 1 === origIdx) return false;
  }
  // Check right boundary
  const normEnd = normStart + normLen;
  if (normEnd > 0 && normEnd < origMap.length) {
    const origIdx = origMap[normEnd];
    const prevOrigIdx = origMap[normEnd - 1];
    if (prevOrigIdx + 1 === origIdx) return false;
  }
  return true;
}

// ── Per-text cache ────────────────────────────────────────────────────────────
let _cachedText = "";
let _cachedNormFull = "";
let _cachedOrigMap: number[] = [];

function getTextCache(fullText: string): { normFull: string; origMap: number[] } {
  if (fullText !== _cachedText) {
    _cachedText = fullText;
    _cachedNormFull = normalize(fullText);
    _cachedOrigMap = buildIndexMap(fullText);
  }
  return { normFull: _cachedNormFull, origMap: _cachedOrigMap };
}

/** Binary search: first index in origMap where origMap[i] >= target */
function bisectLeft(origMap: number[], target: number): number {
  let lo = 0, hi = origMap.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (origMap[mid] < target) lo = mid + 1; else hi = mid;
  }
  return lo;
}

// ── Phonetic / ASR confusion helpers ─────────────────────────────────────────
// Maps commonly confused sounds in English ASR.  Two characters that share
// a group are treated as "phonetically similar" — a mismatch between them
// costs much less than a completely unrelated substitution.
const PHONETIC_GROUPS: string[][] = [
  ["a", "e", "u"],        // short vowels often confused
  ["i", "e"],              // "bit" vs "bet"
  ["o", "u"],              // "got" vs "gut"
  ["s", "z"],              // voiced / unvoiced
  ["b", "p"],              // voiced / unvoiced stops
  ["d", "t"],              // voiced / unvoiced stops
  ["g", "k"],              // voiced / unvoiced stops
  ["v", "f"],              // labiodental
  ["m", "n"],              // nasals
  ["c", "k"],              // same sound in many words
  ["c", "s"],              // "city" vs "kitty"
  ["j", "g"],              // "gem" vs "jem"
  ["w", "r"],              // common L2 confusion
  ["l", "r"],              // common L2 confusion
  ["th", "t"],             // "think" → "tink" (handled at char level: t≈t)
];

// Build a fast lookup: charA → Set<charB> where they are phonetically similar.
const _phoneticMap = new Map<string, Set<string>>();
for (const group of PHONETIC_GROUPS) {
  for (const a of group) {
    for (const b of group) {
      if (a === b) continue;
      if (!_phoneticMap.has(a)) _phoneticMap.set(a, new Set());
      _phoneticMap.get(a)!.add(b);
    }
  }
}

function isPhoneticSimilar(a: string, b: string): boolean {
  return _phoneticMap.get(a)?.has(b) ?? false;
}

// ── Scoring helpers ───────────────────────────────────────────────────────────

/**
 * Score how well `needle` matches `haystack[haystackStart..haystackEnd)`.
 * Uses a two-pointer approach with generous skipping to tolerate:
 *   - Mispronounced words (ASR gives different text)
 *   - Skipped / inserted words by the speaker
 *   - Phonetically similar substitutions (lower penalty)
 *
 * Returns { score ∈ [0,1], endNormIdx: position reached in haystack }.
 *
 * PERFORMANCE: O(haystackEnd - haystackStart + needleLen).
 * Caller must ensure haystack slice is small (≤ NEAR_WINDOW + needle slack).
 */
function scoreMatch(
  haystack: string,
  haystackStart: number,
  haystackEnd: number,
  needle: string,
): { score: number; endNormIdx: number } {
  const nLen = needle.length;
  if (nLen === 0) return { score: 0, endNormIdx: haystackStart };

  const isCJK = cjkRatio(needle) > 0.4;
  // Allow skipping more chars to handle whole-word misreads.
  // E.g. "fundamentally" mis-heard as "fundamently" — need to skip ~3 hay chars.
  // Or the user reads "important" but ASR hears "impotent" — need to skip needle chars.
  const MAX_HAY_SKIP = isCJK ? 5 : 10;
  const MAX_NEE_SKIP = isCJK ? 4 : 8;

  let hIdx = haystackStart;
  let nIdx = 0;
  let matched = 0;        // full matches
  let softMatched = 0;    // phonetically similar matches (partial credit)
  let ops = 0;
  let lastGoodH = haystackStart;
  // Track consecutive mismatches — if too many in a row, we're probably
  // at the wrong position entirely and should stop wasting time.
  let consecutiveMisses = 0;
  const MAX_CONSECUTIVE_MISSES = isCJK ? 6 : 12;

  while (hIdx < haystackEnd && nIdx < nLen) {
    if (consecutiveMisses > MAX_CONSECUTIVE_MISSES) break;

    if (haystack[hIdx] === needle[nIdx]) {
      matched++;
      consecutiveMisses = 0;
      lastGoodH = hIdx + 1;
      hIdx++;
      nIdx++;
    } else if (!isCJK && isPhoneticSimilar(haystack[hIdx], needle[nIdx])) {
      // Phonetically similar — give partial credit and keep going
      softMatched++;
      consecutiveMisses = 0;
      lastGoodH = hIdx + 1;
      hIdx++;
      nIdx++;
    } else {
      ops++;
      consecutiveMisses++;
      let found = false;

      // Try skipping chars in haystack (user read extra words / ASR hallucinated)
      for (let skip = 1; skip <= MAX_HAY_SKIP && hIdx + skip < haystackEnd; skip++) {
        if (haystack[hIdx + skip] === needle[nIdx]) {
          hIdx = hIdx + skip;
          found = true;
          consecutiveMisses = 0;
          break;
        }
        // Also check phonetic similarity when skipping
        if (!isCJK && isPhoneticSimilar(haystack[hIdx + skip], needle[nIdx])) {
          hIdx = hIdx + skip;
          found = true;
          softMatched++;
          consecutiveMisses = 0;
          break;
        }
      }
      if (!found) {
        // Try skipping chars in needle (user skipped words / ASR dropped them)
        let nFound = false;
        for (let ns = 1; ns <= MAX_NEE_SKIP && nIdx + ns < nLen; ns++) {
          if (haystack[hIdx] === needle[nIdx + ns]) {
            nIdx = nIdx + ns;
            nFound = true;
            break;
          }
          if (!isCJK && isPhoneticSimilar(haystack[hIdx], needle[nIdx + ns])) {
            nIdx = nIdx + ns;
            nFound = true;
            softMatched++;
            break;
          }
        }
        if (nFound) {
          matched++;
          consecutiveMisses = 0;
          lastGoodH = hIdx + 1;
          hIdx++;
          nIdx++;
        } else {
          // Complete mismatch at this position — advance both
          hIdx++;
          nIdx++;
        }
      }
    }
  }

  // Score: full matches count 1.0, phonetic matches count 0.7
  const effectiveMatched = matched + softMatched * 0.7;
  const total = matched + softMatched + ops + Math.max(0, nLen - nIdx);
  const score = total > 0 ? effectiveMatched / total : 0;
  return { score, endNormIdx: lastGoodH };
}

/**
 * Exact substring search within normFull[searchStart..searchEnd).
 * Returns the first matching start index, or -1.
 */
function exactFind(normFull: string, needle: string, searchStart: number, searchEnd: number): number {
  const nLen = needle.length;
  if (nLen === 0 || searchEnd - searchStart < nLen) return -1;
  const first = needle.charCodeAt(0);
  for (let i = searchStart; i <= searchEnd - nLen; i++) {
    if (normFull.charCodeAt(i) === first && normFull.slice(i, i + nLen) === needle) return i;
  }
  return -1;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Find how far through `fullText` the user has read.
 *
 * @param fullText    The full teleprompter script (original, with punctuation)
 * @param candidates  Array of raw ASR hypotheses (best first). Keep short (≤3).
 * @param startFrom   Character index of the last confirmed position
 * @param context     Recently confirmed speech text (used only for normStart bias)
 * @param isFinal     True when the ASR result is final (sentence complete).
 *                    Final results allow a larger search window and jump limit
 *                    because the speaker has definitively finished the phrase.
 * @returns           New character index (>= startFrom)
 */
export function findMatchPosition(
  fullText: string,
  candidates: string[],
  startFrom: number = 0,
  context: string = "",
  isFinal: boolean = false,
): number {
  if (!candidates.length || !fullText) return startFrom;

  const { normFull, origMap } = getTextCache(fullText);

  if (!normFull) return startFrom;

  // ── Locate current position in normalized space (binary search, O(log n)) ──
  // Roll back by 20 norm chars (~3-5 words) so short tail-diff candidates
  // (which may overlap slightly with already-highlighted text) can still match.
  let normStart = bisectLeft(origMap, startFrom);
  normStart = Math.max(0, normStart - 20);

  // ── Convert normalized index → original position ──────────────────────────
  const toOrigPos = (normEndIdx: number, maxJump: number): number | null => {
    if (normEndIdx <= 0 || normEndIdx > origMap.length) return null;
    const origIdx = normEndIdx < origMap.length
      ? origMap[normEndIdx - 1] + 1
      : fullText.length;
    const advanced = skipPunctuation(fullText, origIdx);
    if (advanced - startFrom > maxJump) return null;
    return advanced;
  };

  // ── Distance penalty: require higher match scores for farther jumps ───────
  // This prevents a mediocre match 150 chars ahead from beating a good match
  // 10 chars ahead. Returns the minimum score required given the jump distance.
  const distancePenalty = (pos: number): number => {
    const dist = pos - startFrom;
    if (dist <= 30) return 0;            // very close — no penalty
    if (dist <= 80) return 0.75;         // moderate distance
    if (dist <= 150) return 0.85;        // far — need high confidence
    return 0.92;                         // very far — need near-certain match
  };

  // ── Search windows ────────────────────────────────────────────────────────
  // NEAR window: where we expect the user to currently be reading.
  // FAR window:  only used for skip-read recovery (user jumped ahead).
  // Windows are in normalized chars (punctuation stripped).
  const isCJKDoc = hasCJK(normFull.slice(normStart, normStart + 80));

  // ── Max jump: how far ahead (in ORIGINAL chars) one speech result can advance
  //    the highlight position. This is the primary guard against over-shooting.
  //    Tuned conservatively: a speaker reads ~3 words/sec in English, each
  //    interim event fires every ~300-500 ms, so ~1-2 words ≈ 10-15 chars.
  //    We allow ~5× slack for bursty ASR delivery.
  //    Final results (full sentence confirmed) get a larger allowance
  //    (~one full sentence ≈ 15-25 words ≈ 100-150 chars).
  const MAX_JUMP_NEAR = isFinal
    ? (isCJKDoc ? 100 : 200)
    : (isCJKDoc ? 30  : 80);
  const MAX_JUMP_FAR  = isFinal
    ? (isCJKDoc ? 250 : 500)
    : (isCJKDoc ? 80  : 200);

  // Search windows scale with jump limits — no point searching far if we
  // can't advance far anyway.
  const NEAR_WINDOW   = isCJKDoc ? 50  : 120;
  const FAR_WINDOW    = isFinal
    ? (isCJKDoc ? 200 : 500)
    : (isCJKDoc ? 100 : 250);

  // Maximum normalized chars used as needle for fuzzy search.
  const MAX_NEEDLE_FOR_FUZZY = isCJKDoc ? 15 : 40;

  const nearEnd = Math.min(normFull.length, normStart + NEAR_WINDOW);
  const farEnd  = Math.min(normFull.length, normStart + FAR_WINDOW);

  let bestOrigPos = startFrom;
  let bestScore   = 0;

  // ── Context hint: if context is provided, try to locate a normalized suffix
  //    of it to tighten normStart (helps after long silences / restarts).
  //    This replaces the old "context + transcript" string concatenation which
  //    created very long candidates and broke all fast-path exact matches.
  //
  //    IMPORTANT: We save the original normStart so that if context-based
  //    tightening overshoots (e.g. context suffix appears multiple times),
  //    we can still search the full window as fallback.
  const origNormStart = normStart;
  if (context) {
    const normCtx = normalize(context.slice(-60));
    if (normCtx.length >= 4) {
      const ctxSuffix = normCtx.slice(-12); // last ~12 chars of context
      const ctxIdx = exactFind(normFull, ctxSuffix, normStart, farEnd);
      if (ctxIdx !== -1) {
        // Shift normStart forward to just after the context match — we know
        // the user is past this point, so don't re-search behind it.
        // But cap the advance to avoid overshooting too far.
        const tightened = ctxIdx + ctxSuffix.length;
        if (tightened > normStart && tightened < nearEnd) normStart = tightened;
      }
    }
  }

  // ── Try each candidate ───────────────────────────────────────────────────
  for (const rawCandidate of candidates) {
    if (!rawCandidate.trim()) continue;
    const normRec = normalize(rawCandidate);
    if (!normRec) continue;

    const recLen = normRec.length;
    const isPureEnglish = cjkRatio(normRec) < 0.1;

    // ── Strategy A: Exact full-candidate match ────────────────────────────
    // O(window). Fastest path — works when ASR is accurate and candidate is short.
    // For very short candidates (≤6 norm chars), apply distance penalty to
    // avoid common short words matching far ahead.
    for (const [searchEnd, maxJump] of [
      [nearEnd, MAX_JUMP_NEAR],
      [farEnd,  MAX_JUMP_FAR],
    ] as [number, number][]) {
      let idx = exactFind(normFull, normRec, origNormStart, searchEnd);
      if (idx === -1) continue;
      if (isPureEnglish && recLen <= 8 && !isWordBoundaryViaOrigMap(origMap, idx, recLen)) {
        let retry = idx + 1;
        idx = -1;
        while (retry <= searchEnd - recLen) {
          const nextIdx = exactFind(normFull, normRec, retry, searchEnd);
          if (nextIdx === -1) break;
          if (!isPureEnglish || recLen > 8 || isWordBoundaryViaOrigMap(origMap, nextIdx, recLen)) {
            idx = nextIdx;
            break;
          }
          retry = nextIdx + 1;
        }
        if (idx === -1) continue;
      }
      const pos = toOrigPos(idx + recLen, maxJump);
      if (pos !== null && pos > bestOrigPos) {
        // For short exact matches, apply distance penalty: short common
        // words like "the", "and", "there" can appear far ahead.
        // Exact match scores 1.0, so only reject if distance penalty > 1.0
        // (which it never is). But for VERY short matches (≤5 norm chars),
        // cap the jump distance more aggressively.
        if (isPureEnglish && recLen <= 5 && pos - startFrom > 60) continue;
        bestOrigPos = pos;
        bestScore = 1.0;
      }
      break;
    }
    if (bestScore >= 1.0) break;

    // ── Strategy A.5: Near-exact match (allow a few char mismatches) ─────
    // This catches the common case where the user reads correctly but ASR
    // mis-transcribes 1-3 characters (e.g. "their" → "there", "too" → "to",
    // "adapt" → "adept"). We slide the full candidate across the near window
    // and allow up to `maxErrors` character mismatches.
    // O(window × recLen) but bounded by NEAR_WINDOW — fast enough.
    if (recLen >= 6) {
      const maxErrors = Math.min(Math.floor(recLen * 0.3), isCJKDoc ? 3 : 6);
      const searchLimit = Math.min(nearEnd, origNormStart + NEAR_WINDOW);
      let nearExactBest = startFrom;

      for (let i = origNormStart; i <= searchLimit - recLen; i++) {
        let errors = 0;
        let good = true;
        for (let j = 0; j < recLen; j++) {
          if (normFull[i + j] !== normRec[j]) {
            // Check phonetic similarity before counting as full error
            if (!isCJKDoc && isPhoneticSimilar(normFull[i + j], normRec[j])) {
              errors += 0.3; // phonetic mismatch counts as partial error
            } else {
              errors++;
            }
            if (errors > maxErrors) { good = false; break; }
          }
        }
        if (good && errors <= maxErrors) {
          if (isPureEnglish && recLen <= 10 && !isWordBoundaryViaOrigMap(origMap, i, recLen)) continue;
          const pos = toOrigPos(i + recLen, MAX_JUMP_NEAR);
          if (pos !== null && pos > nearExactBest) {
            nearExactBest = pos;
          }
        }
      }
      if (nearExactBest > bestOrigPos) {
        bestOrigPos = nearExactBest;
        bestScore = 0.95;
      }
    }
    if (bestScore >= 0.95) break;

    // ── Strategy B: Exact suffix match (progressively shorter) ───────────
    // Only the TAIL of the candidate is new; earlier words were already matched.
    // Use NEAR window only — FAR window here is what causes over-shooting.
    // Minimum suffix raised to 8 (English) / 4 (CJK) to avoid short common
    // words matching at distant positions.
    {
      const minSuffix = isPureEnglish ? 8 : 4;
      const maxSuffix = Math.min(recLen, 25);
      let suffixHit   = false;

      for (let w = maxSuffix; w >= minSuffix; w--) {
        const suffix = normRec.slice(-w);
        const idx = exactFind(normFull, suffix, origNormStart, nearEnd);
        if (idx === -1) continue;
        if (isPureEnglish && !isWordBoundaryViaOrigMap(origMap, idx, suffix.length)) continue;
        const pos = toOrigPos(idx + suffix.length, MAX_JUMP_NEAR);
        if (pos !== null && pos > bestOrigPos) {
          // Apply distance penalty for suffix matches: shorter suffixes
          // at greater distances are likely false positives.
          const minReq = distancePenalty(pos);
          // Suffix match base score: longer suffixes are more reliable.
          const suffixScore = Math.min(0.9, 0.7 + (w / 40));
          if (minReq > 0 && suffixScore < minReq) continue;
          bestOrigPos = pos;
          bestScore   = suffixScore;
          suffixHit   = true;
        }
        if (suffixHit) break;
      }
      if (bestScore >= 0.9) break;
    }

    // ── Strategy C: Fuzzy sliding-window match ───────────────────────────
    // O(window / stride × needleLen). Bounded by MAX_NEEDLE_FOR_FUZZY and
    // NEAR_WINDOW to stay well under 5 ms budget.
    // Use only the TAIL of the candidate as needle — the head was already
    // consumed and causes false alignment if included.
    //
    // Thresholds raised to ≥75% (English NEAR) / ≥82% (English FAR).
    // Combined with distance penalty, this prevents mediocre fuzzy matches
    // from jumping the highlight across an entire paragraph.
    {
      // Tail needle: take last MAX_NEEDLE_FOR_FUZZY normalized chars.
      const needle = recLen > MAX_NEEDLE_FOR_FUZZY
        ? normRec.slice(-MAX_NEEDLE_FOR_FUZZY)
        : normRec;
      const needleLen = needle.length;

      const stride         = isCJKDoc ? 1 : 2;
      const MIN_SCORE_NEAR = isPureEnglish ? 0.75 : 0.68;
      const MIN_SCORE_FAR  = isPureEnglish ? 0.82 : 0.76;
      const MIN_MATCHED    = isPureEnglish ? 6    : 3;

      // Always search from origNormStart for fuzzy — context hint may have
      // skipped past the real reading position.
      const fuzzyStart = origNormStart;

      for (const [searchEnd, maxJump, minScore] of [
        [nearEnd, MAX_JUMP_NEAR, MIN_SCORE_NEAR],
        [farEnd,  MAX_JUMP_FAR,  MIN_SCORE_FAR],
      ] as [number, number, number][]) {
        let localBestScore = 0;
        let localBestPos   = startFrom;

        for (let i = fuzzyStart; i <= searchEnd - Math.min(needleLen, 4); i += stride) {
          // Give the scorer extra room: the speaker may have inserted extra
          // words that expand the haystack span corresponding to the needle.
          const probeEnd = Math.min(normFull.length, i + needleLen + Math.max(12, Math.floor(needleLen * 0.4)));
          const { score, endNormIdx } = scoreMatch(normFull, i, probeEnd, needle);
          const approxMatched = Math.round(score * (needleLen + 1));
          if (score > localBestScore && score >= minScore && approxMatched >= MIN_MATCHED) {
            const pos = toOrigPos(endNormIdx, maxJump);
            if (pos !== null && pos > startFrom) {
              // Apply distance penalty: farther jumps need higher scores
              const minReq = distancePenalty(pos);
              if (minReq > 0 && score < minReq) continue;
              localBestScore = score;
              localBestPos   = pos;
            }
          }
        }

        if (localBestScore >= minScore && localBestPos > bestOrigPos) {
          bestOrigPos = localBestPos;
          bestScore   = localBestScore;
          break; // NEAR succeeded — skip FAR
        }
      }
    }

    // Don't break on first advancing candidate — try all candidates and
    // keep the one with the best score. This prevents a poor match from
    // a short candidate from overshadowing a precise match from a later one.
    // Only break early for perfect exact matches (score 1.0).
  }

  return bestOrigPos;
}
