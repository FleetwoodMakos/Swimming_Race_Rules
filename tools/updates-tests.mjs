import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { searchRulebook } from '../src/rulebook-logic.mjs';
import { safeUrl } from '../src/logic.mjs';

const data=JSON.parse(await readFile(new URL('../src/content.json',import.meta.url),'utf8'));
const sourceById=new Map(data.sources.map(source=>[source.id,source]));
const ruleByCode=new Map(data.rulebook.map(rule=>[rule.code,rule]));
const updateById=new Map(data.updates.map(update=>[update.id,update]));
const checks=[],failures=[];
function check(name,action){try{action();checks.push(name);}catch(error){failures.push({name,error:error.message});}}
function update(id){const card=updateById.get(id);assert.ok(card,`Missing update ${id}`);return card;}
function text(id){const card=update(id);return [card.title,card.label,card.summary,...card.points,card.scope].join(' ');}
function codes(query,category='all'){return searchRulebook(data,{query,category}).map(row=>row.code);}
function hasCodes(id,expected){const card=update(id);for(const code of expected)assert.ok(card.relatedCodes.includes(code),`${id} does not link ${code}`);}

check('All ten requested change, clarification and outlook topics are present once',()=>{
  const expected=['breaststroke-turn','freestyle-finish','butterfly-finish','butterfly-turn','four-hundred','injury-tape','false-start-video','england-dates','relay-semifinals','outlook-2027'];
  assert.equal(data.updates.length,10);
  assert.equal(updateById.size,10);
  assert.deepEqual([...updateById.keys()].toSorted(),expected.toSorted());
  for(const card of data.updates){
    assert.ok(card.summary.trim().length>40,`${card.id} needs its requirement readable here`);
    assert.ok(card.points.length>=2&&card.points.every(point=>point.trim()),`${card.id} lacks explanatory requirements`);
    assert.ok(card.label.trim()&&card.scope.trim(),`${card.id} lacks temporal label or scope`);
  }
});
check('Every update links to valid readable requirements and official source references',()=>{
  for(const card of data.updates){
    if(card.id!=='outlook-2027')assert.ok(card.relatedCodes.length,`${card.id} needs a current requirement link`);
    for(const code of card.relatedCodes){
      const rule=ruleByCode.get(code);
      assert.ok(rule&&rule.statement.trim()&&rule.plain.trim(),`${card.id} has unreadable or missing rule ${code}`);
    }
    assert.ok(card.refs.length,`${card.id} lacks evidence`);
    for(const reference of card.refs){
      const source=sourceById.get(reference.source);
      assert.ok(source,`${card.id} cites an unknown source`);
      assert.ok(safeUrl(source.url),`${card.id} source URL is not an approved official source`);
      assert.ok(reference.clause.trim()&&reference.location.trim(),`${card.id} has an incomplete reference`);
    }
  }
});
check('The commentary alias resolves to a real canonical rule without inventing a rulebook code',()=>{
  const alias=data.ruleAliases.find(entry=>entry.alias==='8.6.7');
  assert.ok(alias);
  assert.equal(alias.code,'8.6');
  assert.equal(alias.source,'wa-commentary');
  assert.ok(sourceById.has(alias.source));
  assert.match(alias.location,/2/);
  assert.ok(!ruleByCode.has('8.6.7'),'Commentary numbering must not duplicate the official February clause');
  assert.deepEqual(codes('8.6.7'),['8.6']);
  assert.deepEqual(codes('8.6.7'),codes('8.6'));
});
check('Alias lookup combines with butterfly phrases, official prefixes and category filters',()=>{
  for(const query of ['8.6.7 butterfly','butterfly finish 8.6.7','WA 8.6.7','World Aquatics 8.6.7','8 . 6 . 7']){
    assert.deepEqual(codes(query),['8.6'],query);
  }
  assert.deepEqual(codes('8.6.7','Butterfly'),['8.6']);
  assert.deepEqual(codes('8.6.7','Breaststroke'),[]);
  assert.deepEqual(codes('8.6.7 breaststroke'),[]);
});
check('Alias boundaries do not redirect lookalike or invented child codes',()=>{
  for(const query of ['8.6.70','WA 8.6.70','8.6.70 butterfly','18.6.7','8.6.7.1'])assert.deepEqual(codes(query),[],query);
  assert.deepEqual(codes('8.6.7 7.7'),[],'Two conflicting exact code requirements must not widen the result');
});
check('Every alias has a unique number and a supported, non-alias canonical destination',()=>{
  const aliases=new Set(data.ruleAliases.map(entry=>entry.alias));
  assert.equal(aliases.size,data.ruleAliases.length);
  for(const entry of data.ruleAliases){
    assert.ok(ruleByCode.has(entry.code),`Unresolved alias ${entry.alias}`);
    assert.ok(!aliases.has(entry.code),`Alias chain or cycle ${entry.alias}`);
    assert.ok(sourceById.has(entry.source)&&entry.location.trim()&&entry.note.trim());
  }
});
check('Breaststroke rotation applies before any kick, including the dolphin kick',()=>{
  const card=update('breaststroke-turn'),words=text(card.id);
  assert.match(card.summary,/past vertical[\s\S]*before any kick/i);
  assert.match(words,/any kick[\s\S]*dolphin\/butterfly kick/i);
  assert.match(words,/Do not teach a dolphin kick[\s\S]*still on the back/i);
  assert.match(words,/first arm[\s\S]*on the breast|on the breast[\s\S]*first arm/i);
  hasCodes(card.id,['7.1','7.2','7.3','9.4']);
  const pullout=ruleByCode.get('7.1').statement;
  assert.match(pullout,/one[\s\S]*butterfly kick[\s\S]*before the first breaststroke kick/i);
  assert.match(words,/backstroke[\s\S]*finish touch on the back/i);
  assert.match(card.scope,/English[\s\S]*not been independently confirmed/i);
});
check('Butterfly departure and breaststroke departure are not conflated',()=>{
  const words=text('butterfly-turn');
  assert.match(words,/on the breast after leaving/i);
  assert.match(words,/Do not delay[\s\S]*first arm stroke/i);
  assert.match(words,/removes[\s\S]*turns from 8\.1/i);
  assert.match(words,/Do not apply the breaststroke departure permission to butterfly/i);
  hasCodes('butterfly-turn',['8.1','8.2']);
  assert.match(update('butterfly-turn').scope,/English[\s\S]*not been independently confirmed/i);
});
check('Both finish changes retain the 5m, reaching and stroke-specific touch conditions',()=>{
  for(const id of ['freestyle-finish','butterfly-finish']){
    const words=text(id);
    assert.match(words,/head[\s\S]*passed[\s\S]*5m/i);
    assert.match(words,/reaching for the finish/i);
    assert.match(words,/not[\s\S]*(?:whole final 5m|approach.to.turn)/i);
  }
  hasCodes('freestyle-finish',['5.2','5.3','5.4']);
  hasCodes('butterfly-finish',['8.5','8.6']);
  assert.match(text('butterfly-finish'),/both separated hands[\s\S]*same time/i);
  assert.match(text('butterfly-finish'),/8\.6\.7/);
});
check('The 400m warning distances follow two pool lengths plus 5m',()=>{
  const words=text('four-hundred');
  assert.match(words,/individual 400m freestyle/i);
  assert.match(words,/800m and 1500m/);
  assert.match(words,/two pool lengths plus 5m/i);
  const shortCourse=2*25+5,longCourse=2*50+5;
  assert.equal(shortCourse,55);assert.equal(longCourse,105);
  assert.ok(words.includes(`${shortCourse}m in a 25m pool`));
  assert.ok(words.includes(`${longCourse}m in a 50m pool`));
  assert.match(words,/odd numbers[\s\S]*lengths still to swim/i);
  assert.match(words,/Repeat the signal after the turn[\s\S]*5m mark/i);
  hasCodes('four-hundred',['2.8.6','2.8.7']);
});
check('Tape and nasal-strip guidance preserves injury purpose and the England uncertainty',()=>{
  const words=text('injury-tape');
  assert.match(words,/one or two fingers or toes/i);
  assert.match(words,/other body parts/i);
  assert.match(words,/treating or protecting an injury/i);
  assert.match(words,/not unrestricted permission[\s\S]*performance/i);
  assert.match(words,/glue[\s\S]*nasal strips|nasal strips[\s\S]*glue/i);
  assert.match(update('injury-tape').scope,/English[\s\S]*not been independently confirmed/i);
  hasCodes('injury-tape',['14.2','14.4']);
});
check('Early-start video guidance distinguishes official review from joint visual observation',()=>{
  const words=text('false-start-video');
  assert.match(words,/both the starter and referee[\s\S]*observe and confirm/i);
  assert.match(words,/need not agree|concurrence is not required/i);
  assert.match(words,/decision[\s\S]*final/i);
  assert.match(words,/spectator[\s\S]*not[\s\S]*automatic|does not make a spectator/i);
  hasCodes('false-start-video',['2.3.6','4.4']);
});
check('English February adoption dates do not silently establish August applicability',()=>{
  const words=text('england-dates');
  assert.match(words,/Level 1[\s\S]*27 March 2026/i);
  assert.match(words,/other levels[\s\S]*unlicensed[\s\S]*11 May 2026/i);
  assert.match(words,/does not[\s\S]*August/i);
  assert.match(words,/safety[\s\S]*precedence/i);
  hasCodes('england-dates',['501.1']);
});
check('Withdrawn relay-semi-final wording is not presented as a current obligation',()=>{
  const words=text('relay-semifinals');
  assert.match(words,/included in error/i);
  assert.match(words,/not to be applied/i);
  assert.match(words,/do not have semi.finals/i);
  hasCodes('relay-semifinals',['3.3.5']);
  assert.match(ruleByCode.get('3.3.5').statement,/not applied|no operative/i);
});
check('2027 is a dated unapproved outlook, not a new operative rules package',()=>{
  const card=update('outlook-2027'),words=text(card.id);
  assert.match(card.label,/checked 13 October 2026/i);
  assert.match(card.summary,/does not list[\s\S]*approved 2027/i);
  assert.match(words,/15 November 2026/);
  assert.match(words,/1 December 2026/);
  assert.match(words,/1 January 2027/);
  assert.match(words,/Publication does not mean approval/i);
  assert.match(words,/enactment of approved changes/i);
  assert.match(words,/English adoption should be checked separately/i);
  assert.match(words,/not a claim[\s\S]*already been approved/i);
  assert.match(card.scope,/does not update itself or monitor/i);
  assert.deepEqual(card.relatedCodes,[],'Future outlook must not link invented operative 2027 clauses');
  assert.ok(card.refs.some(reference=>reference.source==='wa-hub'));
  assert.ok(card.refs.some(reference=>reference.source==='wa-calendar'));
});
check('Alias search is read-only and preserves the canonical content',()=>{
  const before=JSON.stringify({rules:data.rulebook,aliases:data.ruleAliases,updates:data.updates});
  for(const query of ['8.6.7','butterfly 8.6.7','8.6.70','<script>8.6.7</script>'])codes(query);
  assert.equal(JSON.stringify({rules:data.rulebook,aliases:data.ruleAliases,updates:data.updates}),before);
});
const report={status:failures.length?'failed':'passed',checks:checks.length+failures.length,passed:checks.length,
  updateCards:data.updates.length,aliases:data.ruleAliases.length,tests:checks,failures,
  boundary:'Canonical content, provenance-link and pure-search regressions. These do not establish browser rendering, approval of future rules or England adoption beyond the cited evidence.'};
await writeFile(new URL('../reports/updates-tests.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
