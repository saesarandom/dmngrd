class Simulator {
  constructor(game, movement) {
    console.log('Simulator constructor called');
    this.game = game;
    this.movement = movement;
    this.isSimulating = false;
    this.simulationInterval = null;
    this.strategy = 'hunt'; // 'hunt', 'explore', 'avoid'
    this.autoRejoin = false;
    this.skipMode = false;
    this.targetZone = null;

    this.setupEventListeners();
    this.checkAutoStart();
    this.setupChatCommandListener();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        this.toggleSimulation();
      }
      // Ctrl+Shift+B to toggle auto-rejoin
      if (e.ctrlKey && e.shiftKey && e.key === 'B') {
        e.preventDefault();
        this.toggleAutoRejoin();
      }
    });
  }

  checkAutoStart() {
    console.log('=== checkAutoStart called ===');
    // Check if bot should auto-start after page refresh
    const botState = localStorage.getItem('botState');
    console.log('botState from localStorage:', botState);
    if (botState) {
      const state = JSON.parse(botState);

      // Restore autoRejoin state FIRST
      if (state.autoRejoin) {
        this.autoRejoin = true;
      }

      // Restore skip mode if it was active
      if (state.skipMode && state.targetZone) {
        this.skipMode = true;
        this.targetZone = state.targetZone;
      }

      if (state.isSimulating) {
        // Small delay to ensure game is fully loaded
        setTimeout(() => {
          this.start();
          if (this.autoRejoin) {
            this.game.setMessage('Bot auto-started with auto-rejoin enabled');
          } else {
            this.game.setMessage('Bot auto-started');
          }

          // Show skip mode status if active
          if (this.skipMode && this.targetZone) {
            this.game.setMessage(`Skip mode active - rushing to ${this.targetZone}`);
          }
        }, 1000);
      }
    }
  }

  toggleAutoRejoin() {
    this.autoRejoin = !this.autoRejoin;

    if (this.autoRejoin) {
      this.game.setMessage('Auto-rejoin enabled - Bot will restart on death');
      // Save state
      this.saveBotState();
    } else {
      this.game.setMessage('Auto-rejoin disabled');
      // Clear auto-rejoin from saved state
      localStorage.removeItem('botAutoJoin');
      this.saveBotState();
    }
  }

  saveBotState() {
    const state = {
      isSimulating: this.isSimulating,
      autoRejoin: this.autoRejoin,
      skipMode: this.skipMode,
      targetZone: this.targetZone
    };
    localStorage.setItem('botState', JSON.stringify(state));
  }

  setupChatCommandListener() {
    // Listen for chat input to intercept commands
    const attachListener = () => {
      const messageInput = document.getElementById('messageInput');
      if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const message = messageInput.value.trim();
            console.log('Chat message detected:', message);

            // Check if it's a bot command
            if (message.startsWith('/skip ')) {
              e.preventDefault();
              console.log('Skip command detected!');
              const zoneName = message.substring(6).trim();
              this.setSkipMode(zoneName);
              messageInput.value = '';
            } else if (message === '/skip off' || message === '/skip cancel') {
              e.preventDefault();
              console.log('Skip cancel command detected!');
              this.cancelSkipMode();
              messageInput.value = '';
            }
          }
        });
        console.log('Chat command listener attached successfully');
      } else {
        // Retry after delay if element not found
        console.log('messageInput not found, retrying...');
        setTimeout(attachListener, 500);
      }
    };

    attachListener();
  }

  setSkipMode(zoneName) {
    // Normalize zone name
    const zoneMap = {
      'wilderness': 'Wilderness',
      'outer plains': 'Outer Plains',
      'deep forest': 'Deep Forest',
      'mountain range': 'Mountain Range',
      'caverns': 'Caverns',
      'inner prison': 'Inner Prison',
      "archbishop's cellar": "Archbishop's Cellar"
    };

    const normalizedZone = zoneMap[zoneName.toLowerCase()];

    if (!normalizedZone) {
      this.game.setMessage(`Unknown zone: ${zoneName}. Available: Wilderness, Outer Plains, Deep Forest, Mountain Range, Caverns, Inner Prison, Archbishop's Cellar`);
      return;
    }

    this.skipMode = true;
    this.targetZone = normalizedZone;
    this.saveBotState(); // Save to persist across restarts
    console.log('Skip mode saved to localStorage:', { skipMode: this.skipMode, targetZone: this.targetZone });
    this.game.setMessage(`Skip mode enabled - rushing to ${normalizedZone}`);
  }

  cancelSkipMode() {
    this.skipMode = false;
    this.targetZone = null;
    this.saveBotState(); // Save to persist the cancellation
    this.game.setMessage('Skip mode disabled - resuming normal hunting');
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
    this.saveBotState();

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
    this.saveBotState();
  }

  makeMove() {
    const player = this.game.player;

    // In town - interact with NPCs or exit
    if (this.game.inTown && this.game.currentTown) {
      this.handleTownBehavior();
      return;
    }

    // Check if we've reached target zone in skip mode
    if (this.skipMode && this.targetZone) {
      // Get current zone - use currentMapType (e.g., 'caverns')
      const currentMapType = this.game.currentMapType || 'wilderness';

      // Convert targetZone displayName to mapType for comparison
      const zoneToMapType = {
        'Wilderness': 'wilderness',
        'Outer Plains': 'outer_plains',
        'Deep Forest': 'deep_forest',
        'Mountain Range': 'mountain_range',
        'Caverns': 'caverns',
        'Inner Prison': 'inner_prison',
        "Archbishop's Cellar": 'archbishops_cellar'
      };

      const targetMapType = zoneToMapType[this.targetZone];

      if (currentMapType === targetMapType) {
        // Disable skip mode for this session (but keep it saved for next game)
        if (this.skipMode) {
          this.skipMode = false; // Stop skipping in THIS game session
          this.game.setMessage(`Reached ${this.targetZone} - resuming normal hunting`);
          // Don't save state here - targetZone stays in localStorage for next game
        }
      }
    }

    // In skip mode - prioritize exits, ignore enemies
    if (this.skipMode) {
      if (this.game.exits && this.game.exits.length > 0) {
        const exit = this.game.exits[0];
        this.moveTowards(exit.x, exit.y);
      } else {
        // No exit found, explore to find it
        this.exploreRandomly();
      }
      return;
    }

    // Normal hunting mode - hunt enemies
    const nearestEnemy = this.findNearestEnemy();

    if (nearestEnemy) {
      this.moveTowards(nearestEnemy.x, nearestEnemy.y);
    } else {
      // No enemies - check for exit to next level
      if (this.game.exits && this.game.exits.length > 0) {
        const exit = this.game.exits[0];
        this.moveTowards(exit.x, exit.y);
      } else {
        // No exit available and no enemies - zone is cleared
        // If auto-rejoin is enabled, leave and restart
        if (this.autoRejoin) {
          console.log('Zone cleared - no enemies or exits. Auto-rejoining...');
          localStorage.setItem('botAutoJoin', 'true');
          setTimeout(() => {
            window.location.href = '/lobby.html';
          }, 1000);
        } else {
          // Just explore randomly if auto-rejoin is disabled
          this.exploreRandomly();
        }
      }
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
    const openSet = [{ x: startX, y: startY, g: 0, h: this.getDistance(startX, startY, endX, endY) }];
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