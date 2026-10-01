import {chromium,webkit} from 'playwright'
import assert from 'node:assert/strict'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
const base=process.env.PREVIEW_TEST_URL||'http://127.0.0.1:3010'
const assets=JSON.parse(readFileSync(new URL('../data/narration.json',import.meta.url)))
mkdirSync('test-results',{recursive:true})
const results=[]
for(const [engine,type,viewport] of [ ['chromium',chromium,{width:1280,height:900}], ['chromium-mobile',chromium,{width:390,height:844}], ['webkit-mobile',webkit,{width:390,height:844}] ]) {
 if(process.env.TEST_ENGINES && !process.env.TEST_ENGINES.split(',').includes(engine)) continue
 const executablePath=type===chromium?process.env.CHROMIUM_EXECUTABLE:process.env.WEBKIT_EXECUTABLE
 const browser=await type.launch({headless:true,...(executablePath?{executablePath}:{}),...(type===chromium?{args:['--no-sandbox']}: {})})
 const ctx=await browser.newContext({viewport, ...(engine.includes('mobile')?{isMobile:true,hasTouch:true}: {})})
 const page=await ctx.newPage(), errors=[]
 page.on('pageerror',error=>errors.push(error.message))
 await page.addInitScript(() => {
   window.__audio=[];window.__osc=[]
   const NativeAudio=window.Audio
   window.Audio=function(...args){const a=new NativeAudio(...args);window.__audio.push(a);return a}
   const NativeContext=window.AudioContext
   window.AudioContext=class extends NativeContext {
     createOscillator(){const n=super.createOscillator();window.__osc.push(n);return n}
   }
 })
 // Offline catalog still preserves the existing three playable instruments.
 await page.route('**/rest/v1/song_catalog?**',route=>route.fulfill({status:503,body:'unavailable'}))
 await page.goto(base);await page.getByRole('link',{name:/ספריית שירים/}).click()
 await page.waitForURL('**/library')
 await page.getByText('אין כרגע חיבור לקטלוג.',{exact:false}).waitFor()
 for(const [id,title] of [['garden-hello','בוקר של צלילים'],['rain-dance','טיפות רוקדות'],['color-parade','מצעד הצבעים']]) {
   await page.getByRole('button',{name:`נגן ${title}`,exact:true}).click()
   await page.waitForFunction(()=>window.__osc.length>0)
   await page.getByRole('button',{name:`עצור ${title}`,exact:true}).click()
   const reader=page.locator(`[data-narration="${id}-voice"]`)
   await reader.getByRole('button',{name:`הקרא שוב: ההסבר על ${title}`,exact:true}).click()
   await page.waitForFunction(()=>window.__audio.some(a=>!a.paused&&a.currentTime>.15))
   await reader.getByRole('button',{name:'עצירה',exact:true}).click()
   assert.ok(await page.evaluate(()=>window.__audio.every(a=>a.paused)))
 }
 await page.getByRole('link',{name:'חזרה',exact:true}).click()
 await page.getByRole('link',{name:/שיר הקסם/}).click()
 for(let q=1;q<=10;q++) {
   const reader=page.locator(`[data-narration="question-${q}"]`)
   await reader.waitFor()
   assert.equal(await reader.locator('[data-transcript]').textContent(),assets[`question-${q}`].text)
   await reader.getByRole('button',{name:`הקרא שוב: שאלה ${q}`,exact:true}).click()
   await page.waitForFunction(()=>window.__audio.some(a=>!a.paused&&a.currentTime>.1))
   await page.waitForFunction(()=>document.querySelector('[data-active-word="true"]'))
   const cue=assets[`question-${q}`].words[2]
   await page.evaluate(t=>{const a=window.__audio.at(-1);a.currentTime=t},(cue.start+cue.end)/2)
   await page.waitForFunction(()=>document.querySelector('[data-word-index="2"][data-active-word="true"]'))
   if(q===1){
     await page.screenshot({path:`test-results/${engine}-highlight.png`,fullPage:true})
     await reader.getByRole('button',{name:'עצירה',exact:true}).click()
     assert.ok(await page.evaluate(()=>window.__audio.every(a=>a.paused)))
     await reader.getByRole('button',{name:'המשך הקראה',exact:true}).click()
     await page.waitForFunction(()=>window.__audio.some(a=>!a.paused))
     await reader.getByRole('button',{name:'חזרה להתחלה',exact:true}).click()
     assert.equal(await page.locator('[data-active-word="true"]').count(),0)
     await reader.getByRole('button',{name:`הקרא שוב: שאלה ${q}`,exact:true}).click()
     await reader.getByRole('button',{name:`הקרא שוב: שאלה ${q}`,exact:true}).click()
     await page.waitForFunction(()=>window.__audio.filter(a=>!a.paused).length===1)
   }
   if(q<10){
     const option=page.locator('[role="button"]').first()
     // Duplicate clicks within one transition must advance only one question.
     await option.evaluate(el=>{el.click();el.click();el.click()})
     await page.locator(`[data-narration="question-${q+1}"]`).waitFor()
     assert.ok(await page.evaluate(()=>window.__audio.every(a=>a.paused)))
   }
 }
 await page.getByPlaceholder('לדוגמה: שמיים, ניצוץ, ריחוף...').fill('ניצוץ')
 await page.getByRole('button',{name:'✨ צרו מילים לשיר!',exact:true}).click()
 await page.getByText('המילים לשיר שלכם 🎵',{exact:true}).waitFor()
 await page.getByText('עדיין אין לתוצר לחן או הקלטת שירה.',{exact:false}).waitFor()
 assert.ok(await page.evaluate(()=>window.__audio.every(a=>a.paused)))
 await page.getByRole('button',{name:'🔄 צרו מילים לשיר חדש',exact:true}).click()
 await page.getByRole('button',{name:'הקרא שוב: שאלה 1',exact:true}).click()
 await page.getByRole('link',{name:'חזרה',exact:true}).click()
 assert.ok(await page.evaluate(()=>window.__audio.every(a=>a.paused)))
 // Route exits preserve navigation and expose no runtime exceptions.
 for(const path of ['/guide','/recording','/beat-manager','/teacher','/stations','/dashboard','/behind-scenes']){
   await page.goto(base+path);await page.waitForFunction(()=>document.body.innerText.trim().length>30)
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path+' horizontal overflow')
   assert.equal(await page.locator('html').getAttribute('dir'),'rtl')
 }
 assert.deepEqual(errors,[])
 results.push({engine,viewport,status:'PASS',checks:['3 original score playback flows','13 narration loads','full Hebrew transcripts','media-clock highlight','seek','pause/resume','reset','repeat','rapid multiple clicks','navigation cleanup','lyrics-only output','RTL/no horizontal overflow','no page errors']})
 await browser.close();console.log(engine,'PASS')
 writeFileSync('test-results/browser-regression.json',JSON.stringify(results,null,2))
}
writeFileSync('test-results/browser-regression.json',JSON.stringify(results,null,2))
