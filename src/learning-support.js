let observationPosition={id:null,index:0};
function termText(text,tag='p',cls){
 const el=node(tag,null,cls);for(const part of termSegments(text,LEARNING.terms)){if(part.id){const b=jbutton(part.text,'term',part.id,'term-link');b.setAttribute('aria-label','Explain '+part.text);el.append(b);}else el.append(document.createTextNode(part.text));}return el;
}
function showWords(id){
 const existing=document.getElementById('word-dialog');if(existing){existing.close();existing.remove();}
 const trigger=document.activeElement,dialog=node('dialog',null,'word-dialog');dialog.id='word-dialog';dialog.setAttribute('aria-labelledby','word-title');
 const title=node('h2',id?LEARNING.terms.find(t=>t.id===id)?.term:'Swimming words');title.id='word-title';
 const close=node('button','Close','button secondary');close.type='button';close.addEventListener('click',()=>dialog.close());dialog.append(title,close);
 if(id){const term=LEARNING.terms.find(t=>t.id===id);dialog.append(node('p',term.definition));const all=node('button','See all swimming words','text-button');all.addEventListener('click',()=>{dialog.close();showWords();});dialog.append(all);}
 else{const label=node('label','Find a word');const input=node('input');input.type='search';input.placeholder='Try marshalling or pullout';label.append(input);dialog.append(label);const list=node('div'),status=node('p',null,'small-note');status.setAttribute('role','status');dialog.append(status,list);const update=()=>{list.replaceChildren();const needle=input.value.trim().toLowerCase(),terms=LEARNING.terms.filter(t=>[t.term,...t.aliases,t.definition].join(' ').toLowerCase().includes(needle));status.textContent=terms.length+' '+(terms.length===1?'word':'words');for(const term of terms){const item=node('section');item.append(node('h3',term.term),node('p',term.definition));list.append(item);}};input.addEventListener('input',update);update();}
 dialog.addEventListener('close',()=>{dialog.remove();if(trigger?.isConnected)trigger.focus();},{once:true});document.body.append(dialog);dialog.showModal();close.focus();
}
function observationGraphic(scene,f){
 const s=svgNode('svg',{viewBox:'0 0 600 380',role:'img','aria-label':f.caption});
 const ink='#183c60',far='#66859b',gold='#edc34f',water='#d8edf7';
 const path=(d,color=ink,w=5)=>svgNode('path',{d,fill:'none',stroke:color,'stroke-width':w,'stroke-linecap':'round','stroke-linejoin':'round'});
 const shape=(d,fill)=>svgNode('path',{d,fill});
 const text=(x,y,t,size=17)=>svgNode('text',{x,y,fill:ink,'font-size':size,'font-weight':650},t);
 const ring=(p)=>svgNode('circle',{cx:p[0],cy:p[1],r:10,fill:'none',stroke:'#216957','stroke-width':2});
 const chain=points=>points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
 const pool=(wall,surface,top=surface-13)=>s.append(svgNode('rect',{x:wall,y:surface,width:600-wall,height:380-surface,fill:water}),shape(`M0 ${top} H${wall} V380 H0 Z`,'#e0e9ee'),path(`M${wall} ${top} V380`,'#91adbd',4),path(`M${wall} ${surface} H600`,'#5cabc8',2));
 s.append(svgNode('rect',{width:600,height:380,rx:18,fill:'#f1f7fb'}));
 const figures=observationPoses(scene,f);
 if(scene==='relay'){
  pool(190,253);
  const block=svgNode('g',{transform:'translate(30 80)'});
  block.append(shape('M100 119 H139 L147 157 H87 Z','#b4c5cf'),shape('M115 121 H139 L147 157 H122 Z','#819dad'),svgNode('rect',{x:81,y:154,width:72,height:6,rx:3,fill:'#728fa1'}),shape('M69 102 L173 114 V125 L69 113 Z','#587b91'),shape('M69 102 L173 114 L173 118 L69 106 Z','#254f6b'),path('M73 102 L169 113','#719db7',2),shape('M88 103 L94 81 L119 108 Z','#d6a738'),shape('M94 81 L119 108 L113 108 L91 86 Z','#f0c653'),path('M98 88 L113 104','#8d701e',2));s.append(block);
  s.append(text(26,32,'OUTGOING SWIMMER',16),text(26,54,f.feet?'Feet still touching':'Feet have left the block',15),text(272,354,f.hand?'INCOMING · hand touches':'INCOMING · not yet touching',15));
 }else if(scene==='touch'){
  pool(88,215,150);s.append(text(25,32,'SIDE VIEW · Both arms shown separately',17),text(320,87,'Left hand: '+(f.touches>=1?'touch':'not yet'),16),text(320,113,'Right hand: '+(f.touches===2?'touch':'not yet'),16),text(90,319,'Rings mark direct wall contact.',15),text(90,344,'A gap means the hand has not reached the wall.',14));
 }else if(scene==='distance'){
  s.append(svgNode('rect',{x:0,y:178,width:600,height:202,fill:water}),path('M0 178 H600','#5cabc8',2),text(25,35,f.distance,24),text(25,70,f.submerged?'Head is still below the surface':'Head breaks the surface',17),text(25,333,'SWIMMING DIRECTION →',15));if(f.handUp)s.append(text(365,134,'Hand above water',14),path('M420 141 L391 166',far,1.5));
 }else if(scene==='wall'){
  pool(70,150);s.append(text(25,34,'FREESTYLE TURN · SIDE VIEW',17));
  s.append(text(215,108,f.contact==='feet'?'Feet plant · body level · arms in streamline':f.contact==='away'?'Push away in a tight streamline →':'← Last strokes into the turn',f.contact==='feet'?15:17));
  if(f.contact==='feet')s.append(path('M78 230 H432',far,1),text(85,306,'Head and feet at the same depth',15));
 }else{
  pool(70,166);s.append(text(25,35,f.orientation,23),text(255,286,f.orientation==='On the back'?'Chest faces up ↑':f.orientation==='On the breast'?'Chest faces down ↓':'Rotation follows the legal touch ↻',15),text(90,326,f.contact==='hand'?'Hand touching the wall':'No wall contact at this instant',16));
 }
 for(const [index,p]of figures.entries()){
  const g=svgNode('g',{'data-swimmer':'complete','data-figure':index});
  for(const limb of [p.legs[1],p.arms[1]])g.append(path(chain(limb),far,4));
  g.append(path(chain([p.hip,p.shoulder,p.head])));
  for(const limb of [p.legs[0],p.arms[0]])g.append(path(chain(limb)));
  // Short feet are fixed extensions, never stretched to make contact.
  for(const leg of p.legs){const ankle=leg[2];if(scene==='wall'&&f.contact==='feet')g.append(path(chain([ankle,[ankle[0],ankle[1]-10]]),ink,4));}
  g.append(svgNode('circle',{cx:p.head[0],cy:p.head[1],r:10,fill:gold}));s.append(g);
 }
 if(scene==='relay'){if(f.feet)s.append(ring(figures[0].legs[0][2]));if(f.hand)s.append(ring(figures[1].arms[0][2]));}
 if(scene==='touch'){if(f.touches>=1)s.append(ring(figures[0].arms[0][2]));if(f.touches===2)s.append(ring(figures[0].arms[1][2]));}
 if(scene==='wall'&&f.contact==='feet')s.append(ring(figures[0].legs[0][2]));
 if(scene==='orientation'&&f.contact==='hand')s.append(ring(figures[0].arms[0][2]));
 return s;
}
function observationView(q){
 if(observationPosition.id!==q.id)observationPosition={id:q.id,index:0};const o=q.observation,i=observationPosition.index,f=o.frames[i];
 const wrap=node('section',null,'observation-view');wrap.setAttribute('aria-label','Observe the race action');
 wrap.append(node('p','LOOK AT THE ACTION · '+(i+1)+' OF '+o.frames.length,'eyebrow'),observationGraphic(o.scene,f));
 const caption=node('p',f.title+': '+f.caption,'observation-caption');caption.setAttribute('aria-live','polite');wrap.append(caption);
 if(o.frames.length>1){const prev=jbutton('← Previous picture','observe-step','-1','button secondary'),next=jbutton('Next picture →','observe-step','1','button secondary');prev.disabled=i===0;next.disabled=i===o.frames.length-1;wrap.append(row(prev,next));}
 const all=node('details',null,'written-sequence');all.append(node('summary','Read the complete sequence'));const list=node('ol');for(const frame of o.frames)list.append(node('li',frame.caption));all.append(list);all.open=observationPosition.expanded===true;all.addEventListener('toggle',()=>{observationPosition.expanded=all.open;});wrap.append(all,node('p','Schematic illustration. Use the stated timing, position and distance; do not estimate them from the drawing.','small-note'));if(o.scene==='wall'){const coaching=node('p','Coaching position: a level body and streamlined arms at the wall plant. ','small-note');coaching.append(external('British Swimming freestyle-turn factsheet','https://uk.gomotionapp.com/serwdsc/UserFiles/Image/QuickUpload/fc-turns_017759.pdf'));wrap.append(coaching);}return wrap;
}
function visualLibrary(main){
 main.append(hero('OBSERVE. THINK. MAKE THE CALL.','Look at the action.','Move through each sequence at your own pace, or read the complete written account. There is no timer.'));
 main.append(row(jbutton('← Choose a practice round','pause',undefined,'text-button'),jbutton('Swimming words','words',undefined,'text-button')));
 if(journey.round&&!journey.round.complete)main.append(node('p','Starting a visual question replaces your unfinished practice round.','small-note'),jbutton('Continue saved round','resume',undefined,'text-button'));
 const grid=node('div',null,'lesson-grid');for(const q of BANK.filter(q=>q.observation)){const card=panel(q.title,labelOf(STROKES,q.stroke)+' · '+routeLabel(q.level));const b=jbutton('Try this visual question →','visual-question',q.id);b.setAttribute('aria-label','Try: '+q.title);card.append(b);grid.append(card);}main.append(grid);
}
