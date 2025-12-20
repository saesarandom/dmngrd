const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.json());

// Redirect root to login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Static files AFTER the root route
app.use(express.static(path.join(__dirname)));




const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Server-authoritative inventory state (in-memory)
// Key: socket.id, Value: { slots: [], equipped: {}, gold: number, characterId: number }
const playerInventories = new Map();

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id BIGINT PRIMARY KEY,
        name VARCHAR(30) UNIQUE NOT NULL,
        password VARCHAR(100),
        pvp_enabled BOOLEAN DEFAULT true,
        map_seed BIGINT,
        creator_name VARCHAR(21),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
        socket_id VARCHAR(100),
        name VARCHAR(21),
        class VARCHAR(20),
        race VARCHAR(20),
        level INTEGER,
        x INTEGER,
        y INTEGER,
        location VARCHAR(50) DEFAULT 'Skargnes'
      );
    `);

    await pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(16) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

    await pool.query(`
  CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(21) NOT NULL,
    level INTEGER DEFAULT 1,
    alignment VARCHAR(20),
    race VARCHAR(20),
    class VARCHAR(20),
    stats JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);

    console.log('✓ Database ready');
  } catch (err) {
    console.error('DB error:', err.message);
  }
}

initDB();


app.get('/characters/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM characters WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json({ characters: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/characters', async (req, res) => {
  try {
    const { userId, name, level, alignment, race, class: charClass, stats } = req.body;

    const result = await pool.query(
      'INSERT INTO characters (user_id, name, level, alignment, race, class, stats) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, name, level, alignment, race, charClass, JSON.stringify(stats)]
    );

    res.json({ character: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update character stats (inventory, equipment, etc.)
app.put('/characters/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { stats } = req.body;

    const result = await pool.query(
      'UPDATE characters SET stats = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(stats), characterId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json({ character: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/games', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const bcrypt = require('bcrypt');

// At the top with other requires
const SALT_ROUNDS = 10;

// Auth routes
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    const existing = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT id, username, password FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

io.on('connection', (socket) => {
  console.log('✓ Connected:', socket.id);

  socket.on('create_game', async (data) => {
    try {
      const gameId = Math.floor(Date.now() / 1000);

      await pool.query(
        'INSERT INTO games (id, name, password, pvp_enabled, map_seed, creator_name) VALUES ($1, $2, $3, $4, $5, $6)',
        [gameId, data.gameName, data.password || null, data.pvpEnabled, data.mapSeed, data.player.name]
      );

      await pool.query(
        'INSERT INTO players (game_id, socket_id, name, class, race, level, x, y) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [gameId, socket.id, data.player.name, data.player.class, data.player.race, data.player.level, data.player.x, data.player.y]
      );

      socket.join(`game_${gameId}`);

      const games = await pool.query('SELECT * FROM games ORDER BY created_at DESC');
      io.emit('games_updated', games.rows);

      const createdGame = await pool.query('SELECT * FROM games WHERE id = $1', [gameId]);
      socket.emit('game_created', createdGame.rows[0]);
    } catch (err) {
      console.error('Error:', err.message);
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('join_game', async (data) => {
    try {
      const game = await pool.query('SELECT * FROM games WHERE id = $1', [data.gameId]);

      if (game.rows.length === 0) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (game.rows[0].password && game.rows[0].password !== data.password) {
        socket.emit('error', { message: 'Incorrect password' });
        return;
      }

      const existing = await pool.query(
        'SELECT * FROM players WHERE game_id = $1 AND name = $2',
        [data.gameId, data.player.name]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO players (game_id, socket_id, name, class, race, level, x, y) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [data.gameId, socket.id, data.player.name, data.player.class, data.player.race, data.player.level, data.player.x, data.player.y]
        );
      }

      socket.join(`game_${data.gameId}`);

      // Store game context on socket for cleanup on disconnect
      socket.gameId = data.gameId;
      socket.playerName = data.player.name;

      // Load character inventory from database
      const character = await pool.query(
        'SELECT * FROM characters WHERE name = $1',
        [data.player.name]
      );

      let inventoryData = {
        slots: Array(30).fill(null),
        equipped: { weapon: null, armor: null, helm: null, shield: null },
        gold: 0,
        experience: 0,
        level: 1,
        monstersKilled: 0,
        deaths: 0,
        stats: null
      };

      if (character.rows.length > 0 && character.rows[0].stats) {
        const stats = character.rows[0].stats;
        if (stats.inventory) inventoryData.slots = stats.inventory;
        if (stats.equipped) inventoryData.equipped = stats.equipped;
        if (stats.gold !== undefined) inventoryData.gold = stats.gold;
        if (stats.experience !== undefined) inventoryData.experience = stats.experience;
        if (stats.level !== undefined) inventoryData.level = stats.level;
        if (stats.monstersKilled !== undefined) inventoryData.monstersKilled = stats.monstersKilled;
        if (stats.deaths !== undefined) inventoryData.deaths = stats.deaths;
        if (stats.baseStats) inventoryData.stats = stats.baseStats;

        socket.characterId = character.rows[0].id;
      }

      // Calculate level from experience if not set
      if (inventoryData.experience > 0 && inventoryData.level === 1) {
        const EXPERIENCE_TABLE = [
          0, 64, 77, 93, 113, 137, 166, 202, 244, 296,
          359, 434, 526, 638, 772, 936, 1134, 1373, 1663, 2015,
          2440, 2956, 3580, 4337, 5253, 6363, 7707, 9335, 11307, 13696,
          16589, 20093, 24337, 29478, 35705, 43248, 52384, 63449, 76852, 93086,
          112749, 136566, 165414, 200356, 242678, 293941, 356032, 431240, 522333, 632670,
          766313, 928187, 1124254, 1361738, 1649388, 1997799, 2419809, 2930962, 3550089, 4300000,
          4591991, 4903809, 5236802, 5592406, 5972158, 6377697, 6810774, 7273259, 7767149, 8294576,
          8857818, 9459308, 10101641, 10787592, 11520122, 12302395, 13137788, 14029908, 14982607, 16000000,
          17171217, 18428168, 19777129, 21224836, 22778517, 24445929, 26235397, 28155856, 30216894, 32428803,
          34802626, 37350215, 40084291, 43018504, 46167504, 49547015, 53173909, 57066295, 61243609, 65726706,
          70537971, 75701426, 81242851, 87189914, 93572308, 100421901, 107772891, 115661981, 124128562, 133214904,
          142966377, 153431668, 164663029, 176716538, 189652377, 203535133, 218434121, 234423731, 251583798, 270000000,
          298433158, 329860556, 364597510, 402992543, 445430880, 492338313, 544185474, 601492555, 664834531, 734846922,
          812232179, 897766721, 992308735, 1096806779, 1212309302, 1339975165, 1481085263, 1637055384, 1809450405, 2000000000,
          2297396709, 2639015821, 3031433133, 3482202253, 4000000000, 4594793419, 5278031643, 6062866266, 6964404506, 8000000000
        ];

        for (let i = EXPERIENCE_TABLE.length - 1; i >= 0; i--) {
          if (inventoryData.experience >= EXPERIENCE_TABLE[i]) {
            inventoryData.level = Math.min(i + 1, 150);
            break;
          }
        }
      }

      // Load initial character stats if they exist
      if (character.rows.length > 0) {
        const charData = character.rows[0];
        console.log('Loading character stats:', charData.stats);

        if (charData.stats && charData.stats.baseStats) {
          // Stats from leveling system
          inventoryData.stats = charData.stats.baseStats;
          console.log('Loaded baseStats:', inventoryData.stats);
        } else if (charData.stats && charData.stats.characterStats) {
          // Stats saved as characterStats in database
          inventoryData.stats = charData.stats.characterStats;
          console.log('Loaded characterStats:', inventoryData.stats);
        } else if (charData.stats && typeof charData.stats === 'object') {
          // Check if stats contains the character creation stats directly
          const hasCharStats = charData.stats.strength !== undefined ||
            charData.stats.dexterity !== undefined;

          if (hasCharStats) {
            // Initialize with character creation stats
            inventoryData.stats = {
              strength: charData.stats.strength || 0,
              dexterity: charData.stats.dexterity || 0,
              constitution: charData.stats.constitution || 0,
              intelligence: charData.stats.intelligence || 0,
              luck: charData.stats.luck || 0,
              endurance: charData.stats.endurance || 0,
              speed: charData.stats.speed || 0,
              perception: charData.stats.perception || 0,
              vitality: charData.stats.vitality || 0,
              spirit: charData.stats.spirit || 0,
              defense: charData.stats.defense || 0,
              charisma: charData.stats.charisma || 0,
              resilience: charData.stats.resilience || 0,
              forging: charData.stats.forging || 0
            };
            console.log('Loaded character creation stats:', inventoryData.stats);
          }
        }
      }

      // Store inventory in server memory
      playerInventories.set(socket.id, {
        ...inventoryData,
        characterId: socket.characterId
      });

      // Send initial inventory state to client
      socket.emit('inventory_updated', inventoryData);

      // Send stats update
      socket.emit('stats_updated', {
        monstersKilled: inventoryData.monstersKilled,
        deaths: inventoryData.deaths,
        stats: inventoryData.stats
      });

      const games = await pool.query('SELECT * FROM games ORDER BY created_at DESC');
      const players = await pool.query('SELECT * FROM players WHERE game_id = $1', [data.gameId]);

      io.emit('games_updated', games.rows);

      const othersForThisPlayer = players.rows.filter(p => p.name !== data.player.name).map(p => {
        const inventory = playerInventories.get(p.socket_id);
        return {
          ...p,
          equipment: inventory ? inventory.equipped : {}
        };
      });
      socket.emit('players_in_game', othersForThisPlayer);

      const othersInRoom = players.rows.filter(p => p.socket_id !== socket.id).map(p => {
        const inventory = playerInventories.get(p.socket_id);
        return {
          ...p,
          equipment: inventory ? inventory.equipped : {}
        };
      });
      socket.to(`game_${data.gameId}`).emit('players_in_game', othersInRoom);

      socket.emit('game_joined', { ...game.rows[0], players: players.rows });
    } catch (err) {
      console.error('Error:', err.message);
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('update_position', (data) => {
    const { gameId, playerName, x, y, equipment } = data;
    io.to(`game_${gameId}`).emit('position_updated', {
      playerName,
      x,
      y,
      equipment
    });
  });

  socket.on('update_location', (data) => {
    const { gameId, location, playerName } = data;
    io.to(`game_${gameId}`).emit('location_updated', {
      socketId: socket.id,
      playerName: playerName,
      location
    });
  });

  // ===== SERVER-AUTHORITATIVE INVENTORY HANDLERS =====

  socket.on('inventory_pickup_item', (data) => {
    const inventory = playerInventories.get(socket.id);
    if (!inventory) return;

    const { item } = data;

    // Find empty slot
    const emptySlotIndex = inventory.slots.findIndex(slot => slot === null);
    if (emptySlotIndex !== -1) {
      inventory.slots[emptySlotIndex] = item;

      // Broadcast updated inventory to client
      socket.emit('inventory_updated', {
        slots: inventory.slots,
        equipped: inventory.equipped,
        gold: inventory.gold,
        experience: inventory.experience || 0,
        level: inventory.level || 1,
        monstersKilled: inventory.monstersKilled || 0,
        deaths: inventory.deaths || 0
      });

      console.log(`Player ${socket.playerName} picked up ${item.name}`);
    } else {
      socket.emit('inventory_full');
    }
  });

  socket.on('inventory_equip_item', (data) => {
    const inventory = playerInventories.get(socket.id);
    if (!inventory) return;

    const { inventoryIndex } = data;

    // Validate slot index
    if (inventoryIndex < 0 || inventoryIndex >= 30) return;

    const item = inventory.slots[inventoryIndex];
    if (!item) return;

    // Determine slot type
    let slotType = null;
    if (item.type === 'weapon') slotType = 'weapon';
    else if (item.type === 'armor') slotType = 'armor';
    else if (item.type === 'helm') slotType = 'helm';
    else if (item.type === 'shield') slotType = 'shield';

    if (!slotType) {
      socket.emit('error', { message: 'Item cannot be equipped' });
      return;
    }

    // Swap: put current equipped item back to inventory, equip new item
    const oldItem = inventory.equipped[slotType];
    inventory.equipped[slotType] = item;
    inventory.slots[inventoryIndex] = oldItem; // Can be null

    // Broadcast updated inventory
    socket.emit('inventory_updated', {
      slots: inventory.slots,
      equipped: inventory.equipped,
      gold: inventory.gold,
      experience: inventory.experience || 0,
      level: inventory.level || 1,
      monstersKilled: inventory.monstersKilled || 0,
      deaths: inventory.deaths || 0
    });

    // Broadcast equipment change to other players
    socket.broadcast.emit('equipment_changed', {
      playerName: socket.playerName,
      equipment: inventory.equipped
    });

    console.log(`Player ${socket.playerName} equipped ${item.name}`);
  });

  socket.on('inventory_unequip_item', (data) => {
    const inventory = playerInventories.get(socket.id);
    if (!inventory) return;

    const { slotType } = data;

    const item = inventory.equipped[slotType];
    if (!item) return;

    // Find empty slot in inventory
    const emptySlotIndex = inventory.slots.findIndex(slot => slot === null);
    if (emptySlotIndex !== -1) {
      inventory.slots[emptySlotIndex] = item;
      inventory.equipped[slotType] = null;

      // Broadcast updated inventory
      socket.emit('inventory_updated', {
        slots: inventory.slots,
        equipped: inventory.equipped,
        gold: inventory.gold,
        experience: inventory.experience || 0,
        level: inventory.level || 1,
        monstersKilled: inventory.monstersKilled || 0,
        deaths: inventory.deaths || 0
      });

      // Broadcast equipment change to other players
      socket.broadcast.emit('equipment_changed', {
        playerName: socket.playerName,
        equipment: inventory.equipped
      });

      console.log(`Player ${socket.playerName} unequipped ${item.name}`);
    } else {
      socket.emit('inventory_full');
    }
  });

  socket.on('inventory_delete_item', (data) => {
    const inventory = playerInventories.get(socket.id);
    if (!inventory) return;

    const { inventoryIndex } = data;

    // Validate slot index
    if (inventoryIndex < 0 || inventoryIndex >= 30) return;

    const item = inventory.slots[inventoryIndex];
    if (!item) return;

    // Delete item
    inventory.slots[inventoryIndex] = null;

    // Broadcast updated inventory
    socket.emit('inventory_updated', {
      slots: inventory.slots,
      equipped: inventory.equipped,
      gold: inventory.gold,
      experience: inventory.experience || 0,
      level: inventory.level || 1,
      monstersKilled: inventory.monstersKilled || 0,
      deaths: inventory.deaths || 0
    });

    console.log(`Player ${socket.playerName} deleted ${item.name}`);
  });

  socket.on('inventory_add_gold', (data) => {
    const inventory = playerInventories.get(socket.id);
    if (!inventory) return;

    const { amount } = data;

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) return;

    inventory.gold += amount;

    // Broadcast updated inventory
    socket.emit('inventory_updated', {
      slots: inventory.slots,
      equipped: inventory.equipped,
      gold: inventory.gold,
      experience: inventory.experience || 0,
      level: inventory.level || 1,
      monstersKilled: inventory.monstersKilled || 0,
      deaths: inventory.deaths || 0
    });

    console.log(`Player ${socket.playerName} gained ${amount} gold`);
  });

  socket.on('award_experience', async (data) => {
    const inventory = playerInventories.get(socket.id);
    if (!inventory || !socket.characterId) return;

    const { amount } = data;

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) return;

    // Initialize experience if not exists
    if (!inventory.experience) inventory.experience = 0;
    if (!inventory.level) inventory.level = 1;
    if (!inventory.monstersKilled) inventory.monstersKilled = 0;

    const oldLevel = inventory.level;
    inventory.experience += amount;
    inventory.monstersKilled += 1;

    // Experience table for leveling
    const EXPERIENCE_TABLE = [
      0, 64, 77, 93, 113, 137, 166, 202, 244, 296,
      359, 434, 526, 638, 772, 936, 1134, 1373, 1663, 2015,
      2440, 2956, 3580, 4337, 5253, 6363, 7707, 9335, 11307, 13696,
      16589, 20093, 24337, 29478, 35705, 43248, 52384, 63449, 76852, 93086,
      112749, 136566, 165414, 200356, 242678, 293941, 356032, 431240, 522333, 632670,
      766313, 928187, 1124254, 1361738, 1649388, 1997799, 2419809, 2930962, 3550089, 4300000,
      4591991, 4903809, 5236802, 5592406, 5972158, 6377697, 6810774, 7273259, 7767149, 8294576,
      8857818, 9459308, 10101641, 10787592, 11520122, 12302395, 13137788, 14029908, 14982607, 16000000,
      17171217, 18428168, 19777129, 21224836, 22778517, 24445929, 26235397, 28155856, 30216894, 32428803,
      34802626, 37350215, 40084291, 43018504, 46167504, 49547015, 53173909, 57066295, 61243609, 65726706,
      70537971, 75701426, 81242851, 87189914, 93572308, 100421901, 107772891, 115661981, 124128562, 133214904,
      142966377, 153431668, 164663029, 176716538, 189652377, 203535133, 218434121, 234423731, 251583798, 270000000,
      298433158, 329860556, 364597510, 402992543, 445430880, 492338313, 544185474, 601492555, 664834531, 734846922,
      812232179, 897766721, 992308735, 1096806779, 1212309302, 1339975165, 1481085263, 1637055384, 1809450405, 2000000000,
      2297396709, 2639015821, 3031433133, 3482202253, 4000000000, 4594793419, 5278031643, 6062866266, 6964404506, 8000000000
    ];

    // Calculate new level
    let newLevel = 1;
    for (let i = EXPERIENCE_TABLE.length - 1; i >= 0; i--) {
      if (inventory.experience >= EXPERIENCE_TABLE[i]) {
        newLevel = i + 1;
        break;
      }
    }

    inventory.level = Math.min(newLevel, 150);

    // Check if leveled up
    if (inventory.level > oldLevel) {
      const levelsGained = inventory.level - oldLevel;

      // Distribute 10 random stat points per level across the 14 character stats
      const statNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'luck', 'endurance', 'speed', 'perception', 'vitality', 'spirit', 'defense', 'charisma', 'resilience', 'forging'];
      const statGains = {};

      for (let i = 0; i < levelsGained; i++) {
        for (let j = 0; j < 10; j++) {
          const randomStat = statNames[Math.floor(Math.random() * statNames.length)];
          statGains[randomStat] = (statGains[randomStat] || 0) + 1;
        }
      }

      // Apply stat gains to character stats
      if (!inventory.stats) {
        inventory.stats = {
          strength: 0, dexterity: 0, constitution: 0, intelligence: 0,
          luck: 0, endurance: 0, speed: 0, perception: 0,
          vitality: 0, spirit: 0, defense: 0, charisma: 0,
          resilience: 0, forging: 0
        };
      }

      for (const [stat, gain] of Object.entries(statGains)) {
        inventory.stats[stat] = (inventory.stats[stat] || 0) + gain;
      }

      // Broadcast level up
      socket.emit('level_up', {
        level: inventory.level,
        levelsGained,
        statGains,
        totalStats: inventory.stats
      });

      console.log(`Player ${socket.playerName} leveled up to ${inventory.level}! Stat gains:`, statGains);
    }

    // Broadcast experience and stats update to client
    socket.emit('experience_updated', {
      experience: inventory.experience,
      gained: amount,
      level: inventory.level,
      monstersKilled: inventory.monstersKilled
    });

    socket.emit('stats_updated', {
      monstersKilled: inventory.monstersKilled,
      deaths: inventory.deaths || 0,
      stats: inventory.stats
    });

    console.log(`Player ${socket.playerName} gained ${amount} XP (Total: ${inventory.experience}, Level: ${inventory.level})`);
  });

  socket.on('player_death', () => {
    const inventory = playerInventories.get(socket.id);
    if (!inventory) return;

    // Initialize deaths if not exists
    if (!inventory.deaths) inventory.deaths = 0;

    inventory.deaths += 1;

    // Broadcast stats update to client
    socket.emit('stats_updated', {
      monstersKilled: inventory.monstersKilled || 0,
      deaths: inventory.deaths,
      stats: inventory.stats
    });

    console.log(`Player ${socket.playerName} died (Total deaths: ${inventory.deaths})`);
  });

  // ===== END INVENTORY HANDLERS =====


  // Handle explicit leave_game event (from beforeunload)
  socket.on('leave_game', async (data) => {
    try {
      const { gameId, playerName } = data;

      // Remove player from database
      await pool.query(
        'DELETE FROM players WHERE game_id = $1 AND name = $2',
        [gameId, playerName]
      );

      // Notify other players
      socket.to(`game_${gameId}`).emit('player_left', { name: playerName });

      // Update games list
      const games = await pool.query('SELECT * FROM games ORDER BY created_at DESC');
      io.emit('games_updated', games.rows);

      console.log(`✓ Player ${playerName} left game ${gameId}`);
    } catch (err) {
      console.error('Error leaving game:', err.message);
    }
  });

  socket.on('disconnect', async () => {
    console.log('✗ Disconnected:', socket.id);

    // Save inventory to database before cleanup
    const inventory = playerInventories.get(socket.id);
    if (inventory && socket.characterId) {
      try {
        await pool.query(
          'UPDATE characters SET stats = $1 WHERE id = $2',
          [JSON.stringify({
            inventory: inventory.slots,
            equipped: inventory.equipped,
            gold: inventory.gold,
            experience: inventory.experience || 0,
            level: inventory.level || 1,
            monstersKilled: inventory.monstersKilled || 0,
            deaths: inventory.deaths || 0,
            characterStats: inventory.stats || null
          }), socket.characterId]
        );
        console.log(`✓ Saved inventory for character ${socket.characterId}`);
      } catch (err) {
        console.error('Error saving inventory on disconnect:', err.message);
      }
    }

    // Clean up player inventory from memory
    playerInventories.delete(socket.id);

    // Clean up player if they were in a game
    if (socket.gameId && socket.playerName) {
      try {
        // Remove player from database
        await pool.query(
          'DELETE FROM players WHERE game_id = $1 AND name = $2',
          [socket.gameId, socket.playerName]
        );

        // Notify other players in the game
        socket.to(`game_${socket.gameId}`).emit('player_left', {
          name: socket.playerName
        });

        // Update games list for lobby
        const games = await pool.query('SELECT * FROM games ORDER BY created_at DESC');
        io.emit('games_updated', games.rows);

        console.log(`✓ Cleaned up player ${socket.playerName} from game ${socket.gameId}`);
      } catch (err) {
        console.error('Error cleaning up on disconnect:', err.message);
      }
    }
  });
});

// Auto-save all player inventories every 10 minutes
setInterval(async () => {
  console.log('Running auto-save for all players...');

  for (const [socketId, inventory] of playerInventories.entries()) {
    if (inventory.characterId) {
      try {
        await pool.query(
          'UPDATE characters SET stats = $1 WHERE id = $2',
          [JSON.stringify({
            inventory: inventory.slots,
            equipped: inventory.equipped,
            gold: inventory.gold,
            experience: inventory.experience || 0,
            level: inventory.level || 1,
            monstersKilled: inventory.monstersKilled || 0,
            deaths: inventory.deaths || 0,
            characterStats: inventory.stats || null
          }), inventory.characterId]
        );
        console.log(`✓ Auto-saved inventory for character ${inventory.characterId}`);
      } catch (err) {
        console.error('Error auto-saving inventory:', err.message);
      }
    }
  }
}, 600000); // 10 minutes

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n✓ Server on http://localhost:${PORT}\n`);
});