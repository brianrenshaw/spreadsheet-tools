import { build } from 'rolldown'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
const dir = await mkdtemp(join(tmpdir(), 'spreadsheet-smoke-'))
const entry = `
import assert from 'node:assert/strict';
import * as ops from ${JSON.stringify(resolve('src/lib/operations.js'))};
import * as XLSX from 'xlsx';
async function run() {
const csv = (name, text) => new File([text], name, {type:'text/csv'});
const a=csv('a.csv','id,name,empty\\n1,Alice,\\n2,Bob,\\n2,Bob,');
const b=csv('b.csv','id,name,empty\\n2,Bobby,\\n3,Carol,');
assert.equal((await ops.merge([a,b],'csv')).rows,5);
assert.equal((await ops.deduplicate([a],null,'csv')).results[0].duplicates_removed,1);
assert.deepEqual((await ops.filterColumns(a,['name'],'csv')).columns_kept,['name']);
await assert.rejects(()=>ops.filterColumns(a,['missing'],'csv'));
assert.equal((await ops.convert([a])).results[0].converted_to,'xlsx');
const converted=globalThis.saved.at(-1).blob;
const wb=XLSX.read(await converted.arrayBuffer(),{type:'array'});
assert.equal(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).length,3);
const diff=await ops.compare([csv('old.csv','id,name\\n1,Alice\\n2,Bob'),b],'id');
assert.ok(diff);
assert.equal((await ops.trimClean([csv('dirty.csv','name,value\\n Alice ,NA')],'csv')).results[0].cells_trimmed,1);
assert.equal((await ops.removeEmpty([a],'csv')).results[0].cols_removed,1);
assert.equal(globalThis.saved.length,7);
console.log('PASS: all seven operations; CSV input and generated XLSX read-back; invalid column handling.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
`
try {
 await build({input:'smoke-entry',platform:'node',plugins:[{
  name:'smoke',resolveId(id){if(id==='smoke-entry'||id==='file-saver')return '\0'+id},
  load(id){if(id==='\0smoke-entry')return entry;if(id==='\0file-saver')return 'export function saveAs(blob,filename){(globalThis.saved ||= []).push({blob,filename})}'}
 }],output:{file:join(dir,'test.cjs'),format:'cjs'}})
 const result=spawnSync(process.execPath,[join(dir,'test.cjs')],{stdio:'inherit'})
 process.exitCode=result.status ?? 1
} finally {await rm(dir,{recursive:true,force:true})}
