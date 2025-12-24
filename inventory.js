class Inventory {
  constructor(game, socket) {
    this.game = game;
    this.socket = socket;
    this.isOpen = false;

    // Read-only state (controlled by server)
    this.slots = Array(30).fill(null);
    this.gold = 0;
    this.experience = 0;

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

    // Loot filter settings - which tiers to auto-pickup
    this.lootFilter = {
      NORMAL: true,
      MAGICAL: true,
      RARE: true,
      COMPOUND: true,
      UNIQUE: true,
      LEGENDARY: true
    };

    // Load loot filter from localStorage if available
    try {
      const savedFilter = localStorage.getItem('lootFilter');
      if (savedFilter) {
        this.lootFilter = JSON.parse(savedFilter);
      }
    } catch (e) {
      console.error('Failed to load loot filter:', e);
    }

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
      this.experience = data.experience || 0;

      if (this.isOpen) {
        this.render();
      }
    });

    this.socket.on('experience_updated', (data) => {
      this.experience = data.experience || 0;
      this.game.setMessage(`+${data.gained} XP! (Total: ${this.experience})`);

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
      // Shift + Del to delete all items
      if ((e.key === 'Delete' || e.key === 'Del') && e.shiftKey && this.isOpen) {
        this.deleteAllItems();
      }
    });

    // Create custom tooltip element
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'customTooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      display: none;
      background-color: rgba(10, 10, 10, 0.95);
      border: 2px solid #666;
      border-radius: 4px;
      padding: 10px;
      z-index: 10000;
      pointer-events: none;
      max-width: 300px;
      font-size: 12px;
      line-height: 1.4;
    `;
    document.body.appendChild(this.tooltip);
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
            <span style="margin-left: 20px; color: #888;">Power:</span> <span id="powerDisplay" style="color: #4aff4a; font-weight: bold;">0</span>
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

            <!-- Loot Filter Panel -->
            <h2 style="color: #888; font-size: 18px; margin-bottom: 15px; margin-top: 20px;">Loot Filter</h2>
            <div style="background-color: #1a1a1a; border: 2px solid #333; border-radius: 8px; padding: 20px;">
              <div style="color: #888; font-size: 12px; margin-bottom: 10px;">Auto-pickup:</div>
              <div id="lootFilterContainer" style="display: flex; flex-direction: column; gap: 8px;">
                <!-- Checkboxes generated dynamically -->
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
            Click equipped items to unequip • Click inventory items to equip • Shift + Right-click to delete • Shift + Del to delete all
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(inventoryDiv);
    this.inventoryUI = inventoryDiv;

    this.generateInventorySlots();
    this.generateLootFilterUI();
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

  generateLootFilterUI() {
    const container = document.getElementById('lootFilterContainer');
    if (!container) return;

    const tierColors = {
      NORMAL: '#888888',
      MAGICAL: '#4a9eff',
      RARE: '#ffff4a',
      COMPOUND: '#ff8800',
      UNIQUE: '#ff4aff',
      LEGENDARY: '#ff4a4a'
    };

    const tiers = ['NORMAL', 'MAGICAL', 'RARE', 'COMPOUND', 'UNIQUE', 'LEGENDARY'];

    tiers.forEach(tier => {
      const label = document.createElement('label');
      label.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
      `;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = this.lootFilter[tier];
      checkbox.style.cssText = `
        cursor: pointer;
        width: 16px;
        height: 16px;
      `;

      checkbox.addEventListener('change', (e) => {
        this.lootFilter[tier] = e.target.checked;
        localStorage.setItem('lootFilter', JSON.stringify(this.lootFilter));
        this.game.setMessage(`${tier} items ${e.target.checked ? 'enabled' : 'disabled'} for auto-pickup`);
      });

      const text = document.createElement('span');
      text.textContent = tier.charAt(0) + tier.slice(1).toLowerCase();
      text.style.cssText = `
        color: ${tierColors[tier]};
        font-size: 14px;
        font-weight: bold;
      `;

      label.appendChild(checkbox);
      label.appendChild(text);
      container.appendChild(label);
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

  deleteAllItems() {
    const itemCount = this.slots.filter(item => item !== null).length;
    if (itemCount === 0) {
      this.game.setMessage('No items to delete!');
      return;
    }

    if (confirm(`Delete ALL ${itemCount} items? This cannot be undone!`)) {
      // Emit to server to delete all items
      this.socket.emit('inventory_delete_all_items');
    }
  }

  updatePowerDisplay() {
    const powerElement = document.getElementById('powerDisplay');
    if (!powerElement) return;

    // Calculate power using same logic as fight.js
    let damage = 0;
    let defense = 0;
    let blockChance = 0;

    // Calculate weapon damage with bonuses
    let weaponDamageBonus = 0;
    Object.values(this.equipped).forEach(item => {
      if (!item) return;
      const prefixes = item.prefixes || (item.prefix ? [item.prefix] : []);
      const suffixes = item.suffixes || (item.suffix ? [item.suffix] : []);

      prefixes.forEach(prefix => {
        if (prefix.type === 'increased_weapon_damage') {
          weaponDamageBonus += prefix.value;
        }
      });

      suffixes.forEach(suffix => {
        if (suffix.type === 'increased_weapon_damage') {
          weaponDamageBonus += suffix.value;
        }
      });
    });

    if (this.equipped.weapon) {
      const baseDamage = this.equipped.weapon.damage || 0;
      const modifiedDamage = weaponDamageBonus > 0
        ? baseDamage * (1 + weaponDamageBonus / 100)
        : baseDamage;
      damage += modifiedDamage;
    }

    if (this.equipped.armor) {
      defense += this.equipped.armor.defense || 0;
    }

    if (this.equipped.shield) {
      defense += this.equipped.shield.defense || 0;
      blockChance += (this.equipped.shield.blockChance || 0) * 100;
    }

    if (this.equipped.helm) {
      defense += this.equipped.helm.defense || 0;
    }

    // Check for set bonuses
    const equippedSetPieces = {};
    Object.values(this.equipped).forEach(item => {
      if (item && item.setId) {
        if (!equippedSetPieces[item.setId]) {
          equippedSetPieces[item.setId] = [];
        }
        equippedSetPieces[item.setId].push(item.id);
      }
    });

    // Apply set bonuses
    if (typeof SET_BONUSES !== 'undefined') {
      Object.keys(equippedSetPieces).forEach(setId => {
        if (SET_BONUSES[setId]) {
          const setBonusConfig = SET_BONUSES[setId];
          const setPieceCount = equippedSetPieces[setId].length;

          Object.keys(setBonusConfig.bonuses).forEach(requiredPieces => {
            if (setPieceCount >= parseInt(requiredPieces)) {
              const bonuses = setBonusConfig.bonuses[requiredPieces];

              if (bonuses.increased_weapon_damage && this.equipped.weapon) {
                const avgIncrease = (bonuses.increased_weapon_damage.min + bonuses.increased_weapon_damage.max) / 2;
                damage *= (1 + avgIncrease / 100);
              }

              if (bonuses.weapon_damage_bonus) {
                damage += bonuses.weapon_damage_bonus;
              }
            }
          });
        }
      });
    }

    const blockMultiplier = blockChance > 0 ? 1 / (1 - blockChance / 100) : 1;
    const power = Math.floor((defense * damage) * blockMultiplier);

    powerElement.textContent = power.toLocaleString();
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
        // Compact view: just name and tier
        const tierColor = item.tierData ? item.tierData.color : '#888888';
        slot.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 5px;">
            <div style="font-size: 11px; font-weight: bold; color: ${tierColor}; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">
              ${item.name}
            </div>
            <div style="font-size: 9px; color: ${tierColor}; margin-top: 2px;">
              ${item.tierData ? item.tierData.name : 'Normal'}
            </div>
          </div>
        `;

        // Custom tooltip on hover
        slot.onmouseenter = (e) => {
          this.tooltip.innerHTML = this.renderItemTooltipHTML(item);
          this.tooltip.style.display = 'block';
        };

        slot.onmousemove = (e) => {
          this.tooltip.style.left = (e.clientX + 15) + 'px';
          this.tooltip.style.top = (e.clientY + 15) + 'px';
        };

        slot.onmouseleave = () => {
          this.tooltip.style.display = 'none';
        };

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
        slot.onmouseenter = null;
        slot.onmousemove = null;
        slot.onmouseleave = null;
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

    // Update power display whenever equipment changes
    this.updatePowerDisplay();
  }

  renderItemTooltip(item) {
    if (!item || !item.tierData) return '';

    // Use compound name for Compound tier items if available
    let displayName = item.name;
    if (item.tier === 'COMPOUND' && item.id && BASE_ITEMS[item.id]) {
      if (BASE_ITEMS[item.id].compoundName) {
        displayName = BASE_ITEMS[item.id].compoundName;
      }
    }

    let tooltip = `${displayName} (${item.tierData.name})`;

    // Add stats
    if (item.damage) tooltip += `\nDMG: ${item.damage}`;
    if (item.defense) tooltip += `\nDEF: ${item.defense}`;
    if (item.speed) tooltip += `\nSPD: ${item.speed}`;
    if (item.blockChance) tooltip += `\nBlock: ${(item.blockChance * 100).toFixed(0)}%`;

    // Add affixes
    const prefixes = item.prefixes || (item.prefix ? [item.prefix] : []);
    const suffixes = item.suffixes || (item.suffix ? [item.suffix] : []);

    const prefixGroups = {};
    const suffixGroups = {};

    prefixes.forEach(prefix => {
      if (!prefixGroups[prefix.type]) prefixGroups[prefix.type] = 0;
      prefixGroups[prefix.type] += prefix.value;
    });

    suffixes.forEach(suffix => {
      if (!suffixGroups[suffix.type]) suffixGroups[suffix.type] = 0;
      suffixGroups[suffix.type] += suffix.value;
    });

    const allTypes = new Set([...Object.keys(prefixGroups), ...Object.keys(suffixGroups)]);

    allTypes.forEach(type => {
      const prefixValue = prefixGroups[type] || 0;
      const suffixValue = suffixGroups[type] || 0;
      const totalValue = prefixValue + suffixValue;

      const propName = type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
      if (type.includes('increased')) {
        tooltip += `\n${propName} by ${totalValue}%`;
      } else {
        tooltip += `\n+${totalValue} to ${propName}`;
      }
    });

    // Check for set bonuses
    if (item.setId && typeof SET_BONUSES !== 'undefined' && SET_BONUSES[item.setId]) {
      const setBonusConfig = SET_BONUSES[item.setId];
      tooltip += `\n\n--- Set: ${setBonusConfig.name} ---`;

      // Check how many pieces of the set are equipped
      const equippedSetPieces = [];
      Object.values(this.equipped).forEach(equippedItem => {
        if (equippedItem && equippedItem.setId === item.setId) {
          equippedSetPieces.push(equippedItem.id);
        }
      });

      const setPieceCount = equippedSetPieces.length;
      tooltip += `\n(${setPieceCount}/${setBonusConfig.pieces.length})`;

      // Show set bonuses
      Object.keys(setBonusConfig.bonuses).forEach(requiredPieces => {
        const bonuses = setBonusConfig.bonuses[requiredPieces];
        const isActive = setPieceCount >= parseInt(requiredPieces);
        const color = isActive ? '✓' : '✗';

        tooltip += `\n${color} ${requiredPieces} pieces:`;
        if (bonuses.increased_weapon_damage) {
          tooltip += `\n  ${bonuses.increased_weapon_damage.min}-${bonuses.increased_weapon_damage.max}% Increased Weapon Damage`;
        }
        if (bonuses.weapon_damage_bonus) {
          tooltip += `\n  +${bonuses.weapon_damage_bonus} to Maximum Damage`;
        }
      });
    }

    return tooltip;
  }

  renderItemTooltipHTML(item) {
    if (!item || !item.tierData) return '';

    const tierColor = item.tierData.color;
    let html = `<div style="color: ${tierColor}; font-weight: bold; margin-bottom: 5px;">${item.name}</div>`;
    html += `<div style="color: ${tierColor}; font-size: 11px; margin-bottom: 8px;">${item.tierData.name}</div>`;

    // Add stats
    if (item.damage) html += `<div style="color: #fff;">DMG: ${item.damage}</div>`;
    if (item.defense) html += `<div style="color: #fff;">DEF: ${item.defense}</div>`;
    if (item.speed) html += `<div style="color: #fff;">SPD: ${item.speed}</div>`;
    if (item.blockChance) html += `<div style="color: #fff;">Block: ${(item.blockChance * 100).toFixed(0)}%</div>`;

    // Add affixes
    const prefixes = item.prefixes || (item.prefix ? [item.prefix] : []);
    const suffixes = item.suffixes || (item.suffix ? [item.suffix] : []);

    const prefixGroups = {};
    const suffixGroups = {};

    prefixes.forEach(prefix => {
      if (!prefixGroups[prefix.type]) prefixGroups[prefix.type] = 0;
      prefixGroups[prefix.type] += prefix.value;
    });

    suffixes.forEach(suffix => {
      if (!suffixGroups[suffix.type]) suffixGroups[suffix.type] = 0;
      suffixGroups[suffix.type] += suffix.value;
    });

    // Find stacked types
    const stackedTypes = new Set();
    Object.keys(prefixGroups).forEach(type => {
      if (suffixGroups[type]) stackedTypes.add(type);
    });

    const allTypes = new Set([...Object.keys(prefixGroups), ...Object.keys(suffixGroups)]);

    if (allTypes.size > 0) {
      html += `<div style="margin-top: 8px;"></div>`;
      allTypes.forEach(type => {
        const prefixValue = prefixGroups[type] || 0;
        const suffixValue = suffixGroups[type] || 0;
        const totalValue = prefixValue + suffixValue;

        // Determine color
        let color;
        if (stackedTypes.has(type)) {
          color = '#ffffff'; // White for stacked
        } else if (prefixValue > 0) {
          color = '#88ff88'; // Green for prefix-only
        } else {
          color = '#ffaa44'; // Orange for suffix-only
        }

        const propName = type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
        if (type.includes('increased')) {
          html += `<div style="color: ${color};">${propName} by ${totalValue}%</div>`;
        } else {
          html += `<div style="color: ${color};">+${totalValue} to ${propName}</div>`;
        }
      });
    }

    // Add set bonus display
    if (item.setId && typeof SET_BONUSES !== 'undefined' && SET_BONUSES[item.setId]) {
      const setBonusConfig = SET_BONUSES[item.setId];

      // Check how many pieces of the set are equipped
      const equippedSetPieces = [];
      Object.values(this.equipped).forEach(equippedItem => {
        if (equippedItem && equippedItem.setId === item.setId) {
          equippedSetPieces.push(equippedItem.id);
        }
      });

      const setPieceCount = equippedSetPieces.length;
      const isSetComplete = setPieceCount >= setBonusConfig.pieces.length;
      const setColor = isSetComplete ? '#4aff4a' : '#888';

      html += `<div style="color: ${setColor}; margin-top: 8px; font-size: 11px;">--- ${setBonusConfig.name} (${setPieceCount}/${setBonusConfig.pieces.length}) ---</div>`;

      // Show set bonuses
      Object.keys(setBonusConfig.bonuses).forEach(requiredPieces => {
        const bonuses = setBonusConfig.bonuses[requiredPieces];
        const isActive = setPieceCount >= parseInt(requiredPieces);
        const bonusColor = isActive ? '#4aff4a' : '#666';

        if (bonuses.increased_weapon_damage) {
          html += `<div style="color: ${bonusColor}; font-size: 10px;">${isActive ? '✓' : '✗'} ${bonuses.increased_weapon_damage.min}-${bonuses.increased_weapon_damage.max}% Inc Weapon Dmg</div>`;
        }
        if (bonuses.weapon_damage_bonus) {
          html += `<div style="color: ${bonusColor}; font-size: 10px;">${isActive ? '✓' : '✗'} +${bonuses.weapon_damage_bonus} Max Damage</div>`;
        }
      });
    }

    return html;
  }

  renderItem(item, isEquipment = false) {
    if (!item || !item.tierData) return '';

    const tierColor = item.tierData.color;
    const stats = [];

    // Calculate increased_weapon_damage percentage from all equipped items
    let weaponDamageBonus = 0;

    if (item.type === 'weapon') {
      // Check all equipped items for increased_weapon_damage
      Object.values(this.equipped).forEach(equippedItem => {
        if (!equippedItem) return;

        // Handle both old format (prefix/suffix) and new format (prefixes/suffixes arrays)
        const prefixes = equippedItem.prefixes || (equippedItem.prefix ? [equippedItem.prefix] : []);
        const suffixes = equippedItem.suffixes || (equippedItem.suffix ? [equippedItem.suffix] : []);

        prefixes.forEach(prefix => {
          if (prefix.type === 'increased_weapon_damage') {
            weaponDamageBonus += prefix.value;
          }
        });

        suffixes.forEach(suffix => {
          if (suffix.type === 'increased_weapon_damage') {
            weaponDamageBonus += suffix.value;
          }
        });
      });

      // If this weapon is NOT currently equipped, also check its own affixes
      // since they would apply if it were equipped
      if (this.equipped.weapon?.uniqueId !== item.uniqueId) {
        const prefixes = item.prefixes || (item.prefix ? [item.prefix] : []);
        const suffixes = item.suffixes || (item.suffix ? [item.suffix] : []);

        prefixes.forEach(prefix => {
          if (prefix.type === 'increased_weapon_damage') {
            weaponDamageBonus += prefix.value;
          }
        });

        suffixes.forEach(suffix => {
          if (suffix.type === 'increased_weapon_damage') {
            weaponDamageBonus += suffix.value;
          }
        });
      }
    }

    // Apply weapon damage bonus to display
    if (item.damage) {
      const baseDamage = item.damage;
      const modifiedDamage = weaponDamageBonus > 0
        ? (baseDamage * (1 + weaponDamageBonus / 100)).toFixed(1)
        : baseDamage;
      stats.push(`DMG: ${modifiedDamage}`);
    }

    if (item.defense) stats.push(`DEF: ${item.defense}`);
    if (item.speed) stats.push(`SPD: ${item.speed}`);
    if (item.blockChance) stats.push(`Block: ${(item.blockChance * 100).toFixed(0)}%`);

    const hasImage = item.image && item.image !== '';

    // Affix display format mapping
    const AFFIX_DISPLAY_FORMATS = {
      'increased_damage': (value) => `Increased Damage by ${value}%`,
      'increased_weapon_damage': (value) => `Increased Weapon Damage by ${value}%`,
      'increased_speed': (value) => `Increased Speed by ${value}%`,
      // Default format for stats without custom formatting
      'default': (value, type) => {
        const propName = type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
        return `+${value} to ${propName}`;
      }
    };

    // Build affix display - handle both arrays and legacy single objects
    let affixHTML = '';
    const prefixes = item.prefixes || (item.prefix ? [item.prefix] : []);
    const suffixes = item.suffixes || (item.suffix ? [item.suffix] : []);

    // Group prefixes and suffixes separately first
    const prefixGroups = {};
    const suffixGroups = {};

    prefixes.forEach(prefix => {
      if (!prefixGroups[prefix.type]) {
        prefixGroups[prefix.type] = 0;
      }
      prefixGroups[prefix.type] += prefix.value;
    });

    suffixes.forEach(suffix => {
      if (!suffixGroups[suffix.type]) {
        suffixGroups[suffix.type] = 0;
      }
      suffixGroups[suffix.type] += suffix.value;
    });

    // Find which affixes appear in both (these will be white)
    const stackedTypes = new Set();
    Object.keys(prefixGroups).forEach(type => {
      if (suffixGroups[type]) {
        stackedTypes.add(type);
      }
    });

    // Display all affixes
    const allTypes = new Set([...Object.keys(prefixGroups), ...Object.keys(suffixGroups)]);

    allTypes.forEach(type => {
      const prefixValue = prefixGroups[type] || 0;
      const suffixValue = suffixGroups[type] || 0;
      const totalValue = prefixValue + suffixValue;

      // Determine color: white if stacked, green if prefix-only, orange if suffix-only
      let color;
      if (stackedTypes.has(type)) {
        color = '#ffffff'; // White for stacked
      } else if (prefixValue > 0) {
        color = '#88ff88'; // Green for prefix-only
      } else {
        color = '#ffaa44'; // Orange for suffix-only
      }

      const formatter = AFFIX_DISPLAY_FORMATS[type] || AFFIX_DISPLAY_FORMATS['default'];
      const displayText = typeof formatter === 'function'
        ? formatter(totalValue, type)
        : formatter;
      affixHTML += `<div style="color: ${color}; font-size: ${isEquipment ? '11px' : '10px'}; margin-top: 3px;">
        ${displayText}
      </div>`;
    });

    return `
    <div style="width: 100%; text-align: ${isEquipment ? 'left' : 'center'}; display: flex; ${isEquipment ? 'flex-direction: row; align-items: center; gap: 10px;' : 'flex-direction: column; align-items: center;'}">
      ${hasImage ? `
        <img src="${item.image}" 
             style="width: ${isEquipment ? '40px' : '100%'}; height: ${isEquipment ? '40px' : 'auto'}; max-height: ${isEquipment ? '40px' : '60px'}; object-fit: contain; image-rendering: pixelated;"
             onerror="this.style.display='none'"
        />
      ` : ''
      }
    <div style="flex: 1;">
      <div style="color: ${tierColor}; font-size: ${isEquipment ? '14px' : '12px'}; font-weight: bold; margin-bottom: 5px;">
        ${item.name}
      </div>
      ${item.tier !== 'NORMAL' ? `<div style="color: ${tierColor}; font-size: 10px; margin-bottom: 5px;">${item.tierData.name}</div>` : ''}
      <div style="color: #888; font-size: ${isEquipment ? '12px' : '10px'};">
        ${stats.join(' | ')}
      </div>
      ${affixHTML}
    </div>
    </div >
      `;
  }
}