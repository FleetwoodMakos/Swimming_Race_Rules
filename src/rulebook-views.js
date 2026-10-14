/* Local rule text and a shared, live search for the lookup and master table. */
function rulebookCategories() {
  return [['all', 'All strokes and areas'], ...[...new Set(DATA.rulebook.map(entry => entry.category))].map(category => [category, category])];
}

function rulebookControls(main, table = false) {
  const prefix = table ? 'master' : 'rulebook';
  const controls = node('div', null, 'rulebook-controls');
  const search = node('div', null, 'search-wrap');
  const label = node('label', 'Search by code, stroke or part of a rule');
  label.htmlFor = prefix + '-search';
  const input = node('input');
  input.type = 'search';
  input.id = prefix + '-search';
  input.placeholder = 'Try “6.5”, “backstroke finish” or “15 metres”…';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.value = table ? state.tableQuery : state.codeQuery;
  input.setAttribute('aria-controls', prefix + '-results');
  append(search, label, input);
  append(controls, search,
    selectControl('Stroke or rule area', prefix + '-category', rulebookCategories(), table ? state.tableCategory : state.ruleCategory),
    button('Clear search and filters', table ? 'table-clear' : 'rulebook-clear', undefined, 'button secondary'));
  main.append(controls);
  const status = node('p', '', 'result-count rulebook-count');
  status.id = prefix + '-count';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  main.append(status);
  const results = node('div', null, table ? 'master-results' : 'rulebook-results');
  results.id = prefix + '-results';
  main.append(results);
  renderRulebookResults(results);
}

function rulebookLookup(main) {
  append(main, hero('CODE, STROKE OR RULE WORDING', 'Find a rule',
    'Start typing to narrow the rules immediately. Read the requirement and its plain-English explanation here. The rule statements are written in this app’s own words and carry the official reference code.'),
    node('p', 'Complete swimming section: World Aquatics Part Two, sections 1–17, including officials, seeding, timing, records, eligibility, safety and appendix guides. Related Swim England provisions are included separately. Search a chapter number to see its provisions.', 'small-note'));
  const shortcuts = node('div', null, 'code-shortcuts');
  for (const [code, title] of [['5.3', '5.3 · Freestyle underwater'], ['6.5', '6.5 · Backstroke finish'], ['7.7', '7.7 · Breaststroke touch'], ['9.4', '9.4 · Medley transitions']]) {
    shortcuts.append(button(title, 'clause', code, 'stroke-button'));
  }
  append(main, shortcuts, button('View the master rules table', 'area', 'table', 'text-button'));
  rulebookControls(main);
}

function masterRules(main) {
  append(main, hero('COMPLETE SWIMMING SECTION · PART TWO 1–17', 'Master rules table',
    'Every substantive swimming provision, from racing and officials to seeding, timing, world records, eligibility, pool equipment and safety. The ten pool-layout appendices have their own guides. Search as you type or choose an area.'),
    node('p', 'Requirements and appendix guides are original restatements, with official codes and a separate plain-English explanation. Chapter headings are covered by their numbered provisions. Related Swim England provisions are also included; other aquatic sports and separate Part One rules are outside this table.', 'small-note'));
  rulebookControls(main, true);
}

function rulebookIssue(entry) {
  if (!entry.issue && entry.status !== 'withheld') return null;
  const label = entry.status !== 'withheld' ? 'Source note · ' : 'Review needed · ';
  return node('p', label + entry.issue, 'notice rulebook-issue');
}

function rulebookProvenance(entry) {
  const details = node('details', null, 'rulebook-provenance');
  append(details, node('summary', 'Official source and related learning'));
  details.append(refs({refs:[{source:entry.source, clause:entry.code, location:entry.location}]}));
  for (const alias of DATA.ruleAliases.filter(item => item.code === entry.code)) details.append(refs({refs:[{source:alias.source,clause:alias.alias,location:alias.location}]}));
  if (entry.issue.includes('August') && !DATA.ruleAliases.some(item => item.code === entry.code)) details.append(refs({refs:[{source:'wa-commentary',clause:'Commentary on '+entry.code,location:['2.3.5','2.3.6','3.2.4.4.4','3.3.5','5.4'].includes(entry.code)?'PDF p. 1':'PDF p. 2'}]}));
  for (const id of entry.relatedRuleIds) {
    const rule = ruleById(id);
    if (rule) details.append(button(rule.title, 'rule', id, 'text-button'));
  }
  return details;
}

function rulebookClause(entry, heading = 'h3') {
  const card = node('article', null, 'rule-card rulebook-card');
  card.dataset.code = entry.code;
  const top = node('div', null, 'rulebook-card-top');
  append(top, node('span', 'Rule ' + entry.code, 'rulebook-code'), node('span', entry.category, 'pill'));
  append(card, top, node(heading, entry.title));
  for (const alias of DATA.ruleAliases.filter(item => item.code === entry.code)) card.append(node('p', alias.note, 'small-note'));
  const requirement = node('section', null, 'rulebook-requirement');
  append(requirement, node('h4', entry.code.startsWith('17.') && entry.source === 'wa-cr' ? 'Appendix guide · restated' : 'Rule requirement · restated'), node('p', entry.statement));
  const plain = node('section', null, 'rulebook-plain');
  append(plain, node('h4', 'In plain English'), node('p', entry.plain));
  append(card, requirement, plain, rulebookIssue(entry), rulebookProvenance(entry));
  return card;
}

function renderRulebookResults(area) {
  const table = state.area === 'table';
  const prefix = table ? 'master' : 'rulebook';
  area = area || document.getElementById(prefix + '-results');
  if (!area) return;
  const query = table ? state.tableQuery : state.codeQuery;
  const category = table ? state.tableCategory : state.ruleCategory;
  const matches = searchRulebook(DATA, { query, category });
  const status = document.getElementById(prefix + '-count');
  if (status) status.textContent = matches.length + ' of ' + DATA.rulebook.length + ' rule provisions' + (query.trim() ? ' matching “' + query.trim() + '”' : '') + (category !== 'all' ? ' · ' + category : ' · All strokes and areas');
  area.replaceChildren();
  if (!matches.length) {
    append(area, node('p', 'No matching rule provisions. Try fewer words, a shorter code, or all strokes and areas.', 'empty'),
      button('Clear search and filters', table ? 'table-clear' : 'rulebook-clear', undefined, 'button secondary'));
    return;
  }
  if (table) area.append(rulebookTable(matches));
  else for (const entry of matches) area.append(rulebookClause(entry));
}

function rulebookTable(entries) {
  const table = node('table', null, 'master-rule-table');
  table.setAttribute('role', 'table');
  const caption = node('caption', 'All rule provisions included in this app' + (entries.length !== DATA.rulebook.length ? ' · filtered view' : ''));
  const head = node('thead');
  head.setAttribute('role', 'rowgroup');
  const headings = node('tr');
  headings.setAttribute('role', 'row');
  for (const title of ['Code', 'Stroke / area', 'Requirement / appendix guide · restated', 'In plain English']) {
    const cell = node('th', title);
    cell.scope = 'col';
    cell.setAttribute('role', 'columnheader');
    headings.append(cell);
  }
  head.append(headings);
  const body = node('tbody');
  body.setAttribute('role', 'rowgroup');
  for (const entry of entries) {
    const row = node('tr');
    row.dataset.code = entry.code;
    row.setAttribute('role', 'row');
    const code = node('th');
    code.scope = 'row';
    code.dataset.label = 'Code';
    code.setAttribute('role', 'rowheader');
    code.append(button(entry.code, 'clause', entry.code, 'text-button rulebook-code-button'));
    const category = node('td', entry.category);
    category.dataset.label = 'Stroke / area';
    const requirement = node('td');
    requirement.dataset.label = 'Rule requirement · restated';
    append(requirement, node('strong', entry.title, 'master-rule-title'), node('p', entry.statement), rulebookIssue(entry));
    for (const alias of DATA.ruleAliases.filter(item => item.code === entry.code)) requirement.append(node('p', alias.note, 'small-note'));
    const plain = node('td');
    plain.dataset.label = 'In plain English';
    append(plain, node('p', entry.plain), rulebookProvenance(entry));
    for (const cell of [category, requirement, plain]) cell.setAttribute('role', 'cell');
    append(row, code, category, requirement, plain);
    body.append(row);
  }
  append(table, caption, head, body);
  return table;
}

function showClause(code) {
  const entry = DATA.rulebook.find(item => item.code === code);
  if (!entry) return;
  document.getElementById('rule-dialog')?.remove();
  const dialog = node('dialog');
  dialog.id = 'rule-dialog';
  dialog.setAttribute('aria-label', 'Rule ' + entry.code + ': ' + entry.title);
  append(dialog, button('Close rule', 'close', undefined, 'button close'), rulebookClause(entry, 'h2'));
  root.append(dialog);
  dialog.showModal();
}
