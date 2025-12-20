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

      const games = await pool.query('SELECT * FROM games ORDER BY created_at DESC');
      const players = await pool.query('SELECT * FROM players WHERE game_id = $1', [data.gameId]);

      io.emit('games_updated', games.rows);

      const othersForThisPlayer = players.rows.filter(p => p.name !== data.player.name);
      socket.emit('players_in_game', othersForThisPlayer);

      const othersInRoom = players.rows.filter(p => p.socket_id !== socket.id);
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n✓ Server on http://localhost:${PORT}\n`);
});