// Fixed game generation with proper seed isolation
function initializeGameWithSeed(seed) {
  const rng = new Math.seedrandom(seed);
  
  const enemies = [];
  const traps = [];
  const shrines = [];
  
  const gridSize = 30;
  
  // Generate enemies
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (rng() < 1/128) {
        enemies.push({ x, y });
      }
    }
  }
  
  // Find empty cells
  const emptyCells = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const isOccupied = enemies.some(e => e.x === x && e.y === y);
      if (!isOccupied) {
        emptyCells.push({ x, y });
      }
    }
  }
  
  // Generate traps
  emptyCells.forEach(cell => {
    if (rng() < 1/128) {
      traps.push({ x: cell.x, y: cell.y });
    }
  });
  
  // Generate shrines
  emptyCells.forEach(cell => {
    const hasTrap = traps.some(trap => trap.x === cell.x && trap.y === cell.y);
    if (!hasTrap && rng() < 1/512) {
      shrines.push({ x: cell.x, y: cell.y });
    }
  });
  
  // Safe spawn - first safe cell
  const safeCells = emptyCells.filter(cell => 
    !traps.some(trap => trap.x === cell.x && trap.y === cell.y) &&
    !shrines.some(shrine => shrine.x === cell.x && shrine.y === cell.y)
  );
  
  const playerSpawn = safeCells.length > 0 ? safeCells[0] : { x: 0, y: 0 };
  
  return {
    enemies,
    traps,
    shrines,
    playerSpawn
  };
}

// Initialize town with seed for consistent exits
function initializeTownWithSeed(townName, width, height, seed) {
  const rng = new Math.seedrandom(seed + '_' + townName);
  
  const buildings = [
    { x: 2, y: 2, width: 3, height: 3 },
    { x: 9, y: 9, width: 3, height: 3 }
  ];
  
  const npcs = [
    { x: 3, y: 3, name: 'Merchant' },
    { x: 10, y: 10, name: 'Blacksmith' }
  ];
  
  // Generate exit consistently
  const edge = Math.floor(rng() * 4);
  let exitX, exitY;

  if (edge === 0) {
    exitX = Math.floor(rng() * width);
    exitY = 0;
  } else if (edge === 1) {
    exitX = width - 1;
    exitY = Math.floor(rng() * height);
  } else if (edge === 2) {
    exitX = Math.floor(rng() * width);
    exitY = height - 1;
  } else {
    exitX = 0;
    exitY = Math.floor(rng() * height);
  }
  
  return {
    buildings,
    npcs,
    exits: [{ x: exitX, y: exitY, direction: 'exit' }],
    playerSpawn: { x: 6, y: 1 }
  };
}