// Software fixture only. No physical instrument, child or headphone verification.
import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const base=process.env.PREVIEW_TEST_URL||'http://127.0.0.1:3010'
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox']})
try {
 for(const viewport of [{width:390,height:844},{width:768,height:1024}]) {
  const context=await browser.newContext({viewport,acceptDownloads:true})
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort())
  const page=await context.newPage(),errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await page.addInitScript(()=>{
   class Port extends EventTarget {
    id='SEQUENCE-SOFTWARE-FIXTURE';name='SEQUENCE SOFTWARE FIXTURE';manufacturer='TEST';state='connected'
    open(){return Promise.resolve(this)}close(){return Promise.resolve(this)}
    send(note,stamp=performance.now(),velocity=90){const e=new Event('midimessage');Object.defineProperties(e,{data:{value:new Uint8Array([153,note,velocity])},timeStamp:{value:stamp}});this.dispatchEvent(e)}
   }
   const port=new Port(),access=new EventTarget();access.inputs=new Map([[port.id,port]])
   window.__sequenceFixture={port,access,disconnect(){port.state='disconnected';access.dispatchEvent(new Event('statechange'))},reconnect(){port.state='connected';access.dispatchEvent(new Event('statechange'))}}
   Object.defineProperty(navigator,'requestMIDIAccess',{value:async()=>access})
   localStorage.setItem('habeat.instrument-profile.v1',JSON.stringify({version:1,port:{id:port.id,name:port.name,manufacturer:port.manufacturer},pads:[{id:'green',channel:10,note:38},{id:'orange',channel:10,note:43},{id:'yellow',channel:10,note:46}]}))
  })
  await page.goto(base+'/turn-taking')
  await page.getByRole('button',{name:'הגדרות כלי למבוגר',exact:true}).click()
  assert.equal(await page.getByLabel('אופן המשחק').inputValue(),'sequence')
  await page.getByRole('button',{name:'בדקו כניסות קלט',exact:true}).click()
  await page.getByText(/הכלי המוכר זוהה/).waitFor()
  await page.getByLabel('מהירות ההדגמה').selectOption('650')
  await page.getByRole('button',{name:'סיימנו לכוון, חוזרים למשחק',exact:true}).click()
  for(let level=1;level<=3;level++) {
   await page.getByRole('button',{name:level===1?'התחילו':'לשלב הבא',exact:true}).click()
   await page.locator('[data-turn="demonstrating"]').waitFor()
   // Early input cannot consume a step of the later response.
   await page.evaluate(()=>window.__sequenceFixture.port.send(38))
   await page.locator('[data-turn="waiting"]').waitFor()
   assert.equal(await page.locator('[data-action-progress]').innerText(),`0 מתוך ${level} פעולות בסבב`)
   assert.deepEqual(await page.locator('[data-sequence-step]').evaluateAll(nodes=>nodes.map(n=>n.dataset.sequencePad)),['green','orange','yellow'].slice(0,level))
   await page.evaluate(()=>window.__sequenceFixture.port.send(46))
   assert.equal(await page.locator('[data-action-progress]').innerText(),`0 מתוך ${level} פעולות בסבב`)
   await page.getByText('ננסה שוב בנחת — עכשיו הפד המסומן',{exact:true}).waitFor()
   for(let step=0;step<level;step++) {
    const pad=['green','orange','yellow'][step],note=[38,43,46][step]
    assert.equal(await page.locator('[data-step-active="true"]').getAttribute('data-sequence-pad'),pad)
    await page.evaluate(note=>{const p=window.__sequenceFixture.port,t=performance.now();p.send(note,t);p.send(note,t);p.send(note,t+0.1,0)},note)
    await page.waitForFunction(expected=>document.querySelector('[data-action-progress]').textContent===expected,`${step+1} מתוך ${level} פעולות בסבב`)
   }
   await page.locator('[data-turn="responded"]').waitFor()
   await page.locator('[data-beat-core][data-core-state="idle"]').waitFor()
   assert.equal(await page.locator('[data-step-complete="true"]').count(),level)
  }
  assert.equal(await page.getByRole('button',{name:'לשלב הבא',exact:true}).count(),0)
  await page.getByRole('button',{name:'הגדרות כלי למבוגר',exact:true}).click()
  await page.getByText('אבחון ושמירת דוח למבוגר',{exact:true}).click()
  const downloadPromise=page.waitForEvent('download')
  await page.getByRole('button',{name:'הורידו דוח JSON',exact:true}).click()
  const download=await downloadPromise,report=JSON.parse(readFileSync(await download.path(),'utf8'))
  assert.equal(report.gameMode,'sequence');assert.equal(report.timingScore,'NOT_IMPLEMENTED')
  assert.equal(report.physicalProof,'NOT_AUTOMATICALLY_VERIFIED')
  assert.equal(report.totals.gameResponses,6);assert.equal(report.demoEvents.length,6)
  assert.ok(report.events.filter(e=>e.accepted).every(e=>e.padId===e.expectedPad&&e.sequenceRoundId&&e.sequenceStep))
  assert.equal(report.events.filter(e=>e.accepted).at(-1).id,Number(await page.locator('[data-action-progress]').getAttribute('data-game-response-id')))
  await page.getByRole('button',{name:'סגירת הגדרות הכלי',exact:true}).click()
  await page.getByRole('button',{name:'הרצף שוב',exact:true}).click()
  await page.getByRole('button',{name:'עצירה',exact:true}).click()
  await page.waitForTimeout(2200)
  assert.equal(await page.locator('[data-turn="paused"]').count(),1)
  assert.equal(await page.locator('[data-beat-core][data-core-state="playing"]').count(),0)
  await page.getByRole('button',{name:'הרצף שוב',exact:true}).click()
  await page.locator('[data-turn="waiting"]').waitFor()
  await page.evaluate(()=>window.__sequenceFixture.disconnect())
  await page.locator('[data-turn="paused"]').waitFor()
  await page.evaluate(()=>window.__sequenceFixture.reconnect())
  assert.equal(await page.locator('[data-turn="paused"]').count(),1)
  assert.equal(await page.locator('[data-action-progress]').innerText(),'0 מתוך 3 פעולות בסבב')
  // A completed non-green simulated target must not leak into simple-turn cues.
  await page.getByRole('button',{name:'הגדרות כלי למבוגר',exact:true}).click()
  await page.getByLabel('מקור קלט').selectOption('simulation')
  await page.getByLabel('רמת פתיחה').selectOption('2')
  await page.getByRole('button',{name:'התחילו',exact:true}).click()
  await page.locator('[data-turn="waiting"]').waitFor()
  await page.getByRole('button',{name:'הדמיית ירוק — אמצע שמאל',exact:true}).click()
  await page.getByRole('button',{name:'הדמיית כתום — אמצע ימין',exact:true}).click()
  await page.locator('[data-turn="responded"]').waitFor()
  assert.equal(await page.locator('[data-target-pad]').getAttribute('data-target-pad'),'orange')
  await page.getByRole('button',{name:'הגדרות כלי למבוגר',exact:true}).click()
  await page.getByLabel('אופן המשחק').selectOption('turns')
  assert.equal(await page.locator('[data-target-pad]').getAttribute('data-target-pad'),'green')
  await page.getByRole('button',{name:'סיימנו לכוון, חוזרים למשחק',exact:true}).click()
  await page.getByRole('button',{name:'התחילו',exact:true}).click()
  await page.locator('[data-turn="waiting"]').waitFor()
  await page.getByRole('button',{name:'פעולת הדמיה',exact:true}).click()
  await page.locator('[data-turn="responded"]').waitFor()
  // Return from an orange simulation target to a real-source profile containing only blue.
  await page.getByRole('button',{name:'הגדרות כלי למבוגר',exact:true}).click()
  await page.getByLabel('מקור קלט').selectOption('web-midi')
  await page.getByLabel('ייבוא כיוון מגן אחר').setInputFiles({name:'single-pad-software-fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,port:{id:'SEQUENCE-SOFTWARE-FIXTURE',name:'SEQUENCE SOFTWARE FIXTURE',manufacturer:'TEST'},pads:[{id:'blue',channel:10,note:50}]}))})
  await page.getByText(/הפרופיל יובא/).waitFor()
  await page.getByLabel('מקור קלט').selectOption('simulation')
  await page.getByLabel('אופן המשחק').selectOption('sequence')
  await page.getByLabel('רמת פתיחה').selectOption('2')
  await page.getByRole('button',{name:'התחילו',exact:true}).click()
  await page.locator('[data-turn="waiting"]').waitFor()
  await page.getByRole('button',{name:'הדמיית ירוק — אמצע שמאל',exact:true}).click()
  await page.getByRole('button',{name:'הדמיית כתום — אמצע ימין',exact:true}).click()
  await page.locator('[data-turn="responded"]').waitFor()
  await page.getByRole('button',{name:'הגדרות כלי למבוגר',exact:true}).click()
  await page.getByLabel('מקור קלט').selectOption('web-midi')
  assert.equal(await page.locator('[data-target-pad]').getAttribute('data-target-pad'),'blue')
  await page.getByRole('button',{name:'בדקו כניסות קלט',exact:true}).click()
  await page.getByText(/הכלי המוכר זוהה/).waitFor()
  assert.equal(await page.getByRole('button',{name:'התחילו',exact:true}).isEnabled(),true)
  await page.getByRole('button',{name:'התחילו',exact:true}).click()
  await page.locator('[data-turn="waiting"]').waitFor()
  await page.evaluate(()=>window.__sequenceFixture.port.send(50))
  await page.locator('[data-turn="responded"]').waitFor()
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
  assert.deepEqual(errors,[])
  await context.close()
 }
 console.log('PASS sequence SOFTWARE FIXTURE: 1–3 steps, ordered pad cues, wrong-pad retry, duplicate/note-off filtering, progression, stop/disconnect, coherent input/demo logs; NOT hardware evidence')
} finally {await browser.close()}
