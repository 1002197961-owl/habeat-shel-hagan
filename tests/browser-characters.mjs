import {chromium} from 'playwright'
import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
const base=process.env.PREVIEW_TEST_URL||'http://127.0.0.1:3010'
const output='test-results/character-screens'
mkdirSync(output,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox']})
const results=[]
try {
 for(const width of [320,390,768,1280]) {
  const context=await browser.newContext({viewport:{width,height:900}})
  // Keep this presentation check entirely local: no catalog, media, or service usage.
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort())
  const page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  async function verify(path,ids,label=path.replaceAll('/','')||'home') {
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-static-character] img')].every(img=>img.complete&&img.naturalWidth>0))
   assert.deepEqual(await page.locator('[data-static-character]').evaluateAll(nodes=>nodes.map(n=>n.dataset.staticCharacter).sort()),ids.slice().sort())
   assert.equal(await page.locator('html').getAttribute('dir'),'rtl')
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${path}: overflow at ${width}`)
   assert.ok(await page.locator('[data-character-companions]').evaluateAll(nodes=>nodes.every(n=>n.getAttribute('aria-hidden')==='true'&&getComputedStyle(n).pointerEvents==='none')))
   assert.ok(await page.locator('[data-static-character]').evaluateAll(nodes=>nodes.every(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=0&&r.right<=innerWidth+1})))
   await page.screenshot({path:`${output}/${width}-${label}.png`,fullPage:true})
   results.push({width,route:path,state:label,characters:ids,status:'PASS'})
  }
  for(const [path,ids] of [['/',['G','R','M']],['/library',['G']],['/magic-song',['M']],['/guide',['G','R','M']],['/recording',['M']]]) {
   await page.goto(base+path);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(650)
   await verify(path,ids)
  }
  // Merely select the recording view; do not request microphone/camera permission.
  await page.getByRole('button',{name:'🎬 וידאו',exact:true}).click()
  await verify('/recording',['M'],'recording-video')
  await page.goto(base+'/magic-song')
  for(let q=1;q<10;q++) {await page.locator(`[data-narration="question-${q}"]`).waitFor();await page.locator('[role="button"]').first().click()}
  await page.getByPlaceholder('לדוגמה: שמיים, ניצוץ, ריחוף...').fill('ניצוץ')
  await page.getByRole('button',{name:'צרו מילים לשיר!',exact:true}).click()
  await page.getByText('מרכיב מילים מהבחירות שלכם...',{exact:true}).waitFor()
  await verify('/magic-song',['M'],'magic-generating')
  await page.getByText('המילים לשיר שלכם 🎵',{exact:true}).waitFor()
  await page.waitForTimeout(600)
  await verify('/magic-song',['G','R','M'],'magic-result')
  await page.getByRole('button',{name:'צרו מילים לשיר חדש',exact:true}).click()
  await page.locator('[data-narration="question-1"]').waitFor()
  await verify('/magic-song',['M'],'magic-reset')
  for(const path of ['/teacher','/stations','/beat-manager','/dashboard','/behind-scenes']) {
   await page.goto(base+path)
   assert.equal(await page.locator('[data-static-character]').count(),0)
  }
  assert.deepEqual(errors,[])
  await context.close()
 }
 writeFileSync(`${output}/report.json`,JSON.stringify(results,null,2)+'\n')
 console.log(`PASS: ${results.length} character screen checks at four widths; admin routes unchanged`)
} finally {await browser.close()}
