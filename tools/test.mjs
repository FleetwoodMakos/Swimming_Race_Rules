import {mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
await mkdir(new URL('../reports/',import.meta.url),{recursive:true});
let failed=false;
for(const name of ['verify','journey-tests','lesson-tests','state-regression','rulebook-tests','full-section-tests','updates-tests','learning-support-tests','pose-tests','progress-tests','start-rehearsal-tests','reaction-tests','dq-tests']){
 const r=spawnSync(process.execPath,[fileURLToPath(new URL(name+'.mjs',import.meta.url))],{encoding:'utf8'});
 console.log(name+': '+(r.status===0?'PASS':'FAIL'));
 if(r.status!==0){failed=true;console.error(r.stderr||r.stdout||r.error);}
}
if(failed)process.exitCode=1;
