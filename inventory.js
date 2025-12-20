class Inventory {
  constructor(game, socket) {
    this.game = game;
    this.socket = socket;
    this.isOpen = false;
    this.slots = Array(30).fill(null);
    this.gold = 0;

    // Equipment slots
    this.equipped = {
      weapon: null,
      armor: null,
      helm: null,
      shield: null
    };

    // For item management
    this.selectedItem = null;
    this.selectedSlot = null;

    this.setupEventListeners();
    this.createInventoryUI();
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    // Listen for inventory updates from server
    this.socket.on('inventory_updated', (data) => {
      this.slots = data.slots || Array(30).fill(null);
      this.equipped = data.equipped || { weapon: null, armor: null, helm: null, shield: null };
      this.gold = data.gold || 0;

      if (this.isOpen) {
        this.render();
      }
    });

    this.socket.on('inventory_full', () => {
      this.game.setMessage('Inventory is full!');
    });
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'i' || e.key === 'I') {
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  createInventoryUI() {
    const inventoryDiv = document.createElement('div');
    inventoryDiv.id = 'inventoryUI';
    inventoryDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(10, 10, 10, 0.95);
      display: none;
      z-index: 2000;
      padding: 40px;
      overflow-y: auto;
    `;

    inventoryDiv.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <h1 style="color: #4aff4a; font-size: 32px;">Inventory</h1>
          <div style="color: #ffff4a; font-size: 20px;">
            <span style="color: #888;">Gold:</span> <span id="goldAmount">0</span> Crownel
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 300px 1fr; gap: 30px;">
          <!-- Equipment Panel -->
          <div>
            <h2 style="color: #888; font-size: 18px; margin-bottom: 15px;">Equipment</h2>
            <div style="background-color: #1a1a1a; border: 2px solid #333; border-radius: 8px; padding: 20px;">
              <div id="weaponSlot" class="equipment-slot" data-slot="weapon" style="margin-bottom: 15px;">
                <div style="color: #888; font-size: 14px; margin-bottom: 5px;">Weapon</div>
                <div class="equipment-item" style="background-color: #0a0a0a; border: 2px solid #333; border-radius: 4px; padding: 15px; min-height: 60px;"></div>
              </div>
              <div id="armorSlot" class="equipment-slot" data-slot="armor" style="margin-bottom: 15px;">
                <div style="color: #888; font-size: 14px; margin-bottom: 5px;">Armor</div>
                <div class="equipment-item" style="background-color: #0a0a0a; border: 2px solid #333; border-radius: 4px; padding: 15px; min-height: 60px;"></div>
              </div>
              <div id="helmSlot" class="equipment-slot" data-slot="helm" style="margin-bottom: 15px;">
                <div style="color: #888; font-size: 14px; margin-bottom: 5px;">Helm</div>
                <div class="equipment-item" style="background-color: #0a0a0a; border: 2px solid #333; border-radius: 4px; padding: 15px; min-height: 60px;"></div>
              </div>
              <div id="shieldSlot" class="equipment-slot" data-slot="shield">
                <div style="color: #888; font-size: 14px; margin-bottom: 5px;">Shield</div>
                <div class="equipment-item" style="background-color: #0a0a0a; border: 2px solid #333; border-radius: 4px; padding: 15px; min-height: 60px;"></div>
              </div>
            </div>
          </div>

          <!-- Inventory Grid -->
          <div>
            <h2 style="color: #888; font-size: 18px; margin-bottom: 15px;">Items (30 slots)</h2>
            <div id="inventoryGrid" style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 10px;">
              <!-- Slots generated dynamically -->
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
          <div>Press I or ESC to close</div>
          <div style="margin-top: 10px; font-size: 12px;">
            Click equipped items to unequip • Click inventory items to equip • Shift + Right-click to delete
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(inventoryDiv);
    this.inventoryUI = inventoryDiv;

    this.generateInventorySlots();
  }

  generateInventorySlots() {
    const grid = document.getElementById('inventoryGrid');
    grid.innerHTML = '';

    for (let i = 0; i < 30; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.dataset.index = i;
      slot.style.cssText = `
        aspect-ratio: 1;
        background-color: #1a1a1a;
        border: 2px solid #333;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
      `;

      slot.addEventListener('mouseenter', (e) => {
        e.target.style.borderColor = '#4a7c3e';
        e.target.style.backgroundColor = '#222';
      });

      slot.addEventListener('mouseleave', (e) => {
        e.target.style.borderColor = '#333';
        e.target.style.backgroundColor = '#1a1a1a';
      });

      grid.appendChild(slot);
    }
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
    this.inventoryUI.style.display = 'block';
    this.render();
  }

  close() {
    this.isOpen = false;
    this.inventoryUI.style.display = 'none';
  }

  addItem(item) {
    // Emit to server instead of modifying directly
    this.socket.emit('inventory_pickup_item', { item });
    this.game.setMessage(`Picking up: ${item.name}`);
  }

  addGold(amount) {
    // Emit to server instead of modifying directly
    this.socket.emit('inventory_add_gold', { amount });
    this.game.setMessage(`Picking up ${amount} Crownel`);
  }

  equipItem(item, slotType) {
    // This method is deprecated - use swapEquipment instead
    // Kept for compatibility
  }

  unequipItem(slotType) {
    // Emit to server instead of modifying directly
    this.socket.emit('inventory_unequip_item', { slotType });
  }

  swapEquipment(inventoryIndex) {
    this.socket.emit('inventory_equip_item', { inventoryIndex });
  }

  deleteItem(inventoryIndex) {
    const item = this.slots[inventoryIndex];
    if (!item) return;

    if (confirm(`Delete ${item.name}? This cannot be undone.`)) {
      // Emit to server instead of modifying directly
      this.socket.emit('inventory_delete_item', { inventoryIndex });
    }
  }

  render() {
    // Update gold display
    document.getElementById('goldAmount').textContent = this.gold;

    // Render equipment slots
    this.renderEquipmentSlot('weapon', this.equipped.weapon);
    this.renderEquipmentSlot('armor', this.equipped.armor);
    this.renderEquipmentSlot('helm', this.equipped.helm);
    this.renderEquipmentSlot('shield', this.equipped.shield);

    // Render inventory slots
    const slots = document.querySelectorAll('.inventory-slot');
    slots.forEach((slot, index) => {
      const item = this.slots[index];
      if (item) {
        slot.innerHTML = this.renderItem(item);
        slot.style.cursor = 'pointer';

        // Left click to equip
        slot.onclick = (e) => {
          e.preventDefault();
          this.swapEquipment(index);
        };

        // Right click to delete (with Shift key)
        slot.oncontextmenu = (e) => {
          e.preventDefault();
          if (e.shiftKey) {
            this.deleteItem(index);
          } else {
            this.game.setMessage('Hold Shift + Right-click to delete item');
          }
        };
      } else {
        slot.innerHTML = '';
        slot.style.cursor = 'default';
        slot.onclick = null;
        slot.oncontextmenu = null;
      }
    });
  }

  renderEquipmentSlot(slotType, item) {
    const slotElement = document.querySelector(`#${slotType}Slot .equipment-item`);
    if (!slotElement) return;

    if (item) {
      slotElement.innerHTML = this.renderItem(item, true);
      slotElement.style.cursor = 'pointer';

      // Click to unequip
      slotElement.onclick = () => {
        this.unequipItem(slotType);
      };
    } else {
      slotElement.innerHTML = '<div style="color: #444; font-size: 12px; text-align: center;">Empty</div>';
      slotElement.style.cursor = 'default';
      slotElement.onclick = null;
    }
  }

  renderItem(item, isEquipment = false) {
    const tierColor = item.tierData.color;
    const stats = [];

    if (item.damage) stats.push(`DMG: ${item.damage}`);
    if (item.defense) stats.push(`DEF: ${item.defense}`);
    if (item.speed) stats.push(`SPD: ${item.speed}`);
    if (item.blockChance) stats.push(`Block: ${(item.blockChance * 100).toFixed(0)}%`);

    const hasImage = item.image && item.image !== '';

    return `
    <div style="width: 100%; text-align: ${isEquipment ? 'left' : 'center'}; display: flex; ${isEquipment ? 'flex-direction: row; align-items: center; gap: 10px;' : 'flex-direction: column; align-items: center;'}">
      ${hasImage ? `
        <img src="${item.image}" 
             style="width: ${isEquipment ? '40px' : '100%'}; height: ${isEquipment ? '40px' : 'auto'}; max-height: ${isEquipment ? '40px' : '60px'}; object-fit: contain; image-rendering: pixelated;"
             onerror="this.style.display='none'"
        />
      ` : ''}
      <div style="flex: 1;">
        <div style="color: ${tierColor}; font-size: ${isEquipment ? '14px' : '12px'}; font-weight: bold; margin-bottom: 5px;">
          ${item.name}
        </div>
        ${item.tier !== 'NORMAL' ? `<div style="color: ${tierColor}; font-size: 10px; margin-bottom: 5px;">${item.tierData.name}</div>` : ''}
        <div style="color: #888; font-size: ${isEquipment ? '12px' : '10px'};">
          ${stats.join(' | ')}
        </div>
      </div>
    </div>
  `;
  }
}