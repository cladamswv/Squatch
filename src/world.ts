import * as pc from 'playcanvas';
import { createMothman, createPhotographer, createPickup, createRoadSign, createRock, createTree, createUfo, createVehicle, mat, shape } from './factory';
import type { PickupType, RowType, WeatherType } from './types';

export const CELL_X = 1.35;
export const ROW_Z = 1.55;
export const MIN_COL = -4;
export const MAX_COL = 4;
const WORLD_HALF_WIDTH = 7.15;

export interface VehicleHazard {
  entity: pc.Entity;
  row: number;
  x: number;
  speed: number;
  direction: number;
  halfLength: number;
  kind: string;
}

interface TrainHazard {
  entity: pc.Entity;
  row: number;
  x: number;
  speed: number;
  direction: number;
  active: boolean;
  timer: number;
  nextAt: number;
  sounded: boolean;
}

export interface PickupItem {
  entity: pc.Entity;
  row: number;
  col: number;
  kind: PickupType;
  taken: boolean;
}

interface Photographer {
  entity: pc.Entity;
  row: number;
  side: -1 | 1;
}

export interface WorldRow {
  index: number;
  type: RowType;
  root: pc.Entity;
  safeCols: Set<number> | null;
}

function hashString(s:string) {
  let h=2166136261;
  for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h = Math.imul(h,16777619); }
  return h >>> 0;
}

export class WorldGenerator {
  readonly root = new pc.Entity('Procedural Appalachia');
  private rows = new Map<number,WorldRow>();
  private vehicles: VehicleHazard[] = [];
  private trains: TrainHazard[] = [];
  private pickups: PickupItem[] = [];
  private photographers: Photographer[] = [];
  private rngState: number;
  private eventRngState: number;
  private lastType: RowType = 'forest';
  private repeatLeft = 0;
  private plannedType: RowType = 'forest';
  private backdrop = new pc.Entity('Distant Ridges');
  private rareEntity: pc.Entity | null = null;
  private rareTimer = 0;
  private rareKind = '';
  weather: WeatherType = 'clear';
  onRareEvent: ((kind:string)=>void) | null = null;
  onTrainWarning: (()=>void) | null = null;

  constructor(private app:pc.Application, seed:string, weather:WeatherType) {
    this.rngState = hashString(seed) || 0xC0FFEE;
    this.eventRngState = (this.rngState ^ 0x9E3779B9) >>> 0;
    this.weather = weather;
    this.app.root.addChild(this.root);
    this.root.addChild(this.backdrop);
    this.buildBackdrop();
    for (let i=-5;i<=25;i++) this.createRow(i);
  }

  destroy() { this.root.destroy(); }

  private r() {
    let x=this.rngState;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.rngState = x >>> 0;
    return this.rngState / 4294967296;
  }

  private er() {
    let x=this.eventRngState; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; this.eventRngState=x>>>0; return this.eventRngState/4294967296;
  }

  private rr(min:number,max:number) { return min + this.r()*(max-min); }
  private ri(min:number,max:number) { return Math.floor(this.rr(min,max+1)); }

  private buildBackdrop() {
    const mountainA=mat('ridge-a','#264b43',.06);
    const mountainB=mat('ridge-b','#345c50',.06);
    const mountainC=mat('ridge-c','#496d60',.06);
    for (let i=0;i<7;i++) {
      const m=shape('cone',`Ridge ${i}`,this.backdrop,new pc.Vec3((i-3)*5.5,-1,8+Math.abs(i-3)*1.5),new pc.Vec3(7+this.r()*2,8+this.r()*3,6),i%3===0?mountainC:i%2===0?mountainB:mountainA);
      m.setLocalEulerAngles(0,this.rr(-18,18),0);
    }
  }

  private chooseType(index:number):RowType {
    if (index < 4) return 'forest';
    if (this.repeatLeft > 0) { this.repeatLeft--; return this.plannedType; }
    const roll=this.r();
    let next:RowType;
    if (this.lastType==='road' && roll<.45) next='road';
    else if (roll<.28) next='forest';
    else if (roll<.53) next='road';
    else if (roll<.64) next='creek';
    else if (roll<.73) next='railroad';
    else if (roll<.84) next='town';
    else if (roll<.93) next='campground';
    else next='logging';
    if (next==='road') this.repeatLeft=this.ri(0,2);
    else if (next==='creek') this.repeatLeft=this.ri(0,1);
    else if (next==='town') this.repeatLeft=this.ri(0,1);
    else this.repeatLeft=0;
    this.plannedType=next;
    this.lastType=next;
    return next;
  }

  private createRow(index:number) {
    if (this.rows.has(index)) return;
    const type=this.chooseType(index);
    const root=new pc.Entity(`Row ${index} ${type}`);
    root.setLocalPosition(0,0,index*ROW_Z);
    this.root.addChild(root);
    const row:WorldRow={index,type,root,safeCols:null};
    this.rows.set(index,row);
    const autumn=this.weather==='autumn';

    if (type==='road') this.buildRoad(row);
    else if (type==='railroad') this.buildRail(row);
    else if (type==='creek') this.buildCreek(row);
    else if (type==='town') this.buildTown(row);
    else if (type==='campground') this.buildCamp(row,autumn);
    else if (type==='logging') this.buildLogging(row,autumn);
    else this.buildForest(row,autumn);

    if (index>3 && type!=='railroad' && this.r()<.28) this.addPickup(row);
    if (index>8 && ['forest','town','campground'].includes(type) && this.r()<.16) this.addPhotographer(row);
  }

  private baseGround(row:WorldRow, hex:string) {
    shape('box','Ground',row.root,new pc.Vec3(0,-.14,0),new pc.Vec3(WORLD_HALF_WIDTH*2,.24,ROW_Z),mat(`ground-${hex}`,hex,.08));
  }

  private buildForest(row:WorldRow, autumn:boolean) {
    this.baseGround(row, autumn?'#4e5632':'#3d6338');
    for (const side of [-1,1]) {
      const count=this.ri(2,4);
      for (let i=0;i<count;i++) createTree(row.root,side*this.rr(5.1,6.7),this.rr(-.6,.6),this.rr(.65,1.15),this.ri(0,6),autumn);
      if (this.r()<.55) createRock(row.root,side*this.rr(4.8,6.5),this.rr(-.5,.5),this.rr(.25,.6));
    }
    if (this.r()<.15) createRoadSign(row.root,this.r()<.5?-5.2:5.2,this.rr(-.35,.35));
  }

  private buildRoad(row:WorldRow) {
    this.baseGround(row,'#313638');
    shape('box','Center line',row.root,new pc.Vec3(0,.005,0),new pc.Vec3(WORLD_HALF_WIDTH*1.72,.018,.055),mat('road-yellow','#e6b72e',.2));
    shape('box','Shoulder L',row.root,new pc.Vec3(0,.0,-.67),new pc.Vec3(WORLD_HALF_WIDTH*2,.03,.12),mat('gravel','#77746d',.08));
    shape('box','Shoulder R',row.root,new pc.Vec3(0,.0,.67),new pc.Vec3(WORLD_HALF_WIDTH*2,.03,.12),mat('gravel','#77746d',.08));
    const dir=this.r()<.5?1:-1;
    const kinds=['Sedan','SUV','Pickup','Minivan','Pickup','Coal Truck','Logging Truck','School Bus','RV'];
    const count=this.r()<.22?2:1;
    for (let i=0;i<count;i++) {
      const kind=kinds[this.ri(0,kinds.length-1)];
      const colors=['#a94135','#315f78','#7d7c72','#d4a132','#4d6845','#eee6d0','#5b4c70'];
      const {root,halfLength}=createVehicle(row.root,kind,colors[this.ri(0,colors.length-1)],dir);
      const x=(dir>0?-1:1)*(WORLD_HALF_WIDTH+this.rr(1,8)+i*6);
      root.setLocalPosition(x,0,0);
      this.vehicles.push({entity:root,row:row.index,x,speed:this.rr(3.3,6.2)+(kind.includes('Coal')?-.7:0),direction:dir,halfLength,kind});
    }
  }

  private buildRail(row:WorldRow) {
    this.baseGround(row,'#615f58');
    const steel=mat('rail-steel','#b3b8b7',.72);
    const tie=mat('rail-tie','#51331f',.11);
    shape('box','Rail 1',row.root,new pc.Vec3(0,.08,-.34),new pc.Vec3(WORLD_HALF_WIDTH*2,.08,.08),steel);
    shape('box','Rail 2',row.root,new pc.Vec3(0,.08,.34),new pc.Vec3(WORLD_HALF_WIDTH*2,.08,.08),steel);
    for (let x=-6.5;x<=6.5;x+=.55) shape('box','Tie',row.root,new pc.Vec3(x,.02,0),new pc.Vec3(.17,.07,1.15),tie);
    const train=new pc.Entity('Freight Train'); row.root.addChild(train); train.enabled=false;
    const dir=this.r()<.5?1:-1;
    for (let i=0;i<5;i++) {
      const car=shape('box',i===0?'Locomotive':'Freight Car',train,new pc.Vec3(-dir*i*3.3,.75,0),new pc.Vec3(3,1.25,1.25),mat(i===0?'locomotive':'freight',i===0?'#3c5c49':'#794b32',.3));
      if (i===0) shape('box','Cab window',car,new pc.Vec3(dir*1.42,.2,0),new pc.Vec3(.04,.45,.75),mat('train-window','#b7d4d3',.6,'#596f6e'));
    }
    this.trains.push({entity:train,row:row.index,x:0,speed:this.rr(11,15),direction:dir,active:false,timer:0,nextAt:this.rr(3,8),sounded:false});
  }

  private buildCreek(row:WorldRow) {
    this.baseGround(row,'#356c78');
    shape('box','Water sheen',row.root,new pc.Vec3(0,.02,0),new pc.Vec3(WORLD_HALF_WIDTH*2,.025,ROW_Z*.82),mat('water','#4d93a0',.58,'#194b56',.84));
    const safe=new Set<number>();
    const count=this.ri(4,6);
    while (safe.size<count) safe.add(this.ri(MIN_COL,MAX_COL));
    row.safeCols=safe;
    for (const c of safe) {
      if (this.r()<.55) createRock(row.root,c*CELL_X,.0,this.rr(.48,.68));
      else {
        const log=shape('cylinder','Fallen log',row.root,new pc.Vec3(c*CELL_X,.24,0),new pc.Vec3(.24,.62,.24),mat('creek-log','#6a4227',.12),new pc.Vec3(90,0,0));
        log.setLocalEulerAngles(90,0,0);
      }
    }
    for (const side of [-1,1]) createTree(row.root,side*this.rr(5.5,6.6),this.rr(-.5,.5),this.rr(.6,.9),this.ri(0,4),this.weather==='autumn');
  }

  private buildTown(row:WorldRow) {
    this.baseGround(row,'#77756e');
    shape('box','Sidewalk',row.root,new pc.Vec3(0,.01,0),new pc.Vec3(WORLD_HALF_WIDTH*2,.05,ROW_Z*.86),mat('sidewalk','#aaa79e',.12));
    for (const side of [-1,1]) {
      if (this.r()<.7) {
        const building=new pc.Entity('Small town building'); row.root.addChild(building); building.setLocalPosition(side*6.1,0,0);
        const walls=mat('building',this.r()<.5?'#bb8b68':'#8e9c83',.16);
        shape('box','Walls',building,new pc.Vec3(0,1.15,0),new pc.Vec3(2.25,2.1,1.3),walls);
        shape('box','Roof',building,new pc.Vec3(0,2.3,0),new pc.Vec3(2.55,.18,1.55),mat('roof','#4a4542',.25));
        shape('box','Window',building,new pc.Vec3(-side*1.14,1.3,0),new pc.Vec3(.05,.6,.65),mat('window','#89b6b5',.55,'#315c5c'));
      }
    }
  }

  private buildCamp(row:WorldRow, autumn:boolean) {
    this.baseGround(row,autumn?'#5b5a34':'#45643b');
    for (const side of [-1,1]) {
      const tent=new pc.Entity('Tent'); row.root.addChild(tent); tent.setLocalPosition(side*this.rr(5.1,6.1),0,0);
      shape('cone','Tent canvas',tent,new pc.Vec3(0,.6,0),new pc.Vec3(1.15,1.25,1.0),mat('tent',side>0?'#ca873f':'#658259',.15),new pc.Vec3(0,0,0));
    }
    if (this.r()<.6) {
      shape('cylinder','Fire ring',row.root,new pc.Vec3(this.rr(-2,2),.1,0),new pc.Vec3(.5,.08,.5),mat('fire-ring','#55504a',.12));
    }
  }

  private buildLogging(row:WorldRow, autumn:boolean) {
    this.baseGround(row,autumn?'#6b5a32':'#526247');
    for (const side of [-1,1]) {
      if (this.r()<.7) {
        for (let i=0;i<3;i++) shape('cylinder','Stacked log',row.root,new pc.Vec3(side*(5.3+i*.25),.22+i*.16,this.rr(-.3,.3)),new pc.Vec3(.18,.7,.18),mat('stacked-log','#704020',.1),new pc.Vec3(90,0,0));
      } else createTree(row.root,side*5.9,0,.8,this.ri(0,4),autumn);
    }
  }

  private addPickup(row:WorldRow) {
    const kinds:PickupType[]=['coin','coin','coin','pepperoni','mountainFog','trailMix','fakeFootprints'];
    const kind=kinds[this.ri(0,kinds.length-1)];
    let col=this.ri(MIN_COL,MAX_COL);
    if (row.safeCols && !row.safeCols.has(col)) col=[...row.safeCols][this.ri(0,row.safeCols.size-1)];
    const e=createPickup(row.root,kind,col*CELL_X,0);
    this.pickups.push({entity:e,row:row.index,col,kind,taken:false});
  }

  private addPhotographer(row:WorldRow) {
    const side:(-1|1)=this.r()<.5?-1:1;
    const e=createPhotographer(row.root,side*5.6,0,side<0?90:-90);
    this.photographers.push({entity:e,row:row.index,side});
  }

  ensureAhead(playerRow:number) {
    for (let i=playerRow+1;i<=playerRow+26;i++) if (!this.rows.has(i)) this.createRow(i);
    const cutoff=playerRow-9;
    for (const [idx,row] of [...this.rows]) {
      if (idx<cutoff) {
        row.root.destroy(); this.rows.delete(idx);
        this.vehicles=this.vehicles.filter(v=>v.row!==idx);
        this.trains=this.trains.filter(t=>t.row!==idx);
        this.pickups=this.pickups.filter(p=>p.row!==idx);
        this.photographers=this.photographers.filter(p=>p.row!==idx);
      }
    }
  }

  update(dt:number, playerRow:number, score:number) {
    const difficulty=Math.min(2.25,1+score/650);
    for (const v of this.vehicles) {
      v.x += v.speed*v.direction*difficulty*dt;
      if (v.direction>0 && v.x>WORLD_HALF_WIDTH+7) v.x=-WORLD_HALF_WIDTH-this.rr(3,10);
      if (v.direction<0 && v.x<-WORLD_HALF_WIDTH-7) v.x=WORLD_HALF_WIDTH+this.rr(3,10);
      v.entity.setLocalPosition(v.x,0,0);
    }
    for (const t of this.trains) {
      t.timer+=dt;
      if (!t.active && t.timer>t.nextAt) {
        t.active=true; t.sounded=false; t.x=-t.direction*(WORLD_HALF_WIDTH+18); t.entity.enabled=true; t.entity.setLocalPosition(t.x,0,0);
      }
      if (t.active) {
        if (!t.sounded && Math.abs(t.row-playerRow)<=3) { this.onTrainWarning?.(); t.sounded=true; }
        t.x += t.speed*t.direction*difficulty*dt;
        t.entity.setLocalPosition(t.x,0,0);
        if ((t.direction>0 && t.x>WORLD_HALF_WIDTH+18)||(t.direction<0&&t.x<-WORLD_HALF_WIDTH-18)) {
          t.active=false; t.entity.enabled=false; t.timer=0; t.nextAt=this.rr(4.5,9.5);
        }
      }
    }
    for (const p of this.pickups) if (!p.taken) p.entity.rotateLocal(0,90*dt,0);
    this.updateRare(dt,playerRow,score);
    this.backdrop.setLocalPosition(0,0,playerRow*ROW_Z+30);
  }

  private updateRare(dt:number, playerRow:number, score:number) {
    if (this.rareEntity) {
      this.rareTimer-=dt;
      if (this.rareKind==='Mothman') this.rareEntity.translateLocal(3.8*dt,Math.sin(performance.now()/150)*.004,1.2*dt);
      else this.rareEntity.rotateLocal(0,45*dt,0);
      if (this.rareTimer<=0) { this.rareEntity.destroy(); this.rareEntity=null; }
      return;
    }
    if (score>30 && this.er()<dt*0.0018) {
      if (this.er()<.62) {
        this.rareKind='Mothman'; this.rareEntity=createMothman(this.root); this.rareEntity.setPosition(-12,8,playerRow*ROW_Z+15); this.rareTimer=5;
      } else {
        this.rareKind='UFO'; this.rareEntity=createUfo(this.root); this.rareEntity.setPosition(0,11,playerRow*ROW_Z+10); this.rareTimer=6;
      }
      this.onRareEvent?.(this.rareKind);
    }
  }

  row(index:number) { return this.rows.get(index); }
  rowType(index:number) { return this.rows.get(index)?.type ?? 'forest'; }

  collisionAt(row:number, x:number) {
    for (const v of this.vehicles) if (v.row===row && Math.abs(v.x-x)<v.halfLength+.43) return v.kind;
    for (const t of this.trains) if (t.row===row && t.active && Math.abs(t.x-x)<8.3) return 'Freight Train';
    return null;
  }

  creekSafe(row:number,col:number) {
    const r=this.rows.get(row);
    return !r?.safeCols || r.safeCols.has(col);
  }

  exposedToCamera(row:number,col:number) {
    const x=col*CELL_X;
    return this.photographers.some(p=>p.row===row && (p.side<0 ? x<4.6 : x>-4.6));
  }

  pickupAt(row:number,col:number) {
    const p=this.pickups.find(p=>!p.taken&&p.row===row&&p.col===col);
    if (!p) return null;
    p.taken=true; p.entity.enabled=false; return p.kind;
  }

  trainActive(row:number) { return this.trains.some(t=>t.row===row&&t.active); }
}
