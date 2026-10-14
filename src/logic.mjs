/* Shared, side-effect-free content and learning logic. */
const STROKE_IDS = ['free', 'back', 'breast', 'fly', 'im', 'relay', 'general'];
const LEARNING_STROKES = STROKE_IDS.filter((value) => value !== 'general');
const PHASE_IDS = ['start', 'underwater', 'swimming', 'approach', 'touch', 'departure', 'finish'];
const RULE_OUTCOME_IDS = ['legal', 'breach', 'more'];
const OFFICIAL_HOSTS = new Set([
  'www.microleaguenw.org.uk','worldathletics.org','api.fia.com','www.omegatiming.com','fepsy.com','www.frontiersin.org','pmc.ncbi.nlm.nih.gov', 'www.worldaquatics.com', 'resources.fina.org', 'www.swimming.org', 'www.britishswimming.org', 'www.aquaticsgb.com',
  'eastmidlandswimming.org', 'www.eastmidlandswimming.org', 'swimnorthwest.org', 'www.swimnorthwest.org'
]);

export function safeUrl(value) {
  if (typeof value !== 'string' || value.length > 2048 || /[\s\u0000-\u001f\u007f\\]/u.test(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password &&
      !parsed.port && OFFICIAL_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function validateContent(data) {
  const errors = [];
  const error = (path, message) => { if (errors.length < 160) errors.push(`${path}: ${message}`); };
  const object = (value, fields, path) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) {
      error(path, 'must be a plain record');
      return false;
    }
    const keys = Reflect.ownKeys(value);
    for (const key of keys) {
      if (typeof key !== 'string' || !fields.includes(key)) error(path, `unexpected field ${String(key)}`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor && ('get' in descriptor || 'set' in descriptor)) {
        error(path, 'accessor fields are not data');
        return false;
      }
    }
    for (const key of fields) if (!Object.hasOwn(value, key)) error(path, `missing field ${key}`);
    return true;
  };
  const string = (value, path, empty = false, limit = 12000) => {
    if (typeof value !== 'string' || value.length > limit || (!empty && !value.trim())) {
      error(path, `must be ${empty ? 'a' : 'a non-empty'} string of at most ${limit} characters`);
      return false;
    }
    return true;
  };
  const list = (value, path, minimum = 0) => {
    if (!Array.isArray(value) || value.length < minimum || value.length > 2000) {
      error(path, `must be an array with ${minimum}–2000 entries`);
      return false;
    }
    return true;
  };
  const strings = (value, path, minimum = 0, unique = false) => {
    if (!list(value, path, minimum)) return false;
    value.forEach((entry, index) => string(entry, `${path}[${index}]`));
    if (unique && new Set(value).size !== value.length) error(path, 'contains duplicate entries');
    return true;
  };
  const id = (value, path) => {
    if (typeof value !== 'string' || !/^[a-z][a-z0-9_-]{0,79}$/.test(value)) error(path, 'must be a stable lowercase identifier');
  };
  const oneOf = (value, options, path) => { if (!options.includes(value)) error(path, `must be one of ${options.join(', ')}`); };
  const date = (value, path) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
      error(path, 'must be a real date in YYYY-MM-DD form');
    }
  };
  const collect = (value, path, minimum, fields, check) => {
    const result = new Map();
    if (!list(value, path, minimum)) return result;
    value.forEach((entry, index) => {
      const here = `${path}[${index}]`;
      if (!object(entry, fields, here)) return;
      id(entry.id, `${here}.id`);
      if (result.has(entry.id)) error(`${here}.id`, 'duplicate identifier');
      result.set(entry.id, entry);
      check(entry, here);
    });
    return result;
  };

  if (!object(data, ['meta', 'sources', 'rules', 'scenarios', 'diagrams', 'glossary', 'facilities', 'codeIndex', 'excerpts', 'rulebook', 'ruleAliases', 'updates'], 'content')) return { ok: false, errors };
  if (object(data.meta, ['appVersion', 'contentVersion', 'verified', 'scope', 'reviewStatus', 'limitations', 'changelog'], 'meta')) {
    for (const key of ['appVersion', 'contentVersion', 'scope', 'reviewStatus']) string(data.meta[key], `meta.${key}`);
    date(data.meta.verified, 'meta.verified');
    strings(data.meta.limitations, 'meta.limitations', 1);
    strings(data.meta.changelog, 'meta.changelog', 1);
  }
  const sources = collect(data.sources, 'sources', 1,
    ['id', 'title', 'organisation', 'url', 'version', 'effective', 'verified', 'location', 'notes'], (record, path) => {
      for (const key of ['title', 'organisation', 'version', 'effective', 'location']) string(record[key], `${path}.${key}`);
      string(record.notes, `${path}.notes`, true);
      date(record.verified, `${path}.verified`);
      if (!safeUrl(record.url)) error(`${path}.url`, 'must be an HTTPS URL on an approved official source host, without credentials or a custom port');
    });
  const rules = collect(data.rules, 'rules', 1,
    ['id', 'stroke', 'phases', 'title', 'summary', 'formal', 'requirements', 'permitted', 'exceptions', 'observation', 'breach', 'misconception', 'reminder', 'refs', 'status', 'issue', 'diagramIds'], (record, path) => {
      oneOf(record.stroke, STROKE_IDS, `${path}.stroke`);
      if (strings(record.phases, `${path}.phases`, 1, true)) record.phases.forEach((phase) => oneOf(phase, PHASE_IDS, `${path}.phases`));
      for (const key of ['title', 'summary', 'observation', 'breach', 'misconception', 'reminder']) string(record[key], `${path}.${key}`);
      for (const key of ['requirements', 'permitted', 'exceptions']) strings(record[key], `${path}.${key}`);
      oneOf(record.status, ['verified', 'withheld'], `${path}.status`);
      string(record.issue, `${path}.issue`, record.status !== 'withheld');
      strings(record.diagramIds, `${path}.diagramIds`, 0, true);
      if (list(record.formal, `${path}.formal`, 1)) record.formal.forEach((entry, index) => {
        const entryPath = `${path}.formal[${index}]`;
        if (!object(entry, ['code', 'text', 'source', 'location'], entryPath)) return;
        for (const key of ['code', 'text', 'source', 'location']) string(entry[key], `${entryPath}.${key}`);
        if (!sources.has(entry.source)) error(entryPath, 'formal statement references a missing source');
      });
      if (list(record.refs, `${path}.refs`, record.status === 'verified' ? 1 : 0)) record.refs.forEach((ref, index) => {
        const refPath = `${path}.refs[${index}]`;
        if (!object(ref, ['source', 'clause', 'location'], refPath)) return;
        for (const key of ['source', 'clause', 'location']) string(ref[key], `${refPath}.${key}`);
        if (!sources.has(ref.source)) error(`${refPath}.source`, 'references a missing source');
      });
    });
  const scenarios = collect(data.scenarios, 'scenarios', 20,
    ['id', 'stroke', 'phase', 'title', 'facts', 'outcome', 'explanation', 'ruleIds'], (record, path) => {
      oneOf(record.stroke, STROKE_IDS, `${path}.stroke`);
      oneOf(record.phase, PHASE_IDS, `${path}.phase`);
      oneOf(record.outcome, RULE_OUTCOME_IDS, `${path}.outcome`);
      for (const key of ['title', 'facts', 'explanation']) string(record[key], `${path}.${key}`);
      strings(record.ruleIds, `${path}.ruleIds`, 1, true);
    });
  const diagrams = collect(data.diagrams, 'diagrams', 1,
    ['id', 'type', 'title', 'caption', 'labels', 'ruleIds'], (record, path) => {
      oneOf(record.type, ['hands', 'turn', 'sequence'], `${path}.type`);
      for (const key of ['title', 'caption']) string(record[key], `${path}.${key}`);
      if (strings(record.labels, `${path}.labels`) && record.labels.length !== 6) error(`${path}.labels`, 'must contain exactly six text labels');
      strings(record.ruleIds, `${path}.ruleIds`, 1, true);
    });
  const glossary = collect(data.glossary, 'glossary', 1,
    ['id', 'term', 'definition', 'ruleIds'], (record, path) => {
      for (const key of ['term', 'definition']) string(record[key], `${path}.${key}`);
      strings(record.ruleIds, `${path}.ruleIds`, 1, true);
    });
  for (const [kind, collection] of [['scenarios', scenarios], ['diagrams', diagrams], ['glossary', glossary]]) {
    for (const record of collection.values()) {
      if (!Array.isArray(record.ruleIds)) continue;
      for (const ruleId of record.ruleIds) {
        if (!rules.has(ruleId)) error(`${kind}.${record.id}.ruleIds`, `missing rule ${ruleId}`);
        else if (kind === 'scenarios' && record.outcome !== 'more' && rules.get(ruleId).status !== 'verified') {
          error(`${kind}.${record.id}`, 'a definitive answer cannot depend on a withheld rule');
        }
      }
    }
  }
  for (const rule of rules.values()) {
    if (!Array.isArray(rule.diagramIds)) continue;
    for (const diagramId of rule.diagramIds) {
      if (!diagrams.has(diagramId)) error(`rules.${rule.id}.diagramIds`, `missing diagram ${diagramId}`);
      else if (!Array.isArray(diagrams.get(diagramId).ruleIds) || !diagrams.get(diagramId).ruleIds.includes(rule.id)) {
        error(`rules.${rule.id}.diagramIds`, `diagram ${diagramId} must link back to this rule`);
      }
    }
  }
  // Evidence relationships do not determine display placement. A diagram may
  // draw on several rules while belonging in only one learning context.
  const reference = (ref, path) => {
    if (!object(ref, ['source', 'clause', 'location'], path)) return;
    for (const key of ['source', 'clause', 'location']) string(ref[key], `${path}.${key}`);
    if (!sources.has(ref.source)) error(path, 'references a missing source');
  };
  collect(data.facilities, 'facilities', 0,
    ['id', 'type', 'title', 'summary', 'scope', 'refs', 'dimensions', 'labels', 'notes'], (record, path) => {
      oneOf(record.type, ['pool', 'block', 'ledge', 'markings'], `${path}.type`);
      for (const key of ['title', 'summary', 'scope']) string(record[key], `${path}.${key}`);
      strings(record.notes, `${path}.notes`);
      if (list(record.refs, `${path}.refs`, 1)) record.refs.forEach((ref, i) => reference(ref, `${path}.refs[${i}]`));
      if (record.dimensions === null || typeof record.dimensions !== 'object' || Array.isArray(record.dimensions) || ![Object.prototype, null].includes(Object.getPrototypeOf(record.dimensions))) error(path, 'dimensions must be a plain numeric record');
      else for (const key of Reflect.ownKeys(record.dimensions)) {
        const descriptor = Object.getOwnPropertyDescriptor(record.dimensions, key);
        if (typeof key !== 'string' || !/^[a-z][a-zA-Z0-9]*$/.test(key) || !descriptor || !Object.hasOwn(descriptor, 'value') || !Number.isFinite(descriptor.value) || descriptor.value < 0 || descriptor.value > 10000) error(path, 'dimensions must contain safe finite non-negative numbers');
      }
      const requiredDimensions = {
        pool: ['lengthM','flagsFromWallM','flagsAboveWaterM','markerFromWallM','ropeRedFromWallM','floorTFromWallM','floorCrossbarM','floorLineMinM','floorLineMaxM','markerCrossbarM','midpointM','illustrativeLanes'],
        markings: ['lengthM','floorTFromWallM','floorCrossbarM','floorLineMinM','floorLineMaxM','ropeRedFromWallM','markerFromWallM','markerCrossbarM','flagsFromWallM','flagsAboveWaterM','wallCrossbarM','wallCrossbarBelowWaterM'],
        block: ['platformHeightMinM','platformHeightMaxM','platformWidthMinM','platformDepthMinM','platformSlopeMaxDegrees','gripHeightMinM','gripHeightMaxM','depthMinM','depthZoneStartM','depthZoneEndMinM'],
        ledge: ['adjustmentAboveM','adjustmentBelowM','lengthMinM','heightM','widthM','slopeDegrees']
      }[record.type] || [];
      for (const key of requiredDimensions) {
        const descriptor = record.dimensions && Object.getOwnPropertyDescriptor(record.dimensions, key);
        if (!descriptor || !Object.hasOwn(descriptor, 'value') || !Number.isFinite(descriptor.value) || descriptor.value <= 0) error(`${path}.dimensions.${key}`, 'missing or invalid positive measurement');
      }
      if (list(record.labels, `${path}.labels`, 1)) {
        const ids = new Set();
        record.labels.forEach((label, i) => {
          const here = `${path}.labels[${i}]`;
          if (!object(label, ['id', 'label', 'text'], here)) return;
          if (!Number.isInteger(label.id) || label.id < 1 || label.id > 99 || ids.has(label.id)) error(here, 'label IDs must be unique integers from 1 to 99');
          ids.add(label.id); string(label.label, here); string(label.text, here);
        });
      }
    });
  if (list(data.codeIndex, 'codeIndex', 1)) {
    const codes = new Set();
    data.codeIndex.forEach((entry, i) => {
      const path = `codeIndex[${i}]`;
      if (!object(entry, ['code', 'source', 'location'], path)) return;
      if (typeof entry.code !== 'string' || !/^\d+(?:\.\d+)*$/.test(entry.code) || codes.has(entry.code)) error(path, 'code must be a unique numeric clause identifier');
      codes.add(entry.code);
      if (!sources.has(entry.source)) error(path, 'references a missing source');
      string(entry.location, `${path}.location`);
    });
  }
  if (list(data.excerpts, 'excerpts')) data.excerpts.forEach((entry, i) => {
    const path = `excerpts[${i}]`;
    if (!object(entry, ['ruleId', 'source', 'clause', 'text', 'kind'], path)) return;
    if (!rules.has(entry.ruleId) || !sources.has(entry.source)) error(path, 'excerpt must reference an existing rule and source');
    for (const key of ['clause', 'text']) string(entry[key], `${path}.${key}`);
    oneOf(entry.kind, ['Exact rule', 'Exact excerpt'], `${path}.kind`);
  });
  if (list(data.rulebook, 'rulebook', 1)) {
    const seen = new Set();
    data.rulebook.forEach((entry, i) => {
      const path = `rulebook[${i}]`;
      if (!object(entry, ['code','category','title','statement','plain','source','location','status','issue','relatedRuleIds'], path)) return;
      if (typeof entry.code !== 'string' || !/^\d+(?:\.\d+)*$/.test(entry.code) || seen.has(entry.code)) error(path, 'code must be a unique numeric clause identifier');
      seen.add(entry.code);
      for (const key of ['category','title','statement','plain','location']) string(entry[key], `${path}.${key}`);
      if (!sources.has(entry.source)) error(path, 'rulebook statement references a missing source');
      oneOf(entry.status, ['verified','withheld'], `${path}.status`);
      string(entry.issue, `${path}.issue`, entry.status !== 'withheld');
      if (strings(entry.relatedRuleIds, `${path}.relatedRuleIds`, 0, true)) for (const ruleId of entry.relatedRuleIds) if (!rules.has(ruleId)) error(path, 'related rule is missing');
    });
  }
  const masterCodes = new Set(Array.isArray(data.rulebook) ? data.rulebook.filter(Boolean).map(entry => entry.code) : []);
  if (list(data.ruleAliases, 'ruleAliases')) {
    const aliases = new Set();
    data.ruleAliases.forEach((entry, i) => {
      const path = `ruleAliases[${i}]`;
      if (!object(entry, ['alias','code','source','location','note'], path)) return;
      if (typeof entry.alias !== 'string' || !/^\d+(?:\.\d+)*$/.test(entry.alias) || aliases.has(entry.alias) || masterCodes.has(entry.alias)) error(path, 'alias must be a unique numeric identifier distinct from master codes');
      aliases.add(entry.alias);
      if (!masterCodes.has(entry.code)) error(path, 'alias target must be an existing master rule');
      if (!sources.has(entry.source)) error(path, 'alias references a missing source');
      for (const key of ['location','note']) string(entry[key], `${path}.${key}`);
    });
  }
  collect(data.updates, 'updates', 1, ['id','title','label','summary','points','scope','relatedCodes','refs'], (entry, path) => {
    for (const key of ['title','label','summary']) string(entry[key], `${path}.${key}`);
    string(entry.scope, `${path}.scope`, true);
    strings(entry.points, `${path}.points`, 1);
    if (strings(entry.relatedCodes, `${path}.relatedCodes`, 0, true)) for (const code of entry.relatedCodes) if (!masterCodes.has(code)) error(path, 'update links to a missing master rule');
    if (list(entry.refs, `${path}.refs`, 1)) entry.refs.forEach((ref, i) => {
      const here = `${path}.refs[${i}]`;
      if (!object(ref, ['source','clause','location'], here)) return;
      for (const key of ['source','clause','location']) string(ref[key], `${here}.${key}`);
      if (!sources.has(ref.source)) error(here, 'update references a missing source');
    });
  });
  for (const stroke of LEARNING_STROKES) {
    for (const phase of PHASE_IDS) {
      if (![...rules.values()].some((rule) => (rule.stroke === stroke || rule.stroke === 'general') && Array.isArray(rule.phases) && rule.phases.includes(phase))) {
        error('coverage', `missing ${stroke}/${phase} guidance`);
      }
    }
    if (![...scenarios.values()].some((scenario) => scenario.stroke === stroke)) error('coverage', `missing ${stroke} scenario`);
  }
  for (const phase of PHASE_IDS) {
    if (![...scenarios.values()].some((scenario) => scenario.phase === phase)) error('coverage', `missing ${phase} scenario`);
  }
  return { ok: errors.length === 0, errors };
}

export function searchRules(data, { stroke = 'all', phase = 'all', query = '' } = {}) {
  const labels = { free: 'freestyle', back: 'backstroke', breast: 'breaststroke', fly: 'butterfly', im: 'individual medley', relay: 'medley relay', general: 'all strokes general' };
  const terms = String(query).trim().toLocaleLowerCase('en-GB').split(/\s+/u).filter(Boolean);
  const sources = new Map(data.sources.map((source) => [source.id, source]));
  return data.rules.filter((rule) => {
    if (stroke !== 'all' && (!STROKE_IDS.includes(stroke) || (rule.stroke !== stroke && rule.stroke !== 'general'))) return false;
    if (phase !== 'all' && !rule.phases.includes(phase)) return false;
    const linkedSources = rule.refs.map((ref) => `${ref.clause} ${sources.get(ref.source)?.title || ''}`).join(' ');
    const haystack = [rule.title, rule.summary, labels[rule.stroke], ...rule.phases,
      ...rule.requirements, ...rule.permitted, ...rule.exceptions, rule.observation,
      rule.breach, rule.misconception, rule.reminder, rule.issue, linkedSources].join(' ').toLocaleLowerCase('en-GB');
    return terms.every((term) => haystack.includes(term));
  });
}

export function scenarioScore(scenarios, answers) {
  let answered = 0;
  let correct = 0;
  for (const scenario of scenarios) {
    const answer = answers instanceof Map ? answers.get(scenario.id) : Object.hasOwn(answers || {}, scenario.id) ? answers[scenario.id] : undefined;
    if (!RULE_OUTCOME_IDS.includes(answer)) continue;
    answered += 1;
    if (answer === scenario.outcome) correct += 1;
  }
  return { answered, correct, total: scenarios.length, complete: scenarios.length > 0 && answered === scenarios.length };
}

export function normaliseCode(value) {
  const match = String(value).trim().match(/^(?:(?:wa|sw|rule|article|part\s+two)\s*)?(\d+(?:\s*\.\s*\d+)*)\.?$/i);
  return match ? match[1].replace(/\s/g, '') : '';
}

export function referenceCoversCode(reference, code) {
  if (reference.source !== 'wa-cr' || !normaliseCode(code)) return false;
  const parts = value => value.split('.').map(Number);
  const compare = (left, right) => {
    const a = parts(left), b = parts(right);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) - (b[i] || 0);
    }
    return 0;
  };
  return (reference.clause.match(/\d+(?:\.\d+)*(?:[–-]\d+(?:\.\d+)*)?/g) || []).some(token => {
    const [start, end] = token.split(/[–-]/);
    if (!end) return code === start || code.startsWith(start + '.') || start.startsWith(code + '.');
    return (compare(code, start) >= 0 && (compare(code, end) <= 0 || code.startsWith(end + '.'))) || start.startsWith(code + '.');
  });
}

export function lookupCodes(data, query) {
  const code = normaliseCode(query);
  if (!code) return [];
  return data.codeIndex.filter(entry => entry.code === code || entry.code.startsWith(code + '.'));
}
