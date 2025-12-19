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
    
    this.game.player = { ...this.playerSpawn };
    
    this.game.inTown = true;
    this.game.currentTown = this;
    this.game.render();
    this.game.setMessage(`Welcome to ${this.name}! Press E near NPCs to interact.`);
  }

  exit() {
    this.game.gridSize = 30;
    this.game.setupCanvas();
    this.game.inTown = false;
    this.game.lastTown = this.name;
    this.game.currentTown = null;
    this.game.generateMap();
    this.game.render();
    this.game.setMessage(`You left the ${this.name} and entered the wilderness.`);
  }

  drawTown(ctx, cellSize) {
    // Draw buildings
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

    // Draw NPCs
    this.npcs.forEach(npc => {
      const px = npc.x * cellSize;
      const py = npc.y * cellSize;
      ctx.fillStyle = '#4a9eff';
      ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
    });

    // Draw exits
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

// Town definitions
const createSkargnes = (game) => {
  const town = new Town(game, 'Skargnes', 14, 17);
  
  town.playerSpawn = { x: 6, y: 1 };
  
  town.buildings = [
    { x: 2, y: 2, width: 3, height: 3 },
    { x: 9, y: 9, width: 3, height: 3 }
  ];
  
  town.npcs = [
    { x: 3, y: 3, name: 'Merchant' },
    { x: 10, y: 10, name: 'Blacksmith' }
  ];
  
  const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
let exitX, exitY;

if (edge === 0) { // top
  exitX = Math.floor(Math.random() * town.width);
  exitY = 0;
} else if (edge === 1) { // right
  exitX = town.width - 1;
  exitY = Math.floor(Math.random() * town.height);
} else if (edge === 2) { // bottom
  exitX = Math.floor(Math.random() * town.width);
  exitY = town.height - 1;
} else { // left
  exitX = 0;
  exitY = Math.floor(Math.random() * town.height);
}

town.exits = [
  { x: exitX, y: exitY, direction: 'exit' }
];
  return town;
};

//lullin nové město
