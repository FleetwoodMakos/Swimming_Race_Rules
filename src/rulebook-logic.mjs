/* Search authored rule provisions. No DOM, storage, or network dependency. */
export function normaliseRulebookText(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-GB')
    .replace(/\b(?:world\s+aquatics|part\s+two|wa|sw|rule|article)\s*(?=\d)/g, '')
    .replace(/(\d)\s*\.\s*(?=\d)/g, '$1.')
    .replace(/\b(\d+(?:\.\d+)?)[\s–—-]*(?:metres?|meters?|m)\b/g, '$1m')
    .replace(/\bswim[\s–—-]*off(s)?\b/g, 'swimoff$1')
    .replace(/\banti[\s–—-]*doping\b/g, 'antidoping')
    .replace(/[^a-z0-9.]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function searchRulebook(data, { query = '', category = 'all', dqRows = [] } = {}) {
  const records = Array.isArray(data) ? data : (data?.rulebook || []);
  const normalized = normaliseRulebookText(query);
  const codeAliases = new Map((Array.isArray(data?.ruleAliases) ? data.ruleAliases : []).map(entry => [entry.alias, entry.code]));
  const terms = normalized.split(' ').filter(Boolean).map(term => codeAliases.get(term) || term);
  const aliases = { fly: 'butterfly', im: 'medley' };
  const numericTerms = terms.filter(term => /^\d+\.\d*(?:\.\d*)*$/.test(term) || (terms.length === 1 && /^\d+$/.test(term)));
  const textTerms = terms.filter(term => !numericTerms.includes(term)).map(term => aliases[term] || term);
  const requestedCategory = normaliseRulebookText(category);
  const matches = records.filter(entry => {
    if (category !== 'all' && normaliseRulebookText(entry.category) !== requestedCategory) return false;
    const code = normaliseRulebookText(entry.code);
    // A lone number or dotted code searches a clause family. Numbers in phrases
    // remain searchable facts, so "90 degrees" can find the backstroke position.
    if (!numericTerms.every(term => code === term || code.startsWith(term.endsWith('.') ? term : term + '.'))) return false;
    const haystack = normaliseRulebookText([
      entry.code, entry.category, entry.title, entry.statement, entry.plain, entry.issue,
      ...dqRows.filter(r => r.codes.includes(entry.code)).map(r => r.category + ' ' + r.text)
    ].join(' '));
    const words = haystack.split(' ');
    return textTerms.every(term => words.some(word => word.startsWith(term)));
  });
  // Preserve the authored order, except that an exact code always comes first.
  if (numericTerms.length === 1) {
    const exact = matches.findIndex(entry => normaliseRulebookText(entry.code) === numericTerms[0]);
    if (exact > 0) matches.unshift(...matches.splice(exact, 1));
  }
  return matches;
}

export function searchDqRows(rows, query = '', category = 'all') {
  const terms = normaliseRulebookText(query).split(' ').filter(Boolean);
  const matches = rows.filter(r => (category === 'all' || r.category === category) && terms.every(term => {
    if (/^\d+(?:\.\d+)*$/.test(term)) return [...r.codes, ...r.relatedCodes].some(code => code === term || code.startsWith(term + '.'));
    return normaliseRulebookText([r.category, r.text].join(' ')).split(' ').some(word => word.startsWith(term === 'fly' ? 'butterfly' : term));
  }));
  const code = terms.find(term => /^\d+(?:\.\d+)*$/.test(term));
  if(code) matches.sort((a,b) => Number(b.codes.includes(code)) - Number(a.codes.includes(code)));
  return matches;
}
