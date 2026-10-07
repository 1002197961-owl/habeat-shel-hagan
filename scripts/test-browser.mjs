import {createServer} from 'node:http'
import {readFile,stat} from 'node:fs/promises'
import {resolve,extname,sep} from 'node:path'
import {spawn} from 'node:child_process'
const root=resolve('out')
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.mp3':'audio/mpeg','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'}
const server=createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost'),path=decodeURIComponent(url.pathname)
  let file=resolve(root,'.'+(path==='/'?'/index.html':path))
  if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return}
  try{if((await stat(file)).isDirectory())file+='/index.html'}catch{file+='.html'}
  const data=await readFile(file);res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(data)
 }catch{res.writeHead(404);res.end('Not found')}
})
if(!process.env.PREVIEW_TEST_URL){await new Promise(r=>server.listen(0,'127.0.0.1',r));process.env.PREVIEW_TEST_URL=`http://127.0.0.1:${server.address().port}`}
try {
 for(const script of (process.argv.includes('--characters-only') ? ['tests/browser-characters.mjs'] : process.argv.includes('--capture-only') ? ['scripts/capture-screens.mjs'] : ['tests/browser-regression.mjs','tests/browser-instrument.mjs','tests/browser-instrument-profile.mjs','tests/browser-sequence.mjs','tests/browser-characters.mjs'])) {
  const result=await new Promise(resolve=>{const child=spawn(process.execPath,[script],{stdio:'inherit',env:process.env});child.on('exit',resolve)})
  if(result!==0){process.exitCode=result||1;break}
 }
}finally{server.close()}
