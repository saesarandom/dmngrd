// Fixed game generation with proper seed isolation
function initializeGameWithSeed(seed, gridSize = 30, mapType = 'wilderness') {
  const rng = new Math.seedrandom(seed + '_' + mapType);

  const enemies = [];
  const traps = [];
  const shrines = [];

  // Generate enemies
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (rng() < 1 / 128) {
        enemies.push({ x, y, mapType });
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
    if (rng() < 1 / 128) {
      traps.push({ x: cell.x, y: cell.y });
    }
  });

  // Generate shrines
  emptyCells.forEach(cell => {
    const hasTrap = traps.some(trap => trap.x === cell.x && trap.y === cell.y);
    if (!hasTrap && rng() < 1 / 512) {
      shrines.push({ x: cell.x, y: cell.y });
    }
  });

  // Safe spawn - first safe cell
  const safeCells = emptyCells.filter(cell =>
    !traps.some(trap => trap.x === cell.x && trap.y === cell.y) &&
    !shrines.some(shrine => shrine.x === cell.x && shrine.y === cell.y)
  );

  const playerSpawn = safeCells.length > 0 ? safeCells[0] : { x: 0, y: 0 };

  // Generate exit portal on edge for wilderness maps
  const exits = [];
  if (mapType === 'wilderness' || mapType === 'outer_plains' || mapType === 'deep_forest' || mapType === 'mountain_range' || mapType === 'caverns') {
    const rng2 = new Math.seedrandom(seed + '_exit_' + mapType);
    const edge = Math.floor(rng2() * 4);
    let exitX, exitY;

    if (edge === 0) { // Top
      exitX = Math.floor(rng2() * gridSize);
      exitY = 0;
    } else if (edge === 1) { // Right
      exitX = gridSize - 1;
      exitY = Math.floor(rng2() * gridSize);
    } else if (edge === 2) { // Bottom
      exitX = Math.floor(rng2() * gridSize);
      exitY = gridSize - 1;
    } else { // Left
      exitX = 0;
      exitY = Math.floor(rng2() * gridSize);
    }

    const nextMap = getNextMapType(mapType);
    exits.push({ x: exitX, y: exitY, nextMap });
  }

  return {
    enemies,
    traps,
    shrines,
    playerSpawn,
    gridSize,
    mapType,
    exits
  };
}

function getNextMapType(currentMap) {
  if (currentMap === 'wilderness') {
    return { gridSize: 34, mapType: 'outer_plains', displayName: 'Outer Plains' };
  } else if (currentMap === 'outer_plains') {
    return { gridSize: 38, mapType: 'deep_forest', displayName: 'Deep Forest' };
  } else if (currentMap === 'deep_forest') {
    return { gridSize: 42, mapType: 'mountain_range', displayName: 'Mountain Range' };
  } else if (currentMap === 'mountain_range') {
    return { gridSize: 46, mapType: 'caverns', displayName: 'Caverns' };
  } else if (currentMap === 'caverns') {
    return { gridSize: 50, mapType: 'inner_prison', displayName: 'Inner Prison' };
  }
  return { gridSize: 30, mapType: 'wilderness', displayName: 'Wilderness' };
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