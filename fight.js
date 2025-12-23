class Fight {
  constructor(game) {
    this.game = game;
    this.inFight = false;
    this.currentEnemy = null;
  }

  startFight(enemyX, enemyY) {
    const enemyIndex = this.game.enemies.findIndex(e => e.x === enemyX && e.y === enemyY);
    if (enemyIndex === -1) return;

    const enemy = this.game.enemies[enemyIndex];

    this.currentEnemy = enemy.monsterData || getRandomMonster(enemy.mapType || this.game.currentMapType);

    // Store enemy's location/mapType for loot generation
    this.currentEnemyMapType = enemy.mapType || this.game.currentMapType || 'wilderness';

    // Store enemy position for later
    this.currentEnemyPos = { x: enemyX, y: enemyY };

    // Remove enemy from map
    this.game.enemies.splice(enemyIndex, 1);
    this.game.render();

    this.inFight = true;
    this.resolveFight();
  }

  calculatePlayerPower() {
    const stats = this.game.character.stats;
    const inventory = this.game.inventory;

    // Base stats
    let damage = stats.strength || 0;
    let defense = stats.defense || 0;
    let blockChance = 0;

    // Calculate increased_weapon_damage percentage from all equipped items
    let weaponDamageBonus = 0;
    if (inventory.equipped) {
      ['weapon', 'armor', 'helm', 'shield'].forEach(slot => {
        const equippedItem = inventory.equipped[slot];
        if (equippedItem) {
          // Handle both old format (prefix/suffix) and new format (prefixes/suffixes arrays)
          const prefixes = equippedItem.prefixes || (equippedItem.prefix ? [equippedItem.prefix] : []);
          const suffixes = equippedItem.suffixes || (equippedItem.suffix ? [equippedItem.suffix] : []);

          prefixes.forEach(prefix => {
            if (prefix.type === 'increased_weapon_damage') {
              weaponDamageBonus += prefix.value;
            }
          });

          suffixes.forEach(suffix => {
            if (suffix.type === 'increased_weapon_damage') {
              weaponDamageBonus += suffix.value;
            }
          });
        }
      });
    }

    // Add weapon damage with percentage modifier
    if (inventory.equipped.weapon) {
      const baseDamage = inventory.equipped.weapon.damage || 0;
      const modifiedDamage = weaponDamageBonus > 0
        ? baseDamage * (1 + weaponDamageBonus / 100)
        : baseDamage;
      damage += modifiedDamage;
    }

    // Add armor defense
    if (inventory.equipped.armor) {
      defense += inventory.equipped.armor.defense || 0;
    }

    if (inventory.equipped.shield) {
      defense += inventory.equipped.shield.defense || 0;
      blockChance += (inventory.equipped.shield.blockChance || 0) * 100; // Convert to percentage
    }

    // Add helm defense
    if (inventory.equipped.helm) {
      defense += inventory.equipped.helm.defense || 0;
    }

    // Calculate power: (defense * damage) / 2
    const blockMultiplier = blockChance > 0 ? 1 / (1 - blockChance / 100) : 1;
    const power = (defense * damage) * blockMultiplier;

    return power;
  }

  calculateEnemyPower() {
    if (!this.currentEnemy) return 0;

    const damage = this.currentEnemy.damage;
    const defense = this.currentEnemy.defense;
    const blockChance = this.currentEnemy.block || 0;

    // Same formula
    const blockMultiplier = blockChance > 0 ? 1 / (1 - blockChance / 100) : 1;
    const power = (defense * damage) * blockMultiplier;

    return power;
  }

  resolveFight() {
    const playerPower = this.calculatePlayerPower();
    const enemyPower = this.calculateEnemyPower();

    const totalPower = playerPower + enemyPower;
    const winChance = totalPower > 0 ? playerPower / totalPower : 0.5;


    const roll = Math.random();

    if (roll < winChance) {
      // Player wins
      this.playerWins();
    } else {
      // Player loses
      this.playerLoses();
    }

    this.inFight = false;
    this.currentEnemy = null;
  }

  playerWins() {
    const enemy = this.currentEnemy;
    this.game.setMessage(`Victory! You defeated ${enemy.name}!`);

    // Award experience - provide default if missing
    let experienceAmount = enemy.experience;

    // If experience is missing or 0, assign default based on monster type
    if (!experienceAmount) {
      if (enemy.name === 'Rotten') {
        experienceAmount = 11;
      } else if (enemy.name === 'Fluffy Slime') {
        experienceAmount = 14;
      } else {
        experienceAmount = 10; // Default fallback
      }
    }

    // Broadcast monster kill with monster data for party exp sharing
    if (this.game.socket && this.game.gameId && this.currentEnemyPos) {
      this.game.socket.emit('map_event', {
        gameId: this.game.gameId,
        type: 'enemy_killed',
        x: this.currentEnemyPos.x,
        y: this.currentEnemyPos.y,
        location: this.game.currentLocation || 'wilderness',
        monsterData: {
          name: enemy.name,
          level: enemy.level || 1,
          experience: experienceAmount
        }
      });
    }

    // Generate loot based on enemy's location (not player's current location)
    const enemyLocation = this.currentEnemyMapType || 'wilderness';
    const enemyLevel = enemy.level || 1;
    const enemyDrops = enemy.drops || { goldMin: 6, goldMax: 11 }; // Default fallback
    const drop = generateEnemyDrop(enemyLocation, enemyLevel, enemyDrops);

    // Apply drops immediately, not in setTimeout
    if (drop.type === 'gold') {
      this.game.inventory.addGold(drop.amount);
    } else if (drop.type === 'item') {
      // Check loot filter before picking up
      const itemTier = drop.item.tier || 'NORMAL';
      if (this.game.inventory.lootFilter[itemTier]) {
        this.game.inventory.addItem(drop.item);
      } else {
        this.game.setMessage(`${drop.item.name} (${itemTier}) not picked up (filtered)`);
      }
    }
  }

  playerLoses() {
    const enemy = this.currentEnemy;
    this.game.setMessage(`Defeat! ${enemy.name} has bested you in combat!`);

    // Track death
    if (this.game.socket && this.game.socket.connected) {
      this.game.socket.emit('player_death', {});
    }

    // Later: handle player death, respawn, etc.
    // For now, just display message
  }

  getFightInfo() {
    if (!this.inFight || !this.currentEnemy) return null;

    const playerPower = this.calculatePlayerPower();
    const enemyPower = this.calculateEnemyPower();
    const totalPower = playerPower + enemyPower;
    const winChance = totalPower > 0 ? (playerPower / totalPower * 100).toFixed(1) : 50;

    return {
      playerPower,
      enemyPower,
      winChance,
      enemy: this.currentEnemy
    };
  }
}