import {createHash} from 'node:crypto'
import {readFileSync,readdirSync,writeFileSync} from 'node:fs'
import {execFileSync,spawnSync} from 'node:child_process'
const files=[]
function collect(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=`${dir}/${entry.name}`;if(entry.isDirectory())collect(path);else if(path!=='public/build-info.json')files.push(path)}}
for(const dir of ['app','components','hooks','lib','store','data','public'])collect(dir)
for(const file of ['package.json','package-lock.json','next.config.ts','tailwind.config.ts','tsconfig.json','scripts/build.mjs']){try{readFileSync(file);files.push(file)}catch{}}
const hash=createHash('sha256');for(const file of files.sort()){hash.update(file+'\0');hash.update(readFileSync(file));hash.update('\0')}
const fingerprint=hash.digest('hex'),version=`hb-${fingerprint.slice(0,12)}`
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
const dirty=!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()
const result=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build'],{stdio:'inherit',env:{...process.env,NEXT_PUBLIC_BUILD_SHA:version}})
if(result.status!==0)process.exit(result.status||1)
writeFileSync('out/build-info.json',JSON.stringify({version,sourceFingerprint:fingerprint,sourceCommitAtBuild:commit,workingTreeDirtyAtBuild:dirty,builtAt:new Date().toISOString(),repository:'1002197961-owl/habeat-shel-hagan',branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim()},null,2)+'\n')
console.log(`Built ${version} (${commit}${dirty?' + working changes':''})`)
