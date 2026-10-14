export const OBSERVATION_BONES={torso:64,neck:17,upperArm:42,forearm:40,thigh:47,shin:45};
export function jointFrom(origin,length,degrees){const r=degrees*Math.PI/180;return [origin[0]+length*Math.cos(r),origin[1]+length*Math.sin(r)];}
export function bentJoint(origin,end,firstLength,secondLength,bend=1){
 const dx=end[0]-origin[0],dy=end[1]-origin[1],distance=Math.hypot(dx,dy);
 if(distance>firstLength+secondLength+1e-8||distance<Math.abs(firstLength-secondLength)-1e-8||distance===0)throw new Error('Unreachable limb target');
 const along=(firstLength**2-secondLength**2+distance**2)/(2*distance),height=Math.sqrt(Math.max(0,firstLength**2-along**2));
 return [origin[0]+along*dx/distance-bend*height*dy/distance,origin[1]+along*dy/distance+bend*height*dx/distance];
}
export function fixedSwimmer(hip,heading,armAngles,legAngles,legTargets=null){
 const b=OBSERVATION_BONES,shoulder=jointFrom(hip,b.torso,heading),head=jointFrom(shoulder,b.neck,heading);
 const arms=armAngles.map(([upper,lower])=>{const elbow=jointFrom(shoulder,b.upperArm,upper);return [shoulder,elbow,jointFrom(elbow,b.forearm,lower)];});
 const legs=legTargets?legTargets.map(t=>[hip,bentJoint(hip,t.point,b.thigh,b.shin,t.bend),t.point]):legAngles.map(([upper,lower])=>{const knee=jointFrom(hip,b.thigh,upper);return [hip,knee,jointFrom(knee,b.shin,lower)];});
 return {hip,shoulder,head,arms,legs};
}
export function observationPoses(scene,f){
 const armsForward=[[180,180],[0,0]],legsRight=[[2,-2],[-2,2]],streamline=[[-12,0],[-15,3]];
 if(scene==='relay'){
  const outgoing=f.feet?fixedSwimmer([150,132],20,[[40,0],[15,10]],null,[{point:[201,193],bend:-1},{point:[140,175],bend:-1}]):fixedSwimmer([300,190],25,[[13,25],[10,28]],[[205,205],[207,203]]);
  return [outgoing,fixedSwimmer([f.hand?336:368,290],180,armsForward,legsRight)];
 }
 if(scene==='touch'){
  const x=91+82*Math.cos(20*Math.PI/180)+64+(f.touches===0?20:0);
  return [fixedSwimmer([x,220],180,[[200,200],f.touches===1?[155,135]:[160,160]],legsRight)];
 }
 if(scene==='distance')return [fixedSwimmer([245,f.submerged?218:178],0,[f.handUp?[-35,-35]:[0,0],[180,180]],[[178,182],[182,178]])];
 if(scene==='wall'){
  if(f.contact==='none')return [fixedSwimmer([330,230],180,[[0,0],[4,-4]],legsRight)];
  if(f.contact==='feet'){
   // Compact plant: feet and head at the same depth, level trunk, arms already in streamline.
   return [fixedSwimmer([134,230],0,streamline,null,[{point:[70,230],bend:1},{point:[70,222],bend:1}])];
  }
  return [fixedSwimmer([258,230],0,streamline,[[180,180],[177,183]])];
 }
 const x=f.contact==='hand'?219:251;
 return [fixedSwimmer([x,183],180,armsForward,legsRight)];
}
