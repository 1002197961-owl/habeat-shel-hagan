# Offline preparation: pip install faster-whisper==1.2.1 socksio
# Forced alignment of the preserved files; never synthesizes or replaces audio.
from pathlib import Path
import json,hashlib
from faster_whisper import WhisperModel
from faster_whisper.tokenizer import Tokenizer
from faster_whisper.audio import decode_audio,pad_or_trim
repo=Path(__file__).resolve().parents[1]
texts={
'question-1':'על מה יהיה השיר? בחרו נושא: חיות, טבע או חברות?',
'question-2':'מי הגיבור של השיר? ילד קטן, ילדה קטנה או חיה חמודה?',
'question-3':'איך הגיבור מרגיש? שמחה, הפתעה או אהבה?',
'question-4':'איפה מתרחש הסיפור? בגן ילדים, בים או ביער?',
'question-5':'מה הגיבור עושה? שר, רוקד או משחק?',
'question-6':'איזה כלי נגינה מתאים? גיטרה, תופים או פסנתר?',
'question-7':'מה הקצב שמתאים? מהיר, בינוני או איטי?',
'question-8':'מה קורה בסוף השיר? חגיגה, חיבוק או שקיעה?',
'question-9':'מה המסר של השיר? להיות חברים, לאהוב טבע או ליהנות?',
'question-10':'הוסיפו מילה קסומה לשיר. אפשר לבקש עזרה מהגננת.',
'garden-hello-voice':'בוקר של צלילים. בואו נקשיב, נמחא כפיים ונצטרף לקצב!',
'rain-dance-voice':'טיפות רוקדות. איך נשמעות טיפות של גשם? בואו ננסה!',
'color-parade-voice':'מצעד הצבעים. כל צבע מקבל צליל. בחרו צבע והצטרפו!'}
m=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=4,download_root=str(repo/'.cache/whisper-models'))
t=Tokenizer(m.hf_tokenizer,m.model.is_multilingual,task='transcribe',language='he')
result={}
for id,text in texts.items():
 path=repo/'public/audio'/(id+'.mp3');audio=decode_audio(str(path),sampling_rate=16000)
 f=m.feature_extractor(audio)
 frames=min(f.shape[-1]-1, m.feature_extractor.nb_max_frames)
 encoded=m.encode(pad_or_trim(f))
 aligned=m.find_alignment(t,[t.encode(' '+text)],encoded,frames)[0]
 words=[]
 for a in aligned:
  word=a['word'].strip()
  if not word:continue
  if not any(c.isalnum() for c in word):
   if words: words[-1]['word']+=word
   continue
  words.append({'word':word,'start':round(float(a['start']),3),'end':round(float(a['end']),3)})
 data={'id':id,'src':'/audio/'+path.name,'text':text,'duration':len(audio)/16000,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'alignment':{'method':'recording-forced-alignment','model':'faster-whisper 1.2.1 / Systran faster-whisper-small int8','review':'transcript-checked-against-source; physical-device-listening-pending'},'words':words}
 assert ' '.join(w['word'] for w in words)==text, (id,words)
 result[id]=data
 print(id, json.dumps(words,ensure_ascii=False),flush=True)
(repo/'data/narration.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
