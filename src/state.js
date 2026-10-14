const STROKES = [['all','All strokes'],['free','Freestyle'],['back','Backstroke'],['breast','Breaststroke'],['fly','Butterfly'],['im','Individual medley'],['relay','Medley relay']];
const PHASES = [['all','Every phase'],['start','Start & entry'],['underwater','Underwater'],['swimming','Swimming action'],['approach','Approach'],['touch','Touch & turn'],['departure','Leave the wall'],['finish','Finish']];
const OUTCOMES = {legal:'Legal in these circumstances',breach:'A rule breach',more:'More information needed'};
const STORE = 'mako-race-rules-' + DATA.meta.contentVersion;
const state = {area:location.hash==='#reaction'?'reaction':'home',poolLength:25,codeQuery:'',ruleCategory:'all',tableQuery:'',tableCategory:'all',stroke:'breast',phase:'all',query:'',quizStroke:'all',question:0,answers:Object.create(null)};
try { const saved=JSON.parse(localStorage.getItem(STORE)||'{}'); for(const s of DATA.scenarios) if(Object.hasOwn(OUTCOMES,saved[s.id])) state.answers[s.id]=saved[s.id]; } catch {}
const root=document.getElementById('app');
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=text;if(cls)e.className=cls;return e;};
const append=(parent,...children)=>{parent.append(...children.filter(Boolean));return parent;};
const button=(text,action,value,cls='button')=>{const b=node('button',text,cls);b.type='button';b.dataset.action=action;if(value!==undefined)b.dataset.value=value;return b;};
const labelOf=(list,id)=>list.find(x=>x[0]===id)?.[1]||'Race essentials';
const ruleById=id=>DATA.rules.find(r=>r.id===id);
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(state.answers));}catch{}};
const external=(label,url)=>{if(!safeUrl(url))return node('span',label);const a=node('a',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;};
