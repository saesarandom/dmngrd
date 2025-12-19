class Simulator {
  constructor(game, movement) {
    this.game = game;
    this.movement = movement;
    this.isSimulating = false;
    this.simulationInterval = null;
    this.strategy = 'hunt'; // 'hunt', 'explore', 'avoid'
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        this.toggleSimulation();
      }
    });
  }

  toggleSimulation() {
    if (this.isSimulating) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    this.isSimulating = true;
    this.game.setMessage('Simulation started - Bot is now playing');
    
    this.simulationInterval = setInterval(() => {
      this.makeMove();
    }, this.movement.moveDelay);
  }

  stop() {
    this.isSimulating = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.game.setMessage('Simulation stopped - Manual control restored');
  }

  makeMove() {
    const player = this.game.player;
    
    // In town - interact with NPCs or exit
    if (this.game.inTown && this.game.currentTown) {
      this.handleTownBehavior();
      return;
    }

    // In wilderness - hunt enemies
    const nearestEnemy = this.findNearestEnemy();
    
    if (nearestEnemy) {
      this.moveTowards(nearestEnemy.x, nearestEnemy.y);
    } else {
      // No enemies, explore randomly
      this.exploreRandomly();
    }
  }

  handleTownBehavior() {
    const player = this.game.player;
    const town = this.game.currentTown;
    
    // Check if near NPC
    const nearbyNPC = town.npcs.find(npc => 
      Math.abs(npc.x - player.x) <= 1 && Math.abs(npc.y - player.y) <= 1
    );
    
    if (nearbyNPC) {
      // Interact with NPC
      this.simulateKeyPress('e');
      return;
    }

    // Move towards exit
    const exit = town.exits[0];
    if (player.x === exit.x && player.y === exit.y) {
      // We're at exit, leave town
      return;
    }
    
    this.moveTowards(exit.x, exit.y);
  }

  findNearestEnemy() {
    if (!this.game.enemies || this.game.enemies.length === 0) {
      return null;
    }

    const player = this.game.player;
    let nearest = null;
    let minDistance = Infinity;

    this.game.enemies.forEach(enemy => {
      const distance = this.getDistance(player.x, player.y, enemy.x, enemy.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = enemy;
      }
    });

    return nearest;
  }

  getDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  moveTowards(targetX, targetY) {
    const player = this.game.player;
    const dx = targetX - player.x;
    const dy = targetY - player.y;

    // Prioritize larger difference
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        this.simulateKeyPress('d');
      } else {
        this.simulateKeyPress('a');
      }
    } else {
      if (dy > 0) {
        this.simulateKeyPress('s');
      } else {
        this.simulateKeyPress('w');
      }
    }
  }

  exploreRandomly() {
    const directions = ['w', 'a', 's', 'd'];
    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    this.simulateKeyPress(randomDir);
  }

  simulateKeyPress(key) {
    const event = new KeyboardEvent('keydown', {
      key: key,
      code: `Key${key.toUpperCase()}`,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  // Advanced pathfinding using A* algorithm
  findPath(startX, startY, endX, endY) {
    // A* implementation for future complex pathfinding
    // This is a placeholder for more advanced AI
    const openSet = [{x: startX, y: startY, g: 0, h: this.getDistance(startX, startY, endX, endY)}];
    const closedSet = new Set();
    
    // TODO: Implement full A* pathfinding
    // For now, use simple movement towards target
    return null;
  }

  // Strategy management for future expansion
  setStrategy(strategy) {
    this.strategy = strategy;
    console.log(`Bot strategy changed to: ${strategy}`);
  }
}