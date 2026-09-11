import { ACHIEVEMENTS, dailyMissions, SKINS } from './catalog';
import type { GameScreen, SaveData, SkinDef } from './types';

export interface UIActions {
  play: (daily:boolean)=>void;
  pause: ()=>void;
  resume: ()=>void;
  home: ()=>void;
  retry: ()=>void;
  previewSkin: (skin:SkinDef)=>void;
  useSkin: (skin:SkinDef)=>void;
  claimMission: (id:string)=>void;
  settingsChanged: ()=>void;
  resetSave: ()=>void;
}

const icons={squatch:'👣',missions:'🎯',records:'🏆',settings:'⚙️'};

export class GameUI {
  private screens=new Map<GameScreen,HTMLElement>();
  private toastRoot!:HTMLElement;
  private flashEl!:HTMLElement;
  private skinIndex=0;
  private currentSave!:SaveData;

  constructor(private root:HTMLElement, private actions:UIActions) {
    this.renderShell();
    this.bindBase();
  }

  private renderShell() {
    this.root.innerHTML=`
      <section id="screen-menu" class="screen menu active" aria-label="Main menu">
        <div class="menu-stack">
          <img class="brand" src="./logo.png" alt="Squatch Crossing" />
          <div class="tagline">Cross Appalachia • Stay out of sight</div>
          <button id="play" class="primary">PLAY</button>
          <button id="daily" class="secondary daily">DAILY TRAIL</button>
          <div class="menu-nav">
            <button data-open="squatches"><span>${icons.squatch}</span>Squatches</button>
            <button data-open="missions"><span>${icons.missions}</span>Missions</button>
            <button data-open="records"><span>${icons.records}</span>Records</button>
            <button data-open="settings"><span>${icons.settings}</span>Settings</button>
          </div>
        </div>
      </section>

      <section id="screen-playing" class="screen hud" aria-label="Game heads up display">
        <div>
          <div class="hud-top">
            <div class="hud-pill"><div id="hud-score" class="score">0</div><div class="tiny">Steps</div></div>
            <div class="hud-actions">
              <div class="hud-pill"><div id="hud-coins" class="score">0</div><div class="tiny">🪙 Coins</div></div>
              <button id="pause" class="icon" aria-label="Pause">Ⅱ</button>
            </div>
          </div>
          <div class="sighting-wrap" id="sighting-wrap">
            <div class="sighting-label"><span>👁 Sighting</span><span id="sighting-state">UNKNOWN</span></div>
            <div class="meter"><div id="sighting-fill" class="meter-fill"></div></div>
          </div>
        </div>
        <div class="power-row">
          <span id="power-shield" class="power-chip">🌭 Protected</span>
          <span id="power-fog" class="power-chip">🌫 Hidden</span>
          <span id="power-speed" class="power-chip">🥜 Trail Mix</span>
        </div>
      </section>

      <section id="screen-paused" class="screen panel-screen"><div class="panel pause-card">
        <div class="panel-header"><h2>Trail Paused</h2></div>
        <p class="sub">Squatch is hiding behind a conveniently placed tree.</p>
        <button id="resume" class="primary">RESUME</button>
        <button id="pause-home">Main Menu</button>
      </div></section>

      <section id="screen-gameover" class="screen panel-screen"><div class="panel gameover-card">
        <div class="tiny">Run complete</div>
        <div id="over-score" class="big-number">0</div>
        <div class="sub">steps into Appalachia</div>
        <div id="over-best" class="sub"></div>
        <div id="over-cause" class="cause"></div>
        <div id="over-coins" class="sub" style="margin-top:10px"></div>
        <button id="retry" class="primary">TRY AGAIN</button>
        <div class="gameover-actions"><button id="over-home">Main Menu</button><button data-open="squatches">Squatches</button></div>
      </div></section>

      <section id="screen-squatches" class="screen panel-screen"><div class="panel">
        <div class="panel-header"><h2>Squatches</h2><button class="icon close-panel">×</button></div>
        <div class="skin-preview">
          <div id="skin-name" class="skin-name"></div><span id="skin-rarity" class="rarity"></span>
          <p id="skin-unlock" class="skin-lock"></p>
          <div class="skin-nav"><button id="skin-prev">‹</button><button id="skin-action" class="secondary skin-action"></button><button id="skin-next">›</button></div>
          <div id="collection-count" class="collection-count"></div>
        </div>
        <p class="sub" style="text-align:center;margin-top:14px">The 3D Squatch behind this panel updates as you browse.</p>
      </div></section>

      <section id="screen-missions" class="screen panel-screen"><div class="panel">
        <div class="panel-header"><h2>Daily Missions</h2><button class="icon close-panel">×</button></div>
        <p class="sub">Three fresh goals each day. Normal runs and Daily Trail both count.</p>
        <div id="mission-list"></div>
      </div></section>

      <section id="screen-records" class="screen panel-screen"><div class="panel">
        <div class="panel-header"><h2>Records</h2><button class="icon close-panel">×</button></div>
        <div id="stats" class="stats"></div>
        <h3>Achievements</h3><div id="achievements"></div>
      </div></section>

      <section id="screen-settings" class="screen panel-screen"><div class="panel">
        <div class="panel-header"><h2>Settings</h2><button class="icon close-panel">×</button></div>
        <h3>Audio</h3>
        <div class="setting"><label>Music<small>Low-key mountain atmosphere</small></label><input id="set-music" type="range" min="0" max="1" step="0.05"></div>
        <div class="setting"><label>Sound effects<small>Hops, traffic and collectibles</small></label><input id="set-sfx" type="range" min="0" max="1" step="0.05"></div>
        <div class="setting"><label>Ambient sound<small>Wind and environmental bed</small></label><input id="set-ambient" type="range" min="0" max="1" step="0.05"></div>
        <h3>Controls & Accessibility</h3>
        <div class="setting"><label>Haptic feedback</label><input id="set-haptics" type="checkbox"></div>
        <div class="setting"><label>Hold to hop<small>Hold the screen to keep moving forward</small></label><input id="set-hold" type="checkbox"></div>
        <div class="setting"><label>Reduced motion</label><input id="set-motion" type="checkbox"></div>
        <div class="setting"><label>Reduce camera flashes</label><input id="set-flash" type="checkbox"></div>
        <div class="setting"><label>High contrast hazards</label><input id="set-contrast" type="checkbox"></div>
        <h3>Graphics</h3>
        <div class="setting"><label>Frame rate</label><select id="set-fps"><option value="30">30 FPS</option><option value="60">60 FPS</option></select></div>
        <div class="setting"><label>Quality</label><select id="set-quality"><option value="0">Battery Saver</option><option value="1">Balanced</option><option value="2">High</option></select></div>
        <h3>Save Data</h3>
        <button id="reset-save" class="danger" style="width:100%">Reset All Progress</button>
      </div></section>
      <div id="toast-stack" class="toast-stack" aria-live="polite"></div>
      <div id="flash" class="flash"></div>`;
    for (const name of ['menu','playing','paused','squatches','missions','records','settings','gameover'] as GameScreen[]) {
      this.screens.set(name,document.getElementById(`screen-${name}`)!);
    }
    this.toastRoot=document.getElementById('toast-stack')!;
    this.flashEl=document.getElementById('flash')!;
  }

  private bindBase() {
    document.getElementById('play')!.addEventListener('click',()=>this.actions.play(false));
    document.getElementById('daily')!.addEventListener('click',()=>this.actions.play(true));
    document.getElementById('pause')!.addEventListener('click',()=>this.actions.pause());
    document.getElementById('resume')!.addEventListener('click',()=>this.actions.resume());
    document.getElementById('pause-home')!.addEventListener('click',()=>this.actions.home());
    document.getElementById('retry')!.addEventListener('click',()=>this.actions.retry());
    document.getElementById('over-home')!.addEventListener('click',()=>this.actions.home());
    document.querySelectorAll<HTMLButtonElement>('[data-open]').forEach(b=>b.addEventListener('click',()=>this.openPanel(b.dataset.open as GameScreen)));
    document.querySelectorAll<HTMLButtonElement>('.close-panel').forEach(b=>b.addEventListener('click',()=>this.show('menu')));
    document.getElementById('skin-prev')!.addEventListener('click',()=>this.changeSkin(-1));
    document.getElementById('skin-next')!.addEventListener('click',()=>this.changeSkin(1));
    document.getElementById('skin-action')!.addEventListener('click',()=>this.actions.useSkin(SKINS[this.skinIndex]));
    document.getElementById('reset-save')!.addEventListener('click',()=>{
      if (confirm('Reset every Squatch, coin, record and setting?')) this.actions.resetSave();
    });
    const settingIds=['set-music','set-sfx','set-ambient','set-haptics','set-hold','set-motion','set-flash','set-contrast','set-fps','set-quality'];
    for (const id of settingIds) document.getElementById(id)!.addEventListener('change',()=>{this.pullSettings();this.actions.settingsChanged();});
    for (const id of ['set-music','set-sfx','set-ambient']) document.getElementById(id)!.addEventListener('input',()=>{this.pullSettings();this.actions.settingsChanged();});
  }

  setSave(save:SaveData) {
    this.currentSave=save;
    this.skinIndex=Math.max(0,SKINS.findIndex(s=>s.name===save.selectedSkin));
    this.pushSettings();
    this.renderSkin(); this.renderMissions(); this.renderRecords();
  }

  show(screen:GameScreen) {
    for (const [name,el] of this.screens) el.classList.toggle('active',name===screen);
  }

  openPanel(screen:GameScreen) {
    if (!this.currentSave) return;
    if (screen==='squatches') { this.skinIndex=Math.max(0,SKINS.findIndex(s=>s.name===this.currentSave.selectedSkin)); this.renderSkin(); this.actions.previewSkin(SKINS[this.skinIndex]); }
    if (screen==='missions') this.renderMissions();
    if (screen==='records') this.renderRecords();
    if (screen==='settings') this.pushSettings();
    this.show(screen);
  }

  updateHud(score:number,coins:number,sighting:number,powers:{shield:boolean;fog:boolean;speed:boolean}) {
    document.getElementById('hud-score')!.textContent=String(score);
    document.getElementById('hud-coins')!.textContent=String(coins);
    (document.getElementById('sighting-fill')! as HTMLElement).style.width=`${Math.max(0,Math.min(100,sighting))}%`;
    const state=sighting<15?'UNKNOWN':sighting<40?'RUMOR':sighting<70?'SIGHTED':sighting<95?'VIRAL':'MANHUNT';
    document.getElementById('sighting-state')!.textContent=state;
    document.getElementById('power-shield')!.classList.toggle('on',powers.shield);
    document.getElementById('power-fog')!.classList.toggle('on',powers.fog);
    document.getElementById('power-speed')!.classList.toggle('on',powers.speed);
  }

  gameOver(score:number,best:number,coins:number,cause:string,newBest:boolean) {
    document.getElementById('over-score')!.textContent=String(score);
    document.getElementById('over-best')!.textContent=newBest?`🏆 NEW BEST • ${best}`:`Best: ${best}`;
    document.getElementById('over-coins')!.textContent=`🪙 ${coins} coins collected this run`;
    document.getElementById('over-cause')!.textContent=cause;
    this.show('gameover');
  }

  toast(text:string,kind:'normal'|'gold'|'danger'='normal',ms=1700) {
    const el=document.createElement('div'); el.className=`toast ${kind==='normal'?'':kind}`; el.textContent=text; this.toastRoot.appendChild(el);
    setTimeout(()=>el.remove(),ms);
  }

  photoFlash(reduced:boolean) {
    if (reduced) { this.toast('📸 PHOTO TAKEN','danger',900); return; }
    this.flashEl.classList.remove('go'); void this.flashEl.offsetWidth; this.flashEl.classList.add('go');
  }

  setWeather(kind:string) {
    const fx=document.getElementById('weather-fx')!; fx.className=''; if (kind!=='clear') fx.classList.add(kind);
  }

  applyAccessibility(save:SaveData) {
    document.body.classList.toggle('reduced-motion',save.settings.reducedMotion);
    document.body.classList.toggle('high-contrast',save.settings.highContrast);
  }

  private changeSkin(delta:number) {
    this.skinIndex=(this.skinIndex+delta+SKINS.length)%SKINS.length; this.renderSkin(); this.actions.previewSkin(SKINS[this.skinIndex]);
  }

  renderSkin() {
    if (!this.currentSave) return;
    const s=SKINS[this.skinIndex]; const unlocked=this.currentSave.unlockedSkins.includes(s.name); const scoreReady=this.currentSave.bestScore>=s.scoreUnlock;
    document.getElementById('skin-name')!.textContent=s.name;
    document.getElementById('skin-rarity')!.textContent=s.rarity;
    const action=document.getElementById('skin-action')! as HTMLButtonElement;
    if (unlocked) { action.textContent=this.currentSave.selectedSkin===s.name?'SELECTED':'USE SQUATCH'; action.disabled=this.currentSave.selectedSkin===s.name; }
    else if (!scoreReady) { action.textContent=`REACH ${s.scoreUnlock} STEPS`; action.disabled=true; }
    else if (s.price===0) { action.textContent='UNLOCK'; action.disabled=false; }
    else { action.textContent=`UNLOCK • 🪙 ${s.price}`; action.disabled=this.currentSave.coins<s.price; }
    document.getElementById('skin-unlock')!.textContent=unlocked?'Ready to cross Appalachia.':!scoreReady?`Best-score requirement: ${s.scoreUnlock}.`:`You have ${this.currentSave.coins} Squatch Coins.`;
    document.getElementById('collection-count')!.textContent=`${this.currentSave.unlockedSkins.length} / ${SKINS.length} discovered`;
  }

  renderMissions() {
    if (!this.currentSave) return;
    const defs=dailyMissions(); const list=document.getElementById('mission-list')!; list.innerHTML='';
    for (const m of defs) {
      const p=this.currentSave.missionProgress.find(x=>x.id===m.id) ?? {id:m.id,progress:0,claimed:false}; const ratio=Math.min(1,p.progress/m.target);
      const el=document.createElement('div'); el.className='mission';
      el.innerHTML=`<div class="mission-top"><span>${m.label}</span><small>🪙 ${m.reward}</small></div><div class="meter"><div class="meter-fill" style="width:${ratio*100}%"></div></div><small>${Math.min(p.progress,m.target)} / ${m.target}</small><button ${p.claimed||p.progress<m.target?'disabled':''}>${p.claimed?'CLAIMED':p.progress>=m.target?'CLAIM REWARD':'IN PROGRESS'}</button>`;
      const btn=el.querySelector('button')!; btn.addEventListener('click',()=>this.actions.claimMission(m.id)); list.appendChild(el);
    }
  }

  renderRecords() {
    if (!this.currentSave) return;
    const d=this.currentSave;
    const stats:[string,string|number][]=[['Best steps',d.bestScore],['Total steps',d.totalSteps],['Roads crossed',d.roadsCrossed],['Trains dodged',d.trainsDodged],['Creeks crossed',d.creeksCrossed],['Times flattened',d.timesFlattened],['Photos taken',d.photosTaken],['Longest unseen',d.longestUnseenStreak],['Rare events',d.rareEventsSeen],['Runs played',d.runsPlayed]];
    document.getElementById('stats')!.innerHTML=stats.map(([label,value])=>`<div class="stat"><strong>${value}</strong><span>${label}</span></div>`).join('');
    document.getElementById('achievements')!.innerHTML=ACHIEVEMENTS.map(([id,name,desc])=>`<div class="achievement ${d.achievements.includes(id)?'':'locked'}"><div class="medal">${d.achievements.includes(id)?'🏅':'○'}</div><div><b>${name}</b><p>${desc}</p></div></div>`).join('');
  }

  private pushSettings() {
    if (!this.currentSave) return; const s=this.currentSave.settings;
    (document.getElementById('set-music') as HTMLInputElement).value=String(s.music);
    (document.getElementById('set-sfx') as HTMLInputElement).value=String(s.sfx);
    (document.getElementById('set-ambient') as HTMLInputElement).value=String(s.ambient);
    (document.getElementById('set-haptics') as HTMLInputElement).checked=s.haptics;
    (document.getElementById('set-hold') as HTMLInputElement).checked=s.holdToHop;
    (document.getElementById('set-motion') as HTMLInputElement).checked=s.reducedMotion;
    (document.getElementById('set-flash') as HTMLInputElement).checked=s.reducedFlash;
    (document.getElementById('set-contrast') as HTMLInputElement).checked=s.highContrast;
    (document.getElementById('set-fps') as HTMLSelectElement).value=String(s.fps);
    (document.getElementById('set-quality') as HTMLSelectElement).value=String(s.quality);
  }

  private pullSettings() {
    if (!this.currentSave) return; const s=this.currentSave.settings;
    s.music=Number((document.getElementById('set-music') as HTMLInputElement).value);
    s.sfx=Number((document.getElementById('set-sfx') as HTMLInputElement).value);
    s.ambient=Number((document.getElementById('set-ambient') as HTMLInputElement).value);
    s.haptics=(document.getElementById('set-haptics') as HTMLInputElement).checked;
    s.holdToHop=(document.getElementById('set-hold') as HTMLInputElement).checked;
    s.reducedMotion=(document.getElementById('set-motion') as HTMLInputElement).checked;
    s.reducedFlash=(document.getElementById('set-flash') as HTMLInputElement).checked;
    s.highContrast=(document.getElementById('set-contrast') as HTMLInputElement).checked;
    s.fps=Number((document.getElementById('set-fps') as HTMLSelectElement).value) as 30|60;
    s.quality=Number((document.getElementById('set-quality') as HTMLSelectElement).value) as 0|1|2;
    this.applyAccessibility(this.currentSave);
  }
}
