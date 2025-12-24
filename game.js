class Game {
  constructor(gameSeed) {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.gridSize = 30;
    this.cellSize = 32;
    this.resolutionMenu = document.getElementById('resolutionMenu');
    this.menuOpen = false;
    this.otherPlayers = [];
    this.mapSeed = gameSeed;
    this.currentMapType = 'wilderness';

    this.enemies = [];
    this.traps = [];
    this.shrines = [];
    this.exits = [];
    this.player = { x: 0, y: 0 };
    this.message = '';
    this.messages = []; // Chat message history
    this.hoveredEnemy = null;
    this.inTown = false;
    this.currentTown = null;

    // Image cache for preloading
    this.imageCache = {};

    this.setMessage('Initializing game...');
    this.preloadImages();
    this.setupCanvas();
    this.setupEventListeners();
    this.setupMouseTracking();
    this.setupChatHandlers();
  }

  preloadImages() {
    // List of all images to preload
    const imagePaths = [
      'items/shrine.png',
      'items/blunt_sword2.png',
      'items/crude_helm.png',
      'items/rags2.png',
      // Add more as needed
    ];

    imagePaths.forEach(path => {
      const img = new Image();
      img.src = path;
      this.imageCache[path] = img;
    });
  }

  getCachedImage(path) {
    // Return cached image if available, otherwise create new one
    if (this.imageCache[path]) {
      return this.imageCache[path];
    }

    const img = new Image();
    img.src = path;
    this.imageCache[path] = img;
    return img;
  }

  setupCanvas() {
    const totalSize = this.gridSize * this.cellSize;
    this.canvas.width = totalSize;
    this.canvas.height = totalSize;
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' || e.key === 'R') {
        this.toggleResolutionMenu();
      }
      if (e.key === 'Escape' && this.menuOpen) {
        this.closeResolutionMenu();
      }
    });

    const buttons = document.querySelectorAll('.resolution-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const newSize = parseInt(btn.dataset.res);
        this.changeResolution(newSize);
        this.updateActiveButton(newSize);
      });
    });
  }

  setupMouseTracking() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const gridX = Math.floor(mouseX / this.cellSize);
      const gridY = Math.floor(mouseY / this.cellSize);

      const enemy = this.enemies.find(e => e.x === gridX && e.y === gridY);

      if (enemy) {
        if (!enemy.monsterData) {
          enemy.monsterData = getRandomMonster(enemy.mapType || this.currentMapType);
        }
        this.hoveredEnemy = {
          x: mouseX,
          y: mouseY,
          data: enemy.monsterData
        };
      } else {
        this.hoveredEnemy = null;
      }

      this.render();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredEnemy = null;
      this.render();
    });
  }

  toggleResolutionMenu() {
    this.menuOpen = !this.menuOpen;
    this.resolutionMenu.style.display = this.menuOpen ? 'block' : 'none';
    if (this.menuOpen) {
      this.updateActiveButton(this.cellSize);
    }
  }

  closeResolutionMenu() {
    this.menuOpen = false;
    this.resolutionMenu.style.display = 'none';
  }

  updateActiveButton(size) {
    const buttons = document.querySelectorAll('.resolution-btn');
    buttons.forEach(btn => {
      if (parseInt(btn.dataset.res) === size) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  changeResolution(newSize) {
    this.cellSize = newSize;
    this.setupCanvas();
    this.render();
    this.closeResolutionMenu();
  }

  setMessage(text, sender = 'System') {
    this.message = text;
    this.messages.push({ text, sender, timestamp: Date.now() });

    const messageBox = document.getElementById('messageBox');
    const messageList = document.getElementById('messageList');

    // Create message element
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message';

    const senderSpan = document.createElement('span');
    senderSpan.className = sender === 'System' ? 'system' : 'sender';
    senderSpan.textContent = sender + ':';

    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = text;

    msgDiv.appendChild(senderSpan);
    msgDiv.appendChild(textSpan);
    messageList.appendChild(msgDiv);

    // Auto-scroll to bottom
    messageList.scrollTop = messageList.scrollHeight;

    messageBox.classList.add('show');
  }

  setupChatHandlers() {
    const messageInput = document.getElementById('messageInput');

    const sendMessage = () => {
      const text = messageInput.value.trim();

      // Check if it's a bot command - don't send to server
      if (text.startsWith('/skip ') || text === '/skip off' || text === '/skip cancel') {
        // Let the simulator handle it
        return;
      }

      if (text && this.socket) {
        this.socket.emit('chat_message', {
          gameId: this.gameId,
          playerName: this.character.name,
          text: text
        });
        messageInput.value = '';
      }
    };

    // Prevent game hotkeys from triggering while typing in chat
    messageInput.addEventListener('keydown', (e) => {
      // Stop event from bubbling up to game handlers
      e.stopPropagation();

      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  checkTrap(x, y) {
    const trapIndex = this.traps.findIndex(trap => trap.x === x && trap.y === y);
    if (trapIndex !== -1) {
      this.traps.splice(trapIndex, 1);
      this.setMessage('You activated a trap!');
      this.render();
      return true;
    }
    return false;
  }

  checkShrine(x, y) {
    const shrineIndex = this.shrines.findIndex(shrine => shrine.x === x && shrine.y === y);
    if (shrineIndex !== -1) {
      this.shrines.splice(shrineIndex, 1);
      this.setMessage('You activated a shrine!');
      this.render();
      return true;
    }
    return false;
  }

  updateOtherPlayers(players) {
    this.otherPlayers = players.filter(p => p.name !== this.character.name);
    this.render();
  }

  drawOtherPlayer(x, y, player) {
    const px = x * this.cellSize;
    const py = y * this.cellSize;
    const equipment = player.equipment || {};

    const centerX = px + this.cellSize / 2;
    const centerY = py + this.cellSize / 2;
    const itemSize = this.cellSize / 2;

    // Background
    this.ctx.fillStyle = 'rgba(74, 159, 255, 0.1)';
    this.ctx.fillRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);

    // Draw equipment
    if (equipment.helm) {
      this.drawItemIcon(equipment.helm, centerX - itemSize / 2, py + 2, itemSize, itemSize);
    }

    if (equipment.weapon) {
      this.drawItemIcon(equipment.weapon, px - 4, centerY - itemSize / 2, itemSize, itemSize);
    }

    if (equipment.armor) {
      this.drawItemIcon(equipment.armor, centerX - itemSize / 2, centerY - itemSize / 2, itemSize, itemSize);
    }

    if (equipment.shield) {
      this.drawItemIcon(equipment.shield, px + this.cellSize - itemSize + 4, centerY - itemSize / 2, itemSize, itemSize);
    }

    // If no equipment, show colored square
    if (!equipment.weapon && !equipment.armor && !equipment.helm && !equipment.shield) {
      this.ctx.fillStyle = '#4a9eff';
      this.ctx.fillRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);
    }

    // Draw name
    this.ctx.fillStyle = '#4a9eff';
    this.ctx.font = '13px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(player.name, px + this.cellSize / 2, py - 5);
  }

  drawPlayer(x, y) {
    const px = x * this.cellSize;
    const py = y * this.cellSize;
    const inventory = this.inventory;

    const centerX = px + this.cellSize / 2;
    const centerY = py + this.cellSize / 2;
    const itemSize = this.cellSize / 2;

    this.ctx.fillStyle = 'rgba(74, 255, 74, 0.1)';
    this.ctx.fillRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);

    if (inventory.equipped.helm) {
      this.drawItemIcon(inventory.equipped.helm, centerX - itemSize / 2, py + 2, itemSize, itemSize);
    }

    if (inventory.equipped.weapon) {
      this.drawItemIcon(inventory.equipped.weapon, px - 4, centerY - itemSize / 2, itemSize, itemSize);
    }

    if (inventory.equipped.armor) {
      this.drawItemIcon(inventory.equipped.armor, centerX - itemSize / 2, centerY - itemSize / 2, itemSize, itemSize);
    }

    if (inventory.equipped.shield) {
      this.drawItemIcon(inventory.equipped.shield, px + this.cellSize - itemSize + 4, centerY - itemSize / 2, itemSize, itemSize);
    }

    if (!inventory.equipped.weapon && !inventory.equipped.armor &&
      !inventory.equipped.helm && !inventory.equipped.shield) {
      this.ctx.fillStyle = '#4aff4a';
      this.ctx.fillRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);
    }

    this.ctx.fillStyle = '#4aff4a';
    this.ctx.font = '13px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.character.name, px + this.cellSize / 2, py - 5);
  }

  drawItemIcon(item, x, y, width, height) {
    if (item.image) {
      const img = this.getCachedImage(item.image);

      if (img.complete) {
        this.ctx.drawImage(img, x, y, width, height);
      } else {
        img.onload = () => this.render();
        img.onerror = () => {
          this.ctx.fillStyle = this.getItemColor(item);
          this.ctx.fillRect(x, y, width, height);
        };
      }
    } else {
      this.ctx.fillStyle = this.getItemColor(item);
      this.ctx.fillRect(x, y, width, height);
    }
  }

  getItemColor(item) {
    switch (item.type) {
      case 'weapon': return '#ff4a4a';
      case 'armor': return '#4a9eff';
      case 'helm': return '#ffff4a';
      case 'shield': return '#ff8800';
      default: return '#888888';
    }
  }

  drawShrineImage(x, y) {
    const px = x * this.cellSize;
    const py = y * this.cellSize;

    const img = this.getCachedImage('items/shrine.png');

    if (img.complete) {
      this.ctx.drawImage(img, px, py, this.cellSize, this.cellSize);
    } else {
      img.onload = () => {
        this.ctx.drawImage(img, px, py, this.cellSize, this.cellSize);
      };
      // Fallback to colored square if image fails to load
      img.onerror = () => {
        this.ctx.fillStyle = '#9d4aff';
        this.ctx.fillRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);
      };
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const px = x * this.cellSize;
        const py = y * this.cellSize;

        if ((x + y) % 2 === 0) {
          this.ctx.fillStyle = '#1a1a1a';
        } else {
          this.ctx.fillStyle = '#0f0f0f';
        }

        this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
      }
    }

    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= this.gridSize; i++) {
      const pos = i * this.cellSize;

      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, this.canvas.height);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(this.canvas.width, pos);
      this.ctx.stroke();
    }

    if (this.inTown && this.currentTown) {
      this.currentTown.drawTown(this.ctx, this.cellSize);
    } else {
      if (this.shrines) {
        this.shrines.forEach(shrine => {
          this.drawShrineImage(shrine.x, shrine.y);
        });
      }

      this.enemies.forEach(enemy => {
        this.drawCell(enemy.x, enemy.y, '#ff4a4a');
      });

      // Draw exit portals (yellow, like town exits)
      if (this.exits) {
        this.exits.forEach(exit => {
          this.drawCell(exit.x, exit.y, '#ffff4a');
        });
      }
    }

    // Filter players by current location
    const currentLocation = this.inTown && this.currentTown
      ? this.currentTown.name
      : this.currentMapType || 'wilderness';

    const visiblePlayers = this.otherPlayers.filter(p => {
      const playerLocation = p.location || 'Skargnes';
      return playerLocation === currentLocation;
    });

    visiblePlayers.forEach(player => {
      this.drawOtherPlayer(player.x, player.y, player);
    });

    this.drawPlayer(this.player.x, this.player.y);

    if (this.hoveredEnemy) {
      this.drawEnemyTooltip(this.hoveredEnemy.x, this.hoveredEnemy.y, this.hoveredEnemy.data);
    }
  }

  drawEnemyTooltip(mouseX, mouseY, monster) {
    const padding = 15;
    const lineHeight = 18;
    const fontSize = 14;

    const lines = [
      { text: monster.name, color: '#fff', bold: true },
      { text: `Damage: ${monster.damage}`, color: '#ff4a4a' },
      { text: `Defense: ${monster.defense}`, color: '#4a9eff' },
      { text: `HP: ${monster.hp}`, color: '#4aff4a' },
      { text: 'Resistances:', color: '#888', small: true }
    ];

    Object.keys(monster.resistances).forEach(key => {
      if (monster.resistances[key] > 0) {
        const percent = (monster.resistances[key] * 100).toFixed(0);
        lines.push({
          text: `  ${key}: ${percent}%`,
          color: '#ffff4a',
          small: true
        });
      }
    });

    this.ctx.font = `${fontSize}px Arial`;
    const maxWidth = Math.max(...lines.map(line => this.ctx.measureText(line.text).width));
    const tooltipWidth = maxWidth + padding * 2;
    const tooltipHeight = lines.length * lineHeight + padding * 2;

    let tooltipX = mouseX + 15;
    let tooltipY = mouseY + 15;

    if (tooltipX + tooltipWidth > this.canvas.width) {
      tooltipX = mouseX - tooltipWidth - 15;
    }
    if (tooltipY + tooltipHeight > this.canvas.height) {
      tooltipY = mouseY - tooltipHeight - 15;
    }

    this.ctx.fillStyle = 'rgba(26, 26, 26, 0.95)';
    this.ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

    this.ctx.strokeStyle = '#4a7c3e';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

    let currentY = tooltipY + padding + fontSize;
    lines.forEach(line => {
      const size = line.small ? fontSize - 2 : fontSize;
      this.ctx.font = `${line.bold ? 'bold' : 'normal'} ${size}px Arial`;
      this.ctx.fillStyle = line.color;
      this.ctx.fillText(line.text, tooltipX + padding, currentY);
      currentY += lineHeight;
    });
  }

  drawCell(x, y, color) {
    const px = x * this.cellSize;
    const py = y * this.cellSize;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);
  }
}