'use client'
import { CharacterCompanions } from '@/components/characters/CharacterCompanions'

import { useState } from 'react'
import Link from 'next/link'
import { BRAND } from '@/lib/constants'

const lessons = {
  children: [
    { title: 'בואו נכיר את הביט!', text: 'בחרו כפתור צבעוני במסך הבית. בכל מסך אפשר לחזור הביתה ולנסות משהו חדש.', href: '/', emoji: '🎵', file: '/videos/children-welcome.mp4' },
    { title: 'איך מנגנים שיר?', text: 'בספרייה בוחרים קטע. לוחצים על „השמיעו לי”, מקשיבים ומצטרפים בקצב.', href: '/library', emoji: '🥁', file: '/videos/children-library.mp4' },
    { title: 'איך יוצרים ומקליטים?', text: 'בשיר הקסם בוחרים תשובות ומקבלים מילים לשיר. באולפן מבקשים עזרה מהגננת להקלטה.', href: '/magic-song', emoji: '✨', file: '/videos/children-create.mp4' },
  ],
}

export default function GuidePage() {
  const [audience] = useState<'children'>('children')
  return <main dir="rtl" className="min-h-screen p-5 bg-indigo-50" style={{ color: BRAND.navy }}>
    <Link href="/" className="inline-flex min-h-12 items-center rounded-xl px-3 py-2 font-bold text-indigo-800">→ חזרה לבית</Link>
    <h1 className="text-2xl font-black mt-5">איך משתמשים בביט של הגן?</h1>
    <p className="text-sm mt-2">הדרכות קצרות לילדים.</p>
    <div className="mt-4 w-fit max-w-full rounded-2xl bg-white p-3"><CharacterCompanions /></div>
    <div className="space-y-4 mt-5">{lessons[audience].map((lesson, index) => <section key={lesson.title} className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-black text-lg">{index + 1}. {lesson.emoji} {lesson.title}</h2>
      <p className="text-sm mt-2 leading-relaxed">{lesson.text}</p>
      <Link href={lesson.href} className="inline-flex min-h-12 items-center mt-3 rounded-xl bg-indigo-800 text-white px-4 py-2 font-bold text-base">נסו עכשיו ←</Link>
    </section>)}</div>
  </main>
}
