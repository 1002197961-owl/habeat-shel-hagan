'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Btn } from '@/components/ui/Btn'
import { BRAND } from '@/lib/constants'
import { BEAT_COLORS, type BeatColor, type Song } from '@/lib/mockData'
const MS = 750
interface Props { song: Song; onContinue: () => void }
export function RhythmPractice({ song, onContinue }: Props) {
  const pattern = (song.pattern ?? []) as BeatColor[]
  const [cur, setCur] = useState(-1)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setCur(p => { const n = p+1; if(n>=pattern.length){setRunning(false);return p} return n }), MS)
    return () => clearInterval(id)
  }, [running, pattern.length])
  const info = cur >= 0 ? BEAT_COLORS[pattern[cur]] : null
  return (
    <div dir="rtl">
      <AnimatePresence mode="wait">
        {info ? (
          <motion.div key={cur} initial={{scale:0.75,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:1.1,opacity:0}} transition={{duration:0.14}}
            style={{textAlign:'center',marginBottom:14,padding:'18px 12px',borderRadius:20,background:info.color+'1a',border:'2px solid '+info.color+'44'}}>
            <motion.div animate={{scale:[1,1.12,1]}} transition={{duration:0.35}}
              style={{width:80,height:80,borderRadius:'50%',background:info.color,margin:'0 auto 10px',boxShadow:'0 0 0 10px '+info.color+'30'}}/>
            <div style={{fontWeight:900,fontSize:24,color:info.color}}>{info.label}</div>
            <div style={{fontSize:13,color:'#6b7280',marginTop:3}}>{info.instrument}</div>
            <div style={{fontSize:11,color:'#9ca3af',marginTop:4,fontWeight:700}}>{cur+1} / {pattern.length}</div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{opacity:0}} animate={{opacity:1}}
            style={{textAlign:'center',padding:'22px 12px',marginBottom:14}}>
            <div style={{fontSize:44,marginBottom:8}}>🎵</div>
            <div style={{fontWeight:700,color:'#6b7280',fontSize:15}}>לחצי התחל לתרגול הקצב</div>
            <div style={{fontSize:12,color:'#9ca3af',marginTop:4}}>{pattern.length} פעימות</div>
          </motion.div>
        )}
      </AnimatePresence>
      <div style={{display:'flex',gap:7,overflowX:'auto',paddingBottom:8,marginBottom:14}}>
        {pattern.map((beat,i) => {
          const bi = BEAT_COLORS[beat]
          const isA = i===cur, isP = i<cur
          return (
            <div key={i} style={{flexShrink:0,textAlign:'center'}}>
              <motion.div animate={isA?{scale:[1,1.18,1]}:{scale:1}} transition={{duration:0.22}}
                style={{width:50,height:50,borderRadius:'50%',
                  background:isA?bi.color:isP?bi.color+'60':bi.color+'28',
                  border:'3px solid '+(isA?bi.color:bi.color+'55'),
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:isA?'0 0 0 7px '+bi.color+'2a':'none',
                  fontWeight:900,fontSize:13,color:isA?'white':bi.color}}>
                {i+1}
              </motion.div>
              <div style={{fontSize:9,color:'#9ca3af',fontWeight:700,marginTop:3,width:50}}>{bi.label}</div>
            </div>
          )
        })}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        {running
          ? <Btn bg="#ef4444" onClick={()=>setRunning(false)} style={{flex:1,padding:'12px',fontSize:16}}>⏸ עצור</Btn>
          : <Btn bg={BRAND.green} onClick={()=>{setCur(0);setRunning(true)}} style={{flex:1,padding:'12px',fontSize:16}}>
              {cur===-1?'▶ התחל תרגול':'▶ המשך'}
            </Btn>
        }
        <Btn bg="#f3f4f6" onClick={()=>{setRunning(false);setCur(-1)}} style={{color:'#6b7280',padding:'12px 16px',fontSize:18}}>↺</Btn>
      </div>
      <Btn full bg={BRAND.cyan} onClick={onContinue} style={{padding:'13px',fontSize:15}}>המשך לבחירת כלים ←</Btn>
    </div>
  )
}
