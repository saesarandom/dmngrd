class Movement {
  constructor(game) {
    this.game = game;
    this.moveDelay = 10;
    this.lastMoveTime = 0;
    this.keysPressed = {};

    this.setupEventListeners();
  }
  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      this.keysPressed[e.key.toLowerCase()] = true;

      // Handle E key for interactions
      if (e.key.toLowerCase() === 'e') {
        this.handleInteraction();
        return;
      }

      this.handleMovement(e);
    });

    document.addEventListener('keyup', (e) => {
      this.keysPressed[e.key.toLowerCase()] = false;
    });
  }


  handleInteraction() {
    if (this.game.inTown && this.game.currentTown) {
      this.game.currentTown.checkNPCInteraction(this.game.player.x, this.game.player.y);
    } else {
      // Check for shrine
      this.game.checkShrine(this.game.player.x, this.game.player.y);
    }
  }
  handleMovement(e) {
    const key = e.key.toLowerCase();
    const now = Date.now();

    // Check if enough time has passed since last move
    if (now - this.lastMoveTime < this.moveDelay) {
      return;
    }

    let newX = this.game.player.x;
    let newY = this.game.player.y;

    // WASD movement
    if (key === 'w') {
      newY -= 1;
    } else if (key === 's') {
      newY += 1;
    } else if (key === 'a') {
      newX -= 1;
    } else if (key === 'd') {
      newX += 1;
    } else {
      return; // Not a movement key
    }

    // Check if new position is valid
    if (this.isValidMove(newX, newY)) {
      this.game.player.x = newX;
      this.game.player.y = newY;
      this.lastMoveTime = now;

      // Check for trap
      this.game.checkTrap(newX, newY);

      // Check for enemy collision
      this.checkEnemyCollision(newX, newY);

      this.game.render();
    }
  }

  isValidMove(x, y) {
    // Check grid boundaries
    if (x < 0 || x >= this.game.gridSize || y < 0 || y >= this.game.gridSize) {
      return false;
    }
    return true;
  }

  checkEnemyCollision(x, y) {
    if (this.game.inTown && this.game.currentTown) {
      this.game.currentTown.checkExit(x, y);
    } else {
      // Check for exit portal first
      const exit = this.game.exits.find(e => e.x === x && e.y === y);
      if (exit) {
        this.transitionToNextMap(exit.nextMap);
        return;
      }

      const enemy = this.game.enemies.find(e => e.x === x && e.y === y);
      if (enemy) {
        // Start fight instead of just showing message
        if (this.game.fight) {
          this.game.fight.startFight(x, y);
        } else {
          this.game.setMessage('You encountered an enemy!');
        }
      }
    }
  }

  transitionToNextMap(nextMap) {
    this.game.gridSize = nextMap.gridSize;
    this.game.currentMapType = nextMap.mapType;
    this.game.setupCanvas();

    const mapData = initializeGameWithSeed(this.game.mapSeed, nextMap.gridSize, nextMap.mapType);
    this.game.enemies = mapData.enemies;
    this.game.traps = mapData.traps;
    this.game.shrines = mapData.shrines;
    this.game.exits = mapData.exits || [];
    this.game.player = mapData.playerSpawn;

    this.game.player = {
      x: Math.floor(Math.random() * this.game.gridSize),
      y: Math.floor(Math.random() * this.game.gridSize)
    };

    this.game.render();
    this.game.setMessage(`You entered the ${nextMap.displayName}!`);

    // Broadcast location change
    if (this.game.socket && this.game.socket.connected) {
      const gameInfo = JSON.parse(localStorage.getItem('currentGame'));
      this.game.socket.emit('update_location', {
        gameId: gameInfo.id,
        playerName: this.game.character.name,
        location: nextMap.mapType
      });
    }
  }
}