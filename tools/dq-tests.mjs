import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {searchDqRows,searchRulebook} from '../src/rulebook-logic.mjs';
import {validateDqForm} from '../src/dq-logic.mjs';
const data=JSON.parse(await readFile(new URL('../src/content.json',import.meta.url)));
const form=JSON.parse(await readFile(new URL('../src/dq-form.json',import.meta.url)));
validateDqForm(form,data);
// Independently counted from each of the seven sections on PDF page 2.
const counts={'The Start':1,Freestyle:3,Backstroke:8,Breaststroke:13,Butterfly:10,Medley:4,'The Race':16};
assert.equal(form.rows.length,55);
assert.equal(new Set(form.rows.flatMap(r=>r.codes)).size,41);
for(const [category,count] of Object.entries(counts))assert.equal(form.rows.filter(r=>r.category===category).length,count);
// Three separate findings in each touch row must survive extraction.
for(const code of ['7.7','8.5']){
 const row=form.rows.find(r=>r.codes.includes(code));
 for(const text of ['both hands ☐','separated ☐','simultaneously ☐'])assert.ok(row.text.includes(text));
}
const find=q=>searchDqRows(form.rows,q);
assert.equal(find('7.7')[0].codes[0],'7.7');
assert.equal(find('breast elbows').length,1);
assert.equal(find('relay order').length,2); // medley stroke order and declared team order
assert.equal(searchDqRows(form.rows,'15m','Backstroke').length,1);
assert.equal(find('nonsenseword').length,0);
assert.equal(find('10.2.8')[0].codes[0],'10.4.7');
assert.ok(find('8.2').some(r=>r.codes.includes('8.1')));
for(const [query,code] of [['elbows not under','7.4'],['relay order listed','10.4.2'],['turn initiated completion','6.4'],['taping two fingers','14.4']]){
 assert.ok(searchRulebook(data,{query,dqRows:form.rows}).some(r=>r.code===code),query);
}
assert.throws(()=>validateDqForm({rows:[{...form.rows[0],codes:['999.9']}]},data),/not in rulebook/);
assert.throws(()=>validateDqForm({rows:[form.rows[0],form.rows[0]]},data),/Invalid DQ/);
for(const code of ['14.2','14.4','8.1','8.2','7.3'])assert.equal(data.rulebook.find(r=>r.code===code).status,'withheld');
const pdf=await readFile(new URL('../assets/AGB_DQ_FORM_FINAL.pdf',import.meta.url));
assert.equal(createHash('sha256').update(pdf).digest('hex'),form.sha256);
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
const encoded=JSON.parse(html.match(/const DQ_PDF = ("[^"]+");/)[1]);
assert.deepEqual(Buffer.from(encoded,'base64'),pdf);
assert.deepEqual(await readFile(new URL('../dist/assets/AGB_DQ_FORM_FINAL.pdf',import.meta.url)),pdf);
assert.equal(html,await readFile(new URL('../index.html',import.meta.url),'utf8'));
await writeFile(new URL('../reports/dq-tests.json',import.meta.url),JSON.stringify({passed:true,rows:55,uniquePrintedCodes:41,counts,pdfSha256:form.sha256,checks:['every source row and code mapped','touch sub-findings preserved','search text/code/category and empty result','additional code mappings','invalid data rejected','later-guidance boundaries retained','embedded and static PDF byte equality','root and dist equality']},null,2));
console.log('DQ coverage, search and offline PDF integrity PASS');
