import * as pc from 'playcanvas';
import { AudioSystem } from './audio';
import { ACHIEVEMENTS, dailyMissions, dayKey, SKINS } from './catalog';
import { color, mat, shape } from './factory';
import { SquatchPlayer } from './player';
import { SaveStore } from './save';
import type { GameScreen, MissionType, PickupType, RunStats, SkinDef, WeatherType } from './types';
import { GameUI } from './ui';
import { ROW_Z, WorldGenerator } from './world';

export class SquatchCrossingGame {
  private app:pc.Application;
  private save=new SaveStore();
  private audio:AudioSystem;
  private ui:GameUI;
  private world!:WorldGenerator;
  private player!:SquatchPlayer;
  private camera=new pc.Entity('Camera');
  private sun=new pc.Entity('Sun');
  private fillLight=new pc.Entity('Sky Fill');
  private screen:GameScreen='menu';
  private dailyMode=false;
  private lastDailyMode=false;
  private run:RunStats=this.blankRun();
  private sighting=0;
  private sightFocus=0;
  private photoCooldown=0;
  private shieldUntil=0;
  private fogUntil=0;
  private speedUntil=0;
  private collisionGraceUntil=0;
  private lastForwardAt=0;
  private runStartedAt=0;
  private currentWeather:WeatherType='clear';
  private pointerStart={x:0,y:0,t:0};
  private pointerDown=false;
  private holdTriggered=false;
  private lastHoldHop=0;
  private cameraPos=new pc.Vec3(7.2,10.2,-9.6);
  private tempTarget=new pc.Vec3();
  private frameCounter=0;
  private lastRenderAt=0;

  constructor(private canvas:HTMLCanvasElement, uiRoot:HTMLElement) {
    this.app=new pc.Application(canvas,{
      keyboard:new pc.Keyboard(window),
      mouse:new pc.Mouse(canvas),
      touch:'ontouchstart' in window ? new pc.TouchDevice(canvas) : undefined
    });
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    this.app.setCanvasResolution(pc.RESOLUTION_AUTO);
    this.app.scene.ambientLight=new pc.Color(.46,.54,.49);
    this.app.scene.exposure=1.15;

    this.camera.addComponent('camera',{clearColor:new pc.Color(.42,.58,.61),fov:48,nearClip:.08,farClip:95});
    this.app.root.addChild(this.camera);
    this.sun.addComponent('light',{type:'directional',color:new pc.Color(1,.94,.79),intensity:1.75,castShadows:true,shadowDistance:34,shadowResolution:2048,shadowBias:.18,normalOffsetBias:.15});
    this.sun.setEulerAngles(48,-35,0); this.app.root.addChild(this.sun);
    this.fillLight.addComponent('light',{type:'directional',color:new pc.Color(.55,.72,.78),intensity:.4,castShadows:false});
    this.fillLight.setEulerAngles(62,145,0); this.app.root.addChild(this.fillLight);

    this.audio=new AudioSystem(()=>this.save.data.settings);
    this.ui=new GameUI(uiRoot,{
      play:(daily)=>this.startRun(daily), pause:()=>this.pause(), resume:()=>this.resume(), home:()=>this.home(), retry:()=>this.startRun(this.lastDailyMode),
      previewSkin:(skin)=>this.previewSkin(skin), useSkin:(skin)=>this.useSkin(skin), claimMission:(id)=>this.claimMission(id),
      settingsChanged:()=>this.settingsChanged(), resetSave:()=>this.resetSave()
    });
    this.ui.setSave(this.save.data); this.ui.applyAccessibility(this.save.data);
    this.applyQuality();
    this.setupInput();
    this.createPreview();
    this.app.on('update',(dt:number)=>this.update(Math.min(dt,.05)));
    this.app.start();
    window.addEventListener('resize',()=>this.app.resizeCanvas());
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.screen==='playing') this.pause();});
  }

  private blankRun():RunStats { return {score:0,coins:0,roads:0,trains:0,creeks:0,photos:0,unseenStreak:0}; }

  private createPreview() {
    this.destroyWorld();
    this.currentWeather='autumn';
    this.world=new WorldGenerator(this.app,'menu-preview','autumn');
    this.player=new SquatchPlayer(this.app,this.selectedSkin());
    this.player.row=2; this.player.col=0; this.player.maxRow=2; this.player.entity.setPosition(0,.03,2*ROW_Z);
    this.world.ensureAhead(2);
    this.ui.setWeather('autumn');
    this.applyLighting('autumn');
    this.screen='menu'; this.ui.show('menu');
  }

  private destroyWorld() {
    try { this.world?.destroy(); } catch { /* first boot */ }
    try { this.player?.destroy(); } catch { /* first boot */ }
  }

  private selectedSkin() { return SKINS.find(s=>s.name===this.save.data.selectedSkin) ?? SKINS[0]; }

  private chooseWeather():WeatherType {
    const r=Math.random();
    if (r<.17) return 'fog'; if (r<.32) return 'rain'; if (r<.42) return 'snow'; if (r<.58) return 'autumn'; if (r<.70) return 'night'; return 'clear';
  }

  private startRun(daily:boolean) {
    this.audio.ensureStarted();
    this.lastDailyMode=daily; this.dailyMode=daily;
    this.run=this.blankRun(); this.sighting=0; this.sightFocus=0; this.photoCooldown=0; this.shieldUntil=0; this.fogUntil=0; this.speedUntil=0; this.collisionGraceUntil=performance.now()/1000+1;
    this.runStartedAt=performance.now()/1000; this.lastForwardAt=this.runStartedAt;
    this.destroyWorld();
    this.currentWeather=daily?this.dailyWeather():this.chooseWeather();
    const seed=daily?`daily-${dayKey()}`:`run-${Date.now()}-${Math.random()}`;
    this.world=new WorldGenerator(this.app,seed,this.currentWeather);
    this.world.onTrainWarning=()=>{this.audio.train();this.ui.toast('🚂 TRAIN!','danger',850);};
    this.world.onRareEvent=(kind)=>this.rareEvent(kind);
    this.player=new SquatchPlayer(this.app,this.selectedSkin());
    this.player.onStepStart=()=>{this.audio.hop();this.haptic(8);};
    this.player.onArrive=(fromRow)=>this.onArrive(fromRow);
    this.save.data.runsPlayed++;
    this.save.save();
    this.applyLighting(this.currentWeather); this.ui.setWeather(this.currentWeather); this.ui.setSave(this.save.data);
    this.screen='playing'; this.ui.show('playing'); this.updateHud();
    this.ui.toast(daily?'🌄 DAILY TRAIL':'👣 HIT THE TRAIL','gold',1200);
  }

  private dailyWeather():WeatherType {
    const k=dayKey().replaceAll('-',''); const n=Number(k.slice(-4)); const list:WeatherType[]=['clear','autumn','fog','rain','clear','night','snow']; return list[n%list.length];
  }

  private update(dt:number) {
    this.frameCounter++;
    if (!this.world || !this.player) return;
    const now=performance.now()/1000;
    this.applyRenderCap(now);
    const active=this.screen==='playing';
    this.player.update(active?dt:dt*.35,this.save.data.settings.reducedMotion,now<this.speedUntil);
    this.world.update(active?dt:dt*.45,this.player.row,this.run.score);
    this.updateCamera(dt);
    if (!active) return;

    this.world.ensureAhead(this.player.row);
    if (now>this.collisionGraceUntil) {
      const hit=this.world.collisionAt(this.player.row,this.player.col*1.35);
      if (hit) this.handleCollision(hit);
    }
    if (this.screen!=='playing') return;
    this.updateSighting(dt,now);
    this.updatePressure(dt,now);
    this.photoCooldown=Math.max(0,this.photoCooldown-dt);
    this.handleHold(now);
    this.updateHud();
  }

  private updateCamera(dt:number) {
    const p=this.player.entity.getPosition();
    const desired=new pc.Vec3(p.x+6.8,p.y+9.8,p.z-9.4);
    const k=1-Math.pow(.001,dt);
    this.cameraPos.lerp(this.cameraPos,desired,this.save.data.settings.reducedMotion?1:k);
    this.camera.setPosition(this.cameraPos);
    this.tempTarget.set(p.x*.18,1.0,p.z+3.25);
    this.camera.lookAt(this.tempTarget);
  }

  private onArrive(fromRow:number) {
    if (this.screen!=='playing') return;
    const now=performance.now()/1000;
    const movedForward=this.player.row>fromRow;
    if (movedForward) {
      this.run.score=this.player.maxRow;
      this.run.unseenStreak=this.sighting<15?this.run.unseenStreak+1:0;
      this.save.data.totalSteps++;
      this.save.data.longestUnseenStreak=Math.max(this.save.data.longestUnseenStreak,this.run.unseenStreak);
      this.progressMission('steps',1);
      if (this.sighting<15) this.progressMission('unseen',1);
      this.lastForwardAt=now;
      const previousType=this.world.rowType(fromRow);
      if (previousType==='railroad') { this.run.trains++;this.save.data.trainsDodged++;this.progressMission('trains',1); }
      const type=this.world.rowType(this.player.row);
      if (type==='road') {this.run.roads++;this.save.data.roadsCrossed++;this.progressMission('roads',1);}
      if (type==='creek') {this.run.creeks++;this.save.data.creeksCrossed++;this.progressMission('creeks',1);}
    }
    if (!this.world.creekSafe(this.player.row,this.player.col)) { this.die('Swept downstream 🌊'); return; }
    const pickup=this.world.pickupAt(this.player.row,this.player.col); if (pickup) this.collect(pickup);
    this.checkAchievements(); this.save.save();
  }

  private collect(kind:PickupType) {
    const now=performance.now()/1000;
    if (kind==='coin') {this.run.coins++;this.save.data.coins++;this.audio.coin();this.progressMission('coins',1);this.ui.toast('+1 Squatch Coin','gold',700);}
    else if (kind==='pepperoni') {this.shieldUntil=Math.max(this.shieldUntil,now+7);this.audio.power();this.ui.toast('🌭 PEPPERONI POWER','gold');}
    else if (kind==='mountainFog') {this.fogUntil=Math.max(this.fogUntil,now+7);this.sighting=Math.max(0,this.sighting-18);this.audio.power();this.ui.toast('🌫 MOUNTAIN FOG');}
    else if (kind==='trailMix') {this.speedUntil=Math.max(this.speedUntil,now+6);this.audio.power();this.ui.toast('🥜 TRAIL MIX');}
    else {this.sighting=Math.max(0,this.sighting-38);this.audio.power();this.ui.toast('👣 FAKE FOOTPRINTS');}
    this.haptic(18);
  }

  private handleCollision(kind:string) {
    const now=performance.now()/1000;
    if (now<this.shieldUntil) {
      this.shieldUntil=0; this.collisionGraceUntil=now+1.0; this.audio.crash(); this.ui.toast('🌭 Pepperoni Roll saved you!','gold'); this.haptic([35,35,35]); return;
    }
    this.audio.crash(); this.haptic([70,40,90]);
    if (/Truck|Bus|RV|Sedan|SUV|Pickup|Minivan/.test(kind)) this.save.data.timesFlattened++;
    this.die(kind==='Freight Train'?'Freight train 🚂':`${kind} WHOMP 🚙`);
  }

  private updateSighting(dt:number,now:number) {
    const cloaked=now<this.fogUntil;
    const exposed=!cloaked&&this.world.exposedToCamera(this.player.row,this.player.col);
    if (exposed) {
      this.sightFocus+=dt;
      this.sighting=Math.min(100,this.sighting+dt*(this.sighting>70?8:12));
      if (this.sightFocus>.62 && this.photoCooldown<=0) {
        this.sightFocus=0; this.photoCooldown=1.55; this.sighting=Math.min(100,this.sighting+22); this.run.photos++;this.save.data.photosTaken++;this.progressMission('photos',1);
        this.audio.photo(); this.ui.photoFlash(this.save.data.settings.reducedFlash); this.haptic(24);
      }
    } else {
      this.sightFocus=Math.max(0,this.sightFocus-dt*2.5);
      this.sighting=Math.max(0,this.sighting-dt*(this.sighting>75?2.2:4.5));
    }
    if (this.sighting>=100) this.die('PROOF FOUND 📸');
  }

  private updatePressure(dt:number,now:number) {
    const idle=now-this.lastForwardAt;
    if (idle>5.5) this.sighting=Math.min(100,this.sighting+dt*(idle>9?12:4));
    if (idle>7 && Math.floor(idle*2)%4===0 && Math.random()<dt*.8) this.ui.toast('🌲 Something is closing in behind you…','danger',900);
    if (idle>12) this.die('Cryptid hunters caught up 🎥');
  }

  private die(cause:string) {
    if (this.screen!=='playing') return;
    const wasBest=this.run.score>this.save.data.bestScore;
    if (wasBest) this.save.data.bestScore=this.run.score;
    if (this.dailyMode) this.save.data.dailyBest=Math.max(this.save.data.dailyBest,this.run.score);
    this.checkAchievements(); this.save.save(); this.ui.setSave(this.save.data);
    this.screen='gameover'; this.ui.gameOver(this.run.score,this.save.data.bestScore,this.run.coins,cause,wasBest);
  }

  private rareEvent(kind:string) {
    this.save.data.rareEventsSeen++; this.save.save(); this.ui.toast(kind==='Mothman'?'🔴 MOTHMAN SIGHTING!':'🛸 NOT FROM AROUND HERE','gold',2200); this.checkAchievements();
  }

  private progressMission(type:MissionType,amount:number) {
    const defs=dailyMissions();
    for (const def of defs.filter(d=>d.type===type)) {
      const p=this.save.data.missionProgress.find(x=>x.id===def.id); if (p&&!p.claimed) p.progress=Math.min(def.target,p.progress+amount);
    }
    this.save.save();
  }

  private claimMission(id:string) {
    const def=dailyMissions().find(m=>m.id===id); const p=this.save.data.missionProgress.find(x=>x.id===id); if(!def||!p||p.claimed||p.progress<def.target)return;
    p.claimed=true; this.save.data.coins+=def.reward; this.save.save(); this.audio.unlock(); this.ui.toast(`Mission complete • +${def.reward} 🪙`,'gold'); this.ui.setSave(this.save.data); this.ui.openPanel('missions');
  }

  private checkAchievements() {
    const d=this.save.data; const checks:Record<string,boolean>={
      'first-100':this.run.score>=100,'country-roads':this.run.score>=500,'almost-heaven':this.run.score>=1000,'trainspotter':d.trainsDodged>=25,
      'no-such-thing':this.run.score>=250&&this.run.photos===0,'caught-4k':this.run.photos>=5,'pepperoni-powered':d.coins>=100,'road-warrior':d.roadsCrossed>=250,
      'cryptid-tourist':d.rareEventsSeen>=5,'persistent-squatch':d.runsPlayed>=25
    };
    for (const [id,ok] of Object.entries(checks)) if(ok&&!d.achievements.includes(id)) {d.achievements.push(id);const info=ACHIEVEMENTS.find(a=>a[0]===id);this.audio.unlock();this.ui.toast(`🏆 ${info?.[1]??'Achievement'}`,'gold',2200);}
  }

  private previewSkin(skin:SkinDef) { if(this.player) this.player.setSkin(skin); }

  private useSkin(skin:SkinDef) {
    const d=this.save.data; const unlocked=d.unlockedSkins.includes(skin.name);
    if (!unlocked) {
      if (d.bestScore<skin.scoreUnlock) return;
      if (skin.price>0&&d.coins<skin.price) return;
      if (skin.price>0) d.coins-=skin.price;
      d.unlockedSkins.push(skin.name); this.audio.unlock(); this.ui.toast(`${skin.name} unlocked!`,'gold');
    }
    d.selectedSkin=skin.name; d.coins=Math.max(0,d.coins); this.save.save(); this.previewSkin(skin); this.ui.setSave(d); this.ui.openPanel('squatches');
  }

  private settingsChanged() { this.save.save(); this.audio.syncVolumes(); this.applyQuality(); this.ui.applyAccessibility(this.save.data); }

  private resetSave() { this.save.reset(); this.ui.setSave(this.save.data); this.audio.syncVolumes(); this.createPreview(); this.ui.toast('Progress reset'); }

  private pause() { if(this.screen!=='playing')return;this.screen='paused';this.ui.show('paused'); }
  private resume() { if(this.screen!=='paused')return;this.screen='playing';this.lastForwardAt=performance.now()/1000;this.ui.show('playing'); }
  private home() { this.createPreview();this.ui.setSave(this.save.data); }

  private updateHud() {
    const now=performance.now()/1000; this.ui.updateHud(this.run.score,this.run.coins,this.sighting,{shield:now<this.shieldUntil,fog:now<this.fogUntil,speed:now<this.speedUntil});
  }

  private applyLighting(weather:WeatherType) {
    const cam=this.camera.camera!;
    const fog=this.app.scene.fog;
    fog.type=pc.FOG_LINEAR;
    if (weather==='night') { cam.clearColor=color('#132535'); fog.color=color('#182b39'); fog.start=27; fog.end=64; this.sun.light!.color=color('#93a9d9'); this.sun.light!.intensity=.82; this.fillLight.light!.intensity=.25; this.app.scene.ambientLight=color('#263947'); }
    else if (weather==='fog') { cam.clearColor=color('#9dafaa'); fog.color=color('#a9b9b4'); fog.start=13; fog.end=44; this.sun.light!.color=color('#eee8d5'); this.sun.light!.intensity=1.05; this.fillLight.light!.intensity=.45; this.app.scene.ambientLight=color('#7b8e87'); }
    else if (weather==='rain') { cam.clearColor=color('#536b70'); fog.color=color('#5d7374'); fog.start=22; fog.end=55; this.sun.light!.color=color('#c8d4d0'); this.sun.light!.intensity=1.0; this.fillLight.light!.intensity=.38; this.app.scene.ambientLight=color('#53665f'); }
    else if (weather==='snow') { cam.clearColor=color('#a9c3cc'); fog.color=color('#bdcfd0'); fog.start=24; fog.end=60; this.sun.light!.color=color('#fff3dc'); this.sun.light!.intensity=1.55; this.fillLight.light!.intensity=.48; this.app.scene.ambientLight=color('#899c9b'); }
    else if (weather==='autumn') { cam.clearColor=color('#75939a'); fog.color=color('#7f9893'); fog.start=31; fog.end=67; this.sun.light!.color=color('#ffd49b'); this.sun.light!.intensity=1.62; this.fillLight.light!.intensity=.38; this.app.scene.ambientLight=color('#586c5c'); }
    else { cam.clearColor=color('#6f9ba4'); fog.color=color('#789b9a'); fog.start=36; fog.end=74; this.sun.light!.color=color('#fff0ca'); this.sun.light!.intensity=1.7; this.fillLight.light!.intensity=.4; this.app.scene.ambientLight=color('#667e70'); }
  }

  private applyRenderCap(now:number) {
    if (this.save.data.settings.fps===60) { this.app.autoRender=true; return; }
    this.app.autoRender=false;
    if (now-this.lastRenderAt>=1/30) { this.app.renderNextFrame=true; this.lastRenderAt=now; }
  }

  private applyQuality() {
    const q=this.save.data.settings.quality; const fps=this.save.data.settings.fps; const ratio=q===2?Math.min(devicePixelRatio,2):q===1?Math.min(devicePixelRatio,1.45):1;
    this.app.graphicsDevice.maxPixelRatio=fps===30?Math.min(ratio,1.15):ratio;
    if(this.sun.light) {this.sun.light.castShadows=q>0;this.sun.light.shadowResolution=q===2?2048:1024;this.sun.light.shadowDistance=q===2?38:28;}
  }

  private setupInput() {
    this.canvas.addEventListener('pointerdown',(e)=>{if(this.screen!=='playing')return;this.audio.ensureStarted();this.pointerDown=true;this.holdTriggered=false;this.pointerStart={x:e.clientX,y:e.clientY,t:performance.now()};this.lastHoldHop=performance.now()/1000;});
    this.canvas.addEventListener('pointerup',(e)=>{
      if(this.screen!=='playing'||!this.pointerDown)return;this.pointerDown=false;const dx=e.clientX-this.pointerStart.x,dy=e.clientY-this.pointerStart.y;const dist=Math.hypot(dx,dy);
      if(this.holdTriggered)return;
      if(dist<24){this.player.tryMove(0,1);return;}
      if(Math.abs(dx)>Math.abs(dy))this.player.tryMove(dx>0?1:-1,0);else this.player.tryMove(0,dy<0?1:-1);
    });
    this.canvas.addEventListener('pointercancel',()=>{this.pointerDown=false;});
    this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
    window.addEventListener('keydown',(e)=>{
      if(this.screen!=='playing')return;
      if(['ArrowUp','w','W'].includes(e.key))this.player.tryMove(0,1); else if(['ArrowDown','s','S'].includes(e.key))this.player.tryMove(0,-1); else if(['ArrowLeft','a','A'].includes(e.key))this.player.tryMove(-1,0); else if(['ArrowRight','d','D'].includes(e.key))this.player.tryMove(1,0); else if(e.key==='Escape')this.pause();
    });
  }

  private handleHold(now:number) {
    if(!this.pointerDown||!this.save.data.settings.holdToHop)return;
    const held=performance.now()-this.pointerStart.t;
    if(held>330&&now-this.lastHoldHop>.22){this.holdTriggered=true;this.lastHoldHop=now;this.player.tryMove(0,1);}
  }

  private haptic(pattern:number|number[]) {
    if(!this.save.data.settings.haptics)return;
    try {navigator.vibrate?.(pattern);} catch { /* unsupported */ }
  }
}
