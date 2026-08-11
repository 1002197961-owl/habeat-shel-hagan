// ============================================================
//  הביט של הגן — Song Library
//  lib/songLibrary.ts
//  Structured built-in song data. Add new songs at the bottom.
// ============================================================

export type BeatColor = "red" | "yellow" | "blue" | "green" | "purple" | "rest";
export type Difficulty = "easy" | "medium" | "hard";
export type AgeLevel = "3-4" | "3-5" | "4-5" | "4-6" | "5-6" | "3-6";
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
