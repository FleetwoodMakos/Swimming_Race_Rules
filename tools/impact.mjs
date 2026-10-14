import {readFile} from 'node:fs/promises';
import {referenceCoversCode} from '../src/logic.mjs';
const data=JSON.parse(await readFile(new URL('../src/content.json',import.meta.url),'utf8'));
const id=process.argv[2];
const rule=data.rules.find(r=>r.id===id);
if(!rule){console.error('Provide a canonical rule ID. Known IDs:\n'+data.rules.map(r=>r.id).join('\n'));process.exitCode=1;}
else console.log(JSON.stringify({rule:rule.id,status:rule.status,stroke:rule.stroke,phases:rule.phases,sources:rule.refs.map(ref=>({reference:ref,metadata:data.sources.find(s=>s.id===ref.source)})),scenarios:data.scenarios.filter(s=>s.ruleIds.includes(id)).map(s=>({id:s.id,title:s.title,outcome:s.outcome})),diagrams:data.diagrams.filter(d=>d.ruleIds.includes(id)).map(d=>({id:d.id,title:d.title})),excerpts:data.excerpts.filter(e=>e.ruleId===id),facilities:data.facilities.filter(f=>data.codeIndex.some(c=>rule.refs.some(r=>referenceCoversCode(r,c.code))&&f.refs.some(r=>referenceCoversCode(r,c.code)))).map(f=>f.id),glossary:data.glossary.filter(g=>g.ruleIds.includes(id)).map(g=>g.id),review:'Review every linked explanation and answer against the changed official clause; rerun content review and software/browser tests before a new release.'},null,2));
