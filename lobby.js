class Lobby {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.players = [];
    this.gameName = '';
    this.gamePassword = '';
    this.pvpEnabled = true;
    this.updateInterval = null;
    this.socket = null;
    this.connected = false;
    
    this.createLobbyUI();
    this.createGameModal();
    this.createJoinModal();
    this.setupEventListeners();
    this.connectToServer();
  }

  connectToServer() {
    // Replace with your server URL
    const SERVER_URL = 'http://localhost:3000';
    
    this.socket = io(SERVER_URL);

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('Disconnected from server');
    });

    this.socket.on('game_created', (data) => {
      this.game.setMessage(`Game created: ${data.gameName}`);
      // Store map seed for other players
      if (this.game.mapSeed) {
        console.log('Map seed:', this.game.mapSeed);
      }
    });

    this.socket.on('game_joined', (data) => {
      this.gameName = data.gameName;
      this.pvpEnabled = data.pvpEnabled;
      this.players = data.players;
      
      console.log('=== JOINING GAME ===');
      console.log('Received map seed:', data.mapSeed);
      console.log('Current game seed before:', this.game.mapSeed);
      
      // Sync map with seed if provided
      if (data.mapSeed) {
        this.game.mapSeed = data.mapSeed; // Store it!
        console.log('Stored seed in game:', this.game.mapSeed);
        
        if (this.game.generateMap) {
          console.log('Generating map with seed:', data.mapSeed);
          this.game.generateMap(data.mapSeed);
          console.log('After generateMap, game seed:', this.game.mapSeed);
        }
      }
      
      // Update other players on canvas
      this.game.updateOtherPlayers(data.players);
      
      this.startPositionUpdates();
      this.render();
      this.game.setMessage(`Joined game: ${data.gameName}`);
    });

    this.socket.on('player_joined', (data) => {
      this.players = data.players;
      this.game.updateOtherPlayers(data.players);
      this.render();
      this.game.setMessage(`${data.player.name} joined the game`);
    });

    this.socket.on('player_left', (data) => {
      this.removePlayer(data.name);
      this.game.setMessage(`${data.name} left the game`);
    });

    this.socket.on('position_updated', (data) => {
      const player = this.players.find(p => p.name === data.playerName);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        this.game.updateOtherPlayers(this.players);
        if (this.isOpen) this.render();
      }
    });

    this.socket.on('location_updated', (data) => {
      const player = this.players.find(p => p.name === data.playerName);
      if (player) {
        player.location = data.location;
        this.game.updateOtherPlayers(this.players);
        if (this.isOpen) this.render();
      }
    });

    this.socket.on('map_event', (data) => {
      const { type, x, y } = data;
      
      // Apply map event to local game
      if (type === 'enemy_killed') {
        const enemyIndex = this.game.enemies.findIndex(e => e.x === x && e.y === y);
        if (enemyIndex !== -1) {
          this.game.enemies.splice(enemyIndex, 1);
          this.game.render();
        }
      } else if (type === 'trap_activated') {
        const trapIndex = this.game.traps.findIndex(t => t.x === x && t.y === y);
        if (trapIndex !== -1) {
          this.game.traps.splice(trapIndex, 1);
          this.game.render();
        }
      } else if (type === 'shrine_activated') {
        const shrineIndex = this.game.shrines.findIndex(s => s.x === x && s.y === y);
        if (shrineIndex !== -1) {
          this.game.shrines.splice(shrineIndex, 1);
          this.game.render();
        }
      }
    });

    this.socket.on('error', (data) => {
      alert(data.message);
    });
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  createLobbyUI() {
    const lobbyDiv = document.createElement('div');
    lobbyDiv.id = 'lobbyUI';
    lobbyDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 300px;
      height: 100vh;
      background-color: rgba(26, 26, 26, 0.95);
      border-right: 2px solid #333;
      display: none;
      z-index: 1500;
      padding: 20px;
      overflow-y: auto;
    `;

    lobbyDiv.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h2 style="color: #4aff4a; font-size: 24px; margin-bottom: 10px;">Game Lobby</h2>
        <div id="connectionStatus" style="color: #888; font-size: 12px; margin-bottom: 15px;">
          ● Connecting...
        </div>
        <div id="gameInfo" style="background-color: #1a1a1a; border: 2px solid #4a7c3e; border-radius: 4px; padding: 15px; margin-bottom: 15px;">
          <div style="color: #888; font-size: 12px; margin-bottom: 5px;">Game Name</div>
          <div id="gameName" style="color: #fff; font-size: 16px; font-weight: bold; margin-bottom: 10px;">Not in game</div>
          <div id="gamePassword" style="display: none;">
            <div style="color: #888; font-size: 12px; margin-bottom: 5px;">Password</div>
            <div style="color: #ffff4a; font-size: 14px; margin-bottom: 10px;">🔒 Protected</div>
          </div>
          <div id="pvpStatus" style="color: #888; font-size: 12px;">
            PVP: <span id="pvpValue" style="color: #4aff4a;">Enabled</span>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 15px;">
        <h3 style="color: #888; font-size: 14px; margin-bottom: 10px; text-transform: uppercase;">Players (<span id="playerCount">0</span>)</h3>
        <div id="playerList"></div>
      </div>

      <button id="createGameBtn" style="width: 100%; padding: 12px; background-color: #4a7c3e; border: none; border-radius: 4px; color: #fff; font-size: 14px; cursor: pointer; margin-bottom: 10px;">
        Create Game
      </button>

      <button id="joinGameBtn" style="width: 100%; padding: 12px; background-color: #333; border: 2px solid #555; border-radius: 4px; color: #fff; font-size: 14px; cursor: pointer;">
        Join Game
      </button>

      <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
        Press P to close
      </div>
    `;

    document.body.appendChild(lobbyDiv);
    this.lobbyUI = lobbyDiv;

    document.getElementById('createGameBtn').addEventListener('click', () => {
      this.openGameModal();
    });

    document.getElementById('joinGameBtn').addEventListener('click', () => {
      this.openJoinModal();
    });
  }

  createGameModal() {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'gameModal';
    modalDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(10, 10, 10, 0.9);
      display: none;
      z-index: 2000;
      justify-content: center;
      align-items: center;
    `;

    modalDiv.innerHTML = `
      <div style="background-color: #1a1a1a; border: 2px solid #4a7c3e; border-radius: 8px; padding: 30px; max-width: 500px; width: 90%;">
        <h2 style="color: #4aff4a; font-size: 28px; margin-bottom: 25px; text-align: center;">Create Game</h2>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; color: #888; font-size: 14px; margin-bottom: 8px;">Game Name *</label>
          <input id="gameNameInput" type="text" maxlength="30" placeholder="Enter game name" style="width: 100%; padding: 12px; background-color: #0a0a0a; border: 2px solid #333; border-radius: 4px; color: #fff; font-size: 16px;">
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; color: #888; font-size: 14px; margin-bottom: 8px;">Password (Optional)</label>
          <input id="gamePasswordInput" type="password" maxlength="20" placeholder="Leave empty for public game" style="width: 100%; padding: 12px; background-color: #0a0a0a; border: 2px solid #333; border-radius: 4px; color: #fff; font-size: 16px;">
        </div>

        <div style="margin-bottom: 25px; background-color: #0a0a0a; border: 2px solid #333; border-radius: 4px; padding: 15px;">
          <label style="display: flex; align-items: center; cursor: pointer;">
            <input id="pvpCheckbox" type="checkbox" checked style="width: 20px; height: 20px; margin-right: 10px; cursor: pointer;">
            <div>
              <div style="color: #fff; font-size: 16px; font-weight: bold;">Enable PVP</div>
              <div style="color: #888; font-size: 12px; margin-top: 3px;">Allow player vs player combat</div>
            </div>
          </label>
        </div>

        <div style="display: flex; gap: 15px;">
          <button id="cancelGameBtn" style="flex: 1; padding: 12px; background-color: #333; border: 2px solid #555; border-radius: 4px; color: #fff; font-size: 16px; cursor: pointer;">
            Cancel
          </button>
          <button id="confirmGameBtn" style="flex: 1; padding: 12px; background-color: #4a7c3e; border: none; border-radius: 4px; color: #fff; font-size: 16px; font-weight: bold; cursor: pointer;">
            Create
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalDiv);
    this.gameModal = modalDiv;

    document.getElementById('cancelGameBtn').addEventListener('click', () => {
      this.closeGameModal();
    });

    document.getElementById('confirmGameBtn').addEventListener('click', () => {
      this.createGame();
    });
  }

  createJoinModal() {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'joinModal';
    modalDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(10, 10, 10, 0.9);
      display: none;
      z-index: 2000;
      justify-content: center;
      align-items: center;
    `;

    modalDiv.innerHTML = `
      <div style="background-color: #1a1a1a; border: 2px solid #4a7c3e; border-radius: 8px; padding: 30px; max-width: 500px; width: 90%;">
        <h2 style="color: #4aff4a; font-size: 28px; margin-bottom: 25px; text-align: center;">Join Game</h2>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; color: #888; font-size: 14px; margin-bottom: 8px;">Game Name *</label>
          <input id="joinGameNameInput" type="text" maxlength="30" placeholder="Enter game name" style="width: 100%; padding: 12px; background-color: #0a0a0a; border: 2px solid #333; border-radius: 4px; color: #fff; font-size: 16px;">
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; color: #888; font-size: 14px; margin-bottom: 8px;">Password (if required)</label>
          <input id="joinPasswordInput" type="password" maxlength="20" placeholder="Enter password" style="width: 100%; padding: 12px; background-color: #0a0a0a; border: 2px solid #333; border-radius: 4px; color: #fff; font-size: 16px;">
        </div>

        <div style="display: flex; gap: 15px;">
          <button id="cancelJoinBtn" style="flex: 1; padding: 12px; background-color: #333; border: 2px solid #555; border-radius: 4px; color: #fff; font-size: 16px; cursor: pointer;">
            Cancel
          </button>
          <button id="confirmJoinBtn" style="flex: 1; padding: 12px; background-color: #4a7c3e; border: none; border-radius: 4px; color: #fff; font-size: 16px; font-weight: bold; cursor: pointer;">
            Join
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalDiv);
    this.joinModal = modalDiv;

    document.getElementById('cancelJoinBtn').addEventListener('click', () => {
      this.closeJoinModal();
    });

    document.getElementById('confirmJoinBtn').addEventListener('click', () => {
      this.joinGame();
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.lobbyUI.style.display = 'block';
    this.updateConnectionStatus();
    this.render();
  }

  close() {
    this.isOpen = false;
    this.lobbyUI.style.display = 'none';
  }

  updateConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    if (this.connected) {
      statusEl.textContent = '● Connected';
      statusEl.style.color = '#4aff4a';
    } else {
      statusEl.textContent = '● Disconnected';
      statusEl.style.color = '#ff4a4a';
    }
  }

  openGameModal() {
    this.gameModal.style.display = 'flex';
    document.getElementById('gameNameInput').focus();
  }

  closeGameModal() {
    this.gameModal.style.display = 'none';
    document.getElementById('gameNameInput').value = '';
    document.getElementById('gamePasswordInput').value = '';
    document.getElementById('pvpCheckbox').checked = true;
  }

  openJoinModal() {
    this.joinModal.style.display = 'flex';
    document.getElementById('joinGameNameInput').focus();
  }

  closeJoinModal() {
    this.joinModal.style.display = 'none';
    document.getElementById('joinGameNameInput').value = '';
    document.getElementById('joinPasswordInput').value = '';
  }

  createGame() {
    const nameInput = document.getElementById('gameNameInput');
    const passwordInput = document.getElementById('gamePasswordInput');
    const pvpCheckbox = document.getElementById('pvpCheckbox');

    const name = nameInput.value.trim();
    
    if (!name) {
      alert('Please enter a game name');
      return;
    }

    if (!this.connected) {
      alert('Not connected to server');
      return;
    }

    this.gameName = name;
    this.gamePassword = passwordInput.value.trim();
    this.pvpEnabled = pvpCheckbox.checked;

    // Generate map NOW to get the seed
    console.log('Before generateMap, seed:', this.game.mapSeed);
    if (!this.game.mapSeed) {
      this.game.generateMap(); // This creates the seed
      console.log('After generateMap, seed:', this.game.mapSeed);
    }

    console.log('Sending to server - mapSeed:', this.game.mapSeed);

    this.socket.emit('create_game', {
      gameName: this.gameName,
      password: this.gamePassword,
      pvpEnabled: this.pvpEnabled,
      mapSeed: this.game.mapSeed, // Now it has a value
      player: {
        name: this.game.character.name,
        class: this.game.character.class,
        race: this.game.character.race,
        level: this.game.character.level,
        x: this.game.player.x,
        y: this.game.player.y
      }
    });

    this.closeGameModal();
    this.startPositionUpdates();
  }

  joinGame() {
    const nameInput = document.getElementById('joinGameNameInput');
    const passwordInput = document.getElementById('joinPasswordInput');

    const name = nameInput.value.trim();
    
    if (!name) {
      alert('Please enter a game name');
      return;
    }

    if (!this.connected) {
      alert('Not connected to server');
      return;
    }

    this.socket.emit('join_game', {
      gameName: name,
      password: passwordInput.value.trim(),
      player: {
        name: this.game.character.name,
        class: this.game.character.class,
        race: this.game.character.race,
        level: this.game.character.level,
        x: this.game.player.x,
        y: this.game.player.y
      }
    });

    this.closeJoinModal();
  }

  addPlayer(playerData) {
    this.players.push(playerData);
    if (this.isOpen) this.render();
  }

  removePlayer(playerName) {
    this.players = this.players.filter(p => p.name !== playerName);
    if (this.isOpen) this.render();
  }

  updatePlayerPosition(playerName, x, y) {
    const player = this.players.find(p => p.name === playerName);
    if (player) {
      player.x = x;
      player.y = y;
      if (this.isOpen) this.render();
    }
  }

  startPositionUpdates() {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(() => {
      if (this.gameName && this.connected) {
        this.socket.emit('update_position', {
          gameName: this.gameName,
          x: this.game.player.x,
          y: this.game.player.y
        });
      }
    }, 1000);
  }

  stopPositionUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  render() {
    this.updateConnectionStatus();

    document.getElementById('gameName').textContent = this.gameName || 'Not in game';
    
    const passwordDiv = document.getElementById('gamePassword');
    if (this.gamePassword) {
      passwordDiv.style.display = 'block';
    } else {
      passwordDiv.style.display = 'none';
    }

    const pvpValue = document.getElementById('pvpValue');
    pvpValue.textContent = this.pvpEnabled ? 'Enabled' : 'Disabled';
    pvpValue.style.color = this.pvpEnabled ? '#4aff4a' : '#ff4a4a';

    document.getElementById('playerCount').textContent = this.players.length;

    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';

    if (this.players.length === 0) {
      playerList.innerHTML = '<div style="color: #666; font-size: 12px; text-align: center; padding: 20px;">No players</div>';
      return;
    }

    this.players.forEach(player => {
      const playerDiv = document.createElement('div');
      playerDiv.style.cssText = `
        background-color: #1a1a1a;
        border: 1px solid #333;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 8px;
      `;

      playerDiv.innerHTML = `
        <div style="color: #4aff4a; font-size: 14px; font-weight: bold; margin-bottom: 5px;">${player.name}</div>
        <div style="color: #888; font-size: 12px; margin-bottom: 3px;">${player.race} ${player.class}</div>
        <div style="color: #666; font-size: 11px;">Level ${player.level} • (${player.x}, ${player.y})</div>
        <div style="color: #9d4aff; font-size: 10px; margin-top: 3px;">${player.location || 'Skargnes'}</div>
      `;

      playerList.appendChild(playerDiv);
    });
  }
}