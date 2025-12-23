const ITEM_TIERS = {
  NORMAL: { name: 'Normal', color: '#888888', dropChance: 0 },
  MAGICAL: { name: 'Magical', color: '#4a9eff', dropChance: 1 / 1.1 },
  RARE: { name: 'Rare', color: '#ffff4a', dropChance: 1 / 20 },
  COMPOUND: { name: 'Compound', color: '#ff8800', dropChance: 1 / 100 },
  UNIQUE: { name: 'Unique', color: '#ff4aff', dropChance: 1 / 1000 },
  LEGENDARY: { name: 'Legendary', color: '#ff4a4a', dropChance: 1 / 10000 }
};

// PREFIX pool - can roll as prefixes on magical items
const PREFIX_POOL = [
  // Tier 1 (levelReq 1-4): frequency 1
  { type: 'charisma', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'forging', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'strength', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'dexterity', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'intelligence', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'vitality', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'luck', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'speed', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'spirit', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'defense', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'endurance', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'resilience', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'constitution', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'perception', min: 1, max: 2, levelReq: 1, group: 1, frequency: 1 },
  { type: 'increased_damage', min: 1, max: 20, levelReq: 4, group: 2, frequency: 1 },
  { type: 'increased_weapon_damage', min: 5, max: 10, levelReq: 1, group: 5, frequency: 1 },
  { type: 'increased_weapon_damage', min: 5, max: 10, levelReq: 2, group: 10, frequency: 1 },
  { type: 'increased_weapon_damage', min: 5, max: 10, levelReq: 3, group: 15, frequency: 1 },
  { type: 'increased_weapon_damage', min: 5, max: 10, levelReq: 4, group: 20, frequency: 1 },

  // Tier 2 (levelReq 5-14): frequency 2
  { type: 'charisma', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'forging', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'strength', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'dexterity', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'intelligence', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'vitality', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'luck', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'speed', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'spirit', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'defense', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'endurance', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'resilience', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'constitution', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'perception', min: 3, max: 5, levelReq: 5, group: 1, frequency: 2 },
  { type: 'increased_damage', min: 21, max: 30, levelReq: 4, group: 2, frequency: 2 },
  { type: 'increased_speed', min: 1, max: 5, levelReq: 7, group: 2, frequency: 2 },
  { type: 'increased_weapon_damage', min: 11, max: 15, levelReq: 8, group: 5, frequency: 2 },
  { type: 'increased_weapon_damage', min: 11, max: 15, levelReq: 10, group: 10, frequency: 2 },
  { type: 'increased_weapon_damage', min: 11, max: 15, levelReq: 12, group: 15, frequency: 2 },
  { type: 'increased_weapon_damage', min: 11, max: 15, levelReq: 14, group: 20, frequency: 2 },

  // Tier 3 (levelReq 15-31): frequency 3
  { type: 'charisma', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'forging', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'strength', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'dexterity', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'intelligence', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'vitality', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'luck', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'speed', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'spirit', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'defense', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'endurance', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'resilience', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'constitution', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'perception', min: 6, max: 8, levelReq: 15, group: 1, frequency: 3 },
  { type: 'increased_damage', min: 31, max: 40, levelReq: 18, group: 2, frequency: 3 },
  { type: 'increased_speed', min: 6, max: 8, levelReq: 21, group: 2, frequency: 3 },

  // Tier 4 (levelReq 32-46): frequency 4
  { type: 'charisma', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'forging', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'strength', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'dexterity', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'intelligence', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'vitality', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'luck', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'speed', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'spirit', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'defense', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'endurance', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'resilience', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'constitution', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'perception', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'increased_damage', min: 41, max: 70, levelReq: 33, group: 2, frequency: 4 },
  { type: 'increased_speed', min: 9, max: 11, levelReq: 36, group: 2, frequency: 4 },

  // Tier 5 (levelReq 47-73): frequency 5
  { type: 'charisma', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'forging', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'strength', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'dexterity', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'intelligence', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'vitality', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'luck', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'speed', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'spirit', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'defense', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'endurance', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'resilience', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'constitution', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'perception', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },

  // Tier 6 (levelReq 74-109): frequency 6
  { type: 'charisma', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'forging', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'strength', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'dexterity', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'intelligence', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'vitality', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'luck', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'speed', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'spirit', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'defense', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'endurance', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'resilience', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'constitution', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'perception', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },

  // Tier 7 (levelReq 110-132): frequency 7
  { type: 'charisma', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'forging', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'strength', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'dexterity', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'intelligence', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'vitality', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'luck', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'speed', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'spirit', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'defense', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'endurance', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'resilience', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'constitution', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'perception', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },

  // Tier 8 (levelReq 133+): frequency 8
  { type: 'charisma', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'forging', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'strength', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'dexterity', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'intelligence', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'vitality', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'luck', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'speed', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'spirit', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'defense', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'endurance', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'resilience', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'constitution', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'perception', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 }
];

// SUFFIX pool - can roll as suffixes on magical items
const SUFFIX_POOL = [
  // Tier 1 (levelReq 1-4): frequency 1
  { type: 'charisma', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'forging', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'strength', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'dexterity', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'intelligence', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'vitality', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'luck', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'speed', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'spirit', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'defense', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'endurance', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'resilience', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'constitution', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'perception', min: 1, max: 2, levelReq: 1, group: 100, frequency: 1 },
  { type: 'increased_weapon_damage', min: 5, max: 10, levelReq: 1, group: 105, frequency: 1 },
  { type: 'increased_weapon_damage', min: 5, max: 10, levelReq: 2, group: 110, frequency: 1 },
  { type: 'increased_weapon_damage', min: 5, max: 10, levelReq: 3, group: 115, frequency: 1 },
  { type: 'increased_weapon_damage', min: 5, max: 10, levelReq: 4, group: 120, frequency: 1 },

  // Tier 2 (levelReq 5-14): frequency 2
  { type: 'charisma', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'forging', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'strength', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'dexterity', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'intelligence', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'vitality', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'luck', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'speed', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'spirit', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'defense', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'endurance', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'resilience', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'constitution', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'perception', min: 3, max: 5, levelReq: 5, group: 100, frequency: 2 },
  { type: 'increased_weapon_damage', min: 11, max: 15, levelReq: 8, group: 105, frequency: 2 },
  { type: 'increased_weapon_damage', min: 11, max: 15, levelReq: 10, group: 110, frequency: 2 },
  { type: 'increased_weapon_damage', min: 11, max: 15, levelReq: 12, group: 115, frequency: 2 },
  { type: 'increased_weapon_damage', min: 11, max: 15, levelReq: 14, group: 120, frequency: 2 },

  // Tier 3 (levelReq 15-31): frequency 3
  { type: 'charisma', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'forging', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'strength', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'dexterity', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'intelligence', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'vitality', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'luck', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'speed', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'spirit', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'defense', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'endurance', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'resilience', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'constitution', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },
  { type: 'perception', min: 6, max: 8, levelReq: 15, group: 100, frequency: 3 },

  // Tier 4 (levelReq 32-46): frequency 4
  { type: 'charisma', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'forging', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'strength', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'dexterity', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'intelligence', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'vitality', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'luck', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'speed', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'spirit', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'defense', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'endurance', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'resilience', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'constitution', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },
  { type: 'perception', min: 9, max: 12, levelReq: 32, group: 1, frequency: 4 },

  // Tier 5 (levelReq 47-73): frequency 5
  { type: 'charisma', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'forging', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'strength', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'dexterity', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'intelligence', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'vitality', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'luck', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'speed', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'spirit', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'defense', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'endurance', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'resilience', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'constitution', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },
  { type: 'perception', min: 13, max: 16, levelReq: 47, group: 1, frequency: 5 },

  // Tier 6 (levelReq 74-109): frequency 6
  { type: 'charisma', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'forging', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'strength', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'dexterity', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'intelligence', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'vitality', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'luck', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'speed', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'spirit', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'defense', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'endurance', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'resilience', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'constitution', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },
  { type: 'perception', min: 17, max: 20, levelReq: 74, group: 1, frequency: 6 },

  // Tier 7 (levelReq 110-132): frequency 7
  { type: 'charisma', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'forging', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'strength', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'dexterity', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'intelligence', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'vitality', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'luck', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'speed', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'spirit', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'defense', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'endurance', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'resilience', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'constitution', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },
  { type: 'perception', min: 21, max: 25, levelReq: 110, group: 1, frequency: 7 },

  // Tier 8 (levelReq 133+): frequency 8
  { type: 'charisma', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'forging', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'strength', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'dexterity', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'intelligence', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'vitality', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'luck', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'speed', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'spirit', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'defense', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'endurance', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'resilience', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'constitution', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 },
  { type: 'perception', min: 26, max: 30, levelReq: 133, group: 1, frequency: 8 }
];

const ITEM_TYPES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  HELM: 'helm',
  SHIELD: 'shield'
};

const BASE_ITEMS = {
  // Weapons
  blunt_sword: {
    id: 'blunt_sword',
    name: 'Blunt Sword',
    type: ITEM_TYPES.WEAPON,
    damage: 5,
    speed: 1.0,
    image: 'items/blunt_sword2.png'
  },
  small_dagger: {
    id: 'small_dagger',
    name: 'Small Dagger',
    type: ITEM_TYPES.WEAPON,
    damage: 3,
    speed: 1.5,
    image: 'items/blunt_sword2.png'
  },
  scepter: {
    id: 'scepter',
    name: 'Scepter',
    type: ITEM_TYPES.WEAPON,
    damage: 4,
    speed: 0.8,
    image: 'items/blunt_sword2.png'
  },
  short_bow: {
    id: 'short_bow',
    name: 'Short Bow',
    type: ITEM_TYPES.WEAPON,
    damage: 5,
    speed: 1.2,
    image: 'items/blunt_sword2.png'
  },

  // Armor
  rags: {
    id: 'rags',
    name: 'Rags',
    type: ITEM_TYPES.ARMOR,
    defense: 1,
    image: 'items/rags2.png'
  },
  // Helm
  crude_helm: {
    id: 'crude_helm',
    name: 'Crude Helm',
    type: ITEM_TYPES.HELM,
    defense: 1,
    image: 'items/crude_helm.png'
  },
  // Shield
  wooden_shield: {
    id: 'wooden_shield',
    name: 'Wooden Shield',
    type: ITEM_TYPES.SHIELD,
    defense: 2,
    blockChance: 0.1,
    image: 'items/blunt_sword2.png'
  },
  large_shield: {
    id: 'large_shield',
    name: 'Large Shield',
    type: ITEM_TYPES.SHIELD,
    defense: 4,
    blockChance: 0.2,
    image: 'items/blunt_sword2.png'
  }
};

const STARTER_GEAR = {
  Guardian: {
    weapon: 'blunt_sword',
    armor: 'rags',
    helm: null,
    shield: null
  },
  Rogue: {
    weapon: 'small_dagger',
    armor: null,
    helm: null,
    shield: 'wooden_shield'
  },
  Jinn: {
    weapon: 'small_dagger',
    armor: null,
    helm: null,
    shield: 'wooden_shield'
  },
  Cultist: {
    weapon: 'scepter',
    armor: 'rags',
    helm: null,
    shield: 'wooden_shield'
  },
  Demonologist: {
    weapon: 'scepter',
    armor: 'rags',
    helm: null,
    shield: null
  }
};

function determineItemTier() {
  const roll = Math.random();

  if (roll < ITEM_TIERS.LEGENDARY.dropChance) return 'LEGENDARY';
  if (roll < ITEM_TIERS.UNIQUE.dropChance) return 'UNIQUE';
  if (roll < ITEM_TIERS.COMPOUND.dropChance) return 'COMPOUND';
  if (roll < ITEM_TIERS.RARE.dropChance) return 'RARE';
  if (roll < ITEM_TIERS.MAGICAL.dropChance) return 'MAGICAL';
  return 'NORMAL';
}

// Helper function to get random value between min and max (inclusive)
function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a prefix for an item based on monster level
function generatePrefix(monsterLevel, forceGenerate = false) {
  // 50% chance to get a prefix (unless forced for rare items)
  if (!forceGenerate && Math.random() < 0.5) return null;

  // Filter pool to only include prefixes the monster level qualifies for
  const availablePrefixes = PREFIX_POOL.filter(prefix => prefix.levelReq <= monsterLevel);

  if (availablePrefixes.length === 0) return null;

  // Step 1: Get unique groups from available prefixes
  const availableGroups = [...new Set(availablePrefixes.map(p => p.group))];

  // Step 2: Randomly select a group (equal chance for each group)
  const selectedGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];

  // Step 3: Filter to only affixes in the selected group
  const groupPrefixes = availablePrefixes.filter(p => p.group === selectedGroup);

  // Step 4: Weighted random selection within the group
  const totalFrequency = groupPrefixes.reduce((sum, prefix) => sum + prefix.frequency, 0);
  let random = Math.random() * totalFrequency;
  let selectedPrefix = null;

  for (const prefix of groupPrefixes) {
    random -= prefix.frequency;
    if (random <= 0) {
      selectedPrefix = prefix;
      break;
    }
  }

  if (!selectedPrefix) return null;

  // Roll a random value within the prefix's range
  return {
    type: selectedPrefix.type,
    value: randomRange(selectedPrefix.min, selectedPrefix.max),
    levelReq: selectedPrefix.levelReq,
    group: selectedPrefix.group
  };
}

// Generate a suffix for an item based on monster level
function generateSuffix(monsterLevel, forceGenerate = false) {
  // 50% chance to get a suffix (unless forced for rare items)
  if (!forceGenerate && Math.random() < 0.5) return null;

  // Filter pool to only include suffixes the monster level qualifies for
  const availableSuffixes = SUFFIX_POOL.filter(suffix => suffix.levelReq <= monsterLevel);

  if (availableSuffixes.length === 0) return null;

  // Step 1: Get unique groups from available suffixes
  const availableGroups = [...new Set(availableSuffixes.map(s => s.group))];

  // Step 2: Randomly select a group (equal chance for each group)
  const selectedGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];

  // Step 3: Filter to only affixes in the selected group
  const groupSuffixes = availableSuffixes.filter(s => s.group === selectedGroup);

  // Step 4: Weighted random selection within the group
  const totalFrequency = groupSuffixes.reduce((sum, suffix) => sum + suffix.frequency, 0);
  let random = Math.random() * totalFrequency;
  let selectedSuffix = null;

  for (const suffix of groupSuffixes) {
    random -= suffix.frequency;
    if (random <= 0) {
      selectedSuffix = suffix;
      break;
    }
  }

  if (!selectedSuffix) return null;

  // Roll a random value within the suffix's range
  return {
    type: selectedSuffix.type,
    value: randomRange(selectedSuffix.min, selectedSuffix.max),
    levelReq: selectedSuffix.levelReq,
    group: selectedSuffix.group
  };
}

function createItem(baseItemId, tier = 'NORMAL', monsterLevel = 1) {
  const baseItem = BASE_ITEMS[baseItemId];
  if (!baseItem) return null;

  const item = {
    ...baseItem,
    tier: tier,
    tierData: ITEM_TIERS[tier],
    uniqueId: `${baseItemId}_${Date.now()}_${Math.random()}`
  };

  // Apply tier bonuses
  if (tier !== 'NORMAL') {
    const multiplier = {
      MAGICAL: 1.2,
      RARE: 1.5,
      COMPOUND: 2.0,
      UNIQUE: 3.0,
      LEGENDARY: 5.0
    }[tier];

    if (item.damage) item.damage = Math.floor(item.damage * multiplier);
    if (item.defense) item.defense = Math.floor(item.defense * multiplier);
  }

  // Generate prefixes/suffixes for magical items
  if (tier === 'MAGICAL') {
    const prefix = generatePrefix(monsterLevel);
    const suffix = generateSuffix(monsterLevel);

    // Ensure at least one prefix or suffix exists
    if (!prefix && !suffix) {
      // Force one affix using group-based weighted selection
      const availablePrefixes = PREFIX_POOL.filter(p => p.levelReq <= monsterLevel);
      if (availablePrefixes.length > 0) {
        // Step 1: Get unique groups
        const availableGroups = [...new Set(availablePrefixes.map(p => p.group))];

        // Step 2: Randomly select a group
        const selectedGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];

        // Step 3: Filter to group
        const groupPrefixes = availablePrefixes.filter(p => p.group === selectedGroup);

        // Step 4: Weighted selection within group
        const totalFrequency = groupPrefixes.reduce((sum, p) => sum + p.frequency, 0);
        let random = Math.random() * totalFrequency;
        let selectedPrefix = null;

        for (const prefix of groupPrefixes) {
          random -= prefix.frequency;
          if (random <= 0) {
            selectedPrefix = prefix;
            break;
          }
        }

        if (selectedPrefix) {
          item.prefixes = [{
            type: selectedPrefix.type,
            value: randomRange(selectedPrefix.min, selectedPrefix.max),
            levelReq: selectedPrefix.levelReq,
            group: selectedPrefix.group
          }];
        }
      }
    } else {
      // Store as arrays for consistency with rare items
      if (prefix) item.prefixes = [prefix];
      if (suffix) item.suffixes = [suffix];
    }
  }

  // Generate multiple affixes for rare items (3-6 total, max 3 prefixes, max 3 suffixes)
  if (tier === 'RARE') {
    const totalAffixes = randomRange(3, 6);

    // Randomly split between prefixes and suffixes (but max 3 each)
    let numPrefixes = Math.floor(Math.random() * Math.min(4, totalAffixes + 1)); // 0-3
    let numSuffixes = totalAffixes - numPrefixes;

    // Ensure we don't exceed max of 3 for either
    if (numSuffixes > 3) {
      numSuffixes = 3;
      numPrefixes = totalAffixes - numSuffixes;
    }

    const prefixes = [];
    const suffixes = [];
    const usedPrefixGroups = new Set();
    const usedSuffixGroups = new Set();

    // Generate prefixes (avoid duplicate groups) - keep trying until we get enough
    let prefixAttempts = 0;
    while (prefixes.length < numPrefixes && prefixAttempts < 50) {
      const prefix = generatePrefix(monsterLevel, true); // Force generation for rare items
      if (prefix && !usedPrefixGroups.has(prefix.group)) {
        prefixes.push(prefix);
        usedPrefixGroups.add(prefix.group);
      }
      prefixAttempts++;
    }

    // Generate suffixes (avoid duplicate groups) - keep trying until we get enough
    let suffixAttempts = 0;
    while (suffixes.length < numSuffixes && suffixAttempts < 50) {
      const suffix = generateSuffix(monsterLevel, true); // Force generation for rare items
      if (suffix && !usedSuffixGroups.has(suffix.group)) {
        suffixes.push(suffix);
        usedSuffixGroups.add(suffix.group);
      }
      suffixAttempts++;
    }

    if (prefixes.length > 0) item.prefixes = prefixes;
    if (suffixes.length > 0) item.suffixes = suffixes;
  }

  return item;
}

// Location-specific loot pools - each location has its own exclusive drops
const LOCATION_LOOT = {
  'wilderness': ['rags', 'wooden_shield', 'scepter', 'small_dagger', 'blunt_sword'],
  'outer_plains': ['crude_helm', 'rags', 'blunt_sword'],
  'deep_forest': ['wooden_shield', 'scepter', 'crude_helm'],
  'mountain_range': ['large_shield', 'short_bow']
};

function generateEnemyDrop(location = 'wilderness', monsterLevel = 1) {
  const dropType = Math.random();

  // 33% chance for gold
  if (dropType < 0.33) {
    const goldAmount = Math.floor(Math.random() * 6) + 6; // 6-11 gold
    return {
      type: 'gold',
      amount: goldAmount
    };
  }

  // Get available items for this specific location
  const availableItems = LOCATION_LOOT[location] || LOCATION_LOOT['wilderness'];

  if (availableItems.length === 0) {
    // If no items defined for location, return gold instead
    return {
      type: 'gold',
      amount: Math.floor(Math.random() * 6) + 6
    };
  }

  // 33% chance for normal item
  if (dropType < 0.66) {
    const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    return {
      type: 'item',
      item: createItem(randomItem, 'NORMAL', monsterLevel)
    };
  }

  // 33% chance for tiered item
  const tier = determineItemTier();
  const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
  return {
    type: 'item',
    item: createItem(randomItem, tier, monsterLevel)
  };
}

function getStarterGear(className) {
  const gear = STARTER_GEAR[className];
  if (!gear) return {};

  return {
    weapon: gear.weapon ? createItem(gear.weapon, 'NORMAL') : null,
    armor: gear.armor ? createItem(gear.armor, 'NORMAL') : null,
    helm: gear.helm ? createItem(gear.helm, 'NORMAL') : null,
    shield: gear.shield ? createItem(gear.shield, 'NORMAL') : null
  };
}

// Export for server-side use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStarterGear };
}