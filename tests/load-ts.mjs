import ts from 'typescript'
import {readFileSync} from 'node:fs'
export async function loadTs(path) {
 const source=readFileSync(new URL(path,import.meta.url),'utf8')
 const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}})
 return import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'))
}
