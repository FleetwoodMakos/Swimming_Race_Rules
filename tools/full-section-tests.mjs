import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { searchRulebook } from '../src/rulebook-logic.mjs';

const data = JSON.parse(await readFile(new URL('../src/content.json', import.meta.url), 'utf8'));
const indexed = data.codeIndex.filter(entry => entry.source === 'wa-cr');
const wa = data.rulebook.filter(entry => entry.source === 'wa-cr');
const indexedCodes = indexed.map(entry => entry.code);
const actualCodes = wa.map(entry => entry.code);
const actual = new Map(wa.map(entry => [entry.code, entry]));
const chapter = code => Number(code.split('.')[0]);
const leaves = indexedCodes.filter(code => !indexedCodes.some(other => other.startsWith(code + '.')));

// Independently audited against the official February 2026 PDF pp52–86.
// These are section titles, role labels or list introductions: they have no
// additional standalone requirement omitted from their substantive children.
// This explicit allowlist is not generated from the implementation's omissions.
const headingOnly = new Map([
  ['1','Swimming competitions chapter'],['2','Technical officials chapter'],
  ...['2.3','2.4','2.5','2.6','2.7','2.8','2.9','2.10','2.11','2.12','2.13','2.14','2.15','2.16','2.17','2.18'].map(code=>[code,'Official role label; duties and applicable scope are in children']),
  ['3','Seeding chapter'],['3.2.4','Heat-allocation list introduction'],['3.2.5','Lane-allocation list introduction'],
  ['3.3.2','Last semi-final place tie list'],['3.4.2','Last final place tie list'],['3.7','Championship scope applied in each child'],
  ['4','Start chapter'],['5','Freestyle chapter'],['6','Backstroke chapter'],['7','Breaststroke chapter'],['8','Butterfly chapter'],['9','Medley chapter'],
  ['10','Race chapter'],['10.2','General-race list introduction'],['10.4','Relay list introduction'],
  ['11','Timing chapter'],['12','Records chapter'],['13','Age eligibility chapter'],['14','Swimwear chapter'],['15','Facilities chapter'],
  ['15.1','Pool length heading'],['15.1.1','50m length group'],['15.1.2','25m length group'],
  ['15.2','Dimensional-tolerance heading'],['15.2.1','50m tolerance group'],['15.2.2','25m tolerance group'],
  ['15.3','Pool width heading'],['15.4','Pool depth heading'],['15.5','Pool wall heading'],['15.6','Pool lane heading'],['15.7','Lane rope heading'],
  ['15.7.6.1','Olympic rope colours group'],['15.7.6.2','World championship rope colours group'],['15.7.6.3','Other-competition rope colours group'],
  ['15.8','Starting platform heading'],['15.9','Backstroke flag heading'],['15.10','Backstroke ledge heading'],
  ['15.11','Water conditions heading'],['15.11.2','Water movement group'],['15.12','Lighting heading'],['15.13','Lane markings heading'],['15.14','Bulkhead heading'],
  ['15.16','Timing-equipment group'],['15.16.2','Timing-equipment requirements introduction'],['15.16.3','Starting devices heading'],
  ['15.16.4','Touch-panel heading'],['15.16.5','Semi-automatic timing heading'],['15.16.6','General timing accessories list introduction'],
  ['15.16.7','Olympic and World championship accessories scope applied in children'],['15.16.8','Timing room heading'],
  ['16','Medical and safety chapter'],['16.4','Rescue and lifeguard heading'],['17','Appendices chapter']
]);
const expectedLeafCounts = {1:9,2:70,3:40,4:12,5:4,6:5,7:7,8:6,9:4,10:21,11:21,12:25,13:4,14:4,15:107,16:6,17:10};
const results = [], failures = [];
function check(name, action) { try { action(); results.push(name); } catch(error) { failures.push({name,error:error.message}); } }
function found(query, category='all') { return searchRulebook(data,{query,category}).map(entry=>entry.code); }
function includes(actualValues, expectedValues) { for(const value of expectedValues) assert.ok(actualValues.includes(value), `Missing ${value}; received ${actualValues.join(', ')}`); }
function text(code) { const entry=actual.get(code); assert.ok(entry, `Missing provision ${code}`); return [entry.title,entry.statement,entry.plain,entry.issue].join(' '); }
function page(location) { const match=location.match(/p(?:age)?\.?\s*(\d+)/i); assert.ok(match,`Unreadable page location: ${location}`); return Number(match[1]); }

check('Full Part Two source index contains 459 unique genuine codes across all 17 chapters',()=>{
  assert.equal(indexedCodes.length,459);
  assert.equal(new Set(indexedCodes).size,459);
  for(let number=1;number<=17;number++) assert.ok(indexedCodes.includes(String(number)),`Missing chapter ${number}`);
  for(const artifact of ['3.1.3.2','5.0','6.0']) assert.ok(!indexedCodes.includes(artifact),`PDF line-wrap artefact indexed as ${artifact}`);
});
check('Every indexed code has readable content or an explicitly audited heading-only exclusion',()=>{
  assert.equal(headingOnly.size,71);
  const missing=indexedCodes.filter(code=>!actual.has(code));
  assert.deepEqual(missing.toSorted(),[...headingOnly.keys()].toSorted());
  assert.equal(wa.length,388);
  assert.equal(new Set(actualCodes).size,388);
  for(const code of actualCodes) assert.ok(indexedCodes.includes(code),`Unindexed World Aquatics provision ${code}`);
});
check('Every one of the 355 terminal source codes contains a populated provision',()=>{
  assert.equal(leaves.length,355);
  for(const code of leaves){
    assert.ok(actual.has(code),`Leaf ${code} omitted`);
    const entry=actual.get(code);
    assert.ok(entry.statement.trim().length>=20,`No readable statement for ${code}`);
    assert.ok(entry.plain.trim().length>=15,`No plain explanation for ${code}`);
  }
});
check('Independent per-chapter terminal counts catch entire missing subsections',()=>{
  for(const [number,expected] of Object.entries(expectedLeafCounts)){
    const sourceLeaves=leaves.filter(code=>chapter(code)===Number(number));
    assert.equal(sourceLeaves.length,expected,`Chapter ${number} source leaves`);
    assert.equal(sourceLeaves.filter(code=>actual.has(code)).length,expected,`Chapter ${number} readable leaves`);
  }
  assert.equal(leaves.filter(code=>chapter(code)>=11&&chapter(code)<=13).length,50);
  assert.equal(leaves.filter(code=>chapter(code)>=14&&chapter(code)<=15).length,111);
});
check('Every excluded heading has readable descendants rather than concealing a missing rule',()=>{
  for(const [code,reason] of headingOnly){
    assert.ok(reason.length>10);
    assert.ok(actualCodes.some(child=>child.startsWith(code+'.')),`Heading ${code} has no readable descendants`);
    assert.ok(!leaves.includes(code),`Terminal rule ${code} was mislabelled as heading-only`);
  }
});
check('All chapters have actual content and all World Aquatics citations stay within pp52–86',()=>{
  for(let number=1;number<=17;number++) assert.ok(wa.some(row=>chapter(row.code)===number),`No readable chapter ${number}`);
  for(const entry of wa) assert.ok(page(entry.location)>=52&&page(entry.location)<=86,`Out-of-scope source page for ${entry.code}`);
  for(let number=1;number<=10;number++) assert.equal(page(actual.get('17.'+number).location),76+number,`Appendix ${number} should cite the diagram page`);
});
check('Domestic supplementary rules stay distinct from the complete World Aquatics section',()=>{
  const domestic=data.rulebook.filter(entry=>entry.source!=='wa-cr');
  assert.equal(domestic.length,3);
  assert.ok(domestic.every(entry=>entry.source==='se-handbook'));
  assert.ok(domestic.every(entry=>!indexedCodes.includes(entry.code)));
});
check('All World Aquatics provisions remain discoverable by their own official codes',()=>{
  for(const entry of wa) includes(found('WA '+entry.code),[entry.code]);
});
check('Official jobs and duties are searchable by role, including partial role names',()=>{
  includes(found('referee'),['2.3.1','2.3.6']);
  includes(found('timekeep'),['2.10.1','2.11.1']);
  includes(found('resolution desk'),['2.17.1']);
  includes(found('video supervisor'),['2.15.1']);
});
check('Swim-off spellings find progression rules without matching unrelated officials',()=>{
  const base=found('swimoff');
  includes(base,['3.3.2.1','3.4.2.1']);
  for(const query of ['swim-off','swim off','SWIMOFF']) assert.deepEqual(found(query),base,query);
  assert.ok(!base.includes('2.1.1'),'Swim-off must not mean swimmer plus official');
});
check('World record and anti-doping searches support common compound spellings',()=>{
  includes(found('world record'),['12.1','12.3.8']);
  const base=found('antidoping');
  includes(base,['12.3.8']);
  for(const query of ['anti-doping','anti doping']) assert.deepEqual(found(query),base,query);
  includes(found('world record 24 hours'),['12.3.8']);
});
check('Age and numeric rule phrases do not get mistaken for code-only requests',()=>{
  includes(found('age 14'),['13.1','13.2.1']);
  includes(found('31 December'),['12.3.2','13.1']);
  includes(found('8 lane'),['3.2.5.1.3']);
  includes(found('90 degrees'),['6.2']);
});
check('Medical, safety and all ten appendices are searchable in the expanded resource',()=>{
  includes(found('medical safety'),['16.1','16.2']);
  includes(found('lifeguard'),['16.2.2','16.4.2']);
  for(let number=1;number<=10;number++) includes(found('appendix '+number),['17.'+number]);
  includes(found('25m appendix'),['17.6','17.7']);
});
check('Category and phrase intersections also work in newly added chapters',()=>{
  const foundRows=searchRulebook(data,{query:'referee',category:'Officials and decisions'});
  includes(foundRows.map(row=>row.code),['2.3.1']);
  assert.ok(foundRows.every(row=>row.category==='Officials and decisions'));
  assert.deepEqual(found('antidoping','Seeding and progression'),[]);
  includes(found('world record','World records'),['12.1']);
});
check('Timing instructions retain the no-rounding distinction and an independently calculable example',()=>{
  const rule=text('11.2.3.1');
  assert.match(rule,/average/i);
  assert.match(rule,/discard|truncat/i);
  assert.match(rule,/not[\s\S]*round/i);
  // 6001 and 6002 hundredths average to 6001.5 hundredths: discard the fraction.
  assert.equal(Math.trunc((6001+6002)/2)/100,60.01);
  assert.match(rule,/60\.01/);
  assert.match(rule,/60\.015/);
});
check('Record sampling retains the deadline, all four relay swimmers and negative results',()=>{
  const rule=text('12.3.8');
  assert.match(rule,/24 hours/);
  assert.match(rule,/all four/);
  assert.match(rule,/negative/);
  assert.match(rule,/finals/);
  assert.match(text('12.5.1'),/seven days/);
  assert.match(text('12.5.2'),/fourteen days/);
});
check('Age eligibility retains year-end calculation and the under-14 B-standard exception',()=>{
  assert.match(text('13.1'),/31 December/);
  assert.match(text('13.1'),/14, 15, 16, 17 or 18/);
  const younger=text('13.2.2');
  assert.match(younger,/under 14/i);
  assert.match(younger,/B entry.time standard|B standard/i);
});
check('Seeding carries exact lane orders and mandatory admission for the special tied-final cases',()=>{
  assert.match(text('3.2.5.1.3'),/4, 5, 3, 6, 2, 7, 1, 8/);
  assert.match(text('3.2.5.1.4'),/4, 5, 3, 6, 2, 7, 1, 8, 0, 9/);
  assert.match(text('3.4.2.2'),/seven/);
  assert.match(text('3.4.2.2'),/both[\s\S]*final/);
  assert.match(text('3.4.2.3'),/three[\s\S]*final/);
  assert.match(text('3.4.2.3'),/lanes 8, 0 and 9/);
});
check('Published seeding corrections and unresolved relay-final references remain visible',()=>{
  assert.match(text('3.2.4.4.4'),/3\.2\.4\.2/);
  assert.match(actual.get('3.2.4.4.4').issue,/incorrect|correct/i);
  assert.match(text('3.3.5'),/not applied|not be applied|withdrawn/i);
  assert.match(actual.get('3.4.5').issue,/not[\s\S]*correct|inconsisten|corrected target/i);
});
check('Elite-event equipment scope survives omission of its list-introduction heading',()=>{
  for(const code of ['15.16.7.1','15.16.7.2','15.16.7.3']){
    const rule=actual.get(code).statement;
    assert.match(rule,/Olympic Games/);
    assert.match(rule,/World Aquatics Championships/);
  }
});
check('Medical staffing preserves should versus must and workload-dependent lifeguard numbers',()=>{
  assert.match(actual.get('16.4.2').statement,/should/);
  assert.match(actual.get('16.4.2').statement,/three lifeguards/);
  assert.match(actual.get('16.2.2').statement,/must/);
  assert.match(actual.get('16.2.2').statement,/adapt|adjust/);
});
check('August swimwear clarifications are readable and visibly flagged for England applicability',()=>{
  for(const code of ['14.2','14.4']){
    const entry=actual.get(code);
    assert.equal(entry.status,'withheld');
    assert.match(entry.issue,/English|England/);
    assert.match(entry.statement,/August/);
  }
  assert.match(text('14.2'),/nasal strips/);
  assert.match(text('14.4'),/other parts of the body|other body parts/);
});
check('Expanded content cannot introduce blank or dangling source and learning references',()=>{
  const sources=new Set(data.sources.map(source=>source.id));
  const rules=new Set(data.rules.map(rule=>rule.id));
  for(const entry of data.rulebook){
    for(const key of ['code','category','title','statement','plain','source','location']) assert.ok(typeof entry[key]==='string'&&entry[key].trim(),`${entry.code} missing ${key}`);
    assert.ok(sources.has(entry.source),`${entry.code} has an unknown source`);
    assert.ok(entry.relatedRuleIds.every(id=>rules.has(id)),`${entry.code} has a dangling learning link`);
    if(entry.status==='withheld')assert.ok(entry.issue.trim(),`${entry.code} lacks its issue explanation`);
  }
});
check('The 391-row live-search workload remains responsive with repeated varied queries',()=>{
  const queries=['referee','swimoff','world record','antidoping','age 14','medical safety','appendix 10','15m','back touch','7.7 breast'];
  const started=performance.now();
  for(let repeat=0;repeat<10;repeat++) for(const query of queries) found(query);
  const elapsed=performance.now()-started;
  assert.ok(elapsed<3500,`100 expanded searches took ${elapsed.toFixed(0)}ms`);
});
console.log(JSON.stringify({status:failures.length?'failed':'passed',indexedWorldAquaticsCodes:indexed.length,
  readableWorldAquaticsProvisions:wa.length,headingOnlyExclusions:headingOnly.size,terminalCodes:leaves.length,
  totalRulebookEntries:data.rulebook.length,checks:results.length+failures.length,passed:results.length,tests:results,failures,
  excludedHeadings:Object.fromEntries(headingOnly),
  boundary:'Independent source-coverage, factual-regression and pure-search checks. Does not prove browser rendering, focus, offline operation or a qualified-referee review.'},null,2));
if(failures.length)process.exitCode=1;
