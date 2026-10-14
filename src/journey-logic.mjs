export const LEVELS = [['basics','Start with the basics'],['confidence','Build my confidence'],['challenge','Challenge my knowledge']];
export function shuffleItems(items, random = Math.random) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i],a[j]] = [a[j],a[i]]; }
  return a;
}
export function practiceBank(learning, data) {
  return [...learning.questions, ...data.scenarios.map(s => ({id:'scenario-'+s.id,level:'challenge',stroke:s.stroke,type:'single',title:s.title,lesson:s.explanation,facts:s.facts,options:[{id:'legal',text:'Legal in these circumstances'},{id:'breach',text:'A rule breach'},{id:'more',text:'More information needed'}],correct:[s.outcome],codes:[],ruleIds:s.ruleIds,hint:'Look only at the action described. Check the touch, position and timing; do not assume facts that are missing.',prompts:[],outcome:s.outcome}))];
}
export function questionPool(bank, level, stroke) {
  return bank.filter(q => q.level === level && (stroke === 'all' || q.stroke === stroke || q.stroke === 'general'));
}
export function createRound(bank, level, stroke, size = 5, random = Math.random, previous = []) {
  const pool = shuffleItems(questionPool(bank,level,stroke),random);
  // Prefer unseen questions, while maintaining variety of format when available.
  pool.sort((a,b) => Number(previous.includes(a.id)) - Number(previous.includes(b.id)));
  const chosen=[], kinds=new Set();
  for(const q of pool) if(!kinds.has(q.type) && chosen.length < Math.min(3,size)) { chosen.push(q); kinds.add(q.type); }
  for(const q of pool) if(chosen.length<size && !chosen.includes(q)) chosen.push(q);
  const ids=shuffleItems(chosen,random).map(q=>q.id), arrangements={};
  for(const id of ids) arrangements[id]=shuffleItems(bank.find(q=>q.id===id).options.map(o=>o.id),random);
  return {level,stroke,ids,arrangements,index:0,answers:{},draft:[],hints:[],complete:false};
}
export function correctAnswer(q, answer) {
  if(!Array.isArray(answer) || answer.some(x=>typeof x!=='string')) return false;
  const a=q.type==='multi'?[...answer].sort():answer;
  const b=q.type==='multi'?[...q.correct].sort():q.correct;
  return a.length===b.length && a.every((v,i)=>v===b[i]);
}
export function roundScore(round, bank) {
  const answered=round.ids.filter(id=>Object.hasOwn(round.answers,id));
  return {answered:answered.length,total:round.ids.length,correct:answered.filter(id=>correctAnswer(bank.find(q=>q.id===id),round.answers[id])).length};
}
export function validAnswer(q, a, draft=false) {
  if(!Array.isArray(a) || a.length>q.options.length || a.some(v=>typeof v!=='string'||(!q.options.some(o=>o.id===v) && !(draft && q.type==='match' && v==='')))) return false;
  if(q.type==='match') return draft ? a.length<=q.prompts.length : a.length===q.prompts.length && !a.includes('');
  if(new Set(a).size!==a.length) return false;
  if(draft) return true;
  return q.type==='order'? a.length===q.options.length:q.type==='multi'?a.length>0:a.length===1;
}
export function restoreJourney(value, bank, lessons = []) {
  const clean={level:'basics',stroke:'all',size:5,round:null,completed:0,history:[]};
  if(!value || typeof value!=='object') return clean;
  if(LEVELS.some(x=>x[0]===value.level))clean.level=value.level;
  if(['all','general','free','back','breast','fly','im','relay'].includes(value.stroke))clean.stroke=value.stroke;
  if(value.size===10)clean.size=10;
  if(Number.isInteger(value.completed)&&value.completed>=0&&value.completed<100000)clean.completed=value.completed;
  if(Array.isArray(value.history))clean.history=value.history.filter(h=>h&&LEVELS.some(l=>l[0]===h.level)&&Number.isInteger(h.total)&&h.total>0&&h.total<=10&&Number.isInteger(h.correct)&&h.correct>=0&&h.correct<=h.total).slice(-10).map(h=>({level:h.level,correct:h.correct,total:h.total}));
  const r=value.round;
  if(!r || !LEVELS.some(x=>x[0]===r.level) || !['all','free','back','breast','fly','im','relay'].includes(r.stroke) || !Array.isArray(r.ids) || !r.ids.length || r.ids.length>10 || new Set(r.ids).size!==r.ids.length) return clean;
  const lesson = r.lessonId ? lessons.find(l=>l.id===r.lessonId) : null;
  if(r.lessonId && (!lesson || r.level!==lesson.level || r.stroke!=='all')) return clean;
  const revision = r.kind==='revision';
  if(r.kind && !['revision','stage'].includes(r.kind)) return clean;
  if(r.kind==='stage' && (r.ids.length!==10 || r.stroke!=='all' || lesson || r.hints?.length)) return clean;
  if(revision && (lesson || r.stroke!=='all'))return clean;
  const allowed = revision ? bank : lesson ? bank.filter(q=>lesson.questions.includes(q.id)) : questionPool(bank,r.level,r.stroke);
  if(r.ids.some(id=>!allowed.some(q=>q.id===id))) return clean;
  if(!Number.isInteger(r.index)||r.index<0||r.index>=r.ids.length||!r.arrangements||!r.answers) return clean;
  const result={level:r.level,stroke:r.stroke,ids:[...r.ids],index:r.index,arrangements:{},answers:{},draft:[],hints:[],complete:false};
  if(lesson) result.lessonId=lesson.id;
  if(r.kind) result.kind=r.kind;
  if(typeof r.runId==='string' && /^[a-z0-9-]{1,100}$/.test(r.runId))result.runId=r.runId;
  for(const id of r.ids){const q=bank.find(q=>q.id===id),a=r.arrangements[id];if(!Array.isArray(a)||a.length!==q.options.length||new Set(a).size!==a.length||a.some(v=>!q.options.some(o=>o.id===v)))return clean;result.arrangements[id]=[...a];if(Object.hasOwn(r.answers,id)){if(!validAnswer(q,r.answers[id]))return clean;result.answers[id]=[...r.answers[id]];}}
  // A saved round may only advance through questions in order.
  if(r.ids.slice(0,r.index).some(id=>!Object.hasOwn(result.answers,id)) || r.ids.slice(r.index+1).some(id=>Object.hasOwn(result.answers,id)))return clean;
  const current=bank.find(q=>q.id===r.ids[r.index]);
  if(validAnswer(current,r.draft,true))result.draft=[...r.draft];
  if(Array.isArray(r.hints))result.hints=r.hints.filter(id=>r.ids.includes(id));
  result.complete=r.complete===true && r.ids.every(id=>Object.hasOwn(result.answers,id));
  clean.round=result;return clean;
}
export function validateJourney(learning,data) {
  const errors=[], seen=new Set();
  if(!learning||!Array.isArray(learning.questions))return ['Missing question bank'];
  for(const q of learning.questions){
    if(!q||typeof q.id!=='string'||!/^[-a-z0-9]+$/.test(q.id)||seen.has(q.id)){errors.push('Invalid question ID');continue;}seen.add(q.id);
    if(!['basics','confidence','challenge'].includes(q.level)||!['single','multi','order','match','picture'].includes(q.type))errors.push(q.id+': invalid level or format');
    if(!['general','free','back','breast','fly','im','relay'].includes(q.stroke))errors.push(q.id+': invalid stroke');
    for(const key of ['title','lesson','hint'])if(typeof q[key]!=='string'||!q[key].trim())errors.push(q.id+': missing '+key);
    if(!Array.isArray(q.options)||q.options.length<2||q.options.length>6||new Set(q.options.map(o=>o.id)).size!==q.options.length)errors.push(q.id+': invalid options');
    else if(!validAnswer(q,q.correct)||q.options.some(o=>typeof o.text!=='string'||!o.text))errors.push(q.id+': invalid answer');
    if(q.type==='match'&&q.prompts.length!==q.correct.length)errors.push(q.id+': invalid matching prompts');
    if(q.authority!=='club'&&(!q.codes.length||q.codes.some(code=>!data.rulebook.some(r=>r.code===code&&r.status==='verified'))))errors.push(q.id+': missing or withheld code');
    if(q.authority!=='club'&&(!q.ruleIds.length||q.ruleIds.some(id=>!data.rules.some(r=>r.id===id&&r.status==='verified'))))errors.push(q.id+': missing or withheld rule');
  }
  return errors;
}

export function createLessonRound(lesson, bank, ids = lesson.questions, random = Math.random) {
  const rank={basics:0,confidence:1,challenge:2};
  const ordered=shuffleItems(ids,random).sort((a,b)=>rank[bank.find(q=>q.id===a).level]-rank[bank.find(q=>q.id===b).level]);
  const arrangements={};
  for(const id of ordered) arrangements[id]=shuffleItems(bank.find(q=>q.id===id).options.map(o=>o.id),random);
  return {level:lesson.level,stroke:'all',lessonId:lesson.id,ids:ordered,arrangements,index:0,answers:{},draft:[],hints:[],complete:false};
}
export function restoreLessons(value, lessons) {
  const clean={selected:null,step:0,completed:{}};
  if(!value || typeof value!=='object') return clean;
  const current=lessons.find(l=>l.id===value.selected);
  if(current){clean.selected=current.id;if(Number.isInteger(value.step)&&value.step>=0&&value.step<current.steps.length)clean.step=value.step;}
  for(const l of lessons){const score=value.completed?.[l.id];if(score&&Number.isInteger(score.correct)&&score.correct>=0&&score.total===l.questions.length&&score.correct<=score.total)clean.completed[l.id]={correct:score.correct,total:score.total};}
  return clean;
}
export function validateLessons(learning,data){
  const errors=[],ids=new Set(),bank=practiceBank(learning,data);
  if(!Array.isArray(learning.lessons)||!learning.lessons.length)return ['Missing lessons'];
  for(const l of learning.lessons){
    if(!/^[-a-z0-9]+$/.test(l.id)||ids.has(l.id))errors.push('Invalid lesson ID');ids.add(l.id);
    if(!LEVELS.some(x=>x[0]===l.level))errors.push(l.id+': invalid level');
    if(!l.title||!l.description||!l.takeaway||!Array.isArray(l.steps)||!l.steps.length)errors.push(l.id+': missing teaching');
    for(const step of l.steps||[])if(!step.title||!step.text||!step.kind||!Array.isArray(step.codes)||step.codes.some(c=>!data.rulebook.some(r=>r.code===c)))errors.push(l.id+': invalid lesson step');
    if(!Array.isArray(l.questions)||l.questions.length<3||l.questions.length>10||new Set(l.questions).size!==l.questions.length||l.questions.some(id=>!bank.some(q=>q.id===id)))errors.push(l.id+': invalid practice');
  }
  return errors;
}

export function termSegments(text,terms){
 const aliases=terms.flatMap(t=>[t.term,...t.aliases].map(a=>({text:a,id:t.id}))).sort((a,b)=>b.text.length-a.text.length),parts=[];let pos=0,plain='';
 while(pos<text.length){const match=aliases.find(a=>text.slice(pos,pos+a.text.length).toLowerCase()===a.text.toLowerCase()&&!/[a-z0-9]/i.test(text[pos-1]||'')&&!/[a-z0-9]/i.test(text[pos+a.text.length]||''));if(match){if(plain){parts.push({text:plain});plain='';}parts.push({text:text.slice(pos,pos+match.text.length),id:match.id});pos+=match.text.length;}else plain+=text[pos++];}if(plain)parts.push({text:plain});return parts;
}
export function validateLearningSupport(learning){
 const errors=[],ids=new Set();for(const t of learning.terms||[]){if(!t.id||ids.has(t.id)||!t.term||!t.definition||!Array.isArray(t.aliases))errors.push('Invalid learning term');ids.add(t.id);}
 for(const q of learning.questions){const o=q.observation;if(!o)continue;if(!['touch','wall','orientation','distance','relay'].includes(o.scene)||!Array.isArray(o.frames)||o.frames.length<1||o.frames.length>5){errors.push(q.id+': invalid observation');continue;}if(!q.facts||o.frames.some(f=>!f.title||!f.caption))errors.push(q.id+': missing written observation');for(const f of o.frames){if(o.scene==='touch'&&![0,1,2].includes(f.touches))errors.push(q.id+': invalid hand count');if(o.scene==='relay'&&(typeof f.feet!=='boolean'||typeof f.hand!=='boolean'))errors.push(q.id+': invalid contact state');if(o.scene==='distance'&&(!f.distance||typeof f.submerged!=='boolean'))errors.push(q.id+': invalid distance frame');if(o.scene==='orientation'&&!f.orientation)errors.push(q.id+': missing orientation');if(o.scene==='wall'&&!['none','feet','away'].includes(f.contact))errors.push(q.id+': invalid wall contact');}}
 return errors;
}
