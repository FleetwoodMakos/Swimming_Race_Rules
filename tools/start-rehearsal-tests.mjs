import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createContext,Script} from 'node:vm';
import {observationPoses} from '../src/observation-poses.mjs';
const code=(await readFile(new URL('../src/start-sounds.js',import.meta.url),'utf8')).split('const SIGNAL_CHOICES=')[0];
const ctx=createContext({Float32Array,Math});new Script(code+';this.api={makeStartTimeline,whistleSamples};').runInContext(ctx);
for(const type of ['dive','back']){
 const plan=ctx.api.makeStartTimeline(type,1.25,1.7),events=Array.from(plan);
 assert.equal(events[0].kind,'short');assert.equal(events.filter(x=>x.kind==='long').length,type==='dive'?1:2);
 const marks=events.find(x=>x.kind==='marks'),signal=events.at(-1);assert.equal(signal.kind,'signal');assert.ok(signal.at-marks.at>=2.9);
 const longs=events.filter(x=>x.kind==='long');assert.ok(marks.at-longs.at(-1).at-2.4>=4.9);
 for(let i=1;i<events.length;i++)assert.ok(events[i].at>events[i-1].at);
}
const sample=ctx.api.whistleSamples(44100,2.4);assert.equal(sample.length,105840);assert.equal(sample[0],0);assert.ok(sample.every(Number.isFinite));assert.ok(Math.max(...sample)<1);assert.ok(Math.min(...sample)>-1);
const pose=observationPoses('wall',{contact:'none'})[0];assert.equal(pose.hip[1],150);assert.equal(pose.shoulder[1],150);assert.ok(pose.head[1]-10<150);assert.ok(pose.arms.some(a=>a[1][1]<150));
await writeFile(new URL('../reports/start-rehearsal-tests.json',import.meta.url),JSON.stringify({status:'passed',checks:['Dive and backstroke signal order','Long whistles allow preparation time','Marks precedes start signal with shorter pause','Whistle signal duration and amplitude bounds','Freestyle approach crosses the surface']},null,2));console.log('Start rehearsal and surface approach checks passed');
