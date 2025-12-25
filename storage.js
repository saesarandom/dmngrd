class Storage {
    constructor(game, socket) {
        this.game = game;
        this.socket = socket;
        this.isOpen = false;

        // Storage has 60 slots (6 rows x 10 columns)
        this.slots = Array(60).fill(null);

        // For item management
        this.selectedStorageSlot = null;
        this.transferMode = null; // 'toStorage' or 'toInventory'

        this.setupSocketListeners();
        this.createStorageUI();
    }

    setupSocketListeners() {
        // Listen for storage updates from server
        this.socket.on('storage_updated', (data) => {
            this.slots = data.slots || Array(60).fill(null);

            if (this.isOpen) {
                this.render();
            }
        });
    }

    createStorageUI() {
        const storageDiv = document.createElement('div');
        storageDiv.id = 'storageUI';
        storageDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(10, 10, 10, 0.95);
      display: none;
      z-index: 3000;
      padding: 40px;
      overflow-y: auto;
    `;

        storageDiv.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <h1 style="color: #4a9eff; font-size: 32px;">Storage</h1>
          <button id="closeStorageBtn" style="
            background-color: #ff4a4a;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          ">Close (ESC)</button>
        </div>

        <div style="margin-bottom: 20px; color: #888; font-size: 14px;">
          Click a storage slot to select it, then click an inventory item to move it to storage.<br>
          Click a storage slot with an item to select it, then click an empty inventory slot to move it to inventory.
        </div>

        <!-- Storage Grid -->
        <div>
          <h2 style="color: #888; font-size: 18px; margin-bottom: 15px;">Storage (60 slots)</h2>
          <div id="storageGrid" style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 10px; margin-bottom: 30px;">
            <!-- Slots generated dynamically -->
          </div>
        </div>

        <!-- Inventory Grid -->
        <div>
          <h2 style="color: #888; font-size: 18px; margin-bottom: 15px;">Your Inventory</h2>
          <div id="storageInventoryGrid" style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 10px;">
            <!-- Slots generated dynamically -->
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(storageDiv);
        this.storageUI = storageDiv;

        // Close button handler
        document.getElementById('closeStorageBtn').addEventListener('click', () => {
            this.close();
        });

        // ESC key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        this.generateStorageSlots();
        this.generateInventorySlots();
    }

    generateStorageSlots() {
        const grid = document.getElementById('storageGrid');
        grid.innerHTML = '';

        for (let i = 0; i < 60; i++) {
            const slot = document.createElement('div');
            slot.className = 'storage-slot';
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

            slot.addEventListener('click', () => {
                this.handleStorageSlotClick(i);
            });

            grid.appendChild(slot);
        }
    }

    generateInventorySlots() {
        const grid = document.getElementById('storageInventoryGrid');
        grid.innerHTML = '';

        for (let i = 0; i < 30; i++) {
            const slot = document.createElement('div');
            slot.className = 'storage-inventory-slot';
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

            slot.addEventListener('click', () => {
                this.handleInventorySlotClick(i);
            });

            grid.appendChild(slot);
        }
    }

    handleStorageSlotClick(slotIndex) {
        const item = this.slots[slotIndex];

        if (item) {
            // Item exists in storage - select it to move to inventory
            this.selectedStorageSlot = slotIndex;
            this.transferMode = 'toInventory';
            this.game.setMessage('Click an empty inventory slot to move this item');
            this.render(); // Highlight selected slot
        } else {
            // Empty slot - if we have an inventory item selected, move it here
            if (this.transferMode === 'toStorage' && this.selectedInventorySlot !== null) {
                this.moveToStorage(this.selectedInventorySlot, slotIndex);
                this.selectedInventorySlot = null;
                this.transferMode = null;
            } else {
                this.game.setMessage('This storage slot is empty');
            }
        }
    }

    handleInventorySlotClick(slotIndex) {
        const item = this.game.inventory.slots[slotIndex];

        if (item) {
            // Item exists in inventory - select it to move to storage
            this.selectedInventorySlot = slotIndex;
            this.transferMode = 'toStorage';
            this.game.setMessage('Click an empty storage slot to move this item');
            this.render(); // Highlight selected slot
        } else {
            // Empty slot - if we have a storage item selected, move it here
            if (this.transferMode === 'toInventory' && this.selectedStorageSlot !== null) {
                this.moveToInventory(this.selectedStorageSlot, slotIndex);
                this.selectedStorageSlot = null;
                this.transferMode = null;
            } else {
                this.game.setMessage('This inventory slot is empty');
            }
        }
    }

    moveToStorage(inventoryIndex, storageIndex) {
        this.socket.emit('storage_move_to_storage', {
            inventoryIndex,
            storageIndex
        });
    }

    moveToInventory(storageIndex, inventoryIndex) {
        this.socket.emit('storage_move_to_inventory', {
            storageIndex,
            inventoryIndex
        });
    }

    open() {
        this.isOpen = true;
        this.storageUI.style.display = 'block';

        // Request storage data from server
        this.socket.emit('storage_request');

        this.render();
    }

    close() {
        this.isOpen = false;
        this.storageUI.style.display = 'none';
        this.selectedStorageSlot = null;
        this.selectedInventorySlot = null;
        this.transferMode = null;
    }

    render() {
        this.renderStorageSlots();
        this.renderInventorySlots();
    }

    renderStorageSlots() {
        const slots = document.querySelectorAll('.storage-slot');
        slots.forEach((slot, index) => {
            const item = this.slots[index];

            // Highlight selected slot
            if (index === this.selectedStorageSlot) {
                slot.style.borderColor = '#ffff4a';
                slot.style.backgroundColor = '#332200';
            }

            if (item) {
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
            } else {
                slot.innerHTML = '';
            }
        });
    }

    renderInventorySlots() {
        const slots = document.querySelectorAll('.storage-inventory-slot');
        slots.forEach((slot, index) => {
            const item = this.game.inventory.slots[index];

            // Highlight selected slot
            if (index === this.selectedInventorySlot) {
                slot.style.borderColor = '#ffff4a';
                slot.style.backgroundColor = '#332200';
            }

            if (item) {
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
            } else {
                slot.innerHTML = '';
            }
        });
    }
}
