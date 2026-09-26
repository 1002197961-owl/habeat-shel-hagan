'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { BRAND } from '@/lib/constants'

const players=[
 {name:'נועה',tool:'גיטרה',emoji:'🎸',color:BRAND.pink,status:'מחוברת'},
 {name:'אורי',tool:'שטיח קצב',emoji:'🥁',color:BRAND.orange,status:'מחובר'},
 {name:'מיה',tool:'מיקרופון',emoji:'🎤',color:BRAND.cyan,status:'מחוברת'},
 {name:'יואב',tool:'קלידים',emoji:'🎹',color:BRAND.purple,status:'סימולציה'},
]

export default function TeacherLivePage(){
 return <main dir="rtl" className="min-h-screen text-white" style={{background:'radial-gradient(circle at 20% 0%,#342d70,#15122f 48%,#09081b)'}}>
  <div className="max-w-6xl mx-auto p-5">
   <header className="flex justify-between items-start gap-3 mb-6">
    <div><div className="text-xs font-bold text-white/50">הביט של הגן · חדר בקרה</div><h1 className="text-3xl font-black mt-1">הלהקה שלי 🎛️</h1><p className="text-white/55 mt-1">אותה במה. יותר שליטה. פחות תפעול.</p></div>
    <Link href="/stage" className="px-5 py-3 rounded-2xl font-black" style={{background:BRAND.green}}>פתחי את הבמה ▶</Link>
   </header>

   <section className="grid md:grid-cols-[1.4fr_.8fr] gap-4">
    <div className="rounded-[28px] bg-white/8 border border-white/10 p-4">
     <div className="flex justify-between mb-4"><b>כלים וילדים</b><span className="text-xs text-green-300">● 4 ערוצים מוכנים</span></div>
     <div className="grid sm:grid-cols-2 gap-3">
      {players.map((p,i)=><motion.div key={p.name} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.07}} className="rounded-2xl p-4 border border-white/10" style={{background:'rgba(255,255,255,.055)'}}>
       <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl grid place-items-center text-2xl" style={{background:p.color+'33'}}>{p.emoji}</div><div className="flex-1"><b>{p.name}</b><div className="text-xs text-white/50">{p.tool}</div></div><span className="text-[10px] px-2 py-1 rounded-full" style={{background:p.color+'33',color:p.color}}>{p.status}</span></div>
       <div className="h-2 bg-white/10 rounded-full mt-4 overflow-hidden"><div className="h-full rounded-full" style={{width:`${72+i*6}%`,background:p.color}}/></div>
      </motion.div>)}
     </div>
    </div>

    <div className="space-y-4">
     <div className="rounded-[28px] bg-white/8 border border-white/10 p-5"><div className="text-xs text-white/45">השיר הבא</div><div className="text-xl font-black mt-1">הביט הראשון שלי ✨</div><div className="flex gap-2 mt-4"><button className="flex-1 py-3 rounded-xl font-black" style={{background:BRAND.pink}}>קל</button><button className="flex-1 py-3 rounded-xl bg-white/10 font-bold">רגיל</button><button className="flex-1 py-3 rounded-xl bg-white/10 font-bold">אתגר</button></div></div>
     <div className="rounded-[28px] bg-white/8 border border-white/10 p-5"><b>לפני שמתחילים</b><div className="mt-3 space-y-2 text-sm text-white/65"><div>✓ כל ילד רואה רק את המסלול שלו</div><div>✓ כולם מסונכרנים לאותו שיר</div><div>✓ תגובה מיידית לכל נגינה/דריכה</div><div>✓ אפשר לעצור את כולם בלחיצה אחת</div></div></div>
    </div>
   </section>
  </div>
 </main>
}
