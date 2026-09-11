import type { SaveData } from './types';
import { dayKey, dailyMissions } from './catalog';

const STORAGE_KEY = 'SquatchCrossing_Save_v2';

function defaults(): SaveData {
  const key = dayKey();
  return {
    coins: 0,
    bestScore: 0,
    dailyBest: 0,
    dailyKey: key,
    totalSteps: 0,
    roadsCrossed: 0,
    trainsDodged: 0,
    creeksCrossed: 0,
    timesFlattened: 0,
    photosTaken: 0,
    longestUnseenStreak: 0,
    rareEventsSeen: 0,
    runsPlayed: 0,
    selectedSkin: 'Classic Squatch',
    unlockedSkins: ['Classic Squatch'],
    achievements: [],
    missionKey: key,
    missionProgress: dailyMissions(key).map(m => ({ id:m.id, progress:0, claimed:false })),
    settings: {
      music: 0.45,
      sfx: 0.8,
      ambient: 0.5,
      haptics: true,
      reducedMotion: false,
      reducedFlash: false,
      highContrast: false,
      holdToHop: false,
      fps: 60,
      quality: 1
    }
  };
}

export class SaveStore {
  data: SaveData;

  constructor() {
    this.data = this.load();
    this.refreshDaily();
  }

  private load(): SaveData {
    const base = defaults();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        ...base,
        ...parsed,
        settings: { ...base.settings, ...(parsed.settings ?? {}) },
        unlockedSkins: Array.isArray(parsed.unlockedSkins) ? parsed.unlockedSkins : base.unlockedSkins,
        achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
        missionProgress: Array.isArray(parsed.missionProgress) ? parsed.missionProgress : base.missionProgress
      };
    } catch {
      return base;
    }
  }

  save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch { /* private mode / quota */ }
  }

  refreshDaily() {
    const key = dayKey();
    if (this.data.dailyKey !== key) {
      this.data.dailyKey = key;
      this.data.dailyBest = 0;
    }
    if (this.data.missionKey !== key) {
      this.data.missionKey = key;
      this.data.missionProgress = dailyMissions(key).map(m => ({ id:m.id, progress:0, claimed:false }));
    }
    const defs = dailyMissions(key);
    for (const m of defs) {
      if (!this.data.missionProgress.some(p => p.id === m.id)) {
        this.data.missionProgress.push({ id:m.id, progress:0, claimed:false });
      }
    }
    this.save();
  }

  reset() {
    this.data = defaults();
    this.save();
  }
}
