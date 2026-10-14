// A deliberately labelled QA build; never deploy this file.
import {mkdtemp,readFile,writeFile,copyFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from './build.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
const destination=process.argv[2];
if(!destination)throw Error('Provide an explicit QA HTML output path.');
const scratch=await mkdtemp(join(tmpdir(),'mako-rules-browser-qa-'));
try{
 for(const f of await readdir(join(root,'src')))await copyFile(join(root,'src',f),join(scratch,f));
 const data=JSON.parse(await readFile(join(root,'src/content.json'),'utf8'));
 data.rules.find(r=>r.id==='breast-pullout').title='<img src=x onerror=alert(1)> — inert content test';
 data.diagrams[0].labels[0]='<svg onload=alert(1)> — inert diagram label';
 data.rulebook[0].statement='<img src=x onerror=alert(1)> — inert master-table text';
 data.scenarios[0].id='constructor';
 data.updates[0].summary='<img src=x onerror=alert(1)> — inert update text';
 await writeFile(join(scratch,'content.json'),JSON.stringify(data));
 const state=await readFile(join(root,'src/state.js'),'utf8');
 await writeFile(join(scratch,'state.js'),"Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new Error('QA storage denied');}});\n"+state);
 const controller=await readFile(join(root,'src/app.js'),'utf8');
 await writeFile(join(scratch,'app.js'),controller+"\nconst qaNotice=document.createElement('p');qaNotice.textContent='QA ONLY: storage access denied; inert-text and constructor-ID tests';qaNotice.id='qa-status';document.body.prepend(qaNotice);\nconst qaResources=document.createElement('p');qaResources.id='qa-resources';document.body.prepend(qaResources);const updateResources=()=>{const entries=performance.getEntriesByType('resource').filter(e=>/^https?:/.test(e.name));qaResources.textContent='QA resource requests: '+entries.length+(entries.length?' '+entries.map(e=>e.name).join(', '):'');};new PerformanceObserver(updateResources).observe({type:'resource',buffered:true});window.addEventListener('load',updateResources);updateResources();\n");
 console.log(JSON.stringify(await build({sourceDir:scratch,outputPath:resolve(destination)}),null,2));
}finally{await rm(scratch,{recursive:true,force:true});}
