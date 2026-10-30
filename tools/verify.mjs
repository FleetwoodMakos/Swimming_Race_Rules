import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, rm, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { validateContent, safeUrl, searchRules, scenarioScore, normaliseCode, referenceCoversCode, lookupCodes } from '../src/logic.mjs';
import { build, inspectApplicationSource, serializeForScript } from './build.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const passed = [];
function check(name, action) { action(); passed.push(name); }
const clone = (value) => structuredClone(value);
const strokes = ['free', 'back', 'breast', 'fly', 'im', 'relay'];
const phases = ['start', 'underwater', 'swimming', 'approach', 'touch', 'departure', 'finish'];
function fixture() {
  const source = { id: 'official', title: 'Fixture official regulations', organisation: 'World Aquatics',
    url: 'https://www.worldaquatics.com/rules/competition-regulations', version: 'Fixture only',
    effective: 'Fixture only', verified: '2026-10-13', location: 'Fixture clause', notes: '' };
  const rules = strokes.map((stroke) => ({ id: `rule-${stroke}`, stroke, phases: [...phases], title: `${stroke} example`,
    summary: 'This is synthetic test data, not swimming guidance.', formal:[{code:'6.5',text:'Synthetic in-app statement.',source:'official',location:'PDF p. 61'}], requirements: ['Synthetic requirement'], permitted: [], exceptions: [],
    observation: 'Synthetic observation', breach: 'Synthetic breach', misconception: 'Synthetic misconception', reminder: 'Synthetic reminder',
    refs: [{ source: 'official', clause: 'Fixture clause', location: 'Fixture only' }], status: 'verified', issue: '',
    diagramIds: stroke === 'free' ? ['diagram-test'] : [] }));
  return { meta: { appVersion: '1.0.0', contentVersion: '1.0.0', verified: '2026-10-13', scope: 'Synthetic test fixture',
    reviewStatus: 'Not real guidance', limitations: ['Fixture only'], changelog: ['Initial fixture'] }, sources: [source], rules,
    scenarios: Array.from({ length: 21 }, (_, index) => ({ id: `scenario-${index}`, stroke: strokes[index % strokes.length],
      phase: phases[index % phases.length], title: `Test scenario ${index}`, facts: 'Synthetic test facts',
      outcome: ['legal', 'breach', 'more'][index % 3], explanation: 'Synthetic explanation', ruleIds: [`rule-${strokes[index % strokes.length]}`] })),
    diagrams: [{ id: 'diagram-test', type: 'hands', title: 'Synthetic diagram', caption: 'Fixture only',
      labels: ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'], ruleIds: ['rule-free'] }],
    ruleAliases: [], updates:[{id:'update-fixture',title:'Synthetic change',label:'Fixture',summary:'Synthetic content',points:['Synthetic requirement'],scope:'',relatedCodes:['6.5'],refs:[{source:'official',clause:'6.5',location:'PDF p. 61'}]}], rulebook: [{code:'6.5',category:'Backstroke',title:'Synthetic finish rule',statement:'Synthetic formal content.',plain:'Synthetic plain content.',source:'official',location:'PDF p. 61',status:'verified',issue:'',relatedRuleIds:['rule-back']}], facilities: [], codeIndex: [{code:'6.5',source:'official',location:'PDF p. 61'}], excerpts: [],
    glossary: [{ id: 'glossary-test', term: 'Synthetic term', definition: 'Fixture only', ruleIds: ['rule-free'] }] };
}
function rejected(name, mutate, expected) {
  check(name, () => {
    const data = fixture(); mutate(data);
    const result = validateContent(data);
    assert.equal(result.ok, false, `${name} must fail validation`);
    if (expected) assert.ok(result.errors.some((error) => error.includes(expected)), result.errors.join('\n'));
  });
}
const digest = (text) => createHash('sha256').update(text).digest('base64');

check('Complete synthetic schema is accepted', () => assert.deepEqual(validateContent(fixture()), { ok: true, errors: [] }));
check('Official HTTPS source allowlist accepts intended primary and regional hosts', () => {
  for (const url of ['https://resources.fina.org/fina/document/file.pdf#page=12',
    'https://www.swimming.org/swimengland/swim-england-handbook/',
    'https://www.worldaquatics.com/rules/competition-regulations',
    'https://eastmidlandswimming.org/rules/', 'https://www.eastmidlandswimming.org/rules/']) assert.equal(safeUrl(url), true, url);
});
check('Unsafe, ambiguous and unapproved source links are rejected', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd',
    'http://www.swimming.org/', 'https://www.swimming.org.evil.example/', 'https://evil.example/?www.swimming.org',
    'https://evil.example@www.swimming.org/', 'https://www.swimming.org:8443/', '//www.swimming.org/',
    'https://www.swimming.org/\nfoo', 'https://www.swimming.org\\@evil.example/', ' https://www.swimming.org/',
    'https://www.swіmming.org/', 'https://user:password@www.worldaquatics.com/', null, {}, 7]) assert.equal(safeUrl(url), false, String(url));
});
rejected('Unexpected root executable field is rejected', (data) => { data.script = 'alert(1)'; }, 'unexpected field script');
rejected('Unexpected nested HTML field is rejected', (data) => { data.rules[0].html = '<img src=x onerror=alert(1)>'; }, 'unexpected field html');
rejected('Unexpected source handler field is rejected', (data) => { data.sources[0].onload = 'alert(1)'; }, 'unexpected field onload');
rejected('Unexpected reference field is rejected', (data) => { data.rules[0].refs[0].onclick = 'alert(1)'; }, 'unexpected field onclick');
rejected('Executable SVG fields are rejected', (data) => { data.diagrams[0].svg = '<svg onload="alert(1)"/>'; }, 'unexpected field svg');
rejected('Missing canonical diagram labels are rejected', (data) => { delete data.diagrams[0].labels; }, 'missing field labels');
rejected('Incorrect diagram label count is rejected', (data) => { data.diagrams[0].labels.pop(); }, 'exactly six');
rejected('Blank diagram labels are rejected', (data) => { data.diagrams[0].labels[0] = ''; }, 'non-empty string');
rejected('Diagram labels cannot contain executable records', (data) => { data.diagrams[0].labels[0] = { onload: 'alert(1)' }; }, 'non-empty string');
rejected('Prototype-like imported key is rejected', (data) => { Object.defineProperty(data.rules[0], '__proto__', { value: {}, enumerable: true }); }, 'unexpected field __proto__');
rejected('Accessors are rejected without evaluating them', (data) => { Object.defineProperty(data.rules[0], 'title', { get() { throw new Error('Accessor executed'); }, enumerable: true }); }, 'accessor fields');
rejected('Missing in-app rule statement is rejected', (data) => { data.rules[0].formal=[]; }, '1–2000');
rejected('Rulebook cannot contain a link-only entry', (data) => { data.rulebook[0].statement=''; }, 'non-empty string');
rejected('Rulebook duplicate clauses are rejected', (data) => { data.rulebook.push({...data.rulebook[0]}); }, 'unique numeric');
rejected('Updates cannot omit their readable rule requirements', (data) => { data.updates[0].points=[]; }, '1–2000');
rejected('Updates cannot link to an unknown master rule', (data) => { data.updates[0].relatedCodes=['99.1']; }, 'missing master rule');
rejected('Code aliases must resolve to a substantive master rule', (data) => { data.ruleAliases=[{alias:'8.6.7',code:'99.1',source:'official',location:'PDF p. 2',note:'Synthetic alias'}]; }, 'existing master rule');
rejected('Missing required record field is rejected', (data) => { delete data.rules[0].summary; }, 'missing field summary');
rejected('Malformed arrays are rejected', (data) => { data.rules[0].phases = 'touch'; }, 'must be an array');
rejected('Null records are rejected without crashing', (data) => { data.scenarios[0] = null; }, 'plain record');
rejected('Duplicate canonical rule IDs are rejected', (data) => { data.rules[1].id = data.rules[0].id; }, 'duplicate identifier');
rejected('Duplicate scenario IDs are rejected', (data) => { data.scenarios[1].id = data.scenarios[0].id; }, 'duplicate identifier');
rejected('Unknown source reference is rejected', (data) => { data.rules[0].refs[0].source = 'missing'; }, 'missing source');
rejected('Unknown scenario rule is rejected', (data) => { data.scenarios[0].ruleIds = ['missing']; }, 'missing rule');
rejected('Unknown diagram reference is rejected', (data) => { data.rules[0].diagramIds = ['missing']; }, 'missing diagram');
rejected('Displaying a diagram without matching evidence is rejected', (data) => { data.diagrams[0].ruleIds = ['rule-back']; }, 'link back');
check('Supporting a diagram does not force it onto that rule card', () => {const data=fixture();data.rules[0].diagramIds=[];assert.equal(validateContent(data).ok,true);});
rejected('Unrecognised stroke is rejected', (data) => { data.rules[0].stroke = 'dog-paddle'; }, 'must be one of');
rejected('Unrecognised phase is rejected', (data) => { data.scenarios[0].phase = 'podium'; }, 'must be one of');
rejected('Unrecognised scenario answer is rejected', (data) => { data.scenarios[0].outcome = 'automatic-disqualification'; }, 'must be one of');
rejected('Unrecognised diagram type is rejected', (data) => { data.diagrams[0].type = 'script'; }, 'must be one of');
rejected('Invalid calendar date is rejected', (data) => { data.meta.verified = '2026-02-30'; }, 'real date');
rejected('Unsafe URL in actual source record is rejected', (data) => { data.sources[0].url = 'javascript:alert(1)'; }, 'approved official source');
rejected('Verified claim without source is rejected', (data) => { data.rules[0].refs = []; }, '1–2000');
rejected('Withheld claim without uncertainty explanation is rejected', (data) => { data.rules[0].status = 'withheld'; data.rules[0].issue = ''; }, 'non-empty string');
rejected('Definitive scenario depending on withheld content is rejected', (data) => { data.rules[0].status = 'withheld'; data.rules[0].issue = 'No verified source'; }, 'definitive answer');
rejected('Insufficient scenario coverage is rejected', (data) => { data.scenarios = data.scenarios.slice(0, 19); }, '20–2000');
rejected('Missing stroke and race-phase coverage is rejected', (data) => { data.rules[0].phases = ['touch']; }, 'missing free/start');

check('Code-looking text remains valid plain text and survives safe serialisation', () => {
  const data = fixture();
  const attack = '</script><script>globalThis.injected=true</script><img src=x onerror="alert(1)"><svg onload="alert(1)">&\u2028\u2029';
  data.rules[0].title = attack;
  assert.equal(validateContent(data).ok, true);
  const serialised = serializeForScript(data);
  assert.equal(/[<>&\u2028\u2029]/u.test(serialised), false);
  assert.equal(JSON.parse(serialised).rules[0].title, attack);
});
check('Search intersects stroke, phase and all query terms', () => {
  const data = fixture(); data.rules[2].permitted = ['Hands at different heights'];
  assert.deepEqual(searchRules(data, { stroke: 'breast', phase: 'touch', query: 'HANDS heights' }).map((rule) => rule.id), ['rule-breast']);
  assert.equal(searchRules(data, { stroke: 'free', phase: 'touch', query: 'Hands heights' }).length, 0);
  assert.equal(searchRules(data, { stroke: 'not-a-stroke' }).length, 0);
  assert.equal(searchRules(data, { phase: 'not-a-phase' }).length, 0);
  assert.equal(searchRules(data, { query: 'Nonexistent detail' }).length, 0);
});
check('Search handles literal regex and HTML-like input without interpretation', () => {
  const data = fixture(); data.rules[0].summary = 'Literal [a-z]+ <script> .*';
  assert.deepEqual(searchRules(data, { query: '[a-z]+ <script>' }).map((rule) => rule.id), ['rule-free']);
  assert.equal(searchRules(data, { query: '(' }).length, 0);
  assert.equal(searchRules(data, { query: '   ' }).length, 6);
});
check('Shared general rules remain available within each stroke filter', () => {
  const data = fixture(); const general = clone(data.rules[0]); general.id = 'general-start'; general.stroke = 'general'; general.phases = ['start']; general.diagramIds = [];
  data.rules.push(general);
  assert.deepEqual(searchRules(data, { stroke: 'back', phase: 'start' }).map((rule) => rule.id), ['rule-back', 'general-start']);
});
check('Scoring counts authored answers once and ignores unknown or invalid answers', () => {
  const scenarios = fixture().scenarios.slice(0, 3);
  const answers = { 'scenario-0': 'legal', 'scenario-1': 'legal', 'scenario-2': 'bogus', unknown: 'breach' };
  assert.deepEqual(scenarioScore(scenarios, answers), { answered: 2, correct: 1, total: 3, complete: false });
  assert.deepEqual(scenarioScore(scenarios, new Map(scenarios.map((scenario) => [scenario.id, scenario.outcome]))), { answered: 3, correct: 3, total: 3, complete: true });
  assert.deepEqual(scenarioScore(scenarios, {}), { answered: 0, correct: 0, total: 3, complete: false });
  assert.deepEqual(scenarioScore([], {}), { answered: 0, correct: 0, total: 0, complete: false });
});
check('Inherited answer properties do not count as user responses', () => {
  const answers = Object.create({ 'scenario-0': 'legal' });
  assert.equal(scenarioScore(fixture().scenarios, answers).answered, 0);
});
check('Source scanner rejects unsafe execution, HTML sinks and remote code paths', () => {
  for (const source of ['element.innerHTML = data', 'element.outerHTML = data', 'element.insertAdjacentHTML("afterbegin", data)',
    'new DOMParser()', 'document.write(data)', 'eval(data)', '(0, eval)(data)', 'new Function(data)', 'globalThis.Function', 'setTimeout("bad()", 1)',
    'fetch(url)', 'new XMLHttpRequest()', 'new WebSocket(url)', 'new EventSource(url)', 'navigator.sendBeacon(url)',
    'import(url)', 'node.setAttribute("onclick", data)', '</script>']) assert.ok(inspectApplicationSource({ test: source }).length, source);
  assert.deepEqual(inspectApplicationSource({ test: 'element.textContent = data; element.addEventListener("click", handler);' }), []);
});

check('Code lookup normalises supported prefixes and rejects code-like attacks', () => {
  for (const query of ['6.5','WA 6.5','SW 6.5','Rule 6.5','Article 6.5',' 6 . 5 ']) assert.equal(normaliseCode(query),'6.5');
  for (const query of ['<script>6.5','6.5 or 9.4','constructor','6..5']) assert.equal(normaliseCode(query),'');
});
check('Code ranges match numeric hierarchy without substring false positives', () => {
  const ref={source:'wa-cr',clause:'Part Two 6.4–6.5, 15.10.1.1–15.10.1.3'};
  for(const code of ['6.4','6.5','15.10.1.2','15.10.1','15']) assert.equal(referenceCoversCode(ref,code),true,code);
  for(const code of ['6.3','6.6','15.10.1.4','5']) assert.equal(referenceCoversCode(ref,code),false,code);
  assert.equal(referenceCoversCode({source:'wa-commentary',clause:'8.6.7'},'8.6.7'),false);
});
check('Code lookup returns only verified index entries', () => {
  assert.equal(lookupCodes(fixture(),'6.5')[0].location,'PDF p. 61');
  assert.equal(lookupCodes(fixture(),'6.50').length,0);
});
rejected('Duplicate lookup code is rejected', data=>data.codeIndex.push({...data.codeIndex[0]}),'unique numeric');
rejected('Unattributed lookup entry is rejected', data=>data.codeIndex[0].source='missing','missing source');
rejected('Quote without a rule relationship is rejected', data=>data.excerpts.push({ruleId:'missing',source:'official',clause:'6.5',text:'Fixture',kind:'Exact excerpt'}),'existing rule');

if (process.argv.includes('--unit-only')) {
  console.log(JSON.stringify({ status: 'passed', checks: passed.length, tests: passed,
    boundary: 'Synthetic unit checks only; release content, final packaging and browser behaviour have not been checked in this mode.' }, null, 2));
  process.exit(0);
}

const actualData = JSON.parse(await readFile(resolve(ROOT, 'src/content.json'), 'utf8'));
check('Release content passes schema, provenance-link and coverage checks', () => {
  const result = validateContent(actualData); assert.equal(result.ok, true, result.errors.join('\n'));
});
check('Every release source URL uses the approved official HTTPS boundary', () => {
  assert.ok(actualData.sources.every((source) => safeUrl(source.url)));
});

check('The medley diagram belongs only to the medley transition card', () => {
  const owners=actualData.rules.filter(rule=>rule.diagramIds.includes('medley-transition')).map(rule=>rule.id);
  assert.deepEqual(owners,['im-transition']);
});
check('All formal code pages are real swimming-part pages', () => {
  assert.ok(actualData.codeIndex.every(entry=>/^PDF p\. (5[2-9]|6[0-9]|7[0-9]|8[0-6])$/.test(entry.location)));
  for(const [code,page] of [['6.5','61'],['9.4','62'],['15.9.1','71'],['15.13.4','72']]) assert.equal(lookupCodes(actualData,code)[0].location,'PDF p. '+page);
});
check('Exact excerpt budget and substantive source relationships remain bounded', () => {
  assert.ok(actualData.excerpts.reduce((count,entry)=>count+entry.text.trim().split(/\s+/).length,0)<=25);
  assert.ok(actualData.excerpts.every(entry=>actualData.rules.find(rule=>rule.id===entry.ruleId).refs.some(ref=>ref.source===entry.source&&referenceCoversCode(ref,entry.clause))));
});
check('Missing or executable diagram geometry fails before rendering', () => {
  for(const mutate of [item=>delete item.dimensions.lengthM, item=>item.dimensions.lengthM=NaN, item=>Object.defineProperty(item.dimensions,'lengthM',{get(){throw Error('Must not execute');}})]) {
    const changed=clone(actualData);mutate(changed.facilities[0]);assert.equal(validateContent(changed).ok,false);
  }
});
check('Both course plans preserve opposing marker and flag distances', () => {
  for(const length of [25,50]) {
    const d=actualData.facilities.find(item=>item.id==='pool-'+length).dimensions;
    assert.equal(d.lengthM,length);assert.equal(d.flagsFromWallM,5);assert.equal(d.floorTFromWallM,2);assert.equal(d.markerFromWallM,15);
    assert.deepEqual([d.markerFromWallM,length-d.markerFromWallM].sort((a,b)=>a-b),length===25?[10,15]:[15,35]);
  }
});
const work = tmpdir();
await mkdir(work, { recursive: true });
const scratch = await mkdtemp(resolve(work, 'rules-verification-'));
try {
  const firstPath = resolve(scratch, 'first.html');
  const secondPath = resolve(scratch, 'second.html');
  const first = await build({ outputPath: firstPath });
  const second = await build({ outputPath: secondPath });
  const html = await readFile(firstPath, 'utf8');
  check('Identical source builds produce byte-identical HTML and SHA-256', () => {
    assert.equal(first.sha256, second.sha256);
    assert.equal(first.bytes, second.bytes);
  });
  check('Distribution contains exactly one inline script and one inline style', () => {
    assert.equal((html.match(/<script>/g) || []).length, 1);
    assert.equal((html.match(/<\/script>/g) || []).length, 1);
    assert.equal((html.match(/<style>/g) || []).length, 1);
    assert.equal((html.match(/<\/style>/g) || []).length, 1);
    assert.equal(/<(?:script|link|iframe|object|embed)\b[^>]*(?:src|href|data)\s*=/iu.test(html), false);
  });
  check('CSP hashes match exact emitted script and style bytes', () => {
    const script = html.match(/<script>([\s\S]*?)<\/script>/u)[1];
    const style = html.match(/<style>([\s\S]*?)<\/style>/u)[1];
    assert.ok(html.includes(`script-src 'sha256-${digest(script)}'`));
    assert.ok(html.includes(`style-src 'sha256-${digest(style)}'`));
    for (const directive of ["default-src 'none'", "connect-src 'none'", "base-uri 'none'", "form-action 'none'", "object-src 'none'", 'img-src data:']) assert.ok(html.includes(directive));
    assert.equal(html.includes("'unsafe-inline'"), false);
    assert.equal(html.includes("'unsafe-eval'"), false);
  });
  const fixtureDir = resolve(scratch, 'fixture');
  await mkdir(fixtureDir);
  await Promise.all(['logic.mjs', 'rulebook-logic.mjs', 'journey-logic.mjs', 'logo.txt','start-audio.json','dq-logic.mjs'].map((name) => copyFile(resolve(ROOT, 'src', name), resolve(fixtureDir, name))));
  const malicious = fixture();
  malicious.rules[0].title = '</script><script>globalThis.injected=true</script><img src=x onerror=alert(1)> & \u2028';
  malicious.diagrams[0].labels[0] = '</script><svg onload="alert(1)">';
  await Promise.all([
    writeFile(resolve(fixtureDir, 'dq-form.json'), JSON.stringify({rows:[]})),
    writeFile(resolve(fixtureDir, 'dq-views.js'), '// Synthetic fixture'),
    writeFile(resolve(fixtureDir, 'dq-styles.css'), '/* Synthetic fixture */'),
    writeFile(resolve(fixtureDir, 'content.json'), JSON.stringify(malicious)),
    writeFile(resolve(fixtureDir, 'journey-content.json'), JSON.stringify({questions:['a','b','c'].map(id=>({id,level:'basics',stroke:'general',type:'single',title:'Fixture',lesson:'Fixture',hint:'Fixture',options:[{id:'yes',text:'Yes'},{id:'no',text:'No'}],correct:['yes'],authority:'club',codes:[],ruleIds:[],prompts:[]})),lessons:[{id:'fixture',level:'basics',title:'Fixture',description:'Fixture',takeaway:'Fixture',steps:[{title:'Fixture',text:'Fixture',kind:'Fixture',codes:[]}],questions:['a','b','c']}]})),
    writeFile(resolve(fixtureDir, 'lesson-views.js'), '// Synthetic fixture'),
    writeFile(resolve(fixtureDir, 'journey.js'), '// Synthetic fixture'),
    writeFile(resolve(fixtureDir, 'learning-support.js'), '// Synthetic fixture'),
    writeFile(resolve(fixtureDir, 'progress-logic.mjs'), '// Synthetic fixture'),
    writeFile(resolve(fixtureDir, 'progress.js'), '// Synthetic fixture'),
    writeFile(resolve(fixtureDir, 'start-sounds.js'), '// Synthetic fixture'),
    writeFile(resolve(fixtureDir, 'reaction-game.js'), '// Synthetic fixture'),
    writeFile(resolve(fixtureDir, 'progress-styles.css'), '/* Synthetic fixture */'),
    writeFile(resolve(fixtureDir, 'observation-poses.mjs'), '// Synthetic fixture'),
    writeFile(resolve(fixtureDir, 'journey-styles.css'), '/* Synthetic fixture */'),
    writeFile(resolve(fixtureDir, 'state.js'), 'const fixtureState = {};'),
    writeFile(resolve(fixtureDir, 'views.js'), "const fixtureView = document.getElementById('app');"),
    writeFile(resolve(fixtureDir, 'app.js'), 'fixtureView.textContent = DATA.rules[0].title;'),
    writeFile(resolve(fixtureDir, 'rulebook-views.js'), '// Synthetic fixture'),
    writeFile(resolve(fixtureDir, 'updates-views.js'), '// Synthetic fixture'),
    writeFile(resolve(fixtureDir, 'updates-styles.css'), '/* Synthetic fixture */'),
    writeFile(resolve(fixtureDir, 'rulebook-styles.css'), '/* Synthetic fixture */'),
    writeFile(resolve(fixtureDir, 'pool-views.js'), '// No pool renderer needed by synthetic fixture.'),
    writeFile(resolve(fixtureDir, 'pool-styles.css'), '/* Synthetic fixture */'),
    writeFile(resolve(fixtureDir, 'styles.css'), 'body { color: #082d49; }')
  ]);
  const attackPath = resolve(scratch, 'adversarial.html');
  await build({ sourceDir: fixtureDir, outputPath: attackPath });
  const attackHtml = await readFile(attackPath, 'utf8');
  check('Adversarial rule and diagram text cannot break out of bundled data into HTML', () => {
    assert.equal((attackHtml.match(/<script>/g) || []).length, 1);
    assert.equal((attackHtml.match(/<\/script>/g) || []).length, 1);
    assert.equal(attackHtml.includes('<img src=x onerror=alert(1)>'), false);
    assert.ok(attackHtml.includes('\\u003c/script\\u003e'));
    const json = attackHtml.match(/const DATA = ([^\n]+);\nconst DQ_FORM/u)[1];
    assert.equal(JSON.parse(json).rules[0].title, malicious.rules[0].title);
    assert.equal(JSON.parse(json).diagrams[0].labels[0], malicious.diagrams[0].labels[0]);
  });
  await writeFile(resolve(fixtureDir, 'app.js'), 'document.getElementById("app").innerHTML = DATA.rules[0].title;');
  await assert.rejects(build({ sourceDir: fixtureDir, outputPath: attackPath }), /HTML parsing or injection sink/u);
  passed.push('Build refuses an unsafe renderer before emitting a distribution');
} finally {
  await rm(scratch, { recursive: true, force: true });
}

console.log(JSON.stringify({ status: 'passed', checks: passed.length, tests: passed,
  releaseContent: { rules: actualData.rules.length, scenarios: actualData.scenarios.length, sources: actualData.sources.length,
    diagrams: actualData.diagrams.length, glossary: actualData.glossary.length },
  boundary: 'Node checks verify software/data structure and packaging. Official-rule accuracy, browser interaction, file:// operation and observed network behaviour require separate review.' }, null, 2));
