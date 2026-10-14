export const STAGES=[['basics','Basics'],['confidence','Confidence'],['challenge','Challenge']];
export const ACHIEVEMENT_VERSION='2026-10-stage-1';
export function emptyProgress(){return {questions:{},rounds:[],awards:{}};}
export function stagePassed(r,bank){return r?.kind==='stage' && r.complete===true && Array.isArray(r.ids) && r.ids.length===10 && new Set(r.ids).size===10 && Array.isArray(r.hints) && r.hints.length===0 && r.ids.every(id=>{const q=bank.find(q=>q.id===id);return q?.level===r.level && correctAnswer(q,r.answers?.[id]);});}
export function restoreProgress(raw,bank){
 const p=emptyProgress();if(!raw||typeof raw!=='object')return p;
 for(const q of bank){const x=raw.questions?.[q.id];if(x&&Number.isInteger(x.attempts)&&x.attempts>0&&x.attempts<=100000&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=x.attempts&&typeof x.lastCorrect==='boolean'&&Number.isFinite(x.at)&&x.at>0&&typeof x.hinted==='boolean')p.questions[q.id]={attempts:x.attempts,correct:x.correct,lastCorrect:x.lastCorrect,at:x.at,hinted:x.hinted};}
 if(Array.isArray(raw.rounds))p.rounds=raw.rounds.filter(x=>x&&typeof x.id==='string'&&x.id.length<=100&&STAGES.some(a=>a[0]===x.level)&&['practice','revision','stage','lesson'].includes(x.kind)&&Number.isInteger(x.total)&&x.total>0&&x.total<=10&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=x.total&&Number.isFinite(x.at)&&x.at>0).slice(-40).map(x=>({id:x.id,level:x.level,kind:x.kind,total:x.total,correct:x.correct,at:x.at}));
 for(const[level]of STAGES){const a=raw.awards?.[level];if(a&&a.version===ACHIEVEMENT_VERSION&&Number.isFinite(a.at)&&a.at>0&&a.proof?.level===level&&stagePassed(a.proof,bank))p.awards[level]={at:a.at,version:a.version,proof:{kind:'stage',complete:true,level,ids:[...a.proof.ids],answers:Object.fromEntries(a.proof.ids.map(id=>[id,[...a.proof.answers[id]]])),hints:[]}};}
 return p;
}
export function revisionIds(p,bank){return bank.filter(q=>p.questions[q.id]&&!p.questions[q.id].lastCorrect).sort((a,b)=>p.questions[a.id].at-p.questions[b.id].at).map(q=>q.id);}
export function topicProgress(p,bank){return ['general','free','back','breast','fly','im','relay'].map(stroke=>{const qs=bank.filter(q=>q.stroke===stroke),seen=qs.filter(q=>p.questions[q.id]);return {stroke,available:qs.length,seen:seen.length,confident:seen.filter(q=>p.questions[q.id].lastCorrect).length,revise:seen.filter(q=>!p.questions[q.id].lastCorrect).length};});}
export function recordProgress(p,r,bank,at=Date.now()){
 if(!r.complete||!r.runId||p.rounds.some(x=>x.id===r.runId))return p;
 for(const id of r.ids){const q=bank.find(q=>q.id===id);if(!q||!validAnswer(q,r.answers[id]))return p;}
 const next=restoreProgress(p,bank),score=roundScore(r,bank);
 for(const id of r.ids){const ok=correctAnswer(bank.find(q=>q.id===id),r.answers[id]),old=next.questions[id]||{attempts:0,correct:0};next.questions[id]={attempts:Math.min(old.attempts+1,100000),correct:Math.min(old.correct+Number(ok),100000),lastCorrect:ok,at,hinted:r.hints.includes(id)};}
 next.rounds.push({id:r.runId,level:r.level,kind:r.kind|| (r.lessonId?'lesson':'practice'),total:score.total,correct:score.correct,at});next.rounds=next.rounds.slice(-40);
 if(stagePassed(r,bank)&&!next.awards[r.level])next.awards[r.level]={at,version:ACHIEVEMENT_VERSION,proof:{kind:'stage',complete:true,level:r.level,ids:[...r.ids],answers:Object.fromEntries(r.ids.map(id=>[id,[...r.answers[id]]])),hints:[]}};
 return next;
}
export function createRevisionRound(ids,bank,random=Math.random){const chosen=shuffleItems(ids.filter(id=>bank.some(q=>q.id===id)),random).slice(0,10);return {kind:'revision',level:'confidence',stroke:'all',ids:chosen,arrangements:Object.fromEntries(chosen.map(id=>[id,shuffleItems(bank.find(q=>q.id===id).options.map(o=>o.id),random)])),index:0,answers:{},draft:[],hints:[],complete:false};}
export function createStageRound(bank,level,previous=[],random=Math.random){
 const pool=shuffleItems(bank.filter(q=>q.level===level),random).sort((a,b)=>Number(previous.includes(a.id))-Number(previous.includes(b.id))),chosen=[];
 for(const stroke of ['general','free','back','breast','fly','im','relay']){const q=pool.find(q=>q.stroke===stroke);if(q)chosen.push(q);}
 for(const type of ['single','multi','order','match','picture']){const q=pool.find(q=>q.type===type&&!chosen.includes(q));if(q&&!chosen.some(x=>x.type===type)&&chosen.length<10)chosen.push(q);}
 for(const q of pool)if(chosen.length<10&&!chosen.includes(q))chosen.push(q);
 const r=createRevisionRound(chosen.map(q=>q.id),bank,random);r.kind='stage';r.level=level;return r;
}
