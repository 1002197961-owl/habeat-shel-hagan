import test from 'node:test'
import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {once} from 'node:events'
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'

// A tiny local fixture makes these checks independent of a prior Next build.
// No browser, package download, live catalog, or external service is used.
test('local QA serves exported routes and RSC text safely without external services',async t=>{
 const cwd=await mkdtemp(join(tmpdir(),'habeat-local-qa-'))
 await mkdir(join(cwd,'out','nested'),{recursive:true})
 for(const [name,body] of Object.entries({
  'index.html':'<!doctype html><html dir="rtl"><body>home</body></html>',
  'guide.html':'<html><body>guide</body></html>',
  'guide.txt':'0:{"route":"guide"}',
  'nested/index.html':'nested route',
  'style.css':'body{color:navy}',
  'build-info.json':'{"version":"local-fixture"}',
  'tone.mp3':Buffer.from([0x49,0x44,0x33,0,1]),
 })) await writeFile(join(cwd,'out',name),body)
 await writeFile(join(cwd,'outside.txt'),'must not be served')
 const env={...process.env};delete env.PREVIEW_TEST_URL
 const child=spawn(process.execPath,[fileURLToPath(new URL('../scripts/test-browser.mjs',import.meta.url)),'--serve-only'],{cwd,env,stdio:['ignore','pipe','pipe']})
 const closed=once(child,'exit')
 t.after(async()=>{if(child.exitCode===null)child.kill('SIGTERM');await closed})
 const base=await new Promise((resolve,reject)=>{
  let output='',errors=''
  const timeout=setTimeout(()=>reject(Error(`Local server startup timed out: ${errors}`)),5000)
  child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/LOCAL_QA_URL=(http:\/\/127\.0\.0\.1:\d+)/);if(match){clearTimeout(timeout);resolve(match[1])}})
  child.stderr.on('data',chunk=>{errors+=chunk})
  child.once('error',error=>{clearTimeout(timeout);reject(error)})
  child.once('exit',code=>{clearTimeout(timeout);reject(Error(`Local server exited ${code}: ${errors}`))})
 })
 await t.test('HTML routes and nested indexes resolve',async()=>{
  for(const [path,expected] of [['/','home'],['/guide','guide'],['/nested','nested route']]){
   const response=await fetch(base+path)
   assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^text\/html/)
   assert.ok((await response.text()).includes(expected))
  }
 })
 await t.test('Next RSC .txt requests are text rather than downloads, including query strings',async()=>{
  const response=await fetch(base+'/guide.txt?_rsc=regression')
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'text/plain; charset=utf-8')
  assert.equal(await response.text(),'0:{"route":"guide"}')
 })
 await t.test('local responses prohibit live service connections',async()=>{
  const response=await fetch(base+'/')
  assert.equal(response.headers.get('content-security-policy'),"connect-src 'self'; form-action 'none'")
 })
 await t.test('CSS, JSON and audio retain their MIME type and bytes',async()=>{
  for(const [path,type] of [['/style.css','text/css'],['/build-info.json','application/json'],['/tone.mp3','audio/mpeg']]){
   const response=await fetch(base+path);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),type)
  }
  assert.deepEqual(Buffer.from(await (await fetch(base+'/tone.mp3')).arrayBuffer()),Buffer.from([0x49,0x44,0x33,0,1]))
 })
 await t.test('unknown and malformed routes fail without exposing neighboring files',async()=>{
  assert.equal((await fetch(base+'/missing')).status,404)
  assert.equal((await fetch(base+'/%E0%A4%A')).status,404)
  assert.equal((await fetch(base+'/%2e%2e%2foutside.txt')).status,403)
 })
})
