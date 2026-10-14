const LESSON_STORE='mako-race-rules-lessons-v1';
let lessonState=restoreLessons(null,LEARNING.lessons),lessonScreen='overview',lessonStorageAvailable=true;
try{lessonState=restoreLessons(JSON.parse(localStorage.getItem(LESSON_STORE)||'null'),LEARNING.lessons);}catch{lessonStorageAvailable=false;}
function saveLessonState(){try{localStorage.setItem(LESSON_STORE,JSON.stringify(lessonState));lessonStorageAvailable=true;}catch{lessonStorageAvailable=false;}}
function suggestedLesson(){return LEARNING.lessons.find(l=>!lessonState.completed[l.id])||LEARNING.lessons[0];}
function lessonHomeCard(){
 const resume=lessonState.selected&&!lessonState.completed[lessonState.selected];const next=resume?LEARNING.lessons.find(l=>l.id===lessonState.selected):suggestedLesson();
 const c=panel('Your next small step',next.title+' · '+next.description,'resume-card');
 c.append(row(jbutton(resume?'Continue learning →':'Start a guided lesson →','lesson-open',next.id),jbutton('See all 8 lessons','lesson-list',undefined,'text-button')));
 return c;
}
function lessonView(main){
 if(lessonScreen==='study'&&lessonState.selected){renderLesson(main);return;}
 append(main,hero('LEARN A LITTLE. PUT IT INTO PRACTICE.','Your swimming lessons','Start where you feel comfortable. Each lesson has a few short explanations, mixed-format practice and a recap. Every lesson is open to you.'));
 main.append(jbutton('Swimming words','words',undefined,'text-button'));const count=Object.keys(lessonState.completed).length;
 const progress=node('section',null,'lesson-progress');append(progress,node('h3',count+' of '+LEARNING.lessons.length+' lessons practised'),node('p','Completion means you have tried every question, not passed an exam. Revisit any lesson whenever it helps.'));
 const bar=node('progress');bar.max=LEARNING.lessons.length;bar.value=count;bar.setAttribute('aria-label',count+' of '+LEARNING.lessons.length+' lessons practised');progress.append(bar);main.append(progress);
 if(journey.round?.lessonId&&!journey.round.complete){const l=LEARNING.lessons.find(x=>x.id===journey.round.lessonId);const saved=panel('You have practice to finish',l.title);saved.append(jbutton('Continue lesson practice','resume'));main.append(saved);}
 if(lessonState.selected){const l=LEARNING.lessons.find(x=>x.id===lessonState.selected);main.append(row(jbutton('Continue reading: '+l.title,'lesson-open',l.id)));}
 const cards=node('div',null,'lesson-grid');
 LEARNING.lessons.forEach((l,i)=>{const done=lessonState.completed[l.id],card=node('article',null,'lesson-tile');
 append(card,node('p','LESSON '+String(i+1).padStart(2,'0')+' · '+(l.level==='challenge'?'LOOK CLOSER':l.level==='confidence'?'CONNECT THE RULES':'BUILD THE FOUNDATIONS'),'eyebrow'),node('h3',l.title),node('p',l.description),node('p',l.steps.length+' short sections · '+l.questions.length+' practice questions','small-note'));
 if(done)card.append(node('p','✓ Practised · latest full attempt '+done.correct+' / '+done.total,'encouragement'));else if(l.id===suggestedLesson().id)card.append(node('p','Suggested next lesson','lesson-suggestion'));
 card.append(jbutton(done?'Revisit lesson →':'Explore lesson →','lesson-open',l.id));cards.append(card);
 });main.append(cards,node('p',lessonStorageAvailable?'Your lesson position and completed practice are saved in this browser.':'Saving is unavailable. Lessons still work, but progress lasts only while this page stays open.','small-note'));
}
function renderLesson(main){
 const l=LEARNING.lessons.find(x=>x.id===lessonState.selected),i=lessonState.step,s=l.steps[i];
 append(main,row(jbutton('← All lessons','lesson-list',undefined,'text-button')),hero('LESSON '+(LEARNING.lessons.indexOf(l)+1)+' OF '+LEARNING.lessons.length,l.title,l.description));
 main.append(lessonPhases('Learn'));
 const card=node('article',null,'lesson-study');
 append(card,node('p','SECTION '+(i+1)+' OF '+l.steps.length+' · '+s.kind,'eyebrow'),node('h3',s.title));
 const body=node('div',null,s.visual?'lesson-body with-visual':'lesson-body');
 if(s.visual)body.append(s.visual==='hands'?handPicture('0','Two hands touch together without stacking'):startPicture(s.visual));
 body.append(termText(s.text));card.append(body);if(s.bullets){const list=node('ul',null,'lesson-checklist');for(const text of s.bullets)list.append(termText(text,'li'));card.append(list);}if(s.clubStartAdvice)card.append(clubStartAdvice());if(s.examples){const examples=node('div',null,'lesson-examples');for(const example of s.examples)examples.append(panel(example.label,example.text));card.append(examples);}
 if(s.codes.length){const refs=node('details',null,'lesson-references');refs.append(node('summary','Rule reference and source'));for(const code of s.codes){const clause=DATA.rulebook.find(r=>r.code===code);append(refs,node('h4','World Aquatics · Part Two '+code),node('p',clause.statement),node('p','Rule restatement in this app · '+clause.location+' · '+(clause.status==='verified'?'verified against the release baseline':'application flagged; see source note'),'small-note'),button('Source and context · '+code,'clause',code,'text-button'));}card.append(refs);}
 const prev=jbutton('← Previous section','lesson-step','-1','button secondary');prev.disabled=i===0;
 card.append(row(prev,i<l.steps.length-1?jbutton('Next section →','lesson-step','1'):jbutton('Practise this lesson →','lesson-practise',l.id)));
 if(i===l.steps.length-1){card.append(node('p','There is no pass mark. Beginner questions include help; applied questions let you try first. A hint is always available.','small-note'));if(journey.round&&!journey.round.complete)card.append(node('p','Starting this practice replaces your unfinished round. You can continue that round first.','small-note'),jbutton('Continue saved round','resume',undefined,'text-button'));}
 main.append(card);
 const index=node('nav',null,'lesson-sections');index.setAttribute('aria-label','Lesson sections');l.steps.forEach((step,n)=>{const b=jbutton((n+1)+'. '+step.title,'lesson-jump',String(n),'text-button');if(n===i)b.setAttribute('aria-current','step');index.append(b);});main.append(index);
}
function recordLessonResult(r){
 const l=LEARNING.lessons.find(x=>x.id===r.lessonId);
 if(!l||!r.complete||r.ids.length!==l.questions.length||!l.questions.every(id=>r.ids.includes(id)))return;
 const s=roundScore(r,BANK);lessonState.completed[l.id]={correct:s.correct,total:s.total};saveLessonState();
}
function lessonRecap(r,score){
 const l=LEARNING.lessons.find(x=>x.id===r.lessonId),full=r.ids.length===l.questions.length;
 const c=panel(full?'Lesson practised: '+l.title:'Revision: '+l.title,l.takeaway,'lesson-recap');
 c.append(node('p',full?'You have worked through this lesson. A wrong answer gives you something useful to practise; it does not block your next step.':'This was a focused retry. Your full-lesson result stays separate.'));
 const next=LEARNING.lessons[LEARNING.lessons.indexOf(l)+1];
 c.append(row(next?jbutton('Next lesson: '+next.title+' →','lesson-open',next.id):jbutton('Explore all lessons →','lesson-list'),jbutton('Revisit the explanation','lesson-revisit',l.id,'button secondary')));
 if(!next)c.append(node('p','You have reached the end of this sequence. Revisit any topics you want to strengthen, or try a fresh challenge round.'));
 return c;
}
function handleLessonAction(a,v){
 if(a==='lesson-list'){lessonScreen='overview';state.area='lessons';render(true);return true;}
 if(a==='lesson-route'){journey.level=v;saveJourney();const next=v==='challenge'?'look-closer':v==='confidence'?'freestyle':(LEARNING.lessons.find(l=>l.level==='basics'&&!lessonState.completed[l.id])||LEARNING.lessons[0]).id;if(lessonState.selected!==next)lessonState.step=0;lessonState.selected=next;lessonScreen='study';state.area='lessons';saveLessonState();render(true);return true;}
 if(a==='lesson-open'||a==='lesson-revisit'){const l=LEARNING.lessons.find(x=>x.id===v);if(!l)return true;if(lessonState.selected!==l.id||a==='lesson-revisit')lessonState.step=0;lessonState.selected=l.id;lessonScreen='study';state.area='lessons';saveLessonState();render(true);return true;}
 if(a==='lesson-step'||a==='lesson-jump'){const l=LEARNING.lessons.find(x=>x.id===lessonState.selected);if(!l)return true;const next=a==='lesson-step'?lessonState.step+Number(v):Number(v);if(Number.isInteger(next)&&next>=0&&next<l.steps.length){lessonState.step=next;saveLessonState();render(true);}return true;}
 if(a==='lesson-practise'){const l=LEARNING.lessons.find(x=>x.id===v);if(!l)return true;journey.round=createLessonRound(l,BANK);practiceScreen='round';orderAnnouncement='';state.area='quiz';saveJourney();render(true);return true;}
 return false;
}

function lessonPhases(active){const phases=node('ol',null,'lesson-phases');phases.setAttribute('aria-label','Lesson progress');for(const label of ['Learn','Practise','Recap']){const item=node('li',label);if(label===active)item.setAttribute('aria-current','step');phases.append(item);}return phases;}
