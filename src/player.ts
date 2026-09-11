import * as pc from 'playcanvas';
import { createSquatch } from './factory';
import { CELL_X, MAX_COL, MIN_COL, ROW_Z } from './world';
import type { SkinDef } from './types';

interface MoveCmd { dx:number; dz:number; }

export class SquatchPlayer {
  readonly entity = new pc.Entity('Player');
  row = 0;
  col = 0;
  maxRow = 0;
  moving = false;
  onArrive: ((fromRow:number, fromCol:number)=>void) | null = null;
  onStepStart: (()=>void) | null = null;

  private visual:ReturnType<typeof createSquatch> | null = null;
  private from = new pc.Vec3();
  private to = new pc.Vec3();
  private moveT = 0;
  private moveDuration = .135;
  private queued:MoveCmd | null = null;
  private time = 0;
  private prevRow = 0;
  private prevCol = 0;

  constructor(private app:pc.Application, skin:SkinDef) {
    this.app.root.addChild(this.entity);
    this.setSkin(skin);
    this.reset();
  }

  destroy() { this.entity.destroy(); }

  setSkin(skin:SkinDef) {
    if (this.visual) this.visual.root.destroy();
    this.visual=createSquatch(this.entity,skin);
  }

  reset() {
    this.row=0; this.col=0; this.maxRow=0; this.moving=false; this.queued=null; this.moveT=0;
    this.entity.setPosition(0,.03,0);
    this.entity.setEulerAngles(0,0,0);
  }

  tryMove(dx:number,dz:number) {
    const cmd={dx:Math.sign(dx),dz:Math.sign(dz)};
    if (this.moving) { this.queued=cmd; return false; }
    const nextCol=Math.max(MIN_COL,Math.min(MAX_COL,this.col+cmd.dx));
    const nextRow=Math.max(0,this.row+cmd.dz);
    if (nextCol===this.col && nextRow===this.row) return false;
    this.prevRow=this.row; this.prevCol=this.col;
    this.col=nextCol; this.row=nextRow; this.maxRow=Math.max(this.maxRow,this.row);
    this.from.copy(this.entity.getPosition());
    this.to.set(this.col*CELL_X,.03,this.row*ROW_Z);
    this.moveT=0; this.moving=true;
    const yaw=cmd.dz>0?0:cmd.dz<0?180:cmd.dx>0?90:-90;
    this.entity.setEulerAngles(0,yaw,0);
    this.onStepStart?.();
    return true;
  }

  update(dt:number, reducedMotion=false, speedBoost=false) {
    this.time+=dt;
    if (!this.visual) return;
    if (this.moving) {
      this.moveT += dt/(speedBoost?this.moveDuration*.72:this.moveDuration);
      const t=Math.min(1,this.moveT);
      const ease=1-Math.pow(1-t,3);
      const p=new pc.Vec3().lerp(this.from,this.to,ease);
      p.y=.03 + (reducedMotion?0:Math.sin(t*Math.PI)*.34);
      this.entity.setPosition(p);
      const swing=Math.sin(t*Math.PI*2)*24;
      this.visual.armL.setLocalEulerAngles(0,0,-12+swing);
      this.visual.armR.setLocalEulerAngles(0,0,12-swing);
      this.visual.legL.setLocalEulerAngles(swing*.35,0,0);
      this.visual.legR.setLocalEulerAngles(-swing*.35,0,0);
      if (t>=1) {
        this.entity.setPosition(this.to);
        this.moving=false;
        this.visual.armL.setLocalEulerAngles(0,0,-12);
        this.visual.armR.setLocalEulerAngles(0,0,12);
        this.visual.legL.setLocalEulerAngles(0,0,0);
        this.visual.legR.setLocalEulerAngles(0,0,0);
        this.onArrive?.(this.prevRow,this.prevCol);
        if (this.queued) {
          const q=this.queued; this.queued=null;
          this.tryMove(q.dx,q.dz);
        }
      }
    } else if (!reducedMotion) {
      const bob=Math.sin(this.time*2.2)*.025;
      this.visual.root.setLocalPosition(0,bob,0);
      const sway=Math.sin(this.time*1.3)*2.4;
      this.visual.armL.setLocalEulerAngles(0,0,-12+sway);
      this.visual.armR.setLocalEulerAngles(0,0,12-sway);
    }
  }
}
