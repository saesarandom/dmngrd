const ALIGNMENTS = [
  'neutral',
  'chaotic_good', 
  'good',
  'chaotic_evil',
  'evil'
];

const ALIGNMENT_DISPLAY = {
  neutral: 'Neutral',
  chaotic_good: 'Chaotic Good',
  good: 'Good',
  chaotic_evil: 'Chaotic Evil',
  evil: 'Evil'
};

const ALIGNMENT_COLORS = {
  neutral: '#888888',
  chaotic_good: '#4a9eff',
  good: '#4aff4a',
  chaotic_evil: '#ff4a4a',
  evil: '#8b0000'
};

const races = {
  Human: {
    name: "Human",
    racialsk: [
      "Increased gold find by 10%",
      "Decreased shop prices by 10%"
    ]
  },
  Mastafi: {
    name: "Mastafi",
    racialsk: ["May use parry while shielded (halved effectiveness)"]
  },
  Taurath: {
    name: "Taurath",
    racialsk: ["Increased melee damage by 20%"]
  },
  Skulk: {
    name: "Skulk",
    racialsk: ["May apply 1 additional curse (Demonologist only)"]
  },
  Askr: {
    name: "Askr",
    racialsk: ["Increased healing by 20%"]
  }
};

const classes = {
  Guardian: {
    name: "Guardian",
    classsk: null
  },
  Rogue: {
    name: "Rogue",
    classsk: "Increased ranged damage by 10%"
  },
  Jinn: {
    name: "Jinn",
    classsk: null
  },
  Cultist: {
    name: "Cultist",
    classsk: "Increased resilience and resistances by 10%"
  },
  Demonologist: {
    name: "Demonologist",
    classsk: null
  }
};

const generateStarterStats = () => {
  const stats = {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    luck: 0,
    endurance: 0,
    speed: 0,
    perception: 0,
    vitality: 0,
    spirit: 0,
    defense: 0,
    charisma: 0,
    resilience: 0,
    forging: 0
  };

  const statKeys = Object.keys(stats);
  let pointsLeft = 10;

  while (pointsLeft > 0) {
    const randomStat = statKeys[Math.floor(Math.random() * statKeys.length)];
    const pointsToAdd = Math.min(Math.floor(Math.random() * 3) + 1, pointsLeft);
    stats[randomStat] += pointsToAdd;
    pointsLeft -= pointsToAdd;
  }

  return stats;
};

class CharacterCreation {
  constructor(container, onCharacterCreated) {
    this.container = container;
    this.onCharacterCreated = onCharacterCreated;
    this.name = '';
    this.stats = null;
    this.alignment = null;
    this.race = null;
    this.class = null;
    this.step = 'name';
    this.error = '';
    
    this.render();
  }

  validateName(input) {
    const validName = /^[a-zA-Z]{3,21}$/;
    return validName.test(input);
  }

  handleNameChange(e) {
    const input = e.target.value;
    const filtered = input.replace(/[^a-zA-Z]/g, '').slice(0, 21);
    this.name = filtered;
    
    if (filtered.length > 0 && filtered.length < 3) {
      this.error = 'Too short';
    } else {
      this.error = '';
    }
    
    this.render();
  }

  handleNameSubmit() {
    if (this.validateName(this.name)) {
      this.step = 'race';
      this.error = '';
      this.render();
    }
  }

  handleRaceSelect(raceName) {
    this.race = raceName;
    this.step = 'class';
    this.render();
  }

  handleClassSelect(className) {
    this.class = className;
    const newStats = generateStarterStats();
    const randomAlignment = ALIGNMENTS[Math.floor(Math.random() * ALIGNMENTS.length)];
    
    this.stats = newStats;
    this.alignment = randomAlignment;
    this.step = 'stats';
    this.render();
  }

  handleReroll() {
    const newStats = generateStarterStats();
    const randomAlignment = ALIGNMENTS[Math.floor(Math.random() * ALIGNMENTS.length)];
    this.stats = newStats;
    this.alignment = randomAlignment;
    this.render();
  }

  handleConfirm() {
    const character = {
      name: this.name.trim(),
      level: 1,
      alignment: this.alignment,
      race: this.race,
      class: this.class,
      racialsk: races[this.race].racialsk,
      classsk: classes[this.class].classsk,
      stats: this.stats
    };
    
    if (this.onCharacterCreated) {
      this.onCharacterCreated(character);
    }
  }

  createStatDisplay(name, value) {
    const div = document.createElement('div');
    div.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background-color: #1a1a1a;
      border-radius: 4px;
      margin-bottom: 6px;
      border: ${value > 0 ? '1px solid #4a7c3e' : '1px solid #333'};
    `;
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    nameSpan.style.cssText = `
      text-transform: capitalize;
      color: ${value > 0 ? '#fff' : '#666'};
    `;
    
    const valueSpan = document.createElement('span');
    valueSpan.textContent = value;
    valueSpan.style.cssText = `
      font-weight: bold;
      color: ${value > 0 ? '#4aff4a' : '#444'};
      min-width: 30px;
      text-align: right;
    `;
    
    div.appendChild(nameSpan);
    div.appendChild(valueSpan);
    return div;
  }

  renderNameStep() {
    const isNameValid = this.validateName(this.name);
    
    return `
      <div>
        <h1 style="text-align: center; margin-bottom: 10px; color: #4aff4a; font-size: 32px; text-shadow: 0 0 20px rgba(74, 255, 74, 0.5);">
          Create Your Character
        </h1>
        <p style="text-align: center; color: #888; margin-bottom: 40px; font-size: 14px;">
          Enter your character name
        </p>

        <div>
          <label style="display: block; margin-bottom: 10px; color: #aaa; font-size: 14px;">
            Character Name
          </label>
          <input
            type="text"
            id="nameInput"
            value="${this.name}"
            placeholder="Letters only"
            style="width: 100%; padding: 15px; font-size: 18px; background-color: #0a0a0a; border: 2px solid ${this.error ? '#ff4a4a' : '#333'}; border-radius: 4px; color: #fff; outline: none;"
          />
          ${this.error ? `<div style="color: #ff4a4a; font-size: 12px; margin-top: 5px;">${this.error}</div>` : ''}
          
          <button
            id="nameSubmit"
            ${!isNameValid ? 'disabled' : ''}
            style="width: 100%; margin-top: 30px; padding: 15px; font-size: 18px; font-weight: bold; background-color: ${isNameValid ? '#4a7c3e' : '#333'}; color: ${isNameValid ? '#fff' : '#666'}; border: none; border-radius: 4px; cursor: ${isNameValid ? 'pointer' : 'not-allowed'}; text-transform: uppercase; letter-spacing: 1px;"
          >
            Continue
          </button>
        </div>
      </div>
    `;
  }

  renderRaceStep() {
    const raceButtons = Object.keys(races).map(raceName => {
      const race = races[raceName];
      const skills = race.racialsk.map(sk => `<div style="color: #888; font-size: 13px; margin-top: 5px;">• ${sk}</div>`).join('');
      
      return `
        <button class="raceBtn" data-race="${raceName}" style="padding: 20px; background-color: #1a1a1a; border: 2px solid #333; border-radius: 4px; cursor: pointer; text-align: left; transition: all 0.3s;">
          <div style="color: #4aff4a; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${race.name}</div>
          ${skills}
        </button>
      `;
    }).join('');
    
    return `
      <div>
        <h1 style="text-align: center; margin-bottom: 10px; color: #4aff4a; font-size: 32px;">
          Choose Your Race
        </h1>
        <p style="text-align: center; color: #888; margin-bottom: 40px; font-size: 14px;">
          ${this.name}
        </p>
        <div style="display: grid; gap: 15px;">
          ${raceButtons}
        </div>
      </div>
    `;
  }

  renderClassStep() {
    const classButtons = Object.keys(classes).map(className => {
      const cls = classes[className];
      const skill = cls.classsk ? `<div style="color: #888; font-size: 13px; margin-top: 5px;">• ${cls.classsk}</div>` : '<div style="color: #666; font-size: 13px; margin-top: 5px; font-style: italic;">No class skill</div>';
      
      return `
        <button class="classBtn" data-class="${className}" style="padding: 20px; background-color: #1a1a1a; border: 2px solid #333; border-radius: 4px; cursor: pointer; text-align: left; transition: all 0.3s;">
          <div style="color: #4aff4a; font-size: 18px; font-weight: bold; margin-bottom: 10px;">${cls.name}</div>
          ${skill}
        </button>
      `;
    }).join('');
    
    return `
      <div>
        <h1 style="text-align: center; margin-bottom: 10px; color: #4aff4a; font-size: 32px;">
          Choose Your Class
        </h1>
        <p style="text-align: center; color: #888; margin-bottom: 40px; font-size: 14px;">
          ${this.name} • ${races[this.race].name}
        </p>
        <div style="display: grid; gap: 15px;">
          ${classButtons}
        </div>
      </div>
    `;
  }

  renderStatsStep() {
    const totalPoints = Object.values(this.stats).reduce((a, b) => a + b, 0);
    
    return `
      <div>
        <h1 style="text-align: center; margin-bottom: 5px; color: #4aff4a; font-size: 28px;">
          ${this.name}
        </h1>
        <p style="text-align: center; color: #888; margin-bottom: 30px; font-size: 14px;">
          Level 1 ${races[this.race].name} ${classes[this.class].name}
        </p>

        <div style="text-align: center; margin-bottom: 20px; padding: 15px; background-color: #0a0a0a; border-radius: 4px; border: 2px solid ${ALIGNMENT_COLORS[this.alignment]};">
          <div style="color: #888; font-size: 12px; margin-bottom: 5px;">Alignment</div>
          <div style="color: ${ALIGNMENT_COLORS[this.alignment]}; font-size: 20px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; text-shadow: 0 0 10px ${ALIGNMENT_COLORS[this.alignment]};">
            ${ALIGNMENT_DISPLAY[this.alignment]}
          </div>
        </div>

        <div style="margin-bottom: 20px; padding: 15px; background-color: #0a0a0a; border-radius: 4px; border: 1px solid #333;">
          <div style="color: #aaa; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Racial Skills</div>
          ${races[this.race].racialsk.map(sk => `<div style="color: #4aff4a; font-size: 13px; margin-bottom: 5px;">• ${sk}</div>`).join('')}
          ${classes[this.class].classsk ? `
            <div style="color: #aaa; font-size: 14px; margin: 15px 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Class Skill</div>
            <div style="color: #4aff4a; font-size: 13px;">• ${classes[this.class].classsk}</div>
          ` : ''}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
          <div>
            <h3 style="color: #aaa; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Combat Stats</h3>
            <div id="combatStats"></div>
          </div>
          <div>
            <h3 style="color: #aaa; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Core Stats</h3>
            <div id="coreStats"></div>
          </div>
          <div style="grid-column: 1 / -1;">
            <h3 style="color: #aaa; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">Special Stats</h3>
            <div id="specialStats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;"></div>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 20px; padding: 10px; background-color: #0a0a0a; border-radius: 4px; color: #888; font-size: 14px;">
          Total Stat Points: <span style="color: #4aff4a; font-weight: bold;">${totalPoints}</span>
        </div>

        <div style="display: flex; gap: 15px;">
          <button id="rerollBtn" style="flex: 1; padding: 15px; font-size: 16px; font-weight: bold; background-color: #333; color: #fff; border: 2px solid #555; border-radius: 4px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">
            Reroll
          </button>
          <button id="confirmBtn" style="flex: 2; padding: 15px; font-size: 16px; font-weight: bold; background-color: #4a7c3e; color: #fff; border: none; border-radius: 4px; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">
            Start Journey
          </button>
        </div>
      </div>
    `;
  }

  render() {
    const mainDiv = document.createElement('div');
    mainDiv.style.cssText = `
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0a0a0a;
      padding: 20px;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      width: 100%;
      max-width: ${this.step === 'name' ? '500px' : '700px'};
      background-color: #1a1a1a;
      border: 2px solid #4a7c3e;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 0 40px rgba(74, 124, 62, 0.3);
    `;

    if (this.step === 'name') {
      card.innerHTML = this.renderNameStep();
    } else if (this.step === 'race') {
      card.innerHTML = this.renderRaceStep();
    } else if (this.step === 'class') {
      card.innerHTML = this.renderClassStep();
    } else {
      card.innerHTML = this.renderStatsStep();
    }

    mainDiv.appendChild(card);
    this.container.innerHTML = '';
    this.container.appendChild(mainDiv);

    this.attachEventListeners();
  }

  attachEventListeners() {
    if (this.step === 'name') {
      const input = document.getElementById('nameInput');
      const submitBtn = document.getElementById('nameSubmit');
      
      input.addEventListener('input', (e) => this.handleNameChange(e));
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && this.validateName(this.name)) {
          this.handleNameSubmit();
        }
      });
      input.focus();
      
      submitBtn.addEventListener('click', () => this.handleNameSubmit());
      submitBtn.addEventListener('mouseenter', (e) => {
        if (this.validateName(this.name)) {
          e.target.style.backgroundColor = '#5a8c4e';
          e.target.style.boxShadow = '0 0 20px rgba(74, 124, 62, 0.5)';
        }
      });
      submitBtn.addEventListener('mouseleave', (e) => {
        if (this.validateName(this.name)) {
          e.target.style.backgroundColor = '#4a7c3e';
          e.target.style.boxShadow = 'none';
        }
      });
    } else if (this.step === 'race') {
      const raceBtns = document.querySelectorAll('.raceBtn');
      raceBtns.forEach(btn => {
        btn.addEventListener('mouseenter', (e) => {
          e.target.style.borderColor = '#4a7c3e';
          e.target.style.backgroundColor = '#222';
        });
        btn.addEventListener('mouseleave', (e) => {
          e.target.style.borderColor = '#333';
          e.target.style.backgroundColor = '#1a1a1a';
        });
        btn.addEventListener('click', (e) => {
          const raceName = e.currentTarget.dataset.race;
          this.handleRaceSelect(raceName);
        });
      });
    } else if (this.step === 'class') {
      const classBtns = document.querySelectorAll('.classBtn');
      classBtns.forEach(btn => {
        btn.addEventListener('mouseenter', (e) => {
          e.target.style.borderColor = '#4a7c3e';
          e.target.style.backgroundColor = '#222';
        });
        btn.addEventListener('mouseleave', (e) => {
          e.target.style.borderColor = '#333';
          e.target.style.backgroundColor = '#1a1a1a';
        });
        btn.addEventListener('click', (e) => {
          const className = e.currentTarget.dataset.class;
          this.handleClassSelect(className);
        });
      });
    } else if (this.step === 'stats') {
      const combatStats = document.getElementById('combatStats');
      combatStats.appendChild(this.createStatDisplay('Strength', this.stats.strength));
      combatStats.appendChild(this.createStatDisplay('Dexterity', this.stats.dexterity));
      combatStats.appendChild(this.createStatDisplay('Constitution', this.stats.constitution));
      combatStats.appendChild(this.createStatDisplay('Defense', this.stats.defense));
      combatStats.appendChild(this.createStatDisplay('Resilience', this.stats.resilience));

      const coreStats = document.getElementById('coreStats');
      coreStats.appendChild(this.createStatDisplay('Intelligence', this.stats.intelligence));
      coreStats.appendChild(this.createStatDisplay('Vitality', this.stats.vitality));
      coreStats.appendChild(this.createStatDisplay('Endurance', this.stats.endurance));
      coreStats.appendChild(this.createStatDisplay('Speed', this.stats.speed));
      coreStats.appendChild(this.createStatDisplay('Spirit', this.stats.spirit));

      const specialStats = document.getElementById('specialStats');
      specialStats.appendChild(this.createStatDisplay('Luck', this.stats.luck));
      specialStats.appendChild(this.createStatDisplay('Perception', this.stats.perception));
      specialStats.appendChild(this.createStatDisplay('Charisma', this.stats.charisma));
      specialStats.appendChild(this.createStatDisplay('Forging', this.stats.forging));

      const rerollBtn = document.getElementById('rerollBtn');
      const confirmBtn = document.getElementById('confirmBtn');

      rerollBtn.addEventListener('click', () => this.handleReroll());
      rerollBtn.addEventListener('mouseenter', (e) => {
        e.target.style.backgroundColor = '#444';
        e.target.style.borderColor = '#666';
      });
      rerollBtn.addEventListener('mouseleave', (e) => {
        e.target.style.backgroundColor = '#333';
        e.target.style.borderColor = '#555';
      });

      confirmBtn.addEventListener('click', () => this.handleConfirm());
      confirmBtn.addEventListener('mouseenter', (e) => {
        e.target.style.backgroundColor = '#5a8c4e';
        e.target.style.boxShadow = '0 0 20px rgba(74, 124, 62, 0.5)';
      });
      confirmBtn.addEventListener('mouseleave', (e) => {
        e.target.style.backgroundColor = '#4a7c3e';
        e.target.style.boxShadow = 'none';
      });
    }
  }
}

// Initialize
const app = document.getElementById('app');
new CharacterCreation(app, (character) => {
  console.log('Character created:', character);
  // Do something with the character data
});