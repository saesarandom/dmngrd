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
    
    console.log('✓ Database ready');
  } catch (err) {
    console.error('DB error:', err.message);
  }
}

initDB();

app.get('/games', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM games ORDER BY created_at DESC');
    res.json(result.rows);
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

  socket.on('disconnect', () => {
    console.log('✗ Disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n✓ Server on http://localhost:${PORT}\n`);
});