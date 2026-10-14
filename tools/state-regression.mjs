import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script, createContext } from 'node:vm';
import { validateContent, safeUrl } from '../src/logic.mjs';

// Executes the actual state and controller source against a minimal test harness.
// This is a state/storage regression test, not a DOM or browser implementation.
const [stateSource, controllerSource, releaseText] = await Promise.all([
  readFile(new URL('../src/state.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/content.json', import.meta.url), 'utf8')
]);
const release = JSON.parse(releaseText);
const results = [];

function harness({ saved = null, denyRead = false, denyWrite = false, denyStorageAccess = false } = {}) {
  const data = structuredClone(release);
  data.scenarios[0].id = 'constructor';
  assert.equal(validateContent(data).ok, true, 'Reserved-name regression fixture must be valid content');
  const listeners = new Map();
  const writes = [];
  const observed = { renders: 0, searchFocus: 0 };
  const root = {
    addEventListener(type, listener) {
      assert.equal(listeners.has(type), false, `Duplicate ${type} handler`);
      listeners.set(type, listener);
    },
    append() { throw new Error('Valid fixture unexpectedly reached validation-error rendering'); }
  };
  const sandbox = {
    DATA: data,
    location: {hash: ""},
    document: { getElementById(id) {
      return id === 'app' ? root : id === 'search' ? { focus() { observed.searchFocus++; } } : null;
    } },
    validateContent,
    safeUrl,
    render() { observed.renders++; },
    renderResults() {},
    currentScenarios() { return data.scenarios; },
    showRule() { throw new Error('Unexpected rule-dialog operation in state test'); }
  };
  if (denyStorageAccess) {
    Object.defineProperty(sandbox, 'localStorage', { get() { throw new Error('Storage access denied'); } });
  } else {
    sandbox.localStorage = {
      getItem() { if (denyRead) throw new Error('Storage read denied'); return saved; },
      setItem(key, value) { if (denyWrite) throw new Error('Storage write denied'); writes.push({ key, value }); }
    };
  }
  const context = createContext(sandbox);
  new Script(stateSource, { filename: 'src/state.js' }).runInContext(context);
  new Script(controllerSource, { filename: 'src/app.js' }).runInContext(context);
  const inspect = (expression) => new Script(expression).runInContext(context);
  const click = (action, value) => {
    const button = { disabled: false, dataset: { action, value } };
    listeners.get('click')({ target: { closest() { return button; } } });
  };
  return { data, writes, observed, inspect, click };
}

function check(name, action) { action(); results.push(name); }

check('A valid scenario named constructor begins unanswered and accepts its first answer', () => {
  const h = harness();
  assert.equal(h.inspect('state.answers.constructor'), undefined);
  assert.equal(Object.getPrototypeOf(h.inspect('state.answers')), null);
  h.click('answer', 'legal');
  assert.equal(h.inspect('state.answers.constructor'), 'legal');
  assert.equal(JSON.parse(h.writes.at(-1).value).constructor, 'legal');
  h.click('answer', 'breach');
  assert.equal(h.inspect('state.answers.constructor'), 'legal', 'Answer must not change after first submission');
});

check('Reset clears reserved-name progress and permits a new answer', () => {
  const h = harness();
  h.click('answer', 'legal');
  h.click('reset');
  assert.equal(h.inspect('state.answers.constructor'), undefined);
  assert.equal(Object.getPrototypeOf(h.inspect('state.answers')), null);
  assert.deepEqual(JSON.parse(h.writes.at(-1).value), {});
  h.click('answer', 'breach');
  assert.equal(h.inspect('state.answers.constructor'), 'breach');
});

check('Persisted reserved-name progress reloads without inheriting other answers', () => {
  const h = harness({ saved: '{"constructor":"legal","unknown":"breach","s02":"executable"}' });
  assert.equal(h.inspect('state.answers.constructor'), 'legal');
  assert.equal(h.inspect('Object.hasOwn(state.answers, "unknown")'), false);
  assert.equal(h.inspect('Object.hasOwn(state.answers, "s02")'), false);
});

check('Storage getter denial permits startup, answering and reset in memory', () => {
  const h = harness({ denyStorageAccess: true });
  assert.equal(h.observed.renders, 1);
  h.click('answer', 'legal');
  assert.equal(h.inspect('state.answers.constructor'), 'legal');
  h.click('reset');
  assert.equal(h.inspect('state.answers.constructor'), undefined);
});

check('Read and write exceptions leave in-memory practice usable', () => {
  const h = harness({ denyRead: true, denyWrite: true });
  assert.equal(h.observed.renders, 1);
  h.click('answer', 'more');
  assert.equal(h.inspect('state.answers.constructor'), 'more');
  assert.equal(h.writes.length, 0);
});

check('Malformed persisted JSON cannot prevent startup or answering', () => {
  const h = harness({ saved: '{broken json' });
  assert.equal(h.observed.renders, 1);
  h.click('answer', 'legal');
  assert.equal(h.inspect('state.answers.constructor'), 'legal');
});

check('Clearing filters requests focus on the surviving search control', () => {
  const h = harness();
  h.inspect('state.query = "no matches"; state.stroke = "fly"; state.phase = "finish";');
  h.click('clear');
  assert.equal(h.inspect('state.query'), '');
  assert.equal(h.inspect('state.stroke'), 'all');
  assert.equal(h.inspect('state.phase'), 'all');
  assert.equal(h.observed.searchFocus, 1);
});

console.log(JSON.stringify({ status: 'passed', checks: results.length, tests: results,
  boundary: 'Actual state/controllers with mocked document, render and storage. These checks do not establish real browser focus, storage policy, visual layout or offline operation.' }, null, 2));
