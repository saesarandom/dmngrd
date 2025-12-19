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
  
  this.currentEnemy = enemy.monsterData || getRandomMonster();
  
  // Remove enemy from map
  this.game.enemies.splice(enemyIndex, 1);
  this.game.render();
  
  // Broadcast to other players
  if (this.game.lobby && this.game.lobby.socket && this.game.lobby.gameName) {
    this.game.lobby.socket.emit('map_event', {
      gameName: this.game.lobby.gameName,
      type: 'enemy_killed',
      x: enemyX,
      y: enemyY
    });
  }
  
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
    
    // Add weapon damage
    if (inventory.equipped.weapon) {
      damage += inventory.equipped.weapon.damage || 0;
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
    
  console.log('Player Power:', playerPower);
  console.log('Enemy Power:', enemyPower);
  console.log('Win Chance:', (winChance * 100).toFixed(1) + '%');


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
    
    // Generate loot
    const drop = generateEnemyDrop();
    
    setTimeout(() => {
      if (drop.type === 'gold') {
        this.game.inventory.addGold(drop.amount);
      } else if (drop.type === 'item') {
        this.game.inventory.addItem(drop.item);
      }
    }, 1000);
  }

  playerLoses() {
    const enemy = this.currentEnemy;
    this.game.setMessage(`Defeat! ${enemy.name} has bested you in combat!`);
    
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