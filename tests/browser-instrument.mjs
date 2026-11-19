import assert from 'node:assert/strict'
import {launch,fixture,button,connect,send,close,options,noScroll,base} from './turn-browser-fixture.mjs'
const browser=await launch()
try {
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message))
 await fixture(page,[{id:'green',channel:10,note:38},{id:'blue',channel:10,note:43}]);await connect(page)
 await button(page,'הכיוון נשמר — ממשיכים').click();await page.getByLabel('אופן המשחק').selectOption('turns')
 await button(page,'פדים למשחק').click();await page.getByLabel('הפד למשחק').selectOption('blue');await button(page,'חזרה להגדרות המשחק').click();await close(page)
 await button(page,'התחילו').click();await page.locator('[data-turn="waiting"]').waitFor()
 await send(page,38);await page.locator('[data-character-response="playing"]').waitFor();assert.equal(await page.locator('[data-turn="waiting"]').count(),1)
 await page.evaluate(()=>{const p=window.__fixture.port,t=performance.now();p.send(43,t,0);p.send(43,t+1);p.send(43,t+1)})
 await page.locator('[data-turn="responded"]').waitFor();assert.equal(await page.locator('[data-action-progress]').innerText(),'1 מתוך 1 פעולות בסבב')
 await page.locator('[data-beat-core][data-core-state="idle"]').waitFor()
 await options(page);await button(page,'כלי וגיבוי').click();await page.getByLabel('מקור קלט').selectOption('simulation');await button(page,'ממשיכים בהדמיה').click()
 await page.getByLabel('רמת הסבב').selectOption('2');await close(page);await noScroll(page)
 await button(page,'התחילו').click();await page.locator('[data-turn="waiting"]').waitFor()
 await send(page,43);assert.equal(await page.locator('[data-action-progress]').innerText(),'0 מתוך 2 פעולות בסבב')
 await button(page,'פעולת הדמיה').click();assert.equal(await page.locator('[data-action-progress]').innerText(),'1 מתוך 2 פעולות בסבב')
 await button(page,'פעולת הדמיה').click();await page.locator('[data-turn="responded"]').waitFor()
 await button(page,'שמעו שוב והתחילו').click();await button(page,'עצירה').click();await page.waitForTimeout(1400)
 assert.equal(await page.locator('[data-turn="paused"]').count(),1);assert.equal(await page.evaluate(()=>window.__activeTones.size),0)
 assert.deepEqual(errors,[]);await page.close()
 for(const scenario of ['unsupported','denied']) {
  const page=await browser.newPage()
  await page.addInitScript(s=>Object.defineProperty(navigator,'requestMIDIAccess',{value:s==='unsupported'?undefined:async()=>{throw Error('denied')},configurable:true}),scenario)
  await page.goto(base+'/turn-taking');await button(page,'התחילו').click();await button(page,'חיבור התופים').click()
  await page.getByRole('alert').waitFor();await button(page,'ייבוא כיוון או הדמיית פיתוח').click()
  assert.equal(await page.getByLabel('מקור קלט').inputValue(),'web-midi');await page.close()
 }
 console.log('PASS simple turns, wrong-pad feedback, release/duplicate guards, explicit simulation, two actions, stop cancels sound, denied/unsupported MIDI; software only.')
} finally {await browser.close()}
