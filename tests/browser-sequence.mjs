import assert from 'node:assert/strict'
import {mkdirSync,readFileSync} from 'node:fs'
import {launch,fixture,button,connect,noScroll,close,send,options} from './turn-browser-fixture.mjs'
const browser=await launch();mkdirSync('test-results',{recursive:true})
const pads=[{id:'blue',channel:10,note:38},{id:'purple',channel:10,note:43},{id:'green',channel:10,note:46}]
try {
 for(const viewport of [{width:390,height:844},{width:360,height:640},{width:768,height:1024},{width:1024,height:768}]) {
  const page=await browser.newPage({viewport,acceptDownloads:true}),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  await fixture(page,pads);await noScroll(page)
  const primary=button(page,'התחילו');assert.ok(await primary.isEnabled())
  assert.deepEqual(await primary.evaluate(el=>({bg:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color})),{bg:'rgb(30, 27, 75)',color:'rgb(255, 255, 255)'})
  await connect(page);await noScroll(page)
  await button(page,'הכיוון נשמר — ממשיכים').click();await noScroll(page)
  await page.getByLabel('מהירות ההדגמה').selectOption('650');await close(page)
  for(let level=1;level<=3;level++) {
   await button(page,level===1?'התחילו':'לשלב הבא').click()
   await page.locator('[data-turn="demonstrating"]').waitFor()
   await send(page,38) // early input cannot consume the later response
   const sequence=await page.locator('[data-sequence-step]').evaluateAll(nodes=>nodes.map(n=>n.dataset.sequencePad))
   assert.equal(new Set(sequence).size,level)
   await page.locator('[data-turn="waiting"]').waitFor()
   assert.equal(await page.locator('[data-action-progress]').innerText(),`0 מתוך ${level} פעולות בסבב`)
   const wrong=pads.find(p=>p.id!==sequence[0]);await send(page,wrong.note)
   await page.getByText('ננסה שוב בנחת — עכשיו הפד המסומן',{exact:true}).waitFor()
   for(let i=0;i<sequence.length;i++) {
    assert.equal(await page.locator('[data-step-active="true"]').getAttribute('data-sequence-pad'),sequence[i])
    await page.evaluate(note=>{const p=window.__fixture.port,t=performance.now();p.send(note,t);p.send(note,t);p.send(note,t+.1,0)},pads.find(p=>p.id===sequence[i]).note)
    await page.waitForFunction(expected=>document.querySelector('[data-action-progress]').textContent===expected,`${i+1} מתוך ${level} פעולות בסבב`)
   }
   await page.locator('[data-turn="responded"]').waitFor();await noScroll(page)
  }
  const original=await page.locator('[data-sequence-step]').evaluateAll(nodes=>nodes.map(n=>n.dataset.sequencePad))
  await button(page,'הרצף שוב').click()
  assert.deepEqual(await page.locator('[data-sequence-step]').evaluateAll(nodes=>nodes.map(n=>n.dataset.sequencePad)),original,'replay preserves the learned pattern')
  const scheduled=await page.evaluate(()=>window.__scheduled.slice(-3))
  assert.ok(Math.abs(scheduled[1]-scheduled[0]-.65)<.001)
  assert.ok(Math.abs(scheduled[2]-scheduled[1]-.325)<.001)
  await button(page,'עצירה').click();await page.waitForTimeout(2800)
  assert.equal(await page.locator('[data-turn="paused"]').count(),1)
  assert.equal(await page.evaluate(()=>window.__activeTones.size),0)
  await button(page,'הרצף שוב').click();await page.locator('[data-turn="waiting"]').waitFor()
  await page.evaluate(()=>window.__fixture.change(false));await page.locator('[data-turn="paused"]').waitFor()
  await page.evaluate(()=>window.__fixture.change(true));assert.equal(await page.locator('[data-turn="paused"]').count(),1)
  await options(page);await button(page,'אבחון ושמירת דוח למבוגר').click();await noScroll(page)
  const pending=page.waitForEvent('download');await button(page,'הורידו דוח JSON').click()
  const report=JSON.parse(readFileSync(await(await pending).path(),'utf8'))
  assert.equal(report.physicalProof,'NOT_AUTOMATICALLY_VERIFIED');assert.equal(report.totals.gameResponses,6)
  assert.ok(report.events.filter(e=>e.accepted).every(e=>e.padId===e.expectedPad&&e.sequenceRoundId&&e.uiCommitMs>=0))
  await button(page,'יומן קלט').click();await noScroll(page);assert.equal(await page.locator('.turn-log li').count(),4)
  await button(page,'הבא').click();await noScroll(page)
  await button(page,'סגירת הגדרות הכלי').click()
  await page.screenshot({path:`test-results/turn-taking-${viewport.width}.png`})
  assert.deepEqual(errors,[]);await page.close()
 }
 console.log('PASS rhythmic sequence software fixtures: four viewports without scroll, distinct pads, replay, clock timing, stop/disconnect, JSON. No physical hardware tested.')
} finally {await browser.close()}
