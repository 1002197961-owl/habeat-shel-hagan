'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BRAND } from '@/lib/constants'

type Lane = { id:string; name:string; emoji:string; key:string; color:string; player:string }
type Hit = { lane:string; id:number; born:number }

const LANES: Lane[] = [
  { id:'guitar', name:'גיטרה', emoji:'🎸', key:'A', color:BRAND.pink, player:'נועה' },
  { id:'drums', name:'שטיח קצב', emoji:'🥁', key:'S', color:BRAND.orange, player:'אורי' },
  { id:'voice', name:'קול', emoji:'🎤', key:'D', color:BRAND.cyan, player:'מיה' },
  { id:'keys', name:'קלידים', emoji:'🎹', key:'F', color:BRAND.purple, player:'יואב' },
]

export default function StagePage() {
  const [playing,setPlaying]=useState(false)
  const [score,setScore]=useState(0)
  const [streak,setStreak]=useState(0)
  const [flash,setFlash]=useState<string|null>(null)
  const [hits,setHits]=useState<Hit[]>([])
  const start=useRef(Date.now())
  const nextId=useRef(1)

  useEffect(()=>{
    if(!playing) return
    start.current=Date.now()
    const timer=setInterval(()=>{
      const lane=LANES[Math.floor(Math.random()*LANES.length)]
      setHits(h=>[...h.slice(-14),{lane:lane.id,id:nextId.current++,born:Date.now()}])
    },760)
    return()=>clearInterval(timer)
  },[playing])

  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{
      const lane=LANES.find(l=>l.key.toLowerCase()===e.key.toLowerCase())
      if(lane) trigger(lane.id)
      if(e.code==='Space'){e.preventDefault();setPlaying(p=>!p)}
    }
    window.addEventListener('keydown',fn)
    return()=>window.removeEventListener('keydown',fn)
  })

  const trigger=(laneId:string)=>{
    setFlash(laneId); setTimeout(()=>setFlash(null),180)
    const now=Date.now()
    const candidates=hits.filter(h=>h.lane===laneId)
    const target=candidates.sort((a,b)=>b.born-a.born)[0]
    if(target && now-target.born>900){
      setHits(h=>h.filter(x=>x.id!==target.id))
      setScore(s=>s+100+Math.min(streak,10)*10); setStreak(s=>s+1)
    } else { setStreak(0) }
  }

  const status=useMemo(()=>playing?'הלהקה מנגנת עכשיו':'מוכנים לעלות לבמה?', [playing])

  return <main dir="rtl" className="min-h-screen overflow-hidden text-white" style={{background:'radial-gradient(circle at 50% 0%,#332a73 0%,#171338 45%,#0b0920 100%)'}}>
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <header className="flex items-center justify-between gap-3 mb-4">
        <div><div className="text-sm font-bold text-white/60">הביט של הגן · LIVE</div><h1 className="text-2xl md:text-4xl font-black">הבמה שלנו 🎵</h1><p className="text-white/65 text-sm mt-1">{status}</p></div>
        <div className="flex gap-2">
          <div className="rounded-2xl bg-white/10 px-4 py-2 text-center"><b className="text-xl">{score}</b><div className="text-[10px] text-white/50">נקודות</div></div>
          <div className="rounded-2xl bg-white/10 px-4 py-2 text-center"><b className="text-xl">🔥 {streak}</b><div className="text-[10px] text-white/50">רצף</div></div>
        </div>
      </header>

      <section className="grid grid-cols-4 gap-2 md:gap-4 h-[62vh] min-h-[430px]" dir="ltr">
        {LANES.map(lane=><div key={lane.id} className="relative overflow-hidden rounded-[28px] border border-white/15" style={{background:'linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.025))'}}>
          <div className="absolute inset-x-0 top-0 z-20 p-3 text-center bg-black/20" dir="rtl"><div className="text-2xl md:text-4xl">{lane.emoji}</div><b className="hidden md:block">{lane.name}</b><span className="text-[10px] text-white/55">{lane.player}</span></div>
          <div className="absolute inset-x-2 bottom-20 h-1 rounded-full" style={{background:lane.color,boxShadow:`0 0 18px ${lane.color}`}}/>
          <AnimatePresence>
            {hits.filter(h=>h.lane===lane.id).map(h=><motion.div key={h.id} initial={{top:'22%',opacity:0,scale:.6}} animate={{top:'76%',opacity:1,scale:1}} exit={{opacity:0,scale:1.8}} transition={{duration:2,ease:'linear'}} onAnimationComplete={()=>setHits(x=>x.filter(v=>v.id!==h.id))} className="absolute left-1/2 -translate-x-1/2 w-12 h-12 md:w-16 md:h-16 rounded-full border-4 border-white/70" style={{background:lane.color,boxShadow:`0 0 30px ${lane.color}`}}/> )}
          </AnimatePresence>
          <motion.button whileTap={{scale:.9}} onClick={()=>trigger(lane.id)} className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[86%] h-14 rounded-2xl font-black border-2 border-white/30" style={{background:flash===lane.id?'white':lane.color,color:flash===lane.id?lane.color:'white',boxShadow:flash===lane.id?`0 0 45px ${lane.color}`:undefined}}>
            <span className="md:hidden">{lane.emoji}</span><span className="hidden md:inline">נגן! · {lane.key}</span>
          </motion.button>
        </div>)}
      </section>

      <div className="mt-4 flex items-center justify-center gap-3" dir="rtl">
        <button onClick={()=>setPlaying(p=>!p)} className="rounded-2xl px-8 py-3 font-black text-lg" style={{background:playing?'#ef4444':BRAND.green}}>{playing?'⏸ עצירה':'▶ מתחילים לנגן'}</button>
        <div className="hidden md:block text-xs text-white/45">מצב סימולציה: A / S / D / F מדמים כלי נגינה · רווח מפעיל/עוצר</div>
      </div>
    </div>
  </main>
}
