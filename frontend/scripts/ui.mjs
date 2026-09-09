import { build } from 'rolldown'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

// Exercise the real React workflow in a DOM, without opening or controlling a browser.
// File reading and downloads are stubbed here; smoke.mjs tests the actual operations.
const dir = await mkdtemp(join(tmpdir(), 'spreadsheet-ui-'))
const entry = `
import assert from 'node:assert/strict';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from ${JSON.stringify(resolve('src/App.jsx'))};
import { TOOLS } from ${JSON.stringify(resolve('src/lib/tools.js'))};
const root = createRoot(document.getElementById('root'));
const buttons = () => [...document.querySelectorAll('button')];
const named = (name) => buttons().find(b => b.textContent.trim() === name || b.getAttribute('aria-label') === name);
const toolButton = (id) => document.querySelectorAll('.tool-choice')[TOOLS.findIndex(t=>t.id===id)];
async function click(button) { assert.ok(button); assert.equal(button.disabled,false); await act(async()=>button.click()); }
async function choose(id) { await click(toolButton(id)); }
async function files(list) {
 const input=document.querySelector('#file-input');
 Object.defineProperty(input,'files',{value:list,configurable:true});
 await act(async()=>input.dispatchEvent(new window.Event('change',{bubbles:true})));
}
const file=(name,columns=['id','name'])=>({name,columns});
await act(async()=>root.render(<App />));
assert.equal(document.querySelectorAll('.tool-choice').length,7);
assert.ok([...document.querySelectorAll('.tool-choice')].every(b=>!b.disabled));
assert.equal(document.querySelector('#file-input'),null);
assert.ok(document.body.textContent.includes('Make everyday spreadsheet tasks easier.'));

await choose('merge');
assert.equal(document.activeElement.id,'workspace-title');
assert.ok(document.body.textContent.includes('Add 2 files to continue.'));
await files([file('first.csv')]);
assert.equal(toolButton('merge').getAttribute('aria-pressed'),'true');
assert.ok(document.body.textContent.includes('Add 1 more file to continue.'));
assert.equal(named('Combine and download'),undefined);
await files([file('second.csv')]);
await click(named('Combine and download'));
assert.equal(globalThis.runs.at(-1).operation,'merge');
assert.deepEqual(globalThis.runs.at(-1).names,['first.csv','second.csv']);
assert.ok(document.body.textContent.includes('Your result is ready.'));
await click(named('Remove second.csv'));
assert.equal(toolButton('merge').getAttribute('aria-pressed'),'true');
assert.ok(!document.body.textContent.includes('Your result is ready.'));
assert.equal(named('Combine and download'),undefined);

await choose('filter');
assert.equal(document.querySelectorAll('.file-list li').length,1);
assert.equal(named('Keep columns and download').disabled,true);
await click(named('name'));
assert.equal(named('Keep columns and download').disabled,false);
await files([file('extra.csv')]);
assert.ok(document.body.textContent.includes('This tool uses 1 file.'));
assert.equal(named('Keep columns and download'),undefined);
await click(named('Remove extra.csv'));
assert.equal(named('Keep columns and download').disabled,true);
await click(named('name'));
await click(named('Keep columns and download'));
assert.equal(globalThis.runs.at(-1).operation,'filterColumns');

await choose('compare');
await files([file('new.csv')]);
const select=document.querySelector('#match-column');
assert.ok(document.querySelector('label[for="match-column"]'));
await act(async()=>{select.value='id';select.dispatchEvent(new window.Event('change',{bubbles:true}));});
await click(named('Compare and download'));
assert.equal(globalThis.runs.at(-1).key,'id');
await files([file('third.csv')]);
assert.equal(named('Compare and download'),undefined);
assert.ok(document.body.textContent.includes('This tool uses 2 files.'));
await choose('convert');
assert.equal(named('Convert and download').disabled,false);
await click(named('Convert and download'));
await click(named('Start over'));
assert.equal(document.querySelector('#file-input'),null);
assert.equal(document.activeElement.id,'tools-title');

await choose('dedup');
await files([file('list.csv')]);
await click(named('Selected columns'));
assert.equal(named('Remove duplicates and download').disabled,true);
await click(named('id'));
await click(named('Remove duplicates and download'));
assert.equal(globalThis.runs.at(-1).operation,'deduplicate');
await click(named('Remove list.csv'));
await files([file('different.csv',['email'])]);
assert.equal(named('id'),undefined);
assert.equal(named('All columns').getAttribute('aria-pressed'),'true');

await files([file('unsupported.pdf')]);
assert.ok(document.querySelector('[role="alert"]').textContent.includes('Choose a CSV or Excel'));
assert.equal(document.querySelectorAll('.file-list li').length,1);
await files([file('empty.csv',[])]);
assert.ok(document.querySelector('[role="alert"]').textContent.includes('no readable data rows'));
assert.equal(document.querySelectorAll('.file-list li').length,1);

// Processing locks task/file changes; a failure unlocks them and can be retried.
await choose('trim');
globalThis.holdRun=true;
await click(named('Clean up and download'));
assert.ok([...document.querySelectorAll('.tool-choice')].every(b=>b.disabled));
assert.equal(named('Remove different.csv').disabled,true);
assert.equal(named('Start over').disabled,true);
await act(async()=>globalThis.rejectRun(new Error('Test processing error')));
assert.ok([...document.querySelectorAll('[role="alert"]')].some(el=>el.textContent.includes('Test processing error')));
assert.equal(toolButton('trim').disabled,false);
globalThis.holdRun=false;
await click(named('Clean up and download'));
await choose('remove-empty');
await click(named('Remove empty rows and columns'));
assert.equal(globalThis.runs.at(-1).operation,'removeEmpty');
assert.ok(!document.body.textContent.includes('Test processing error'));
assert.ok(!document.body.textContent.includes('\\u2014'));
await act(async()=>root.unmount());
console.log('PASS: seven tools visible before files; tool-first flow; count limits; preserved tool/file selection; reset of columns/results; errors; processing lock and retry; focus handoff.');
`
try {
  await build({
    input: 'ui-entry', platform: 'node', transform: { jsx: { runtime: 'automatic' } },
    plugins: [{
      name: 'ui-check',
      resolveId(id) {
        if (id === 'ui-entry' || id === '../lib/spreadsheet' || id === '../lib/operations') return '\0' + id
      },
      load(id) {
        if (id === '\0ui-entry') return { code: entry, moduleType: 'jsx' }
        if (id === '\0../lib/spreadsheet') return 'export async function readColumns(file){return file.columns}'
        if (id === '\0../lib/operations') return `
          async function run(operation, files, key) {
            (globalThis.runs ||= []).push({operation,names:files.map(f=>f.name),key});
            if(globalThis.holdRun) await new Promise((resolve,reject)=>{globalThis.rejectRun=reject});
            return {rows:2,columns:2,files_merged:files.length,columns_kept:key || [],added:1,removed:0,changed:1,unchanged:0,
              results:files.map(f=>({original:f.name,converted_to:'xlsx',rows:2,original_rows:3,final_rows:2,duplicates_removed:1,cells_trimmed:1,cells_normalized:0,rows_removed:0,cols_removed:1,final_cols:1}))};
          }
          export const merge=(f,k)=>run('merge',f,k);
          export const convert=f=>run('convert',f);
          export const deduplicate=(f,k)=>run('deduplicate',f,k);
          export const filterColumns=(f,k)=>run('filterColumns',[f],k);
          export const compare=(f,k)=>run('compare',f,k);
          export const trimClean=f=>run('trimClean',f);
          export const removeEmpty=f=>run('removeEmpty',f);
        `
      },
    }], output: { file: join(dir, 'test.mjs'), format: 'esm' },
  })
  const harness = `
    import { JSDOM } from ${JSON.stringify(import.meta.resolve('jsdom'))};
    const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://example.test/'});
    globalThis.window=dom.window;globalThis.document=dom.window.document;
    globalThis.HTMLElement=dom.window.HTMLElement;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
    await import('./test.mjs');dom.window.close();process.exit(0);
  `
  await writeFile(join(dir, 'run.mjs'), harness)
  const result = spawnSync(process.execPath, [join(dir, 'run.mjs')], { stdio: 'inherit' })
  process.exitCode = result.status ?? 1
} finally {
  await rm(dir, { recursive: true, force: true })
}
