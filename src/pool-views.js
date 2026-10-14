/* Pool illustrations are original schematic SVGs; the verified content owns their labels and dimensions. */
const POOL_INK = '#1d4667', POOL_WATER = '#e9f4fb', POOL_BLUE = '#548bab', POOL_GOLD = '#d9a93d';
function poolShape(svg, tag, attrs, text){const item=svgNode(tag,attrs,text);svg.append(item);return item;}
function poolLine(svg,x1,y1,x2,y2,attrs={}){return poolShape(svg,'line',{x1,y1,x2,y2,stroke:POOL_INK,'stroke-width':3,...attrs});}
function poolKey(svg,id,x,y){const group=svgNode('g',{'aria-hidden':'true'});append(group,svgNode('circle',{cx:x,cy:y,r:19,fill:'#fff',stroke:POOL_INK,'stroke-width':2}),svgNode('text',{x,y:y+6,'text-anchor':'middle',fill:POOL_INK,'font-size':19,'font-weight':800},String(id)));svg.append(group);}
function poolDimension(svg,x1,y1,x2,y2,label){poolLine(svg,x1,y1,x2,y2,{stroke:POOL_BLUE,'stroke-width':2});const horizontal=Math.abs(y2-y1)<Math.abs(x2-x1);if(horizontal){poolLine(svg,x1,y1-7,x1,y1+7,{stroke:POOL_BLUE,'stroke-width':2});poolLine(svg,x2,y2-7,x2,y2+7,{stroke:POOL_BLUE,'stroke-width':2});}else{poolLine(svg,x1-7,y1,x1+7,y1,{stroke:POOL_BLUE,'stroke-width':2});poolLine(svg,x2-7,y2,x2+7,y2,{stroke:POOL_BLUE,'stroke-width':2});}if(label)poolShape(svg,'text',{x:(x1+x2)/2,y:(y1+y2)/2-10,'text-anchor':'middle',fill:POOL_INK,'font-size':21,'font-weight':750},label);}
function poolSvg(record,viewBox){const s=svgNode('svg',{viewBox,role:'img','aria-label':record.title,'preserveAspectRatio':'xMidYMid meet'});append(s,svgNode('title',{},record.title),svgNode('desc',{},record.summary+' '+record.labels.map(k=>k.id+'. '+k.label+': '+k.text).join(' ')));return s;}
function poolPlanSvg(record){
 const d=record.dimensions, s=poolSvg(record,'0 0 1000 500');
 const left=75,right=925,top=110,bottom=405,length=d.lengthM;
 const x=m=>left+(right-left)*m/length;
 poolShape(s,'rect',{x:left-13,y:top-13,width:right-left+26,height:bottom-top+26,rx:7,fill:'#d8e2e9'});
 poolShape(s,'rect',{x:left,y:top,width:right-left,height:bottom-top,fill:POOL_WATER,stroke:POOL_INK,'stroke-width':3});
 // The canonical record specifies an illustrative lane count, not a venue lane-count requirement.
 const laneCount=d.illustrativeLanes,laneH=(bottom-top)/laneCount;
 for(let n=0;n<laneCount;n++){
  const y=top+(n+.5)*laneH,t0=x(d.floorTFromWallM),t1=x(length-d.floorTFromWallM);
  poolLine(s,t0,y,t1,y,{stroke:'#536d82','stroke-width':4});
  poolLine(s,t0,y-12,t0,y+12,{stroke:'#536d82','stroke-width':5});poolLine(s,t1,y-12,t1,y+12,{stroke:'#536d82','stroke-width':5});
  poolShape(s,'rect',{x:left-29,y:y-12,width:22,height:24,rx:3,fill:'#698299'});
  for(const m of [d.markerFromWallM,length-d.markerFromWallM])poolLine(s,x(m),y-6,x(m),y+6,{stroke:'#536d82','stroke-width':5});
 }
 for(let n=1;n<laneCount;n++){
  const y=top+n*laneH;
  poolLine(s,left,y,right,y,{stroke:'#7292a7','stroke-width':5,'stroke-dasharray':'5 4'});
  poolLine(s,left,y,x(d.ropeRedFromWallM),y,{stroke:'#a85349','stroke-width':5,'stroke-dasharray':'5 4'});
  poolLine(s,x(length-d.ropeRedFromWallM),y,right,y,{stroke:'#a85349','stroke-width':5,'stroke-dasharray':'5 4'});
  for(const m of [d.markerFromWallM,length-d.markerFromWallM])poolLine(s,x(m)-4,y,x(m)+4,y,{stroke:POOL_GOLD,'stroke-width':8});
 }
 for(const m of [d.flagsFromWallM,length-d.flagsFromWallM]){
  const fx=x(m);poolLine(s,fx,top-20,fx,bottom+20,{stroke:POOL_INK,'stroke-width':2});
  for(let y=top-4;y<bottom;y+=30)poolShape(s,'path',{d:`M ${fx} ${y} l 17 9 l -17 9 z`,fill:POOL_GOLD,stroke:'#977126','stroke-width':1});
 }
 if(length===50)for(let n=1;n<laneCount;n++)poolLine(s,x(d.midpointM),top+n*laneH-6,x(d.midpointM),top+n*laneH+6,{stroke:'#765d91','stroke-width':9});
 poolDimension(s,left,43,right,43,String(length)+' m');
 poolDimension(s,left,82,x(d.flagsFromWallM),82,String(d.flagsFromWallM)+' m');
 poolDimension(s,x(length-d.flagsFromWallM),82,right,82,String(d.flagsFromWallM)+' m');
 poolDimension(s,left,451,x(d.markerFromWallM),451,String(d.markerFromWallM)+' m');
 poolDimension(s,x(length-d.markerFromWallM),482,right,482,String(d.markerFromWallM)+' m');
 poolKey(s,1,right+34,255);poolKey(s,2,x(d.flagsFromWallM),top-26);poolKey(s,3,x(length-d.markerFromWallM),bottom+27);poolKey(s,4,x(length*.72),top+laneH);poolKey(s,5,x(d.floorTFromWallM),top+laneH*2.5);if(length===50)poolKey(s,6,x(d.midpointM),top+laneH);
 s.classList.add('pool-plan-wide');return s;
}
function poolPlanPortraitSvg(record){
 const d=record.dimensions,s=poolSvg(record,'0 0 440 875'),left=95,right=370,top=98,bottom=729;
 const y=m=>top+(bottom-top)*m/d.lengthM,laneW=(right-left)/d.illustrativeLanes;
 poolShape(s,'rect',{x:left-10,y:top-10,width:right-left+20,height:bottom-top+20,rx:6,fill:'#d8e2e9'});
 poolShape(s,'rect',{x:left,y:top,width:right-left,height:bottom-top,fill:POOL_WATER,stroke:POOL_INK,'stroke-width':3});
 for(let n=0;n<d.illustrativeLanes;n++){const cx=left+(n+.5)*laneW;poolLine(s,cx,y(d.floorTFromWallM),cx,y(d.lengthM-d.floorTFromWallM),{stroke:'#536d82','stroke-width':4});for(const m of[d.floorTFromWallM,d.lengthM-d.floorTFromWallM])poolLine(s,cx-14,y(m),cx+14,y(m),{stroke:'#536d82','stroke-width':5});for(const m of[d.markerFromWallM,d.lengthM-d.markerFromWallM])poolLine(s,cx-7,y(m),cx+7,y(m),{stroke:'#536d82','stroke-width':5});}
 for(let n=1;n<d.illustrativeLanes;n++){const cx=left+n*laneW;poolLine(s,cx,top,cx,bottom,{stroke:'#7292a7','stroke-width':5,'stroke-dasharray':'5 4'});poolLine(s,cx,top,cx,y(d.ropeRedFromWallM),{stroke:'#a85349','stroke-width':5,'stroke-dasharray':'5 4'});poolLine(s,cx,y(d.lengthM-d.ropeRedFromWallM),cx,bottom,{stroke:'#a85349','stroke-width':5,'stroke-dasharray':'5 4'});for(const m of[d.markerFromWallM,d.lengthM-d.markerFromWallM])poolLine(s,cx-6,y(m),cx+6,y(m),{stroke:POOL_GOLD,'stroke-width':8});if(d.lengthM===50)poolLine(s,cx-6,y(d.midpointM),cx+6,y(d.midpointM),{stroke:'#765d91','stroke-width':8});}
 for(const m of[d.flagsFromWallM,d.lengthM-d.flagsFromWallM]){const fy=y(m);poolLine(s,left-16,fy,right+16,fy);for(let cx=left;cx<right;cx+=29)poolShape(s,'path',{d:`M ${cx} ${fy} l 9 17 l 9 -17 z`,fill:POOL_GOLD,stroke:'#977126','stroke-width':1});}
 poolShape(s,'text',{x:244,y:48,'text-anchor':'middle',fill:POOL_INK,'font-size':19,'font-weight':700},'Left wall in the horizontal plan');poolShape(s,'text',{x:231,y:829,'text-anchor':'middle',fill:POOL_INK,'font-size':19,'font-weight':700},'Right wall in the horizontal plan');
 poolDimension(s,47,top,47,bottom);poolShape(s,'text',{x:47,y:62,'text-anchor':'middle',fill:POOL_INK,'font-size':23,'font-weight':750},d.lengthM+' m');
 poolDimension(s,409,top,409,y(d.flagsFromWallM));poolShape(s,'text',{x:399,y:top-18,'text-anchor':'middle',fill:POOL_INK,'font-size':22,'font-weight':750},d.flagsFromWallM+' m');
 poolDimension(s,409,y(d.lengthM-d.flagsFromWallM),409,bottom);poolShape(s,'text',{x:399,y:bottom+40,'text-anchor':'middle',fill:POOL_INK,'font-size':22,'font-weight':750},d.flagsFromWallM+' m');
 poolKey(s,1,232,bottom+40);poolKey(s,2,77,y(d.flagsFromWallM));poolKey(s,3,385,y(d.markerFromWallM));poolKey(s,4,left+laneW,y(d.lengthM*.75));poolKey(s,5,left+laneW*.5,y(d.floorTFromWallM));if(d.lengthM===50)poolKey(s,6,77,y(d.midpointM));
 s.classList.add('pool-plan-portrait');return s;
}
function poolMarkingsSvg(record){
 const group=node('div',null,'pool-marking-parts'),d=record.dimensions;
 const floor=poolSvg(record,'0 0 440 355');
 poolShape(floor,'rect',{x:48,y:66,width:355,height:223,fill:POOL_WATER,rx:5});poolLine(floor,48,66,48,289,{'stroke-width':9});
 poolLine(floor,190,181,403,181,{stroke:'#3e566b','stroke-width':17});poolLine(floor,190,145,190,217,{stroke:'#3e566b','stroke-width':17});
 poolDimension(floor,48,269,190,269,d.floorTFromWallM+' m');poolDimension(floor,151,145,151,217,d.floorCrossbarM+' m');poolKey(floor,1,117,299);poolKey(floor,2,190,115);poolKey(floor,3,328,181);
 const rope=poolSvg(record,'0 0 440 355'),rx=m=>35+370*m/d.lengthM;
 poolShape(rope,'rect',{x:35,y:66,width:370,height:223,fill:POOL_WATER,rx:5});poolLine(rope,35,66,35,289,{'stroke-width':9});poolLine(rope,35,165,405,165,{stroke:'#7292a7','stroke-width':10,'stroke-dasharray':'9 5'});poolLine(rope,35,165,rx(d.ropeRedFromWallM),165,{stroke:'#a85349','stroke-width':10,'stroke-dasharray':'9 5'});poolLine(rope,rx(d.markerFromWallM),155,rx(d.markerFromWallM),175,{stroke:POOL_GOLD,'stroke-width':12});
 poolDimension(rope,35,113,rx(d.ropeRedFromWallM),113,d.ropeRedFromWallM+' m');poolDimension(rope,35,259,rx(d.markerFromWallM),259,d.markerFromWallM+' m');poolKey(rope,4,rx(d.ropeRedFromWallM),165);poolKey(rope,5,rx(d.markerFromWallM),198);
 const wall=poolSvg(record,'0 0 440 355');poolShape(wall,'rect',{x:45,y:66,width:350,height:223,fill:'#d8e2e9',rx:5});poolShape(wall,'rect',{x:45,y:112,width:350,height:177,fill:POOL_WATER});poolLine(wall,45,112,395,112,{stroke:POOL_BLUE,'stroke-width':3});poolLine(wall,220,73,220,289,{stroke:'#3e566b','stroke-width':17});poolLine(wall,159,186,281,186,{stroke:'#3e566b','stroke-width':17});poolDimension(wall,159,254,281,254,d.wallCrossbarM*100+' cm');poolDimension(wall,330,112,330,186);poolShape(wall,'text',{x:332,y:95,'text-anchor':'middle',fill:POOL_INK,'font-size':21,'font-weight':750},d.wallCrossbarBelowWaterM*100+' cm');poolKey(wall,7,220,187);
 for(const[title,svg]of[['Floor',floor],['Surface lane rope',rope],['End wall / touchpad',wall]]){const box=node('div',null,'pool-marking-part');append(box,node('p',title,'diagram-label'),svg);group.append(box);}return group;
}
function poolBlockSvg(record){
 const s=poolSvg(record,'40 55 450 475');
 poolShape(s,'path',{d:'M300 440 H485 V510 H300 Z',fill:POOL_WATER});poolLine(s,300,440,485,440,{stroke:POOL_BLUE,'stroke-width':3});
 poolShape(s,'path',{d:'M50 325 H300 V510 H272 V349 H50 Z',fill:'#cbd6df',stroke:'#7990a3','stroke-width':2});
 poolShape(s,'path',{d:'M100 176 L300 195 L300 214 L100 195 Z',fill:POOL_INK});
 poolShape(s,'path',{d:'M142 199 L191 204 L218 325 L165 325 Z',fill:'#8299ab'});
 poolShape(s,'path',{d:'M110 177 L148 135 L177 183 Z',fill:POOL_GOLD,stroke:'#967027','stroke-width':2});
 poolShape(s,'path',{d:'M275 211 V273 H292 V291 H266',fill:'none',stroke:'#677f91','stroke-width':10,'stroke-linejoin':'round'});
 poolShape(s,'text',{x:182,y:278,'text-anchor':'middle',fill:'#fff','font-size':23,'font-weight':800},'#');
 poolLine(s,300,349,300,510,{stroke:POOL_INK,'stroke-width':5});
 poolShape(s,'path',{d:'M302 438 L307 438 L314 477 L302 477 Z',fill:POOL_INK});
 poolDimension(s,383,195,383,440);poolDimension(s,100,102,300,102);
 poolLine(s,300,195,390,195,{stroke:POOL_BLUE,'stroke-width':2});
 poolKey(s,1,383,317);poolKey(s,2,200,102);poolKey(s,3,312,144);poolKey(s,4,281,283);poolKey(s,5,133,162);poolKey(s,6,180,269);poolKey(s,7,337,441);
 return s;
}
function poolLedgeSvg(record){
 const s=poolSvg(record,'90 65 450 590'),d=record.dimensions;
 poolShape(s,'rect',{x:210,y:177,width:309,height:276,fill:POOL_WATER});poolShape(s,'rect',{x:178,y:90,width:32,height:363,fill:'#cbd6df'});poolLine(s,210,90,210,453,{'stroke-width':5});poolLine(s,210,177,518,177,{stroke:POOL_BLUE,'stroke-width':3});
 const ledgeTop=233,ledgeBottom=393,height=ledgeBottom-ledgeTop,ledgeWidth=height*d.widthM/d.heightM,frontTop=210+ledgeWidth-height*Math.tan(d.slopeDegrees*Math.PI/180),frontBottom=210+ledgeWidth;
 poolShape(s,'path',{d:`M210 ${ledgeTop} H${frontTop} L${frontBottom} ${ledgeBottom} H210 Z`,fill:POOL_INK});poolLine(s,frontTop,ledgeTop,frontBottom,ledgeBottom,{stroke:POOL_GOLD,'stroke-width':5});
 poolLine(s,218,90,218,ledgeTop,{stroke:'#839bad','stroke-width':5});
 poolShape(s,'path',{d:'M211 201 C214 193 224 196 230 210 L239 236 L249 269 L276 291 C283 299 277 310 266 306 L240 293 L229 272 L219 240 L211 230 Z',fill:'#e6bd78',stroke:'#866934','stroke-width':2});
 poolShape(s,'circle',{cx:212,cy:211,r:5,fill:'#946622'});
 poolDimension(s,383,177-height*d.adjustmentAboveM/d.heightM,383,177+height*d.adjustmentBelowM/d.heightM);poolLine(s,371,177,395,177,{stroke:POOL_BLUE,'stroke-width':2});
 poolDimension(s,297,ledgeTop,297,ledgeBottom);poolDimension(s,210,426,frontBottom,426);
 poolLine(s,frontTop,ledgeTop,frontTop,ledgeBottom,{stroke:POOL_BLUE,'stroke-width':1,'stroke-dasharray':'5 5'});
 poolShape(s,'path',{d:`M${frontTop} 356 Q${frontTop+14} 350 ${frontBottom-6} 356`,fill:'none',stroke:POOL_BLUE,'stroke-width':2});
 poolShape(s,'rect',{x:147,y:521,width:316,height:41,rx:3,fill:POOL_INK});poolShape(s,'rect',{x:147,y:512,width:316,height:12,rx:3,fill:POOL_GOLD});poolDimension(s,147,600,463,600);
 poolKey(s,1,383,97);poolKey(s,2,305,600);poolKey(s,3,298,343);poolKey(s,4,245,371);poolKey(s,5,195,211);
 return s;
}
function poolRecordCard(record,large=false){
 const article=node('article',null,'pool-card'+(large?' pool-card-wide':''));article.id='facility-'+record.id;
 append(article,node('p',record.scope,'eyebrow'),node('h3',record.title),node('p',record.summary,'lead-small'));
 const fig=node('figure',null,'pool-figure');const draw={pool:poolPlanSvg,markings:poolMarkingsSvg,block:poolBlockSvg,ledge:poolLedgeSvg}[record.type];if(draw)fig.append(draw(record));if(record.type==='pool')fig.append(poolPlanPortraitSvg(record));
 const caption=node('figcaption',record.caption||'Schematic illustration. Use the numbered key for the rule and measurement.');fig.append(caption);article.append(fig);
 const keys=node('ol',null,'pool-key-list');for(const item of record.labels){const li=node('li');const badge=node('span',String(item.id),'pool-key-number');badge.setAttribute('aria-hidden','true');const text=node('div');append(text,node('h4',item.label),node('p',item.text));append(li,badge,text);keys.append(li);}article.append(keys);
 if(record.notes.length){const notes=node('div',null,'pool-notes');for(const note of record.notes)notes.append(node('p',note));article.append(notes);}article.append(refs(record));return article;
}
function poolGuide(main){
 append(main,hero('READ THE POOL AS WELL AS THE RULE','Pool, markings & equipment','See where the reference points are, how the start equipment fits together and which measurements the official facilities rules specify.'));
 const intro=node('p','The diagrams are learning illustrations, not a survey of your venue. Check the source and the meet conditions for the facilities required at a particular competition.','pool-scope-note');main.append(intro);
 const chooser=node('div',null,'pool-length-control');chooser.setAttribute('role','group');chooser.setAttribute('aria-label','Pool length');for(const length of [25,50]){const b=button(length+' m pool','pool-length',String(length),'stroke-button');b.setAttribute('aria-pressed',String(Number(state.poolLength||25)===length));chooser.append(b);}main.append(chooser);
 const chosen=DATA.facilities.find(r=>r.type==='pool'&&r.dimensions.lengthM===Number(state.poolLength||25));if(chosen)main.append(poolRecordCard(chosen,true));
 const grid=node('div',null,'pool-equipment-grid');for(const record of DATA.facilities.filter(r=>r.type!=='pool'))grid.append(poolRecordCard(record,record.type==='markings'));main.append(grid);
}
