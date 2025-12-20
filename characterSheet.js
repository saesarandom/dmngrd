// Character Sheet UI
class CharacterSheet {
    constructor(game, socket) {
        this.game = game;
        this.socket = socket;
        this.isOpen = false;
        this.experience = 0;
        this.level = 1;
        this.monstersKilled = 0;
        this.deaths = 0;
        this.stats = null;

        this.setupEventListeners();
        this.createCharacterSheetUI();
        this.setupSocketListeners();
    }

    setupSocketListeners() {
        // Listen for experience updates
        this.socket.on('experience_updated', (data) => {
            this.experience = data.experience || 0;
            if (data.level) this.level = data.level;
            if (data.monstersKilled !== undefined) this.monstersKilled = data.monstersKilled;
            if (this.isOpen) {
                this.render();
            }
        });

        // Listen for inventory updates to get initial data
        this.socket.on('inventory_updated', (data) => {
            this.experience = data.experience || 0;
            if (data.level) this.level = data.level;
            if (data.monstersKilled !== undefined) this.monstersKilled = data.monstersKilled;
            if (data.deaths !== undefined) this.deaths = data.deaths;
            if (this.isOpen) {
                this.render();
            }
        });

        // Listen for stats updates
        this.socket.on('stats_updated', (data) => {
            if (data.monstersKilled !== undefined) this.monstersKilled = data.monstersKilled;
            if (data.deaths !== undefined) this.deaths = data.deaths;
            if (data.stats) this.stats = data.stats;
            if (this.isOpen) {
                this.render();
            }
        });

        // Listen for level up
        this.socket.on('level_up', (data) => {
            this.level = data.level;
            this.stats = data.totalStats;

            // Show level up message
            const statGainsText = Object.entries(data.statGains)
                .map(([stat, gain]) => `+${gain} ${stat}`)
                .join(', ');

            this.game.setMessage(`LEVEL UP! You are now level ${data.level}! ${statGainsText}`);

            if (this.isOpen) {
                this.render();
            }
        });
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                this.toggle();
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    createCharacterSheetUI() {
        const sheetDiv = document.createElement('div');
        sheetDiv.id = 'characterSheetUI';
        sheetDiv.style.cssText = `
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

        sheetDiv.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #4aff4a; font-size: 36px; margin-bottom: 10px;">Character Sheet</h1>
          <div style="color: #888; font-size: 14px;">Press C or ESC to close</div>
        </div>

        <div style="background-color: #1a1a1a; border: 2px solid #333; border-radius: 8px; padding: 30px;">
          <!-- Character Info -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #4aff4a; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">Character Information</h2>
            
            <div style="display: grid; grid-template-columns: 200px 1fr; gap: 15px; font-size: 16px;">
              <div style="color: #888;">Name:</div>
              <div style="color: #fff;" id="charName">-</div>
              
              <div style="color: #888;">Level:</div>
              <div style="color: #ffff4a;" id="charLevel">1</div>
              
              <div style="color: #888;">Experience:</div>
              <div style="color: #4aff4a;" id="charExperience">0</div>
              
              <div style="color: #888;">Class:</div>
              <div style="color: #fff;" id="charClass">-</div>
              
              <div style="color: #888;">Race:</div>
              <div style="color: #fff;" id="charRace">-</div>
            </div>
          </div>

          <!-- Rolled Stats -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #4aff4a; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">Rolled Stats</h2>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 16px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Strength:</span>
                <span style="color: #fff;" id="statStrength">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Dexterity:</span>
                <span style="color: #fff;" id="statDexterity">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Constitution:</span>
                <span style="color: #fff;" id="statConstitution">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Intelligence:</span>
                <span style="color: #fff;" id="statIntelligence">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Luck:</span>
                <span style="color: #fff;" id="statLuck">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Endurance:</span>
                <span style="color: #fff;" id="statEndurance">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Speed:</span>
                <span style="color: #fff;" id="statSpeed">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Perception:</span>
                <span style="color: #fff;" id="statPerception">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Vitality:</span>
                <span style="color: #fff;" id="statVitality">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Spirit:</span>
                <span style="color: #fff;" id="statSpirit">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Defense:</span>
                <span style="color: #fff;" id="statDefense">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Charisma:</span>
                <span style="color: #fff;" id="statCharisma">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Resilience:</span>
                <span style="color: #fff;" id="statResilience">0</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Forging:</span>
                <span style="color: #fff;" id="statForging">0</span>
              </div>
            </div>
          </div>

          <!-- Combat Stats -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #ff4a4a; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px;">Combat Statistics</h2>
            
            <div style="display: grid; grid-template-columns: 200px 1fr; gap: 15px; font-size: 16px;">
              <div style="color: #888;">Monsters Killed:</div>
              <div style="color: #4aff4a;" id="charMonstersKilled">0</div>
              
              <div style="color: #888;">Deaths:</div>
              <div style="color: #ff4a4a;" id="charDeaths">0</div>
            </div>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(sheetDiv);
        this.sheetUI = sheetDiv;
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
        this.sheetUI.style.display = 'block';
        this.render();
    }

    close() {
        this.isOpen = false;
        this.sheetUI.style.display = 'none';
    }

    render() {
        const character = this.game.character;

        document.getElementById('charName').textContent = character.name || '-';
        document.getElementById('charLevel').textContent = this.level;
        document.getElementById('charExperience').textContent = this.experience;
        document.getElementById('charClass').textContent = character.class || '-';
        document.getElementById('charRace').textContent = character.race || '-';
        document.getElementById('charMonstersKilled').textContent = this.monstersKilled;
        document.getElementById('charDeaths').textContent = this.deaths;

        // Display rolled stats (14 stats from character creation)
        if (this.stats) {
            document.getElementById('statStrength').textContent = this.stats.strength || 0;
            document.getElementById('statDexterity').textContent = this.stats.dexterity || 0;
            document.getElementById('statConstitution').textContent = this.stats.constitution || 0;
            document.getElementById('statIntelligence').textContent = this.stats.intelligence || 0;
            document.getElementById('statLuck').textContent = this.stats.luck || 0;
            document.getElementById('statEndurance').textContent = this.stats.endurance || 0;
            document.getElementById('statSpeed').textContent = this.stats.speed || 0;
            document.getElementById('statPerception').textContent = this.stats.perception || 0;
            document.getElementById('statVitality').textContent = this.stats.vitality || 0;
            document.getElementById('statSpirit').textContent = this.stats.spirit || 0;
            document.getElementById('statDefense').textContent = this.stats.defense || 0;
            document.getElementById('statCharisma').textContent = this.stats.charisma || 0;
            document.getElementById('statResilience').textContent = this.stats.resilience || 0;
            document.getElementById('statForging').textContent = this.stats.forging || 0;
        }
    }
}
