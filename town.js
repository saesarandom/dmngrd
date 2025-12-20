class Town {
  constructor(game, name, width, height) {
    this.game = game;
    this.name = name;
    this.width = width;
    this.height = height;
    this.npcs = [];
    this.buildings = [];
    this.exits = [];
    this.playerSpawn = { x: 0, y: 0 };
  }

  enter() {
    this.game.gridSize = Math.max(this.width, this.height);
    this.game.setupCanvas();

    this.game.enemies = [];
    this.game.traps = [];
    this.game.shrines = [];

    this.game.player = { ...this.playerSpawn };

    this.game.inTown = true;
    this.game.currentTown = this;
    this.game.render();
    this.game.setMessage(`Welcome to ${this.name}! Press E near NPCs to interact.`);

    // Broadcast location change
    if (this.game.socket && this.game.socket.connected) {
      const gameInfo = JSON.parse(localStorage.getItem('currentGame'));
      this.game.socket.emit('update_location', {
        gameId: gameInfo.id,
        playerName: this.game.character.name,
        location: this.name
      });
    }
  }

  exit() {
    // Determine next map based on current progression
    const nextMap = this.getNextMap();

    this.game.gridSize = nextMap.gridSize;
    this.game.currentMapType = nextMap.mapType;
    this.game.setupCanvas();
    this.game.inTown = false;
    this.game.lastTown = this.name;
    this.game.currentTown = null;

    const mapData = initializeGameWithSeed(this.game.mapSeed, nextMap.gridSize, nextMap.mapType);
    this.game.enemies = mapData.enemies;
    this.game.traps = mapData.traps;
    this.game.shrines = mapData.shrines;
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

  getNextMap() {
    // Map progression: Skargnes -> Wilderness (30x30) -> Outer Plains (34x34)
    if (this.name === 'Skargnes') {
      return { gridSize: 30, mapType: 'wilderness', displayName: 'Wilderness' };
    }
    // Future: add more towns and maps
    return { gridSize: 30, mapType: 'wilderness', displayName: 'Wilderness' };
  }

  drawTown(ctx, cellSize) {
    this.buildings.forEach(building => {
      for (let y = building.y; y < building.y + building.height; y++) {
        for (let x = building.x; x < building.x + building.width; x++) {
          const px = x * cellSize;
          const py = y * cellSize;
          ctx.fillStyle = '#4a4a4a';
          ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
        }
      }
    });

    this.npcs.forEach(npc => {
      const px = npc.x * cellSize;
      const py = npc.y * cellSize;
      ctx.fillStyle = '#4a9eff';
      ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
    });

    this.exits.forEach(exit => {
      const px = exit.x * cellSize;
      const py = exit.y * cellSize;
      ctx.fillStyle = '#ffff4a';
      ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
    });
  }

  checkNPCInteraction(x, y) {
    const npc = this.npcs.find(n =>
      Math.abs(n.x - x) <= 1 && Math.abs(n.y - y) <= 1
    );

    if (npc) {
      this.game.setMessage(`${npc.name}: Hello, traveler!`);
      return true;
    }
    return false;
  }

  checkExit(x, y) {
    const exit = this.exits.find(e => e.x === x && e.y === y);
    if (exit) {
      this.exit();
      return true;
    }
    return false;
  }
}

const createSkargnes = (game, seed) => {
  const town = new Town(game, 'Skargnes', 14, 17);
  const townData = initializeTownWithSeed('Skargnes', town.width, town.height, seed);

  town.playerSpawn = townData.playerSpawn;
  town.buildings = townData.buildings;
  town.npcs = townData.npcs;
  town.exits = townData.exits;

  return town;
};