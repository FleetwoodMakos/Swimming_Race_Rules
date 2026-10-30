let dqQuery = '', dqCategory = 'all';
function dqDownload() {
  const bytes = Uint8Array.from(atob(DQ_PDF), c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], {type:'application/pdf'}));
  const link = node('a'); link.href = url; link.download = 'AGB_DQ_FORM_FINAL.pdf';
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  const status = document.getElementById('dq-download-status');
  if (status) status.textContent = 'PDF ready to save. Open the saved file to view or print both pages.';
}
function dqReferenceCard() {
  const card = node('section', null, 'rule-card dq-download-card');
  append(card, node('p','THE OFFICIALS’ REPORT FORM','eyebrow'),node('h3','Understand a disqualification'),
    node('p','Download the original Aquatics GB card, or explore every tick-box reason with its rule code and explanation.'),
    row(button('Download PDF · 2 pages','dq-download'),button('Explore DQ form & codes','area','dq','button secondary')),
    node('p','Form version: '+DQ_FORM.version+' · Available offline','small-note'));
  return card;
}
function dqView(main) {
  append(main, hero('FROM THE REPORT TO THE RULE','DQ form & codes','A DQ is a chance to learn. Find the reason written on the card, understand the rule and talk it through with your coach.'),
    node('p','The original two-page Aquatics GB form is included unchanged. Page 1 records the report; page 2 lists 55 tick-box reasons using 41 rule references. These are rule numbers, not a separate set of penalty codes.','lead-small'),
    row(button('Download original PDF','dq-download'),external('Official download ↗',DQ_FORM.sourceUrl)),
    node('p','Printed version: '+DQ_FORM.version+' · Cross-checked with this app: '+DQ_FORM.checked,'small-note'));
  const status = node('p','','small-note'); status.id='dq-download-status';status.setAttribute('role','status');main.append(status);
  append(main,node('p','The tick boxes are shorthand. Open the linked rule for the full explanation and exceptions; later commentary can add context to this June form.','notice'));
  const details=node('details',null,'rule-card dq-review');append(details,node('summary','What the cross-check found'));
  append(details,node('p','All 55 reasons and all 41 printed rule references are covered. The review made the end of a backstroke turn pull, continuing breaststroke body position and declared relay order clearer.'),
    node('p','Three cross-references need context: 7.2 also needs 7.3; 8.1 also needs 8.2; the exit row prints 10.4.7, while an individual-race exit is covered by 10.2.8. The relevant rows link both.'),
    node('p','The June form does not replace the later August commentary on turns and tape. Existing English-applicability review notes remain. The card is also not an exhaustive list of every competition rule.'));
  main.append(details);
  const controls=node('div',null,'rulebook-controls dq-controls'),wrap=node('div',null,'search-wrap'),label=node('label','Find a reason or rule code'),input=node('input');
  label.htmlFor='dq-search';input.id='dq-search';input.type='search';input.value=dqQuery;input.placeholder='Try “elbows”, “relay order” or “7.7”…';input.setAttribute('aria-controls','dq-results');
  append(wrap,label,input);append(controls,wrap,selectControl('Stroke or race area','dq-category',[['all','All areas'],...[...new Set(DQ_FORM.rows.map(r=>r.category))].map(c=>[c,c])],dqCategory),button('Clear search','dq-clear',undefined,'button secondary'));main.append(controls);
  const count=node('p','','result-count');count.id='dq-count';count.setAttribute('role','status');main.append(count);
  const results=node('div');results.id='dq-results';main.append(results);renderDqResults();
}
function renderDqResults() {
  const area=document.getElementById('dq-results');if(!area)return;
  const matches=searchDqRows(DQ_FORM.rows,dqQuery,dqCategory);
  document.getElementById('dq-count').textContent=matches.length+' of 55 form reasons';area.replaceChildren();
  if(!matches.length){area.append(node('p','No matching reasons. Try a shorter phrase or another area.','empty'));return;}
  for(const r of matches){
    const card=node('article',null,'rule-card dq-reason');card.dataset.dqId=r.id;
    append(card,node('p',r.category+' · form rule '+r.codes.join(' / '),'eyebrow'),node('h3',r.text));
    if(r.note)card.append(node('p',r.note,'dq-context'));
    const links=row(...r.codes.map(c=>button('Read rule '+c,'clause',c,'button secondary')));
    for(const c of r.relatedCodes)links.append(button('Also read '+c,'clause',c,'text-button'));
    card.append(links);area.append(card);
  }
}
function dqClauseNotes(entry) {
  const rows=DQ_FORM.rows.filter(r=>r.codes.includes(entry.code));if(!rows.length)return null;
  const details=node('details',null,'rulebook-provenance');append(details,node('summary','DQ card: reasons linked to this rule'));
  for(const r of rows){append(details,node('p',r.text),r.note?node('p',r.note,'small-note'):null);}
  details.append(button('See the original form and all reasons','area','dq','text-button'));return details;
}
root.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;if(b.dataset.action==='dq-download')dqDownload();if(b.dataset.action==='dq-clear'){dqQuery='';dqCategory='all';render();document.getElementById('dq-search')?.focus();}});
root.addEventListener('input',e=>{if(e.target.id==='dq-search'){dqQuery=e.target.value;renderDqResults();}});
root.addEventListener('change',e=>{if(e.target.id==='dq-category'){dqCategory=e.target.value;renderDqResults();}});
