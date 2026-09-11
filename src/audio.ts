export class AudioSystem {
  private ctx: AudioContext | null = null;
  musicGain: GainNode | null = null;
  sfxGain: GainNode | null = null;
  ambientGain: GainNode | null = null;
  private humOsc: OscillatorNode | null = null;
  private windOsc: OscillatorNode | null = null;
  private started = false;

  constructor(private getSettings: () => {music:number;sfx:number;ambient:number}) {}

  ensureStarted() {
    if (this.started) return;
    const Ctx = window.AudioContext || (window as unknown as {webkitAudioContext?: typeof AudioContext}).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.ambientGain = this.ctx.createGain();
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain.connect(this.ctx.destination);
    this.ambientGain.connect(this.ctx.destination);
    this.syncVolumes();

    this.humOsc = this.ctx.createOscillator();
    this.humOsc.type = 'sine';
    this.humOsc.frequency.value = 73;
    const humGain = this.ctx.createGain();
    humGain.gain.value = 0.018;
    this.humOsc.connect(humGain).connect(this.musicGain);
    this.humOsc.start();

    this.windOsc = this.ctx.createOscillator();
    this.windOsc.type = 'triangle';
    this.windOsc.frequency.value = 31;
    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.012;
    this.windOsc.connect(windGain).connect(this.ambientGain);
    this.windOsc.start();
    this.started = true;
  }

  syncVolumes() {
    const s = this.getSettings();
    if (this.musicGain) this.musicGain.gain.value = s.music;
    if (this.sfxGain) this.sfxGain.gain.value = s.sfx;
    if (this.ambientGain) this.ambientGain.gain.value = s.ambient;
  }

  private tone(freq:number, duration:number, type:OscillatorType, volume:number, slide=0) {
    this.ensureStarted();
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), this.ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    osc.connect(gain).connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  hop() { this.tone(95, .07, 'sine', .08, 30); }
  coin() { this.tone(740, .09, 'sine', .08, 220); }
  power() { this.tone(330, .24, 'triangle', .09, 420); }
  photo() { this.tone(1100, .035, 'square', .09, -500); }
  crash() { this.tone(70, .32, 'sawtooth', .13, -35); }
  train() { this.tone(140, .5, 'square', .08, -20); }
  unlock() { this.tone(440, .14, 'sine', .08, 220); setTimeout(()=>this.tone(660,.18,'sine',.07,220),120); }
}
