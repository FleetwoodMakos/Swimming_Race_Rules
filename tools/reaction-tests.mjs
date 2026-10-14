import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {Script,createContext} from 'node:vm';
const source=await readFile(new URL('../src/reaction-game.js',import.meta.url),'utf8');
const context=createContext({root:{addEventListener(){}},document:{addEventListener(){}},window:{addEventListener(){}}});
new Script(source+';this.api={reactionElapsedMs,reactionOutcome,reactionShareText};').runInContext(context);
const {reactionElapsedMs,reactionOutcome,reactionShareText}=context.api;
// Audio timestamp at 4s corresponds to output at 10,000ms; the 5s signal is heard at 11,000ms.
const output={getOutputTimestamp(){return {contextTime:4,performanceTime:10000};}};
assert.equal(reactionElapsedMs(output,5,11234),234);
assert.equal(reactionElapsedMs(output,5,10999),-1);
// Without an output timestamp, include known latency instead of the queued audio clock alone.
assert.ok(Math.abs(reactionElapsedMs({currentTime:5.31,outputLatency:.06},5,0)-250)<.001);
assert.equal(reactionOutcome(-.1),'early');assert.equal(reactionOutcome(0),'result');assert.equal(reactionOutcome(3000),'result');assert.equal(reactionOutcome(3001),'late');
const text=reactionShareText('  Mako  ',234.4,'back',true,'https://rules.fleetwoodmakos.com/#reaction');
assert.ok(text.startsWith('Mako reacted in 234 ms'));assert.ok(text.includes('Backstroke start · sound + visual cue'));assert.ok(text.includes('not an official'));assert.ok(text.endsWith('/#reaction'));
assert.ok(!reactionShareText('',250,'dive',false,'').includes('http'));
assert.ok(reactionShareText('a'.repeat(100),250,'dive',false).startsWith('a'.repeat(32)+' reacted'));
await writeFile(new URL('../reports/reaction-tests.json',import.meta.url),JSON.stringify({status:'passed',checks:['Audio output clock conversion','Early tap before audible signal','Fallback output latency','Early/result/late boundaries','Share name trimming and length','Cue-mode label and recreational timing qualification','No public play link in local preview']},null,2));
console.log('Reaction checks passed');
