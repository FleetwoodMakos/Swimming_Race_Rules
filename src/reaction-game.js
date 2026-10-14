// Local, recreational timing. Names and results stay in memory until explicitly shared.
let reaction={phase:'idle',type:'dive',visual:false,name:'',ms:null,message:''};
let reactionRun={id:0,ctx:null,timers:[],signalAt:Infinity};
function reactionElapsedMs(ctx,signalAt,now){
 const stamp=typeof ctx.getOutputTimestamp==='function'?ctx.getOutputTimestamp():null;
 if(stamp&&stamp.contextTime>0&&stamp.performanceTime>0)return now-(stamp.performanceTime+(signalAt-stamp.contextTime)*1000);
 return (ctx.currentTime-signalAt-(ctx.outputLatency||ctx.baseLatency||0))*1000;
}
function reactionOutcome(ms){return ms<0?'early':ms>3000?'late':'result';}
function reactionShareText(name,ms,type,visual,url=''){
 const who=name.trim().slice(0,32)||'I';
 return `${who} reacted in ${Math.round(ms)} ms in the Mako Start Challenge! ${type==='back'?'Backstroke':'Dive'} start · ${visual?'sound + visual cue':'sound only'}. Listen, wait, tap. Can you beat that?\nA fun device reaction game, not an official swimming start time.${url?'\nPlay and learn the starting rules: '+url:''}`;
}
function reactionPublicUrl(){return location.protocol==='https:'&&location.hostname==='rules.fleetwoodmakos.com'?'https://rules.fleetwoodmakos.com/#reaction':'';}
function stopReactionPlayback(){
 reactionRun.id++;for(const t of reactionRun.timers)clearTimeout(t);reactionRun.timers=[];
 const ctx=reactionRun.ctx;reactionRun.ctx=null;if(ctx)ctx.close().catch(()=>{});
}
function cancelReaction(reason){
 if(!['arming','waiting'].includes(reaction.phase))return;
 stopReactionPlayback();reaction.phase='cancelled';reaction.message=reason;updateReactionPanel();
}
function reactionHomeCard(){const p=panel('How quick is your start?','Hear the whistles. Wait for the starting signal. Tap the giant button and share your reaction time.','reaction-promo');p.append(button('Play the start challenge →','area','reaction'));return p;}
function reactionReferenceCard(){
 const study='https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2023.1157359/pdf';
 const results='https://www.omegatiming.com/File/00011900010101EB0104FFFFFFFFFF01.pdf';
 const card=panel('How does your time fit in?','Have a go, find your place and challenge a friend.','elite-start-card');card.id='reaction-references';
 append(card,node('h4','Times from fastest to slowest','reaction-reference-heading'),node('p','Where will you land? Your latest time joins the table in gold.'));
 const rows=[
  {ms:80,name:'Fast sound response',kind:'Observed in research',detail:'Reported in World Athletics’ start research.'},
  {ms:100,name:'Athletics false-start threshold',kind:'Rule threshold',detail:'A competition cutoff—not a fixed biological minimum.'},
  {ms:161,name:'International Women Swimmers',kind:'First block-force change',detail:'Study average · 30 women.',url:study,source:'2023 swimming study'},
  {ms:167,name:'International Men Swimmers',kind:'First block-force change',detail:'Study average · 22 men.',url:study,source:'2023 swimming study'},
  {ms:230,name:'Average adult',kind:'Sound → button press',detail:'FEPSY · adults around age 25.',url:'https://fepsy.com/tests/auditory-reaction-time/',source:'FEPSY reference'},
  {ms:146,name:'Usain Bolt',kind:'Gun → detected start response',detail:'Berlin 2009 · his 9.58 s world-record race.',url:'https://worldathletics.org/news/news/2009-end-of-year-reviews-sprints',source:'World Athletics'},
  {ms:200,approx:true,name:'F1 drivers (estimate)',kind:'Race lights → driver response',detail:'Sebastian Vettel’s estimate · 2017.',url:'https://api.fia.com/news/f1-v-bottas-it-was-perfect-weekend',source:'FIA press conference'}
 ];
 const hasResult=reaction.phase==='result'&&Number.isFinite(reaction.ms);
 if(hasResult)rows.push({ms:Math.round(reaction.ms),name:'You · this go',kind:reaction.visual?'Sound + visual cue → tap':'Sound → tap',detail:'Your latest go. Can you beat it?',you:true});
 rows.sort((a,b)=>a.ms-b.ms);
 const wrap=node('div',null,'reaction-table-wrap'),table=node('table',null,'reaction-comparison-table');
 table.append(node('caption','Fastest first · 1,000 milliseconds (ms) = 1 second'));
 const head=node('thead'),headRow=node('tr');for(const label of ['Order','Time','Who','What the clock measures']){const th=node('th',label);th.scope='col';headRow.append(th);}head.append(headRow);table.append(head);
 const body=node('tbody');
 for(let i=0;i<rows.length;i++){
  const r=rows[i],tr=node('tr',null,r.you?'reaction-you':''),order=node('td',String(i+1)),time=node('td',(r.approx?'≈':'')+r.ms+' ms','reaction-table-time'),who=node('th',r.name);who.scope='row';
  const measure=node('td');append(measure,node('strong',r.kind),node('p',r.detail));append(tr,order,time,who,measure);body.append(tr);
 }
 table.append(body);wrap.append(table);card.append(wrap);
 if(!hasResult)card.append(node('p','Your spot is waiting—play a go above!' ,'reaction-table-prompt'));
 else card.append(node('p','There you are in gold! Have another go or challenge a friend.','reaction-table-prompt'));
 card.append(node('p','Different tests, one fun comparison. For your personal best, keep using the same device and cue setting.','small-note'));
 const about=node('details',null,'reaction-reference-details');about.append(node('summary','About these times'));
 append(about,node('p','World Athletics’ commissioned research reported sound responses as fast as 80 ms. Athletics uses a 100 ms false-start threshold; that is a rule cutoff, not a universal biological minimum. The swimmer study measured the first change in block force: 161 ms for 30 women and 167 ms for 22 men, with no significant difference between the groups. Bolt’s time detects his start response through the blocks. The adult figure is a sound-to-button average; the F1 figure is Vettel’s estimate for reacting to lights. These are different tasks, so this is not a sporting leaderboard.'),node('p','Sources:'));
 const links=node('ul');for(const [label,url] of [['80 ms research · World Athletics','https://worldathletics.org/news/news/iaaf-sprint-start-research-project-is-the-100'],['100 ms athletics threshold · World Athletics','https://worldathletics.org/disciplines/sprints/100-metres'],['Swimming study · Rudnik and colleagues, 2023',study],['Adult button-press reference · FEPSY','https://fepsy.com/tests/auditory-reaction-time/'],['Bolt · World Athletics','https://worldathletics.org/news/news/2009-end-of-year-reviews-sprints'],['Vettel · FIA press conference','https://api.fia.com/news/f1-v-bottas-it-was-perfect-weekend']]){const li=node('li');li.append(external(label,url));links.append(li);}about.append(links);card.append(about);
 const push=panel('Reacting is only the beginning…','On the blocks, you still have to push your whole body off after you react.','reaction-push-off');
 const times=row();for(const [name,time] of [['Cameron McEvoy','0.56 s'],['Ben Proud','0.59 s']]){const item=node('div',null,'reaction-block-time');append(item,node('strong',name),node('span',time),node('p','Start signal → feet leave the block'));times.append(item);}
 append(push,times,node('p','Imagine you take 0.20 s to react. To leave ahead of Cam, you have less than 0.36 s left to push off completely—or less than 0.39 s to beat Ben. Just a few tenths to turn that reaction into power!'),node('p','2025 World Championships · men’s 50 m freestyle final','small-note'),external('See the official race times',results));card.append(push);return card;
}
function reactionView(main){
 append(main,hero('LISTEN. WAIT. TAP.','The Mako Start Challenge','How quickly can you react to the starting signal? Challenge a friend, then learn what each whistle means.'));
 const box=node('section',null,'reaction-game');box.id='reaction-game';main.append(box);updateReactionPanel();
 const learn=panel('A quick reaction starts with knowing when to go.','Short whistles get your attention. The long whistle prepares you for the start. “Take your marks” gets you into position. Only the starting signal means go.');append(learn,row(button('Learn the starting signals','area','meet'),button('Read the starting rules','lookup','4','button secondary'),button('Help at a meet','area','volunteer','text-button')));main.append(reactionReferenceCard(),learn);
}
function updateReactionPanel(){
 const box=document.getElementById('reaction-game');if(!box)return;box.replaceChildren();
 const active=['arming','waiting'].includes(reaction.phase);
 if(['idle','cancelled','error'].includes(reaction.phase)){
  append(box,node('h3','Ready to race your reactions?'),node('p','Turn your sound on. After three short whistles and the long whistle(s), you’ll hear “Take your marks”. Wait through the pause, then tap as soon as the starting tone begins.'));
  const options=row();const label=node('label','Start type','select-label'),select=node('select');select.id='reaction-type';for(const[v,t]of[['dive','Dive start'],['back','Backstroke start']]){const opt=node('option',t);opt.value=v;opt.selected=reaction.type===v;select.append(opt);}label.append(select);
  const visual=node('label',null,'reaction-visual-option'),check=node('input');check.type='checkbox';check.id='reaction-visual';check.checked=reaction.visual;append(visual,check,node('span','Show a visual signal too'));append(options,label,visual);box.append(options);
  if(reaction.message)append(box,node('p',reaction.message,'notice'));
  append(box,button('I’m ready — play the start','reaction-start',undefined,'button reaction-launch'),node('p','Sound starts only when you press Play. Keep the screen open and listen: the final pause changes each time. Space or Enter also works.','small-note'));
 }else if(active){
  append(box,node('p',reaction.phase==='arming'?'Getting the sound ready…':'Listen carefully. Only the starting tone means go.','reaction-instruction'));
  const tap=node('button',null,'reaction-target');tap.type='button';tap.id='reaction-tap';tap.disabled=reaction.phase==='arming';tap.setAttribute('aria-label','Tap when you hear the starting signal');append(tap,node('span','LISTEN · WAIT','reaction-tap-overline'),node('span','TAP','reaction-tap-title'),node('span','ON THE STARTING TONE','reaction-tap-subtitle'));box.append(tap);
  append(box,row(button('Cancel this go','reaction-cancel',undefined,'button secondary')),node('p','Whistles and “Take your marks” are preparation. Wait for the starting tone.','small-note'));
 }else{
  const early=reaction.phase==='early',late=reaction.phase==='late';
  append(box,node('p',early?'A LITTLE TOO SOON':late?'LET’S HAVE ANOTHER GO':'YOUR REACTION TIME','eyebrow'),node('h3',early?'You beat the signal.':late?'Missed that one? No problem.':Math.round(reaction.ms)+' ms',early||late?'reaction-outcome':'reaction-result'));
  append(box,node('p',early?'That’s a false start in this game. Listen through the whistles and the command, then wait for the starting tone. Have another go.':late?'That was more than three seconds after the signal. Get comfortable with the sounds and try again.':'Nice waiting. Now challenge someone else to listen just as carefully.'));
  if(reaction.phase==='result'){
   if(reaction.ms<100)box.append(node('p','That was extremely quick and may have been anticipation. Try again and focus on hearing the signal. This game does not apply an official disqualification threshold.','small-note'));
   box.append(node('p',(reaction.type==='back'?'Backstroke':'Dive')+' start · '+(reaction.visual?'Sound + visual cue':'Sound only'),'reaction-mode'));
   const label=node('label','Name or nickname (optional)','reaction-name-label'),input=node('input');input.type='text';input.id='reaction-name';input.maxLength=32;input.autocomplete='off';input.placeholder='Your nickname';input.value=reaction.name;label.append(input);box.append(label);
   append(box,node('p','A nickname is enough. It appears on the result you choose to share; the app does not save or upload it.','small-note'),row(button('Share my result','reaction-share'),button('Save result picture','reaction-save',undefined,'button secondary')));
   const status=node('p','','small-note');status.id='reaction-share-status';status.setAttribute('role','status');box.append(status);
   if(!reactionPublicUrl())box.append(node('p','Local preview: this game is not published yet. Shared results will gain a play link when it goes live.','small-note'));
  }
  append(box,row(button('Try again','reaction-start'),button('Change start or cue','reaction-settings',undefined,'button secondary')));
 }
 if(!active)box.append(node('p','Just for fun: device, browser, speakers and headphones affect the time. This is not a pool start measurement or a safety assessment.','small-note'));
 const references=document.getElementById('reaction-references');if(references)references.replaceWith(reactionReferenceCard());
}
async function startReaction(){
 stopStartAudio();stopReactionPlayback();reaction.ms=null;reaction.message='';reaction.phase='arming';updateReactionPanel();
 const id=reactionRun.id;
 try{
  const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error('unavailable');
  const ctx=new Context();reactionRun.ctx=ctx;await ctx.resume();
  if(reactionRun.id!==id)return;
  const bytes=Uint8Array.from(atob(START_AUDIO.marks.split(',')[1]),c=>c.charCodeAt(0));const marks=await ctx.decodeAudioData(bytes.buffer);
  if(reactionRun.id!==id)return;
  if(ctx.state!=='running')throw Error('suspended');
  const gain=ctx.createGain();gain.gain.value=.22;gain.connect(ctx.destination);
  // Schedule all sounds together; measure against audio output time, never a caption timer.
  const now=ctx.currentTime+.25,events=makeStartTimeline(reaction.type,marks.duration,1.6+Math.random()*2.8);
  for(const e of events){
   if(e.kind==='short'||e.kind==='long')for(const offset of e.kind==='short'?[0,.8,1.6]:[0]){
    const duration=e.kind==='short'?.34:2.4,buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate);buffer.copyToChannel(whistleSamples(ctx.sampleRate,duration),0);const source=ctx.createBufferSource();source.buffer=buffer;source.connect(gain);source.start(now+e.at+offset);
   }
   if(e.kind==='marks'){const source=ctx.createBufferSource();source.buffer=marks;source.connect(gain);source.start(now+e.at);}
   if(e.kind==='signal'){
    reactionRun.signalAt=now+e.at;
    for(const[freq,scale]of[[660,.5],[880,.22]]){const osc=ctx.createOscillator(),level=ctx.createGain();osc.frequency.value=freq;level.gain.setValueAtTime(0,now+e.at);level.gain.linearRampToValueAtTime(scale,now+e.at+.02);level.gain.setValueAtTime(scale,now+e.at+.32);level.gain.linearRampToValueAtTime(0,now+e.at+.4);osc.connect(level);level.connect(gain);osc.start(now+e.at);osc.stop(now+e.at+.42);}
   }
  }
  reaction.phase='waiting';updateReactionPanel();document.getElementById('reaction-tap')?.focus({preventScroll:true});
  const outputDelay=ctx.outputLatency||ctx.baseLatency||0,delay=(reactionRun.signalAt-ctx.currentTime+outputDelay)*1000;
  if(reaction.visual)reactionRun.timers.push(setTimeout(()=>{if(reactionRun.id===id&&reaction.phase==='waiting'){const target=document.getElementById('reaction-tap');target?.classList.add('reaction-go');if(target){target.querySelector('.reaction-tap-title').textContent='GO!';target.querySelector('.reaction-tap-subtitle').textContent='Tap now';}}},delay));
  reactionRun.timers.push(setTimeout(()=>{if(reactionRun.id===id&&reaction.phase==='waiting'){stopReactionPlayback();reaction.phase='late';updateReactionPanel();}},delay+10000));
  ctx.onstatechange=()=>{if(reactionRun.ctx===ctx&&ctx.state!=='running')cancelReaction('Sound was interrupted. Start a fresh go when you’re ready.');};
 }catch{if(reactionRun.id===id){stopReactionPlayback();reaction.phase='error';reaction.message='Sound could not start in this browser. Try again, or open the starting-signals lesson below.';updateReactionPanel();}}
}
function tapReaction(){
 if(reaction.phase!=='waiting'||!reactionRun.ctx)return;
 const ms=reactionElapsedMs(reactionRun.ctx,reactionRun.signalAt,performance.now());
 reaction.ms=ms;reaction.phase=reactionOutcome(ms);stopReactionPlayback();updateReactionPanel();
 const heading=document.querySelector('#reaction-game h3');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
}
function reactionPicture(){
 const canvas=node('canvas');canvas.width=1080;canvas.height=1080;const c=canvas.getContext('2d');
 c.fillStyle='#0b456c';c.fillRect(0,0,1080,1080);c.fillStyle='#f1c64e';c.fillRect(70,80,940,10);c.textAlign='center';
 c.font='700 34px system-ui';c.fillText('THE MAKO START CHALLENGE',540,170);
 c.fillStyle='white';c.font='700 48px system-ui';const name=(reaction.name.trim()||'My reaction').slice(0,32);c.fillText(name,540,320,900);
 c.font='800 150px system-ui';c.fillText(Math.round(reaction.ms)+' ms',540,520,920);
 c.font='32px system-ui';c.fillText((reaction.type==='back'?'Backstroke':'Dive')+' start · '+(reaction.visual?'sound + visual':'sound only'),540,625);
 c.font='700 48px system-ui';c.fillText('LISTEN. WAIT. TAP.',540,760);c.font='30px system-ui';c.fillText('Can you beat that?',540,820);
 c.font='24px system-ui';c.fillText('A fun device reaction game — not an official start time.',540,940);
 if(reactionPublicUrl())c.fillText('rules.fleetwoodmakos.com/#reaction',540,1000);
 return canvas;
}
async function shareReaction(){
 if(reaction.phase!=='result')return;const status=document.getElementById('reaction-share-status');
 const text=reactionShareText(reaction.name,reaction.ms,reaction.type,reaction.visual,reactionPublicUrl());
 try{
  if(navigator.share){await navigator.share({title:'The Mako Start Challenge',text});if(status.isConnected)status.textContent='Result shared.';return;}
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);if(status.isConnected)status.textContent='Result copied. Paste it into your message to a friend.';return;}
  throw Error('No share method');
 }catch(error){if(!status.isConnected)return;if(error.name==='AbortError'){status.textContent='Sharing cancelled. Your result is still here.';return;}
  status.replaceChildren(node('span','Copy this result into your message:'));const field=node('textarea');field.readOnly=true;field.value=text;field.setAttribute('aria-label','Result to copy');status.append(field);field.select();
 }
}
root.addEventListener('pointerdown',event=>{if(event.target.closest('#reaction-tap')&&event.isPrimary!==false&&(event.button===0||event.pointerType==='touch')){event.preventDefault();tapReaction();}});
root.addEventListener('keydown',event=>{if(event.target.closest('#reaction-tap')&&[' ','Enter'].includes(event.key)){event.preventDefault();if(!event.repeat)tapReaction();}});
root.addEventListener('click',event=>{
 if(event.detail===0&&event.target.closest('#reaction-tap')){tapReaction();return;}
 const b=event.target.closest('button[data-action]');if(!b||b.disabled)return;const a=b.dataset.action;
 if(a==='reaction-start')startReaction();
 if(a==='reaction-cancel')cancelReaction('Go cancelled. Start again whenever you’re ready.');
 if(a==='reaction-settings'){stopReactionPlayback();reaction.phase='idle';updateReactionPanel();}
 if(a==='reaction-share')shareReaction();
 if(a==='reaction-save'&&reaction.phase==='result'){const link=node('a');link.href=reactionPicture().toDataURL('image/png');link.download='mako-start-challenge.png';link.click();document.getElementById('reaction-share-status').textContent='Result picture ready to save.';}
},false);
root.addEventListener('click',event=>{const b=event.target.closest('[data-action]');if(b&&!b.dataset.action.startsWith('reaction-')){cancelReaction('Go cancelled when you left the game.');if(state.area==='reaction')reaction.name='';}},true);
root.addEventListener('input',event=>{if(event.target.id==='reaction-name')reaction.name=event.target.value.slice(0,32);});
root.addEventListener('change',event=>{if(event.target.id==='reaction-type')reaction.type=event.target.value==='back'?'back':'dive';if(event.target.id==='reaction-visual')reaction.visual=event.target.checked;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelReaction('The screen was hidden, so this go was cancelled. Try again when you’re ready.');});
window.addEventListener('blur',()=>cancelReaction('The game lost focus, so this go was cancelled. Try again when you’re ready.'));
window.addEventListener('pagehide',stopReactionPlayback);
window.addEventListener('hashchange',()=>{if(location.hash==='#reaction'){state.area='reaction';render(true);}});
