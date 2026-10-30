/* Supplied report-card wording is kept separate from the canonical rulebook. */
export function validateDqForm(form, data) {
  if (!form || !Array.isArray(form.rows)) throw new Error('DQ form rows are required');
  const ids = new Set();
  for (const r of form.rows) {
    if (!r.id || ids.has(r.id) || !r.text || !r.category || !Array.isArray(r.codes) || !r.codes.length || !Array.isArray(r.relatedCodes)) throw new Error('Invalid DQ row');
    ids.add(r.id);
    for (const code of [...r.codes, ...r.relatedCodes]) if (!data.rulebook.some(entry => entry.code === code)) throw new Error('DQ code not in rulebook: ' + code);
  }
}
