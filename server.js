const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Neon PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000,
});

// Initialize database tables
async function initDB() {
  try {
    // Test connection first
    const client = await pool.connect();
    console.log('✓ Connected to Neon PostgreSQL');
    client.release();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        name VARCHAR(30) UNIQUE NOT NULL,
        password VARCHAR(100),
        pvp_enabled BOOLEAN DEFAULT true,
        map_seed BIGINT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        socket_id VARCHAR(100),
        name VARCHAR(21) NOT NULL,
        class VARCHAR(20),
        race VARCHAR(20),
        level INTEGER DEFAULT 1,
        x INTEGER DEFAULT 0,
        y INTEGER DEFAULT 0,
        location VARCHAR(50) DEFAULT 'Skargnes',
        last_update TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('✓ Database tables ready');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    console.error('Check your DATABASE_URL in .env file');
    process.exit(1);
  }
}

initDB();

// Active games in memory (for faster access)
const activeGames = new Map(); // gameId -> { name, password, pvpEnabled, players: Map(socketId -> playerData) }

// Save player position to database (called periodically and on disconnect)
async function savePlayerPosition(socketId) {
  try {
    const game = Array.from(activeGames.values()).find(g => 
      Array.from(g.players.keys()).includes(socketId)
    );
    
    if (game) {
      const player = game.players.get(socketId);
      await pool.query(
        'UPDATE players SET x = $1, y = $2, last_update = NOW() WHERE socket_id = $3',
        [player.x, player.y, socketId]
      );
    }
  } catch (error) {
    console.error('Error saving position:', error);
  }
}

// Auto-save all positions every 10 minutes
setInterval(async () => {
  console.log('Auto-saving all player positions...');
  const savePromises = [];
  
  activeGames.forEach(game => {
    game.players.forEach((player, socketId) => {
      savePromises.push(savePlayerPosition(socketId));
    });
  });
  
  await Promise.all(savePromises);
  console.log('Auto-save complete');
}, 10 * 60 * 1000); // 10 minutes

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create game
  socket.on('create_game', async (data) => {
    try {
      const { gameName, password, pvpEnabled, mapSeed, player } = data;

      // Insert game into database with map seed
      const gameResult = await pool.query(
        'INSERT INTO games (name, password, pvp_enabled, map_seed) VALUES ($1, $2, $3, $4) RETURNING id',
        [gameName, password || null, pvpEnabled, mapSeed]
      );

      const gameId = gameResult.rows[0].id;

      // Insert player
      await pool.query(
        'INSERT INTO players (game_id, socket_id, name, class, race, level, x, y) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [gameId, socket.id, player.name, player.class, player.race, player.level, player.x, player.y]
      );

      // Join socket room
      socket.join(gameName);

      // Store in memory
      const playerData = { socketId: socket.id, location: 'Skargnes', ...player };
      const playersMap = new Map();
      playersMap.set(socket.id, playerData);
      
      activeGames.set(gameId, {
        name: gameName,
        password: password || null,
        pvpEnabled,
        mapSeed: mapSeed,
        players: playersMap
      });

      socket.emit('game_created', { gameId, gameName, mapSeed });
      console.log(`Game created: ${gameName} by ${player.name} (seed: ${mapSeed})`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to create game: ' + error.message });
    }
  });

  // Join game
  socket.on('join_game', async (data) => {
    try {
      const { gameName, password, player } = data;

      // Check if game exists
      const gameResult = await pool.query('SELECT * FROM games WHERE name = $1', [gameName]);
      
      if (gameResult.rows.length === 0) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const game = gameResult.rows[0];

      // Check password
      if (game.password && game.password !== password) {
        socket.emit('error', { message: 'Incorrect password' });
        return;
      }

      // Add player to game
      await pool.query(
        'INSERT INTO players (game_id, socket_id, name, class, race, level, x, y) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [game.id, socket.id, player.name, player.class, player.race, player.level, player.x, player.y]
      );

      socket.join(gameName);

      // Add to memory
      let gameData = activeGames.get(game.id);
      if (!gameData) {
        gameData = {
          name: gameName,
          password: game.password,
          pvpEnabled: game.pvp_enabled,
          mapSeed: game.map_seed,
          players: new Map()
        };
        activeGames.set(game.id, gameData);
      }
      
      const playerData = { socketId: socket.id, location: 'Skargnes', ...player };
      gameData.players.set(socket.id, playerData);

      // Get all players from memory
      const allPlayers = Array.from(gameData.players.values()).map(p => ({
        name: p.name,
        class: p.class,
        race: p.race,
        level: p.level,
        x: p.x,
        y: p.y,
        location: p.location || 'Skargnes'
      }));

      // Notify everyone
      io.to(gameName).emit('player_joined', { player, players: allPlayers });
      
      socket.emit('game_joined', { 
        gameId: game.id, 
        gameName: game.name,
        pvpEnabled: game.pvp_enabled,
        mapSeed: game.map_seed,
        players: allPlayers
      });

      console.log(`${player.name} joined game: ${gameName} (seed: ${game.map_seed})`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join game: ' + error.message });
    }
  });

  // Update position (memory only, saved periodically)
  socket.on('update_position', async (data) => {
    try {
      const { gameName, x, y } = data;

      // Update in memory
      const game = Array.from(activeGames.values()).find(g => g.name === gameName);
      if (game && game.players.has(socket.id)) {
        const player = game.players.get(socket.id);
        player.x = x;
        player.y = y;

        // Broadcast to other players in the game (memory only)
        socket.to(gameName).emit('position_updated', {
          socketId: socket.id,
          playerName: player.name,
          x,
          y
        });
      }
    } catch (error) {
      console.error('Position update error:', error);
    }
  });

  // Update location (town/wilderness)
  socket.on('update_location', async (data) => {
    try {
      const { gameName, location } = data;

      // Update in memory
      const game = Array.from(activeGames.values()).find(g => g.name === gameName);
      if (game && game.players.has(socket.id)) {
        const player = game.players.get(socket.id);
        player.location = location;

        // Broadcast location change
        socket.to(gameName).emit('location_updated', {
          playerName: player.name,
          location
        });

        console.log(`${player.name} moved to ${location}`);
      }
    } catch (error) {
      console.error('Location update error:', error);
    }
  });

  // Map event (enemy killed, trap triggered, shrine activated)
  socket.on('map_event', async (data) => {
    try {
      const { gameName, type, x, y } = data;
      
      // Broadcast to all players in same game
      socket.to(gameName).emit('map_event', {
        type,
        x,
        y
      });
      
      console.log(`Map event in ${gameName}: ${type} at (${x}, ${y})`);
    } catch (error) {
      console.error('Map event error:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    try {
      // Save position to DB before removing
      await savePlayerPosition(socket.id);

      // Remove player from database
      const result = await pool.query(
        'DELETE FROM players WHERE socket_id = $1 RETURNING game_id, name',
        [socket.id]
      );

      if (result.rows.length > 0) {
        const { game_id, name } = result.rows[0];
        
        // Remove from memory
        const gameData = activeGames.get(game_id);
        if (gameData) {
          gameData.players.delete(socket.id);
          
          // Get game name
          const gameName = gameData.name;
          
          // Notify other players
          io.to(gameName).emit('player_left', { name });
          
          // Check if game is empty
          if (gameData.players.size === 0) {
            // Delete empty game
            await pool.query('DELETE FROM games WHERE id = $1', [game_id]);
            activeGames.delete(game_id);
            console.log(`Game ${gameName} deleted (empty)`);
          }
        }
      }

      console.log('Player disconnected:', socket.id);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
});

// REST API endpoints
app.get('/games', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.id, g.name, g.password IS NOT NULL as has_password, g.pvp_enabled, 
             COUNT(p.id) as player_count
      FROM games g
      LEFT JOIN players p ON g.id = p.game_id
      GROUP BY g.id
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});