class Inventory {
  constructor(game) {
    this.game = game;
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
    
    this.setupEventListeners();
    this.createInventoryUI();
    
    // Load starter gear
    this.loadStarterGear();
  }

  loadStarterGear() {
    const starterGear = getStarterGear(this.game.character.class);
    this.equipped.weapon = starterGear.weapon;
    this.equipped.armor = starterGear.armor;
    this.equipped.helm = starterGear.helm;
    this.equipped.shield = starterGear.shield;
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
          Press I or ESC to close
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
    const emptySlot = this.slots.findIndex(slot => slot === null);
    if (emptySlot !== -1) {
      this.slots[emptySlot] = item;
      this.game.setMessage(`Picked up: ${item.name}`);
      if (this.isOpen) this.render();
      return true;
    } else {
      this.game.setMessage('Inventory is full!');
      return false;
    }
  }

  addGold(amount) {
    this.gold += amount;
    this.game.setMessage(`Picked up ${amount} Crownel`);
    if (this.isOpen) this.render();
  }

  equipItem(item, slotType) {
    this.equipped[slotType] = item;
    if (this.isOpen) this.render();
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
      } else {
        slot.innerHTML = '';
      }
    });
  }

  renderEquipmentSlot(slotType, item) {
    const slotElement = document.querySelector(`#${slotType}Slot .equipment-item`);
    if (!slotElement) return;
    
    if (item) {
      slotElement.innerHTML = this.renderItem(item, true);
    } else {
      slotElement.innerHTML = '<div style="color: #444; font-size: 12px; text-align: center;">Empty</div>';
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