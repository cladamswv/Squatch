import type { MissionDef, SkinDef } from './types';

export const SKINS: SkinDef[] = [
  { name:'Classic Squatch', fur:'#6b3d27', accent:'#b57a48', price:0, scoreUnlock:0, accessory:'none', rarity:'Common' },
  { name:'Mountain Squatch', fur:'#51463c', accent:'#8e8167', price:150, scoreUnlock:0, accessory:'none', rarity:'Common' },
  { name:'Miner Squatch', fur:'#583926', accent:'#f2bd34', price:300, scoreUnlock:100, accessory:'miner', rarity:'Uncommon' },
  { name:'Snow Squatch', fur:'#e3ecef', accent:'#73a8c6', price:450, scoreUnlock:150, accessory:'scarf', rarity:'Rare' },
  { name:'Grandpa Squatch', fur:'#81736b', accent:'#d6d0c3', price:350, scoreUnlock:200, accessory:'brows', rarity:'Uncommon' },
  { name:'Baby Squatch', fur:'#74452c', accent:'#da8e4d', price:400, scoreUnlock:250, accessory:'baby', rarity:'Rare' },
  { name:'Golden Squatch', fur:'#d19b2e', accent:'#ffe38a', price:1000, scoreUnlock:500, accessory:'sparkle', rarity:'Legendary' },
  { name:'MothSquatch', fur:'#2e2930', accent:'#d33b45', price:0, scoreUnlock:650, accessory:'moth', rarity:'Secret' },
  { name:'Tourist Squatch', fur:'#70492f', accent:'#43aabe', price:500, scoreUnlock:300, accessory:'camera', rarity:'Rare' },
  { name:'Firefighter Squatch', fur:'#59392b', accent:'#d93634', price:550, scoreUnlock:350, accessory:'fire', rarity:'Rare' },
  { name:'Football Squatch', fur:'#65422d', accent:'#2b6c4b', price:500, scoreUnlock:325, accessory:'helmet', rarity:'Rare' },
  { name:'Zombie Squatch', fur:'#5d7857', accent:'#91c38a', price:650, scoreUnlock:450, accessory:'zombie', rarity:'Epic' },
  { name:'Alien Squatch', fur:'#526a50', accent:'#75d998', price:700, scoreUnlock:550, accessory:'antenna', rarity:'Epic' },
  { name:'Autumn Squatch', fur:'#91461f', accent:'#e57927', price:350, scoreUnlock:225, accessory:'leaf', rarity:'Uncommon' },
  { name:'Coal Dust Squatch', fur:'#32302f', accent:'#8d8985', price:450, scoreUnlock:275, accessory:'miner', rarity:'Rare' },
  { name:'River Squatch', fur:'#4b5958', accent:'#4d98a5', price:375, scoreUnlock:240, accessory:'none', rarity:'Uncommon' },
  { name:'Camp Squatch', fur:'#6c4b31', accent:'#e28b42', price:325, scoreUnlock:180, accessory:'scarf', rarity:'Uncommon' },
  { name:'Night Squatch', fur:'#2b282d', accent:'#7d61a0', price:475, scoreUnlock:320, accessory:'none', rarity:'Rare' },
  { name:'Copper Squatch', fur:'#a65b31', accent:'#d78b52', price:500, scoreUnlock:340, accessory:'none', rarity:'Rare' },
  { name:'Frost Squatch', fur:'#bfd8e1', accent:'#5c9abd', price:600, scoreUnlock:420, accessory:'scarf', rarity:'Epic' },
  { name:'Trail Guide Squatch', fur:'#66452f', accent:'#4a7a44', price:550, scoreUnlock:360, accessory:'hat', rarity:'Rare' },
  { name:'Pepperoni Squatch', fur:'#86412f', accent:'#efb357', price:750, scoreUnlock:475, accessory:'pepperoni', rarity:'Epic' },
  { name:'Storm Squatch', fur:'#444b56', accent:'#79a5c9', price:600, scoreUnlock:430, accessory:'none', rarity:'Epic' },
  { name:'Moon Squatch', fur:'#56536c', accent:'#c5c7e3', price:625, scoreUnlock:460, accessory:'none', rarity:'Epic' },
  { name:'Red-Eye Squatch', fur:'#413532', accent:'#e53434', price:700, scoreUnlock:520, accessory:'redEyes', rarity:'Epic' },
  { name:'Hunter Disguise', fur:'#674b34', accent:'#596f43', price:800, scoreUnlock:575, accessory:'hat', rarity:'Epic' },
  { name:'Rainbow Squatch', fur:'#855b93', accent:'#5fc0b3', price:900, scoreUnlock:600, accessory:'rainbow', rarity:'Legendary' },
  { name:'Old Growth Squatch', fur:'#4e543b', accent:'#8d9960', price:650, scoreUnlock:500, accessory:'leaf', rarity:'Epic' },
  { name:'Blackwater Squatch', fur:'#303536', accent:'#56737b', price:700, scoreUnlock:540, accessory:'none', rarity:'Epic' },
  { name:'Almost Heaven Squatch', fur:'#65422a', accent:'#558bd0', price:0, scoreUnlock:1000, accessory:'crown', rarity:'Legendary' }
];

export const ACHIEVEMENTS = [
  ['first-100', 'Just Getting Started', 'Reach 100 steps in one run.'],
  ['country-roads', 'Country Roads', 'Reach 500 steps in one run.'],
  ['almost-heaven', 'Almost Heaven', 'Reach 1,000 steps in one run.'],
  ['trainspotter', 'Trainspotter', 'Dodge 25 trains across all runs.'],
  ['no-such-thing', 'No Such Thing', 'Reach 250 steps without being photographed.'],
  ['caught-4k', 'Caught in 4K', 'Get photographed 5 times in one run and survive.'],
  ['pepperoni-powered', 'Pepperoni Powered', 'Collect 100 coins across all runs.'],
  ['road-warrior', 'Road Warrior', 'Cross 250 roads across all runs.'],
  ['cryptid-tourist', 'Cryptid Tourist', 'Witness 5 rare events.'],
  ['persistent-squatch', 'Persistent Squatch', 'Play 25 runs.']
] as const;

function seeded(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

export function dailyMissions(key = dayKey()): MissionDef[] {
  const seed = [...key].reduce((a,c) => ((a * 31) + c.charCodeAt(0)) >>> 0, 2166136261);
  const r = seeded(seed);
  const pool: Omit<MissionDef,'id'>[] = [
    {type:'steps', target:120 + Math.floor(r()*100), reward:60, label:'Travel {n} steps'},
    {type:'coins', target:18 + Math.floor(r()*12), reward:55, label:'Collect {n} Squatch Coins'},
    {type:'trains', target:3 + Math.floor(r()*3), reward:70, label:'Survive {n} train crossings'},
    {type:'creeks', target:4 + Math.floor(r()*3), reward:60, label:'Cross {n} creek rows'},
    {type:'unseen', target:80 + Math.floor(r()*80), reward:80, label:'Travel {n} steps unseen'},
    {type:'photos', target:2 + Math.floor(r()*3), reward:50, label:'Survive {n} photographs'},
    {type:'roads', target:12 + Math.floor(r()*8), reward:65, label:'Cross {n} road rows'}
  ];
  const picked: MissionDef[] = [];
  while (picked.length < 3) {
    const i = Math.floor(r() * pool.length);
    const candidate = pool[i];
    if (!picked.some(m => m.type === candidate.type)) {
      picked.push({ ...candidate, id:`${key}-${candidate.type}`, label:candidate.label.replace('{n}', String(candidate.target)) });
    }
  }
  return picked;
}
