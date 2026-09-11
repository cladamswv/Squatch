export type GameScreen = 'menu' | 'playing' | 'paused' | 'squatches' | 'missions' | 'records' | 'settings' | 'gameover';
export type RowType = 'forest' | 'road' | 'railroad' | 'creek' | 'town' | 'campground' | 'logging';
export type WeatherType = 'clear' | 'fog' | 'rain' | 'snow' | 'autumn' | 'night';
export type PickupType = 'coin' | 'pepperoni' | 'mountainFog' | 'trailMix' | 'fakeFootprints';
export type MissionType = 'steps' | 'coins' | 'trains' | 'creeks' | 'unseen' | 'photos' | 'roads';

export interface SkinDef {
  name: string;
  fur: string;
  accent: string;
  price: number;
  scoreUnlock: number;
  accessory: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Secret';
}

export interface MissionDef {
  id: string;
  type: MissionType;
  target: number;
  reward: number;
  label: string;
}

export interface MissionProgress {
  id: string;
  progress: number;
  claimed: boolean;
}

export interface SaveData {
  coins: number;
  bestScore: number;
  dailyBest: number;
  dailyKey: string;
  totalSteps: number;
  roadsCrossed: number;
  trainsDodged: number;
  creeksCrossed: number;
  timesFlattened: number;
  photosTaken: number;
  longestUnseenStreak: number;
  rareEventsSeen: number;
  runsPlayed: number;
  selectedSkin: string;
  unlockedSkins: string[];
  achievements: string[];
  missionKey: string;
  missionProgress: MissionProgress[];
  settings: {
    music: number;
    sfx: number;
    ambient: number;
    haptics: boolean;
    reducedMotion: boolean;
    reducedFlash: boolean;
    highContrast: boolean;
    holdToHop: boolean;
    fps: 30 | 60;
    quality: 0 | 1 | 2;
  };
}

export interface RunStats {
  score: number;
  coins: number;
  roads: number;
  trains: number;
  creeks: number;
  photos: number;
  unseenStreak: number;
}
