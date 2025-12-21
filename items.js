const ITEM_TIERS = {
  NORMAL: { name: 'Normal', color: '#888888', dropChance: 0 },
  MAGICAL: { name: 'Magical', color: '#4a9eff', dropChance: 1 / 2 },
  RARE: { name: 'Rare', color: '#ffff4a', dropChance: 1 / 20 },
  COMPOUND: { name: 'Compound', color: '#ff8800', dropChance: 1 / 200 },
  UNIQUE: { name: 'Unique', color: '#ff4aff', dropChance: 1 / 1000 },
  LEGENDARY: { name: 'Legendary', color: '#ff4a4a', dropChance: 1 / 10000 }
};

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

  // Armor
  rags: {
    id: 'rags',
    name: 'Rags',
    type: ITEM_TYPES.ARMOR,
    defense: 1,
    image: 'items/rags2.png'
  },
  // Helm
  helm: {
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

function createItem(baseItemId, tier = 'NORMAL') {
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

  return item;
}

// Location-specific loot pools
const LOCATION_LOOT = {
  'outer_plains': ['crude_helm'], // Items that ONLY drop in Outer Plains
  'deep_forest': [], // Add location-specific items here
  'wilderness': [] // Default location
};

function generateEnemyDrop(location = 'wilderness') {
  const dropType = Math.random();

  // 33% chance for gold
  if (dropType < 0.33) {
    const goldAmount = Math.floor(Math.random() * 6) + 6; // 6-11 gold
    return {
      type: 'gold',
      amount: goldAmount
    };
  }

  // Get available items for this location
  const locationSpecificItems = LOCATION_LOOT[location] || [];
  const generalItems = Object.keys(BASE_ITEMS).filter(
    item => !Object.values(LOCATION_LOOT).flat().includes(item)
  );
  const availableItems = [...generalItems, ...locationSpecificItems];

  // 33% chance for normal item
  if (dropType < 0.66) {
    const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    return {
      type: 'item',
      item: createItem(randomItem, 'NORMAL')
    };
  }

  // 33% chance for tiered item
  const tier = determineItemTier();
  const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
  return {
    type: 'item',
    item: createItem(randomItem, tier)
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