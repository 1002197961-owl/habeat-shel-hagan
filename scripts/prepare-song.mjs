// Local intake only. Does not upload, approve, or publish anything.
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {resolve,extname} from 'node:path'
const [recordPath,audioPath,outputPath]=process.argv.slice(2)
if(!recordPath||!audioPath||!outputPath)throw Error('Usage: node scripts/prepare-song.mjs record.json audio.mp3 output.json')
if(existsSync(outputPath))throw Error('Output exists; choose a new output file')
const row=JSON.parse(readFileSync(recordPath,'utf8')),audio=readFileSync(audioPath)
if(!/^[a-z0-9-]{1,80}$/.test(row.id)||!row.title?.trim())throw Error('Valid id and title required')
if(audio.byteLength>26214400||audio.byteLength<128)throw Error('Invalid audio size')
const ext=extname(audioPath).toLowerCase()
if(!['.mp3','.wav','.m4a','.ogg'].includes(ext))throw Error('Unsupported audio extension')
const sha=createHash('sha256').update(audio).digest('hex')
const draft={...row,builtin_audio_id:null,audio_object_path:`drafts/${row.id}-${sha.slice(0,12)}${ext}`,
 recording_sha256:sha,recording_status:'pending',recording_review_note:null,rights_status:'pending',rights_note:null,published:false}
writeFileSync(resolve(outputPath),JSON.stringify(draft,null,2)+'\n',{flag:'wx'})
console.log('Prepared a private, unapproved draft:',outputPath)
