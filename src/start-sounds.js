let startAudioContext=null,startAudioTimers=[],audioVolume=.25;
function stopStartAudio(){
 for(const timer of startAudioTimers)clearTimeout(timer);startAudioTimers=[];
 if(startAudioContext){startAudioContext.close().catch(()=>{});startAudioContext=null;}
 document.querySelectorAll('.sound-status').forEach(e=>e.textContent='Sound stopped. Press Play to hear the cue again.');
}
function whistleSamples(rate,duration){
 const samples=new Float32Array(Math.ceil(rate*duration));let phase=0,seed=17;
 for(let i=0;i<samples.length;i++){
  const t=i/rate,envelope=Math.min(1,t/.035,(duration-t)/.07),trill=.72+.28*Math.sin(2*Math.PI*36*t);
  phase+=2*Math.PI*(2850+55*Math.sin(2*Math.PI*7*t))/rate;
  seed=(1664525*seed+1013904223)>>>0;const breath=(seed/4294967296*2-1)*.035;
  samples[i]=Math.max(0,envelope)*trill*(.48*Math.sin(phase)+.16*Math.sin(phase*1.17)+breath);
 }
 return samples;
}
function makeStartTimeline(type,marksDuration,readyPause=1.7){
 const events=[{at:0,kind:'short',caption:'Three short whistles — get ready at the starting end.'},{at:3,kind:'long',caption:type==='back'?'First long whistle — enter the water promptly.':'Long whistle — get onto the starting block.'},{at:5.4,kind:'pause',caption:type==='back'?'Time to enter the water and get ready.':'Time to get onto the block. Wait for “Take your marks”.'}];
 let marksAt=11.4;
 if(type==='back'){events.push({at:11.4,kind:'long',caption:'Second long whistle — return to the wall and hold the starting grips.'},{at:13.8,kind:'pause',caption:'Time to take hold of the grips and get into position.'});marksAt=18.8;}
 events.push({at:marksAt,kind:'marks',caption:'Take your marks — take your starting position.'},{at:marksAt+marksDuration,kind:'pause',caption:'Be still. Wait for the starting signal.'},{at:marksAt+marksDuration+readyPause,kind:'signal',caption:'Starting signal — go!'});return events;
}
function soundControls(cue){
 const c=node('div',null,'sound-controls'),full=cue.startsWith('Full ');
 const play=button('▶ '+(full?'Play whole sequence':'Play '+cue),'audio-play',cue),stop=button('■ Stop sound','audio-stop',undefined,'button secondary');
 const label=node('label','Sound level'),volume=node('input');volume.type='range';volume.min='0';volume.max='100';volume.value=String(Math.round(audioVolume*100));volume.setAttribute('aria-label','Sound level');volume.dataset.audioVolume='true';label.append(volume);
 const status=node('p','Sound is off until you press Play.','sound-status');status.setAttribute('role','status');
 append(c,row(play,stop),label,status,node('p','Illustrative whistle and starting sounds, with a spoken command. This rehearsal uses three short whistles; the rule describes a series. Pauses vary at meets: follow the officials and wait for the signal.','small-note'));return c;
}
function fullStartRehearsal(type){
 const c=node('section',null,'full-start-rehearsal');append(c,node('h4','Put the whole start together'),node('p',type==='back'?'Three short whistles → first long whistle → time to enter the water → second long whistle → time to hold the grips → “Take your marks” → be still → starting signal.':'Three short whistles → long whistle → time to get onto the block → “Take your marks” → be still → starting signal.'),node('p','Rehearse the order here, then practise the physical start with your coach. The words below follow the sound; there is no countdown to anticipate.','small-note'),soundControls(type==='back'?'Full backstroke start':'Full dive start'));return c;
}
async function playStartCue(cue,host){
 stopStartAudio();const status=host.querySelector('.sound-status');
 if(audioVolume===0){status.textContent='Muted. Raise the sound level or use the written sequence.';return;}
 let ctx;
 try{
  const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw new Error('Audio not supported');
  ctx=new Context();startAudioContext=ctx;await ctx.resume();if(startAudioContext!==ctx)return;
  const full=cue.startsWith('Full ');let marks;
  if(full||cue==='Take your marks'){
   const binary=atob(START_AUDIO.marks.split(',')[1]),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
   marks=await ctx.decodeAudioData(bytes.buffer);if(startAudioContext!==ctx)return;
  }
  const master=ctx.createGain();master.gain.value=audioVolume*.55;master.connect(ctx.destination);
  const now=ctx.currentTime+.12;
  const caption=(at,text)=>{startAudioTimers.push(setTimeout(()=>{if(startAudioContext===ctx&&status.isConnected)status.textContent=text;},(at+.12)*1000));};
  const whistle=(at,duration)=>{const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate);buffer.copyToChannel(whistleSamples(ctx.sampleRate,duration),0);const src=ctx.createBufferSource();src.buffer=buffer;src.connect(master);src.start(now+at);};
  const signal=at=>{for(const[freq,scale]of[[660,.5],[880,.22]]){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=freq;gain.gain.setValueAtTime(0,now+at);gain.gain.linearRampToValueAtTime(scale,now+at+.02);gain.gain.setValueAtTime(scale,now+at+.32);gain.gain.linearRampToValueAtTime(0,now+at+.4);osc.connect(gain);gain.connect(master);osc.start(now+at);osc.stop(now+at+.42);}};
  const events=full?makeStartTimeline(cue==='Full backstroke start'?'back':'dive',marks.duration,1.3+Math.random()):[{at:0,kind:cue==='Short whistles'?'short':cue==='Take your marks'?'marks':cue==='Starting signal'?'signal':'long',caption:'Playing: '+cue+'.'}];
  let end=0;for(const e of events){caption(e.at,e.caption);let duration=0;
   if(e.kind==='short'){for(const offset of [0,.8,1.6])whistle(e.at+offset,.34);duration=1.94;}
   if(e.kind==='long'){whistle(e.at,2.4);duration=2.4;}
   if(e.kind==='signal'){signal(e.at);duration=.42;}
   if(e.kind==='marks'){const src=ctx.createBufferSource();src.buffer=marks;src.connect(master);src.start(now+e.at);duration=marks.duration;}
   end=Math.max(end,e.at+duration);
  }
  startAudioTimers.push(setTimeout(()=>{if(startAudioContext===ctx){ctx.close().catch(()=>{});startAudioContext=null;startAudioTimers=[];status.textContent=full?'Sequence complete. Replay whenever you like.':'Finished: '+cue+'. Replay whenever you like.';}},(end+.3)*1000));
 }catch{if(startAudioContext===ctx){stopStartAudio();status.textContent='Sound is unavailable here. Use the written cues to complete the rehearsal.';}}
}
function microLeagueNote(){
 const c=panel('Micro League North West · water-start relays',null,'micro-league-note');
 append(c,node('p','Published league provision · Rule 11d (2023 document currently linked by the league): diving is from the starting end only, with relay swimmers two and four pushing off from the water. Diving at both ends may be permitted at the Main Final and swim-off finals where pool conditions allow.'),node('p','Before your relay, ask your team manager which end you start from and confirm the takeover instructions with the referee. A water takeover needs its own briefing; the platform rule about feet leaving the block does not describe it.'),node('p','Hand-release detail — not confirmed in the published league rules: we could not verify the proposed requirement to keep a hand on the wall until the incoming swimmer touches. Confirm this before racing; it is not included as a scored rule question.','small-note'),external('Micro League official rules · 11d, page 3','https://www.microleaguenw.org.uk/documents/MicroNWRules2023.pdf'),node('p','Source checked 14 October 2026. The document is dated 2023; check for a newer fixture briefing.','small-note'));return c;
}
const SIGNAL_CHOICES=[['ready','Get ready at the starting end.'],['block','Get onto the starting block and wait.'],['water','Enter the water promptly.'],['grips','Return to the wall and take hold of the starting grips.'],['marks','Take your starting position and be still.'],['go','Start swimming.']];
const SIGNAL_ROUND=[{type:'dive',step:0,correct:'ready'},{type:'dive',step:1,correct:'block'},{type:'dive',step:2,correct:'marks'},{type:'dive',step:3,correct:'go'},{type:'back',step:1,correct:'water'},{type:'back',step:2,correct:'grips'},{type:'back',step:3,correct:'marks'},{type:'back',step:4,correct:'go'}];
let signalPractice={order:shuffleItems(SIGNAL_ROUND.map((_,i)=>i)),index:0,answers:[],options:shuffleItems(SIGNAL_CHOICES.map(x=>x[0]))};
function signalGame(){const g=node('section',null,'signal-game');g.id='signal-game';g.tabIndex=-1;append(g,node('p','HEAR IT · RECOGNISE IT · KNOW WHAT TO DO','eyebrow'),node('h3','Your turn at the starting end'));
 const p=signalPractice;if(p.index===p.order.length){const correct=p.answers.filter((x,i)=>x===SIGNAL_ROUND[p.order[i]].correct).length;append(g,node('p',correct+' / '+p.order.length+' cues recognised. '+(correct===p.order.length?'You’re getting comfortable with the signals.':'Rehearse any that surprised you, then have another go.')),node('p','This is rehearsal, not a stage check. You can use the written cues, sound or both. There is no time limit.','small-note'),button('Play the signals again','audio-restart'));return g;}
 const q=SIGNAL_ROUND[p.order[p.index]],step=START_STEPS[q.type][q.step],answered=p.answers.length>p.index;append(g,node('p','CUE '+(p.index+1)+' OF '+p.order.length+' · '+(q.type==='dive'?'DIVE START':'BACKSTROKE / MEDLEY RELAY'),'eyebrow'),node('p','Written cue: '+step[0],'hint-box'),soundControls(step[0]),node('h4','What should you do now?'));const answers=node('div',null,'choice-grid');for(const id of p.options){const b=button(SIGNAL_CHOICES.find(x=>x[0]===id)[1],'audio-answer',id,'practice-choice');b.disabled=answered;b.setAttribute('aria-pressed',String(p.answers[p.index]===id));answers.append(b);}g.append(answers);if(answered){const ok=p.answers[p.index]===q.correct;const feedback=panel(ok?'That’s right.':'Let’s rehearse that one.',step[1],'practice-feedback '+(ok?'success':'learning'));feedback.setAttribute('role','status');append(feedback,button('Read rule '+step[2],'clause',step[2],'text-button'));g.append(feedback,button(p.index===p.order.length-1?'See my signal results':'Next cue →','audio-next'));}else g.append(node('p','Long whistles prepare the start. Only the starting signal tells you to go. There is no countdown to predict.','small-note'));return g;
}
root.addEventListener('click',event=>{const b=event.target.closest('button[data-action]');if(!b||b.disabled||!b.dataset.action.startsWith('audio-'))return;const a=b.dataset.action.slice(6);if(a==='play'){playStartCue(b.dataset.value,b.closest('.sound-controls'));return;}if(a==='stop'){stopStartAudio();return;}const p=signalPractice;if(a==='answer'&&p.answers.length===p.index&&SIGNAL_CHOICES.some(x=>x[0]===b.dataset.value))p.answers.push(b.dataset.value);else if(a==='next'&&p.answers.length>p.index){p.index++;p.options=shuffleItems(SIGNAL_CHOICES.map(x=>x[0]));}else if(a==='restart')signalPractice={order:shuffleItems(SIGNAL_ROUND.map((_,i)=>i)),index:0,answers:[],options:shuffleItems(SIGNAL_CHOICES.map(x=>x[0]))};else return;stopStartAudio();render();document.getElementById('signal-game')?.focus({preventScroll:true});});
root.addEventListener('input',event=>{if(event.target.dataset.audioVolume){audioVolume=Number(event.target.value)/100;stopStartAudio();document.querySelectorAll('[data-audio-volume]').forEach(e=>e.value=event.target.value);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopStartAudio();});
window.addEventListener('pagehide',stopStartAudio);

root.addEventListener('click',event=>{const b=event.target.closest('[data-action]');if(b&&!b.dataset.action.startsWith('audio-'))stopStartAudio();},true);
