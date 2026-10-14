import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { normaliseRulebookText, searchRulebook } from '../src/rulebook-logic.mjs';

// Default: verify the actual shipped canonical content. --fixture is a development
// option only, while content integration is in progress; never a release check.
const fixtureMode = process.argv.includes('--fixture');
const parsed = JSON.parse(await readFile(new URL(fixtureMode
  ? '../../../work/race-rulebook-v12.json' : '../src/content.json', import.meta.url), 'utf8'));
const data = fixtureMode ? { rulebook: parsed } : parsed;
assert.ok(Array.isArray(data.rulebook) && data.rulebook.length, 'Canonical content must contain populated rulebook entries');
const results = [];
const failures = [];
const codes = (query, category = 'all') => searchRulebook(data, { query, category }).map(row => row.code);
function check(name, test) {
  try { test(); results.push(name); }
  catch (error) { failures.push({ name, error: error.message }); }
}
function includesCodes(actual, expected) { for (const code of expected) assert.ok(actual.includes(code), `Missing ${code}; received ${actual.join(', ')}`); }

check('Every substantive racing provision in Part Two 4–10 is present exactly once', () => {
  // Independently transcribed from the official source, PDF pp60–63. Parent labels
  // 10.2 and 10.4 have no independent requirement and are intentionally excluded.
  const expected = [
    '4.1','4.1.1','4.1.2','4.1.3','4.1.4','4.2','4.2.1','4.2.2','4.2.3','4.2.4','4.2.5','4.3','4.4','4.4.1','4.4.2',
    '5.1','5.2','5.3','5.4',
    '6.1','6.2','6.3','6.4','6.5',
    '7.1','7.2','7.3','7.4','7.5','7.6','7.7',
    '8.1','8.2','8.3','8.4','8.5','8.6',
    '9.1','9.2','9.3','9.4',
    '10.1','10.2.1','10.2.2','10.2.3','10.2.4','10.2.5','10.2.6','10.2.7','10.2.8','10.2.9',
    '10.3','10.3.1','10.4.1','10.4.2','10.4.2.1','10.4.2.2','10.4.3','10.4.4','10.4.5','10.4.6','10.4.7','10.5','10.6'
  ];
  assert.equal(expected.length, 64);
  const actual = data.rulebook.filter(row => /^(?:[4-9]|10)\./.test(row.code)).map(row => row.code);
  assert.deepEqual(actual.toSorted(), expected.toSorted());
  assert.equal(new Set(actual).size, 64);
});

check('Empty search shows the complete master dataset in its authored order', () => {
  assert.deepEqual(codes(''), data.rulebook.map(row => row.code));
  assert.deepEqual(codes('  '), codes(''));
});

check('Partial stroke plus distance narrows to freestyle underwater rule', () => {
  assert.deepEqual(codes('freest 15m'), ['5.3']);
});

check('Partial stroke plus rule phrase finds simultaneous butterfly actions', () => {
  const found = codes('butter simultaneous');
  includesCodes(found, ['8.3']);
  assert.ok(found.length < data.rulebook.length);
  assert.ok(!found.includes('5.3'));
});

check('Word order does not affect an intersecting phrase query', () => {
  const forward = codes('back touch');
  includesCodes(forward, ['6.1','6.4','6.5','9.4']);
  assert.deepEqual(forward, codes('touch back'));
  assert.ok(forward.length < codes('back').length);
});

check('Code and partial stroke combine rather than widening one another', () => {
  assert.deepEqual(codes('7.7 breast'), ['7.7']);
  assert.deepEqual(codes('7.7 backstroke'), []);
});

check('Official prefix and dotted-code spacing resolve to the same rule', () => {
  for (const query of ['WA 6.5','SW 6.5','World Aquatics 6.5','Part Two 6.5','Rule 6.5','Article 6.5','6 . 5']) {
    assert.deepEqual(codes(query), ['6.5'], query);
  }
});

check('Distance spellings and units return the same underwater provisions', () => {
  const base = codes('15m');
  includesCodes(base, ['5.3','6.3','8.6']);
  for (const query of ['15 m','15 metre','15 metres','15 meter','15 meters','15-metre','15-meter','15–metre']) {
    assert.deepEqual(codes(query), base, query);
  }
});

check('A numeric section query matches its code family, not incidental prose numbers', () => {
  assert.deepEqual(codes('6'), ['6.1','6.2','6.3','6.4','6.5']);
  assert.ok(codes('6').every(code => code.startsWith('6.')));
  assert.deepEqual(codes('6.'), codes('6'));
  assert.deepEqual(codes('10.4.2'), ['10.4.2','10.4.2.1','10.4.2.2']);
});

check('Numeric boundaries avoid matching 6.50 or 16.5 for query 6.5', () => {
  const source = data.rulebook.find(row => row.code === '6.5');
  const sample = ['6.50','16.5','6.5.1','6.5'].map(code => ({...source, code}));
  assert.deepEqual(searchRulebook(sample, {query:'6.5'}).map(row => row.code), ['6.5','6.5.1']);
});

check('Stroke aliases find the same results as their full terms', () => {
  assert.deepEqual(codes('fly'), codes('butterfly'));
  assert.deepEqual(codes('IM'), codes('medley'));
});

check('A number embedded in a rule phrase searches the requirement rather than code 90', () => {
  includesCodes(codes('90 degrees'), ['6.2']);
  includesCodes(codes('back 90'), ['6.2']);
});

check('Familiar official terms remain searchable in original restatements', () => {
  includesCodes(codes('separated hands'), ['7.7','8.5']);
  includesCodes(codes('stationary'), ['4.1.4','4.2.5']);
  includesCodes(codes('single arm pull'), ['6.4']);
  includesCodes(codes('head break'), ['5.3','6.3','8.6']);
  includesCodes(codes('medley one quarter'), ['9.1','9.2']);
  includesCodes(codes('running start'), ['10.4.4']);
});

check('Category filters intersect phrase results and support exact code lookup', () => {
  assert.deepEqual(codes('15m','Freestyle'), ['5.3']);
  assert.deepEqual(codes('15m','Backstroke'), ['6.3']);
  assert.deepEqual(codes('15m','Butterfly'), ['8.6']);
  assert.deepEqual(codes('6.5','Breaststroke'), []);
  assert.deepEqual(codes('6.5','Backstroke'), ['6.5']);
});

check('Title, statement and plain explanation are all searchable', () => {
  const base = data.rulebook.find(row => row.code === '5.3');
  const sample = [{...base,title:'titleneedle',statement:'statementneedle',plain:'plainneedle',issue:''}];
  for (const query of ['titleneed','statementneed','plainneed']) {
    assert.equal(searchRulebook(sample,{query}).length,1);
  }
});

check('Source IDs, location and unrelated version metadata cannot create false matches', () => {
  const sample = [{...data.rulebook.find(row => row.code === '5.3'),
    source:'sourceneedle',location:'locationneedle',version:'editionneedle'}];
  for (const query of ['sourceneedle','locationneedle','editionneedle']) {
    assert.deepEqual(searchRulebook(sample,{query}),[]);
  }
});

check('Unmatched and contradictory terms produce zero results', () => {
  assert.deepEqual(codes('platypus trapezium'), []);
  assert.deepEqual(codes('6.5 7.7'), []);
  assert.deepEqual(codes('6.5 nonexistentword'), []);
});

check('Markup, script-like and prototype-key queries stay inert and do not mutate data', () => {
  const before = JSON.stringify(data.rulebook);
  for (const query of ['<img src=x onerror=alert(1)>','<script>globalThis.searchPwned=true</script>','__proto__','constructor prototype']) {
    const matched = codes(query);
    assert.ok(matched.every(code => data.rulebook.some(row => row.code === code)));
    // '__proto__' can legitimately prefix-match 'protocol'; matching is not execution.
  }
  assert.equal(globalThis.searchPwned,undefined);
  assert.equal(JSON.stringify(data.rulebook),before);
});

check('Normalisation accepts case, accent and whitespace differences', () => {
  assert.equal(normaliseRulebookText('  FRÉESTYLE  15 METRES '),'freestyle 15m');
  assert.deepEqual(codes('FRÉEST 15 METRES'),['5.3']);
});

check('15m provision distinguishes head deadline from continued surface contact', () => {
  for (const code of ['5.3','6.3','8.6']) {
    const entry = data.rulebook.find(row => row.code === code);
    assert.match(entry.statement,/head[\s\S]*no later than 15 metres/i,code);
    assert.match(entry.statement,/15\.01 metres/i,code);
    assert.match(entry.statement,/some (?:portion|part) of (?:the swimmer’s |the )?body[\s\S]*surface/i,code);
  }
  if (!fixtureMode) {
    for (const id of ['free-underwater','back-underwater','fly-underwater']) {
      const card = data.rules.find(row => row.id === id);
      assert.match(card.requirements[0],/head[\s\S]*(?:at or before|no later than)[\s\S]*15/i,id);
      assert.ok(card.requirements.some((text,index)=>index>0&&/some part of the body/i.test(text)),id);
      assert.ok(!card.requirements.some(text=>/^After that allowance/i.test(text)),id);
    }
  }
});

check('The three commentary-sensitive provisions visibly retain their uncertainty', () => {
  for (const code of ['7.3','8.1','8.2']) {
    const entry = data.rulebook.find(row => row.code === code);
    assert.equal(entry.status,'withheld',code);
    assert.match(entry.issue,/England|English/i,code);
    assert.match(entry.issue,/not been independently confirmed|unverified|not confirmed/i,code);
    assert.ok(entry.statement.length > 100, 'A flag must not replace the readable requirements');
  }
});

check('Repeated live-search workload stays within a generous responsiveness budget', () => {
  const queries = ['f','fre','freest 15m','back touch','7.7 breast','WA 6.5','butter simultaneous'];
  const start = performance.now();
  for (let repeat=0;repeat<12;repeat++) for (const query of queries) codes(query);
  const elapsed = performance.now()-start;
  assert.ok(elapsed<2500, `84 searches took ${elapsed.toFixed(0)}ms`);
});

console.log(JSON.stringify({status:failures.length?'failed':'passed', fixtureMode, rules:data.rulebook.length,
  checks:results.length+failures.length, passed:results.length, tests:results, failures,
  boundary:'Pure search and canonical content checks. Browser interaction, focus, rendering and visual accessibility require separate browser verification.'},null,2));
if(failures.length) process.exitCode=1;
