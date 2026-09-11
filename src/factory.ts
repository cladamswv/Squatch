import * as pc from 'playcanvas';
import type { SkinDef } from './types';

const materialCache = new Map<string, pc.StandardMaterial>();

export function color(hex:string) {
  const h = hex.replace('#','');
  const n = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
  return new pc.Color(((n>>16)&255)/255, ((n>>8)&255)/255, (n&255)/255, 1);
}

export function mat(key:string, hex:string, gloss=.22, emissive?:string, opacity=1) {
  const cacheKey = `${key}|${hex}|${gloss}|${emissive ?? ''}|${opacity}`;
  const existing = materialCache.get(cacheKey);
  if (existing) return existing;
  const m = new pc.StandardMaterial();
  m.diffuse = color(hex);
  m.gloss = gloss;
  m.metalness = 0;
  if (emissive) {
    m.emissive = color(emissive);
    m.emissiveIntensity = 1.15;
  }
  if (opacity < 1) {
    m.opacity = opacity;
    m.blendType = pc.BLEND_NORMAL;
    m.depthWrite = false;
  }
  m.update();
  materialCache.set(cacheKey, m);
  return m;
}

export function shape(type:'box'|'sphere'|'capsule'|'cylinder'|'cone'|'plane', name:string, parent:pc.Entity, pos:pc.Vec3, scale:pc.Vec3, material:pc.Material, rot?:pc.Vec3) {
  const e = new pc.Entity(name);
  e.addComponent('render', { type, material });
  e.setLocalPosition(pos);
  e.setLocalScale(scale);
  if (rot) e.setLocalEulerAngles(rot);
  parent.addChild(e);
  if (e.render) {
    e.render.castShadows = true;
    e.render.receiveShadows = true;
  }
  return e;
}

export function createTree(parent:pc.Entity, x:number, z:number, scale=1, variant=0, autumn=false) {
  const root = new pc.Entity('Appalachian Tree');
  root.setLocalPosition(x,0,z);
  root.setLocalScale(scale,scale,scale);
  parent.addChild(root);
  const trunk = mat('trunk','#53351f',.12);
  const greens = autumn ? ['#9b4c25','#b76a27','#d18a30','#7d6b2e'] : ['#315d32','#3c7138','#294d31','#4d692e'];
  const leaves = mat(`leaves-${greens[variant%greens.length]}`, greens[variant%greens.length], .10);
  shape('cylinder','Trunk',root,new pc.Vec3(0,1.15,0),new pc.Vec3(.34,1.15,.34),trunk);
  if (variant % 5 === 4) {
    shape('cone','Pine low',root,new pc.Vec3(0,2.25,0),new pc.Vec3(1.65,1.65,1.65),leaves);
    shape('cone','Pine high',root,new pc.Vec3(0,3.2,0),new pc.Vec3(1.2,1.45,1.2),leaves);
  } else {
    shape('sphere','Crown A',root,new pc.Vec3(-.28,2.55,0),new pc.Vec3(1.22,1.05,1.15),leaves);
    shape('sphere','Crown B',root,new pc.Vec3(.43,2.72,.1),new pc.Vec3(1.08,.96,1.02),leaves);
    shape('sphere','Crown C',root,new pc.Vec3(.04,3.25,-.12),new pc.Vec3(.95,.88,.9),leaves);
  }
  return root;
}

export function createRock(parent:pc.Entity, x:number, z:number, scale=.45) {
  const e = shape('sphere','Mossy Rock',parent,new pc.Vec3(x,.16,z),new pc.Vec3(scale,scale*.55,scale*.8),mat('rock','#626b62',.16));
  e.setLocalEulerAngles(0,Math.random()*180,Math.random()*10);
  return e;
}

export function createRoadSign(parent:pc.Entity, x:number, z:number, labelColor='#f1c431') {
  const root = new pc.Entity('Road sign'); parent.addChild(root); root.setLocalPosition(x,0,z);
  shape('cylinder','Post',root,new pc.Vec3(0,.9,0),new pc.Vec3(.06,.9,.06),mat('metal','#777b79',.55));
  const s = shape('box','Sign',root,new pc.Vec3(0,1.65,0),new pc.Vec3(.58,.5,.05),mat('sign',labelColor,.28));
  s.setLocalEulerAngles(0,0,45);
  return root;
}

export function createVehicle(parent:pc.Entity, kind:string, bodyHex:string, direction=1) {
  const root = new pc.Entity(kind); parent.addChild(root);
  const body = mat(`vehicle-${bodyHex}`,bodyHex,.48);
  const glass = mat('glass','#2f4e5a',.72);
  const tire = mat('tire','#151515',.22);
  const chrome = mat('chrome','#bfc7c7',.8);
  let length=2.5, height=.62;
  if (/Coal|Logging/.test(kind)) length=4.4;
  else if (/Bus|RV/.test(kind)) length=3.7;
  else if (/Pickup/.test(kind)) length=3.0;
  shape('box','Lower Body',root,new pc.Vec3(0,.52,0),new pc.Vec3(length,.56,1.16),body);
  if (/Coal/.test(kind)) {
    shape('box','Cab',root,new pc.Vec3(direction*1.45,.95,0),new pc.Vec3(.95,.92,1.02),body);
    shape('box','Windshield',root,new pc.Vec3(direction*1.92,1.05,0),new pc.Vec3(.05,.42,.78),glass);
    shape('box','Dump',root,new pc.Vec3(-direction*.65,1.05,0),new pc.Vec3(2.15,1.02,1.08),mat('coalbed','#343637',.25));
  } else if (/Logging/.test(kind)) {
    shape('box','Cab',root,new pc.Vec3(direction*1.45,.95,0),new pc.Vec3(.92,.92,1.02),body);
    for (let i=0;i<4;i++) {
      const log = shape('cylinder','Log',root,new pc.Vec3(-direction*.65,.82+i*.22,(i%2?-.24:.24)),new pc.Vec3(.18,1.15,.18),mat('log','#704020',.1),new pc.Vec3(0,0,90));
      log.setLocalEulerAngles(0,0,90);
    }
  } else {
    shape('box','Cabin',root,new pc.Vec3(-direction*.1,.92,0),new pc.Vec3(length*.56,.5,1.02),glass);
    if (/Pickup/.test(kind)) shape('box','Bed',root,new pc.Vec3(-direction*.9,.78,0),new pc.Vec3(.95,.42,1.0),body);
  }
  const wheelX = Math.max(.75,length*.34);
  for (const xx of [-wheelX,wheelX]) for (const zz of [-.55,.55]) {
    shape('cylinder','Wheel',root,new pc.Vec3(xx,.28,zz),new pc.Vec3(.29,.15,.29),tire,new pc.Vec3(90,0,0));
    shape('cylinder','Hub',root,new pc.Vec3(xx,.28,zz*1.012),new pc.Vec3(.11,.16,.11),chrome,new pc.Vec3(90,0,0));
  }
  shape('box','Headlight L',root,new pc.Vec3(direction*(length/2+.02),.58,-.34),new pc.Vec3(.04,.15,.18),mat('headlight','#f3e8b6',.7,'#fff1b9'));
  shape('box','Headlight R',root,new pc.Vec3(direction*(length/2+.02),.58,.34),new pc.Vec3(.04,.15,.18),mat('headlight','#f3e8b6',.7,'#fff1b9'));
  return {root, halfLength:length/2, height};
}

export function createSquatch(parent:pc.Entity, skin:SkinDef) {
  const root = new pc.Entity('Squatch'); parent.addChild(root);
  const fur = mat(`fur-${skin.name}`,skin.fur,.18);
  const accent = mat(`accent-${skin.name}`,skin.accent,.23);
  const black = mat('black','#18120f',.3);
  const white = mat('eyes','#f0eee2',.25);
  shape('capsule','Body',root,new pc.Vec3(0,1.35,0),new pc.Vec3(1.08,1.45,.9),fur);
  shape('sphere','Chest',root,new pc.Vec3(0,1.36,.42),new pc.Vec3(.78,.93,.28),accent);
  shape('sphere','Head',root,new pc.Vec3(0,2.58,-.02),new pc.Vec3(.94,.84,.84),fur);
  shape('sphere','Muzzle',root,new pc.Vec3(0,2.4,.62),new pc.Vec3(.63,.4,.34),accent);
  shape('sphere','Nose',root,new pc.Vec3(0,2.48,.91),new pc.Vec3(.24,.15,.12),black);
  shape('sphere','Ear L',root,new pc.Vec3(-.78,2.56,-.02),new pc.Vec3(.22,.28,.16),fur);
  shape('sphere','Ear R',root,new pc.Vec3(.78,2.56,-.02),new pc.Vec3(.22,.28,.16),fur);
  for (const x of [-.24,.24]) {
    shape('sphere','Eye',root,new pc.Vec3(x,2.72,.68),new pc.Vec3(.16,.19,.11),white);
    shape('sphere','Pupil',root,new pc.Vec3(x,2.72,.78),new pc.Vec3(.065,.09,.055),skin.accessory==='redEyes'||skin.accessory==='moth'?mat('red-eye','#e43b3b',.4,'#c52222'):black);
  }
  const armL=shape('capsule','Arm L',root,new pc.Vec3(-.72,1.42,.02),new pc.Vec3(.34,1.02,.34),fur,new pc.Vec3(0,0,-12));
  const armR=shape('capsule','Arm R',root,new pc.Vec3(.72,1.42,.02),new pc.Vec3(.34,1.02,.34),fur,new pc.Vec3(0,0,12));
  const legL=shape('capsule','Leg L',root,new pc.Vec3(-.34,.56,0),new pc.Vec3(.42,.72,.42),fur);
  const legR=shape('capsule','Leg R',root,new pc.Vec3(.34,.56,0),new pc.Vec3(.42,.72,.42),fur);
  shape('sphere','Foot L',root,new pc.Vec3(-.34,.13,.27),new pc.Vec3(.5,.24,.77),accent);
  shape('sphere','Foot R',root,new pc.Vec3(.34,.13,.27),new pc.Vec3(.5,.24,.77),accent);
  addAccessory(root, skin, accent, black);
  if (skin.accessory === 'baby') root.setLocalScale(.78,.78,.78);
  return { root, armL, armR, legL, legR };
}

function addAccessory(root:pc.Entity, skin:SkinDef, accent:pc.Material, black:pc.Material) {
  const a = accent;
  if (['miner','fire','helmet'].includes(skin.accessory)) {
    shape('sphere','Helmet',root,new pc.Vec3(0,3.1,-.03),new pc.Vec3(.95,.36,.84),a);
    if (skin.accessory==='miner') shape('sphere','Lamp',root,new pc.Vec3(0,3.12,.77),new pc.Vec3(.19,.19,.13),mat('lamp','#ffd45c',.7,'#ffdc72'));
  } else if (skin.accessory==='scarf') {
    shape('cylinder','Scarf',root,new pc.Vec3(0,2.05,0),new pc.Vec3(.57,.12,.57),a);
  } else if (skin.accessory==='camera') {
    shape('box','Camera',root,new pc.Vec3(0,1.5,.78),new pc.Vec3(.5,.34,.23),black);
    shape('cylinder','Lens',root,new pc.Vec3(0,1.5,.98),new pc.Vec3(.13,.11,.13),a,new pc.Vec3(90,0,0));
  } else if (skin.accessory==='moth') {
    const wing=mat('moth-wing','#39323d',.14);
    shape('box','Wing L',root,new pc.Vec3(-.82,1.78,.28),new pc.Vec3(.95,.1,1.28),wing,new pc.Vec3(10,18,24));
    shape('box','Wing R',root,new pc.Vec3(.82,1.78,.28),new pc.Vec3(.95,.1,1.28),wing,new pc.Vec3(10,-18,-24));
  } else if (skin.accessory==='antenna') {
    shape('cylinder','Antenna',root,new pc.Vec3(0,3.35,0),new pc.Vec3(.06,.3,.06),a);
    shape('sphere','Antenna Tip',root,new pc.Vec3(0,3.7,0),new pc.Vec3(.16,.16,.16),a);
  } else if (skin.accessory==='hat') {
    shape('cylinder','Hat Brim',root,new pc.Vec3(0,3.08,0),new pc.Vec3(.78,.08,.78),a);
    shape('cylinder','Hat Top',root,new pc.Vec3(0,3.3,0),new pc.Vec3(.48,.22,.48),a);
  } else if (skin.accessory==='crown') {
    shape('cylinder','Crown',root,new pc.Vec3(0,3.28,0),new pc.Vec3(.45,.25,.45),mat('crown','#f5bd32',.65,'#c98a14'));
  } else if (skin.accessory==='pepperoni') {
    shape('cylinder','Pepperoni Roll',root,new pc.Vec3(.75,1.45,.58),new pc.Vec3(.16,.48,.16),a,new pc.Vec3(90,0,15));
  }
}

export function createPhotographer(parent:pc.Entity, x:number, z:number, facing:number) {
  const root=new pc.Entity('Photographer'); parent.addChild(root); root.setLocalPosition(x,0,z); root.setLocalEulerAngles(0,facing,0);
  const coat=mat('photographer-coat','#335665',.24);
  const skin=mat('skin','#d0a478',.2);
  shape('capsule','Body',root,new pc.Vec3(0,.85,0),new pc.Vec3(.48,.8,.38),coat);
  shape('sphere','Head',root,new pc.Vec3(0,1.65,0),new pc.Vec3(.38,.38,.38),skin);
  shape('box','Phone',root,new pc.Vec3(0,1.48,.42),new pc.Vec3(.22,.36,.06),mat('phone','#11151a',.65));
  shape('cone','Sight Cone',root,new pc.Vec3(0,.35,2.1),new pc.Vec3(1.65,3.6,1.65),mat('sight-cone','#ffd66b',.1,'#6b5520',.09),new pc.Vec3(90,0,0));
  return root;
}

export function createPickup(parent:pc.Entity, kind:string, x:number, z:number) {
  const root=new pc.Entity(`Pickup ${kind}`); parent.addChild(root); root.setLocalPosition(x,.55,z);
  if (kind==='coin') {
    shape('cylinder','Coin',root,new pc.Vec3(),new pc.Vec3(.28,.06,.28),mat('coin','#f6bd32',.7,'#8c5a05'),new pc.Vec3(90,0,0));
  } else if (kind==='pepperoni') {
    shape('cylinder','Roll',root,new pc.Vec3(),new pc.Vec3(.19,.42,.19),mat('bread','#d69b53',.25),undefined);
    shape('cylinder','Pepperoni',root,new pc.Vec3(0,.28,0),new pc.Vec3(.15,.04,.15),mat('pep','#a54332',.2));
  } else if (kind==='mountainFog') {
    shape('sphere','Fog Orb',root,new pc.Vec3(),new pc.Vec3(.38,.38,.38),mat('fog-orb','#b9d5d1',.4,'#6aa9a2',.72));
  } else if (kind==='trailMix') {
    shape('box','Trail Mix',root,new pc.Vec3(),new pc.Vec3(.38,.5,.18),mat('trail-mix','#e2773f',.3));
  } else {
    shape('sphere','Footprint',root,new pc.Vec3(),new pc.Vec3(.26,.1,.42),mat('footprint','#8c7258',.22));
  }
  return root;
}

export function createMothman(parent:pc.Entity) {
  const root=new pc.Entity('Mothman'); parent.addChild(root);
  const dark=mat('mothman','#17171b',.12);
  const red=mat('mothman-eye','#f22732',.5,'#f22732');
  shape('capsule','Body',root,new pc.Vec3(0,0,0),new pc.Vec3(.5,1.1,.4),dark);
  shape('sphere','Head',root,new pc.Vec3(0,.95,0),new pc.Vec3(.5,.45,.45),dark);
  shape('box','Wing L',root,new pc.Vec3(-.75,.2,0),new pc.Vec3(1.35,.1,1.1),dark,new pc.Vec3(0,0,18));
  shape('box','Wing R',root,new pc.Vec3(.75,.2,0),new pc.Vec3(1.35,.1,1.1),dark,new pc.Vec3(0,0,-18));
  shape('sphere','Eye L',root,new pc.Vec3(-.16,1.02,.4),new pc.Vec3(.08,.08,.06),red);
  shape('sphere','Eye R',root,new pc.Vec3(.16,1.02,.4),new pc.Vec3(.08,.08,.06),red);
  return root;
}

export function createUfo(parent:pc.Entity) {
  const root=new pc.Entity('UFO'); parent.addChild(root);
  shape('cylinder','Saucer',root,new pc.Vec3(),new pc.Vec3(1.8,.18,1.8),mat('ufo','#aeb9bb',.8));
  shape('sphere','Dome',root,new pc.Vec3(0,.22,0),new pc.Vec3(.65,.32,.65),mat('ufo-dome','#6fc7d1',.65,'#1f7583',.65));
  shape('cone','Beam',root,new pc.Vec3(0,-2.6,0),new pc.Vec3(1.8,4.8,1.8),mat('ufo-beam','#cae7c8',.15,'#7eb27a',.12));
  return root;
}
