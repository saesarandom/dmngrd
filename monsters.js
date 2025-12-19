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

function createMonster(prototype) {
  return new Monster(JSON.parse(JSON.stringify(prototype)));
}

function getRandomMonster() {
  return createMonster(RottenPrototype);
}