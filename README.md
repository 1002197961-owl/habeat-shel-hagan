# הביט של הגן 🎵

> קצב. יצירה. דמיון.

אפליקציית MVP למוסיקה ויצירה בגן הילדים — RTL עברית, Next.js 15, TypeScript, Tailwind, Framer Motion.

---

## 🚀 התקנה והפעלה

```bash
npm install
npm run dev
```

פתחי את הדפדפן בכתובת: [http://localhost:3000](http://localhost:3000)

---

## 📁 מבנה הפרויקט

```
app/                   # Next.js App Router
  page.tsx             # מסך הבית
  layout.tsx           # Layout ראשי (RTL, Heebo font)
  globals.css          # CSS variables, keyframes, base styles
  beat-manager/        # מנהל הביט
  magic-song/          # שיר הקסם
  stations/            # תחנות כלי נגינה
  recording/           # הקלטה וצילום קליפ
  library/             # ספריית שירים וקליפים
  behind-scenes/       # מאחורי הקלעים
  dashboard/           # דאשבורד עירוני
  teacher/             # מצב גננת

components/
  ui/                  # Card, Pill, Toggle, WaveBar, Btn
  layout/              # AppShell, BackHeader
  home/                # LogoHero, NavGrid

lib/
  constants.ts         # Brand colors, nav screens
  mockData.ts          # Mock data (songs, gardens, stations)
  utils.ts             # cn() helper

store/
  appStore.ts          # Zustand global state
```

---

## 🎨 Brand Colors

| Name   | Hex       |
|--------|-----------|
| Pink   | `#FF4DA6` |
| Orange | `#FFA500` |
| Yellow | `#FFD600` |
| Green  | `#22C55E` |
| Cyan   | `#00B4E6` |
| Purple | `#8B5CF6` |
| Navy   | `#1E1B4B` |
| Rose   | `#f43f5e` |

---

## 🔧 טכנולוגיות

- **Next.js 15** — App Router
- **TypeScript** — strict mode
- **Tailwind CSS** — with custom brand palette
- **Framer Motion** — page & card animations
- **Zustand** — global state (no backend yet)
- **Heebo** — Google Font, Hebrew-first

---

## 📱 ציוד פיילוט

| תחנה | ציוד |
|------|------|
| תחנת הופעה | גיטרה ורודה + מיקרופון |
| רצפת הקצב | שטיח פסנתר ענק |
| עמדת שירה | Logitech G335 Headset |
| תחנות פעילות | טאבלטים עם כיסוי מוקשח |

---

## 📌 סטטוס מסכים

| מסך | סטטוס |
|-----|-------|
| 🏠 Home | ✅ מוכן |
| 🎛️ מנהל הביט | 🔜 בפיתוח |
| ⭐ שיר הקסם | 🔜 בפיתוח |
| 🎸 תחנות נגינה | 🔜 בפיתוח |
| 🎤 הקלטה | 🔜 בפיתוח |
| 📂 ספרייה | 🔜 בפיתוח |
| 🎬 מאחורי הקלעים | 🔜 בפיתוח |
| 📊 דאשבורד עירוני | 🔜 בפיתוח |
| 👩‍🏫 מצב גננת | 🔜 בפיתוח |
