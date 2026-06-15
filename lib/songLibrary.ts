// ============================================================
//  הביט של הגן — Song Library
//  lib/songLibrary.ts
//  Structured built-in song data. Add new songs at the bottom.
// ============================================================

export type BeatColor = "red" | "yellow" | "blue" | "green" | "purple" | "rest";
export type Difficulty = "easy" | "medium" | "hard";
export type AgeLevel = "3-4" | "4-5" | "5-6" | "3-6";
export type SongCategory = "folk" | "movement" | "nature" | "animals" | "holiday";
export type SpeedLevel = "slow" | "normal" | "fast";

export interface BeatSection {
  label: string;          // e.g. "פזמון", "בית א׳"
  beats: BeatColor[];     // 8–16 beats per section
}

export interface ProgressionStage {
  stage: number;          // 1 = beginner → 3 = advanced
  label: string;
  description: string;
  unlockedAt: number;     // stars required to unlock
  speedLevel: SpeedLevel;
  sectionsEnabled: number; // how many sections are active
}

export interface LyricLine {
  text: string;
  beatIndex: number;      // which global beat this line starts on
}

export interface Song {
  id: string;
  title: string;
  subtitle: string;       // artist / folk
  category: SongCategory;
  ageLevel: AgeLevel;
  difficulty: Difficulty;
  durationSec: number;
  bpm: number;            // beats per minute (for future audio sync)
  emoji: string;          // visual stand-in for preview image
  previewColor: string;   // hex card accent color
  instruments: string[];  // e.g. ["drums","microphone","red-button"]
  colorPattern: BeatColor[]; // base repeating pattern (4–8 beats)
  sections: BeatSection[];
  lyrics: LyricLine[];
  progression: ProgressionStage[];
  tags: string[];
}

// ── Color → instrument mapping ──────────────────────────────
export const COLOR_META: Record<BeatColor, { label: string; icon: string; hex: string }> = {
  red:    { label: "תופים",    icon: "🥁", hex: "#EF4444" },
  yellow: { label: "מחיאות",  icon: "👏", hex: "#EAB308" },
  blue:   { label: "שירה",    icon: "🎤", hex: "#3B82F6" },
  green:  { label: "גיטרה",   icon: "🎸", hex: "#22C55E" },
  purple: { label: "קלידים",  icon: "🎹", hex: "#9333EA" },
  rest:   { label: "הפסקה",   icon: "·",  hex: "#E5E7EB" },
};

// ── Default progression template ────────────────────────────
const defaultProgression = (sections: number): ProgressionStage[] => [
  { stage:1, label:"מתחיל",   description:"2 חלקים ראשונים בקצב איטי",  unlockedAt:0, speedLevel:"slow",   sectionsEnabled: Math.min(2, sections) },
  { stage:2, label:"מתקדם",   description:"כל החלקים בקצב רגיל",         unlockedAt:2, speedLevel:"normal", sectionsEnabled: sections },
  { stage:3, label:"מומחה",   description:"כל החלקים בקצב מהיר",          unlockedAt:5, speedLevel:"fast",   sectionsEnabled: sections },
];

// ════════════════════════════════════════════════════════════
//  BUILT-IN SONGS
// ════════════════════════════════════════════════════════════

export const SONGS: Song[] = [

  // ── 1. אם אתה שמח ──────────────────────────────────────
  {
    id: "im-ata-sameach",
    title: "אם אתה שמח",
    subtitle: "שיר עממי",
    category: "movement",
    ageLevel: "3-6",
    difficulty: "easy",
    durationSec: 45,
    bpm: 120,
    emoji: "😊",
    previewColor: "#FFD600",
    instruments: ["drums", "red-button", "microphone"],
    colorPattern: ["red", "yellow", "red", "blue"],
    sections: [
      { label: "בית א׳",  beats: ["red","yellow","red","yellow","rest","red","yellow","rest"] },
      { label: "פזמון",   beats: ["blue","blue","red","yellow","blue","red","yellow","blue"] },
      { label: "גשר",    beats: ["green","red","yellow","green","red","yellow","blue","rest"] },
      { label: "סיום",   beats: ["red","yellow","red","blue","red","yellow","red","rest"] },
    ],
    lyrics: [
      { text: "אִם אַתָּה שָׂמֵחַ וְיוֹדֵעַ אֶת זֶה", beatIndex: 0 },
      { text: "תִּמְחָא בְּכַפַּיִם – פָּם פָּם", beatIndex: 8 },
      { text: "אִם אַתָּה שָׂמֵחַ וְיוֹדֵעַ אֶת זֶה", beatIndex: 16 },
      { text: "תִּמְחָא בְּכַפַּיִם – פָּם פָּם", beatIndex: 24 },
    ],
    progression: defaultProgression(4),
    tags: ["classic","clapping","group"],
  },

  // ── 2. יונתן הקטן ──────────────────────────────────────
  {
    id: "yonatan-hakatan",
    title: "יונתן הקטן",
    subtitle: "שיר ילדים",
    category: "animals",
    ageLevel: "3-5",
    difficulty: "medium",
    durationSec: 52,
    bpm: 108,
    emoji: "🐑",
    previewColor: "#8B5CF6",
    instruments: ["drums", "keyboard", "microphone"],
    colorPattern: ["purple","red","yellow","blue"],
    sections: [
      { label: "פתיחה",  beats: ["purple","red","purple","red","yellow","blue","rest","rest"] },
      { label: "בית",    beats: ["red","yellow","red","purple","blue","yellow","red","rest"] },
      { label: "פזמון",  beats: ["purple","blue","yellow","red","purple","blue","yellow","red"] },
      { label: "סיום",   beats: ["purple","red","yellow","blue","purple","red","yellow","rest"] },
    ],
    lyrics: [
      { text: "יוֹנָתָן הַקָּטָן יָצָא לִרְעוֹת", beatIndex: 0 },
      { text: "אֶת הַצֹּאן בַּשָּׂדֶה לֹא רָחוֹק", beatIndex: 8 },
      { text: "יוֹנָתָן הַקָּטָן שָׁר וְשָׂמֵחַ", beatIndex: 16 },
      { text: "עִם הַצֹּאן הַלָּבָן בַּדֶּרֶךְ", beatIndex: 24 },
    ],
    progression: defaultProgression(4),
    tags: ["pastoral","singing","animals"],
  },

  // ── 3. לדוד משה הייתה חווה ─────────────────────────────
  {
    id: "ledavid-moshe",
    title: "לדוד משה הייתה חווה",
    subtitle: "Old MacDonald (עברית)",
    category: "animals",
    ageLevel: "4-6",
    difficulty: "hard",
    durationSec: 60,
    bpm: 100,
    emoji: "🐄",
    previewColor: "#22C55E",
    instruments: ["drums", "guitar", "microphone", "keyboard"],
    colorPattern: ["red","yellow","red","yellow","blue","red","yellow","green"],
    sections: [
      { label: "בית א׳",       beats: ["red","yellow","red","yellow","blue","red","yellow","green"] },
      { label: "פזמון",        beats: ["green","red","yellow","green","purple","blue","red","yellow"] },
      { label: "חיקוי קולות",  beats: ["blue","blue","red","purple","blue","green","yellow","red"] },
      { label: "בית ב׳",       beats: ["red","green","yellow","red","purple","yellow","blue","red"] },
      { label: "סיום",         beats: ["yellow","red","yellow","green","blue","purple","red","yellow"] },
    ],
    lyrics: [
      { text: "לְדָוִד מֹשֶׁה הָיְתָה חַוָּה, הֵי הֵי הֵי", beatIndex: 0 },
      { text: "וּבַחַוָּה הָיְתָה פָּרָה, הֵי הֵי הֵי", beatIndex: 8 },
      { text: "מוּ מוּ פֹּה, מוּ מוּ שָׁם", beatIndex: 16 },
      { text: "פֹּה מוּ שָׁם מוּ בְּכָל מָקוֹם מוּ", beatIndex: 24 },
      { text: "לְדָוִד מֹשֶׁה הָיְתָה חַוָּה, הֵי הֵי הֵי", beatIndex: 32 },
    ],
    progression: defaultProgression(5),
    tags: ["animals","imitation","group","classic"],
  },

  // ── 4. ידיים למעלה ─────────────────────────────────────
  {
    id: "yadayim-lemaala",
    title: "ידיים למעלה",
    subtitle: "שיר תנועה",
    category: "movement",
    ageLevel: "3-5",
    difficulty: "easy",
    durationSec: 38,
    bpm: 130,
    emoji: "🙌",
    previewColor: "#FF4DA6",
    instruments: ["drums", "red-button"],
    colorPattern: ["red","yellow","red","yellow"],
    sections: [
      { label: "פתיחה",  beats: ["red","yellow","red","yellow","blue","blue","rest","rest"] },
      { label: "פזמון",  beats: ["red","red","yellow","blue","red","yellow","green","rest"] },
      { label: "תנועה",  beats: ["yellow","blue","yellow","red","red","blue","yellow","red"] },
      { label: "סיום",   beats: ["red","yellow","red","yellow","rest","rest","rest","rest"] },
    ],
    lyrics: [
      { text: "יָדַיִם לְמַעְלָה, יָדַיִם לְמַטָּה", beatIndex: 0 },
      { text: "יָדַיִם לַצְּדָדִים וְנִמְחָא בְּכַפּוֹת", beatIndex: 8 },
      { text: "רַגְלַיִם לְמַעְלָה, רַגְלַיִם לְמַטָּה", beatIndex: 16 },
      { text: "קָפִיץ קָפִיץ וְנִרְקַד", beatIndex: 24 },
    ],
    progression: defaultProgression(4),
    tags: ["movement","body","energetic","group"],
  },

  // ── 5. קן לציפור ───────────────────────────────────────
  {
    id: "ken-latzipor",
    title: "קן לציפור",
    subtitle: "שיר טבע",
    category: "nature",
    ageLevel: "4-6",
    difficulty: "medium",
    durationSec: 50,
    bpm: 96,
    emoji: "🐦",
    previewColor: "#00B4E6",
    instruments: ["guitar", "microphone", "keyboard"],
    colorPattern: ["green","blue","green","blue","yellow","rest"],
    sections: [
      { label: "פתיחה",  beats: ["green","blue","green","blue","yellow","rest","rest","rest"] },
      { label: "בית",    beats: ["blue","green","yellow","red","blue","green","yellow","rest"] },
      { label: "גשר",   beats: ["green","purple","blue","yellow","green","red","blue","rest"] },
      { label: "סיום",   beats: ["green","blue","yellow","green","blue","yellow","rest","rest"] },
    ],
    lyrics: [
      { text: "יֵשׁ קַן לַצִּפּוֹר בְּרֹאשׁ הָעֵץ", beatIndex: 0 },
      { text: "הַצִּפּוֹר שָׁרָה שִׁיר יָפֶה", beatIndex: 8 },
      { text: "גּוֹזָלִים קְטַנִּים בַּקָּן יוֹשְׁבִים", beatIndex: 16 },
      { text: "וּמְחַכִּים לְאִמָּא שֶׁתָּשׁוּב", beatIndex: 24 },
    ],
    progression: defaultProgression(4),
    tags: ["nature","birds","gentle","harmony"],
  },
];

// ── Helpers ──────────────────────────────────────────────────

export function getSongById(id: string): Song | undefined {
  return SONGS.find(s => s.id === id);
}

export function getSongsByCategory(cat: SongCategory): Song[] {
  return SONGS.filter(s => s.category === cat);
}

export function getSongsByDifficulty(diff: Difficulty): Song[] {
  return SONGS.filter(s => s.difficulty === diff);
}

export function getSongsByAge(age: string): Song[] {
  return SONGS.filter(s => s.ageLevel === age || s.ageLevel === "3-6");
}

export function getTotalBeats(song: Song): number {
  return song.sections.reduce((t, sec) => t + sec.beats.filter(b => b !== "rest").length, 0);
}

export function getStageForStars(song: Song, stars: number): ProgressionStage {
  const unlocked = song.progression.filter(p => p.unlockedAt <= stars);
  return unlocked[unlocked.length - 1] ?? song.progression[0];
}

"use client";
// ============================================================
//  הביט של הגן — app/library/page.tsx
//  Song Library — שירי צבע full page
// ============================================================
import { useState, useEffect, useRef, useCallback } from "react";
import {
  SONGS, COLOR_META, getTotalBeats, getStageForStars,
  type Song, type BeatColor, type SpeedLevel,
} from "@/lib/songLibrary";

// ── Stars persistence (mock localStorage) ───────────────────
function useStars(songId: string) {
  const key = `habeat:stars:${songId}`;
  const [stars, setStarsState] = useState(0);
  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (v) setStarsState(parseInt(v, 10));
  }, [key]);
  const setStars = (n: number) => {
    setStarsState(n);
    if (typeof window !== "undefined") localStorage.setItem(key, String(n));
  };
  return [stars, setStars] as const;
}

// ── Beat component ───────────────────────────────────────────
function Beat({
  color, sectionIdx, beatIdx, lit, tapped, onTap,
}: {
  color: BeatColor; sectionIdx: number; beatIdx: number;
  lit: boolean; tapped: boolean; onTap: () => void;
}) {
  const meta = COLOR_META[color];
  const isRest = color === "rest";
  const base = "w-11 h-11 rounded-xl flex items-center justify-center text-xl select-none transition-all duration-100 cursor-pointer";
  const bgMap: Record<BeatColor, string> = {
    red: "bg-red-100",   yellow: "bg-yellow-100",
    blue: "bg-blue-100", green: "bg-green-100",
    purple: "bg-purple-100", rest: "bg-gray-100 border border-dashed border-gray-300 opacity-40 cursor-default",
  };
  return (
    <div
      className={`${base} ${bgMap[color]} ${lit ? "scale-125 ring-2 ring-black/20" : ""} ${tapped ? "opacity-40 scale-95" : ""}`}
      onClick={isRest ? undefined : onTap}
      title={meta.label}
    >
      {meta.icon}
    </div>
  );
}

// ── Song Card (library grid) ─────────────────────────────────
function SongCard({ song, stars, onSelect }: { song: Song; stars: number; onSelect: () => void }) {
  const total = getTotalBeats(song);
  const diffLabel = { easy: "קל", medium: "בינוני", hard: "מאתגר" }[song.difficulty];
  const diffColor = { easy: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", hard: "bg-red-100 text-red-800" }[song.difficulty];
  return (
    <button
      onClick={onSelect}
      className="text-right w-full bg-white rounded-2xl border border-gray-100 p-4 hover:border-gray-300 hover:shadow-sm transition-all active:scale-95"
    >
      <div
        className="w-full h-20 rounded-xl flex items-center justify-center text-4xl mb-3"
        style={{ background: song.previewColor + "22" }}
      >
        {song.emoji}
      </div>
      <div className="font-black text-base text-gray-900 mb-0.5">{song.title}</div>
      <div className="text-xs text-gray-400 mb-2">{song.subtitle}</div>
      <div className="flex gap-1.5 flex-wrap mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diffColor}`}>{diffLabel}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{total} ביטים</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">{song.durationSec}″</span>
      </div>
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => <span key={i} className="text-base">{i < stars ? "⭐" : "☆"}</span>)}
      </div>
    </button>
  );
}

// ── Karaoke line ─────────────────────────────────────────────
function KaraokeDisplay({ song, currentBeat }: { song: Song; currentBeat: number }) {
  const line = [...song.lyrics].reverse().find(l => l.beatIndex <= currentBeat);
  if (!line) return null;
  return (
    <div className="text-center py-3 px-4 bg-indigo-50 rounded-xl font-bold text-indigo-900 text-base leading-relaxed min-h-[56px] flex items-center justify-center">
      {line.text}
    </div>
  );
}

// ── Game Screen ──────────────────────────────────────────────
function GameScreen({ song, onBack }: { song: Song; onBack: () => void }) {
  const [savedStars, setSavedStars] = useStars(song.id);
  const stage = getStageForStars(song, savedStars);

  const [speed, setSpeed] = useState<SpeedLevel>(stage.speedLevel);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [tapped, setTapped] = useState(0);
  const [combo, setCombo] = useState(0);
  const [sessionStars, setSessionStars] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [litBeat, setLitBeat] = useState<{ si: number; bi: number } | null>(null);
  const [tappedSet, setTappedSet] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idxRef = useRef(0);
  const flatRef = useRef<{ b: BeatColor; si: number; bi: number }[]>([]);

  const activeSections = song.sections.slice(0, stage.sectionsEnabled);
  const total = activeSections.reduce((t, s) => t + s.beats.filter(b => b !== "rest").length, 0);
  const pct = total > 0 ? Math.round((tapped / total) * 100) : 0;

  const msPerBeat = speed === "slow" ? 850 : speed === "fast" ? 300 : 550;

  useEffect(() => () => { if (ivRef.current) clearInterval(ivRef.current); }, []);

  const tick = useCallback(() => {
    const flat = flatRef.current;
    if (idxRef.current >= flat.length) {
      if (ivRef.current) clearInterval(ivRef.current);
      setPlaying(false);
      setFinished(true);
      setLitBeat(null);
      return;
    }
    const { b, si, bi } = flat[idxRef.current++];
    setCurrentBeat(prev => prev + 1);
    if (b !== "rest") setLitBeat({ si, bi });
    else setLitBeat(null);
  }, []);

  const startPlay = () => {
    flatRef.current = activeSections.flatMap((sec, si) =>
      sec.beats.map((b, bi) => ({ b, si, bi }))
    );
    idxRef.current = 0;
    setCurrentBeat(0);
    setPlaying(true);
    setFinished(false);
    ivRef.current = setInterval(tick, msPerBeat);
  };

  const stopPlay = () => {
    if (ivRef.current) clearInterval(ivRef.current);
    setPlaying(false);
    setLitBeat(null);
  };

  const tapBeat = (si: number, bi: number) => {
    const key = `${si}-${bi}`;
    if (tappedSet.has(key)) return;
    const pts = 10 + combo * 2;
    setScore(s => s + pts);
    setTapped(t => {
      const next = t + 1;
      const pctNow = total > 0 ? Math.round((next / total) * 100) : 0;
      const ns = pctNow >= 80 ? 3 : pctNow >= 50 ? 2 : pctNow >= 20 ? 1 : 0;
      if (ns > sessionStars) {
        setSessionStars(ns);
        if (ns > savedStars) setSavedStars(ns);
      }
      return next;
    });
    setCombo(c => c + 1);
    setTappedSet(prev => new Set([...prev, key]));
  };

  const resetGame = () => {
    stopPlay();
    setScore(0); setTapped(0); setCombo(0); setSessionStars(0);
    setCurrentBeat(-1); setLitBeat(null);
    setTappedSet(new Set()); setFinished(false);
  };

  const speedMs = { slow: "איטי", normal: "רגיל", fast: "מהיר" };

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 text-xl">←</button>
        <div className="flex-1">
          <div className="font-black text-xl text-gray-900">{song.emoji} {song.title}</div>
          <div className="text-xs text-gray-400">{song.subtitle} • שלב {stage.stage}: {stage.label}</div>
        </div>
        <div className="flex gap-0.5">
          {[0,1,2].map(i => <span key={i} className="text-lg">{i < savedStars ? "⭐" : "☆"}</span>)}
        </div>
      </div>

      {/* Karaoke */}
      <KaraokeDisplay song={song} currentBeat={currentBeat} />

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {(["red","yellow","blue","green","purple"] as BeatColor[]).map(c => (
          <div key={c} className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-3 h-3 rounded-full" style={{ background: COLOR_META[c].hex }} />
            {COLOR_META[c].icon} {COLOR_META[c].label}
          </div>
        ))}
      </div>

      {/* Speed */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400">מהירות:</span>
        {(["slow","normal","fast"] as SpeedLevel[]).map(s => (
          <button
            key={s}
            onClick={() => { setSpeed(s); if (playing) { stopPlay(); } }}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${speed === s ? "bg-[#1E1B4B] text-white border-[#1E1B4B]" : "border-gray-200 text-gray-500"}`}
          >
            {speedMs[s]}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3">
        {activeSections.map((sec, si) => (
          <div key={si} className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1E1B4B] text-white text-[10px] flex items-center justify-center">{si + 1}</span>
              {sec.label}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {sec.beats.map((b, bi) => (
                <Beat
                  key={bi} color={b} sectionIdx={si} beatIdx={bi}
                  lit={litBeat?.si === si && litBeat?.bi === bi}
                  tapped={tappedSet.has(`${si}-${bi}`)}
                  onTap={() => tapBeat(si, bi)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={playing ? stopPlay : startPlay}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white transition-all ${playing ? "bg-rose-500" : "bg-[#1E1B4B]"}`}
        >
          {playing ? "⏹ עצור" : "▶ נגן קצב"}
        </button>
        <button onClick={resetGame} className="px-4 py-2.5 rounded-full text-sm text-gray-500 border border-gray-200">↺ אפס</button>
        {combo >= 3 && <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full animate-pulse">{combo >= 10 ? "🔥🔥" : "🔥"} {combo}x קומבו!</span>}
      </div>

      {/* Score */}
      <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
        <div><div className="text-xs text-gray-400">ניקוד</div><div className="text-2xl font-black text-[#1E1B4B]">{score}</div></div>
        <div><div className="text-xs text-gray-400 mb-1">כוכבים</div><div className="flex gap-1">{[0,1,2].map(i=><span key={i} className="text-xl">{i<sessionStars?"⭐":"☆"}</span>)}</div></div>
        <div><div className="text-xs text-gray-400">התקדמות</div><div className="text-2xl font-black text-[#1E1B4B]">{pct}%</div></div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#1E1B4B] rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      {/* Finished banner */}
      {finished && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl mb-1">{sessionStars >= 3 ? "🏆" : sessionStars >= 2 ? "🎉" : "👍"}</div>
          <div className="font-black text-green-800">
            {sessionStars >= 3 ? "מעולה! ניגנת הכל!" : sessionStars >= 2 ? "יפה מאוד!" : "כל הכבוד!"}
          </div>
          <div className="text-xs text-green-600 mt-1">צברת {sessionStars} כוכבים • ניקוד: {score}</div>
        </div>
      )}

      <div className="text-center text-xs text-gray-400 pb-2">💡 לחצו על הביטים בזמן שהם מאירים לצבור נקודות</div>
    </div>
  );
}

// ── Library Page ─────────────────────────────────────────────
export default function LibraryPage() {
  const [selected, setSelected] = useState<Song | null>(null);
  const [filter, setFilter] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [search, setSearch] = useState("");

  const allStars = SONGS.reduce<Record<string, number>>((acc, s) => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem(`habeat:stars:${s.id}`);
      acc[s.id] = v ? parseInt(v, 10) : 0;
    } else { acc[s.id] = 0; }
    return acc;
  }, {});

  const filtered = SONGS.filter(s => {
    if (filter !== "all" && s.difficulty !== filter) return false;
    if (search && !s.title.includes(search) && !s.tags.some(t => t.includes(search))) return false;
    return true;
  });

  if (selected) {
    return (
      <div className="p-4 max-w-2xl mx-auto" dir="rtl">
        <GameScreen song={selected} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-3xl">🎨</span>
        <div>
          <h1 className="text-2xl font-black text-gray-900">שירי צבע</h1>
          <p className="text-sm text-gray-400">בחרו שיר ← לחצו ביטים ← צברו כוכבים</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mt-4 mb-4 flex-wrap">
        {(["all","easy","medium","hard"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filter === f ? "bg-[#1E1B4B] text-white border-[#1E1B4B]" : "border-gray-200 text-gray-500"}`}
          >
            {{ all:"הכל", easy:"קל", medium:"בינוני", hard:"מאתגר" }[f]}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map(song => (
          <SongCard
            key={song.id}
            song={song}
            stars={allStars[song.id] ?? 0}
            onSelect={() => setSelected(song)}
          />
        ))}
      </div>

      <p className="text-center text-xs text-gray-300 mt-6">{SONGS.length} שירים • עוד שירים בקרוב</p>
    </div>
  );
}
