'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

const lessons = {
  children: [
    { title: 'בואו נכיר את הביט!', text: 'בחרו כפתור צבעוני במסך הבית. בכל מסך אפשר לחזור הביתה ולנסות משהו חדש.', href: '/', emoji: '🎵', file: '/videos/children-welcome.mp4' },
    { title: 'איך מנגנים שיר?', text: 'בספרייה בוחרים קטע. לוחצים על „השמיעו לי”, מקשיבים ומצטרפים בקצב.', href: '/library', emoji: '🥁', file: '/videos/children-library.mp4' },
    { title: 'איך יוצרים ומקליטים?', text: 'בשיר הקסם בוחרים תשובות ומקבלים מילים לשיר. באולפן מבקשים עזרה מהגננת להקלטה.', href: '/magic-song', emoji: '✨', file: '/videos/children-create.mp4' },
  ],
  teachers: [
    { title: 'הכנה למפגש', text: 'בדקו שמע, מיקרופון ומצלמה, בחרו שיר והחליטו אילו ילדים יפעלו בכל תחנה.', href: '/teacher', emoji: '👩‍🏫', file: '/videos/teachers-setup.mp4' },
    { title: 'הנחיית הפעילות', text: 'פתחו את מנהל הביט, בחרו שיר ותרגלו את רצף הצבעים. עצרו כשצריך ותנו מקום להצלחה.', href: '/beat-manager', emoji: '🎛️', file: '/videos/teachers-session.mp4' },
    { title: 'צילום ושמירה', text: 'קבלו הרשאות והסכמות מתאימות לפני צילום ילדים. הורידו כל הקלטה לפני סגירת העמוד.', href: '/recording', emoji: '🎬', file: '/videos/teachers-recording.mp4' },
  ],
}

export default function GuidePage() {
  const [audience, setAudience] = useState<'children' | 'teachers'>('children')
  useEffect(() => { if (new URLSearchParams(window.location.search).get('audience') === 'teachers') setAudience('teachers') }, [])
  return <main dir="rtl" className="min-h-screen p-5 bg-indigo-50" style={{ color: BRAND.navy }}>
    <Link href="/" className="font-bold text-indigo-800">→ חזרה לבית</Link>
    <h1 className="text-2xl font-black mt-5">איך משתמשים בביט של הגן?</h1>
    <p className="text-sm mt-2">הדרכות קצרות לפי התפקיד שלכם.</p>
    <div className="flex gap-2 my-5">
      <button onClick={() => setAudience('children')} className="flex-1 rounded-xl p-3 font-bold" style={{ background: audience === 'children' ? BRAND.pink : 'white', color: audience === 'children' ? 'white' : BRAND.navy }}>לילדים 🧒</button>
      <button onClick={() => setAudience('teachers')} className="flex-1 rounded-xl p-3 font-bold" style={{ background: audience === 'teachers' ? BRAND.purple : 'white', color: audience === 'teachers' ? 'white' : BRAND.navy }}>לגננות 👩‍🏫</button>
    </div>
    <div className="space-y-4">{lessons[audience].map((lesson, index) => <section key={lesson.title} className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-black text-lg">{index + 1}. {lesson.emoji} {lesson.title}</h2>
      <p className="text-sm mt-2 leading-relaxed">{lesson.text}</p>
      {audience === 'teachers' && <div className="mt-3 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-800">🎬 סרטון הדרכה קצר יתווסף כאן לאחר ההפקה.</div>}
      <Link href={lesson.href} className="inline-block mt-3 rounded-xl bg-indigo-800 text-white px-4 py-2 font-bold text-sm">נסו עכשיו ←</Link>
    </section>)}</div>
  </main>
}
