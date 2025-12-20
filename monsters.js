// Monster prototype base class
class Monster {
  constructor(baseStats) {
    Object.assign(this, baseStats);
    this.applyVariance();
    this.currentHp = this.hp;
    this.uniqueId = `${this.id}_${Date.now()}_${Math.random()}`;
  }

  applyVariance(variance = 0.1) {
    // Apply variance to numeric stats
    this.damage = this.applyStatVariance(this.damage, variance);
    this.defense = this.applyStatVariance(this.defense, variance);
    this.hp = this.applyStatVariance(this.hp, variance);

    // Apply variance to resistances
    Object.keys(this.resistances).forEach(key => {
      this.resistances[key] = this.applyResistanceVariance(this.resistances[key], variance);
    });
  }

  applyStatVariance(value, variance) {
    if (value === 0) return 0;
    const min = value * (1 - variance);
    const max = value * (1 + variance);
    return Math.floor(min + Math.random() * (max - min));
  }

  applyResistanceVariance(resistance, variance) {
    if (resistance === 0) return 0;
    const min = resistance * (1 - variance);
    const max = resistance * (1 + variance);
    const randomValue = min + Math.random() * (max - min);
    return Math.round(randomValue * 100) / 100;
  }
}

// Monster prototypes
const RottenPrototype = {
  id: 'rotten',
  name: 'Rotten',
  damage: 1,
  defense: 2,
  block: 5,
  hp: 10,
  color: '#ff4a4a',
  experience: 11,
  resistances: {
    physical: 0,
    fire: 0,
    cold: 0,
    lightning: 0,
    poison: 0.05,
    magic: 0,
    curse: 0,
    dot: 0,
  },
  drops: {
    goldMin: 6,
    goldMax: 11
  }
};

const FluffySlimePrototype = {
  id: 'fluffy_slime',
  name: 'Fluffy Slime',
  damage: 2,
  defense: 2,
  block: 0,
  hp: 14,
  color: '#4aff4a',
  experience: 14,
  resistances: {
    physical: 0,
    fire: 0,
    cold: 0,
    lightning: 0,
    poison: 0,
    magic: 0,
    curse: 0,
    dot: 0,
  },
  drops: {
    goldMin: 5,
    goldMax: 10
  }
};

const ArmedVillagerPrototype = {
  id: 'armed_villager',
  name: 'Armed Villager',
  damage: 3,
  defense: 3,
  block: 10,
  hp: 20,
  color: '#ff8c00',
  experience: 24,
  resistances: {
    physical: 0.05,
    fire: 0,
    cold: 0,
    lightning: 0,
    poison: 0,
    magic: 0,
    curse: 0,
    dot: 0,
  },
  drops: {
    goldMin: 12,
    goldMax: 18
  }
};

function createMonster(prototype) {
  return new Monster(JSON.parse(JSON.stringify(prototype)));
}

function getRandomMonster(mapType = 'wilderness') {
  let monsters;

  if (mapType === 'outer_plains') {
    monsters = [ArmedVillagerPrototype];
  } else {
    // wilderness or default
    monsters = [RottenPrototype, FluffySlimePrototype];
  }

  const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
  return createMonster(randomMonster);
}