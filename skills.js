const SKILL_LEVELS = [4, 8, 12, 18, 24, 32, 40, 48, 58, 68, 78, 88, 100, 112, 124, 130, 131, 132, 133, 134];

// Add levels 135 to 150
for (let i = 135; i <= 150; i++) {
  SKILL_LEVELS.push(i);
}

const SKILLS = {
  // Combat Skills
  power_strike: {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'Increases melee damage by 10% per level',
    maxLevel: 5,
    type: 'combat',
    effect: (level) => ({ meleeDamage: level * 0.1 })
  },
  precise_shot: {
    id: 'precise_shot',
    name: 'Precise Shot',
    description: 'Increases ranged damage by 10% per level',
    maxLevel: 5,
    type: 'combat',
    effect: (level) => ({ rangedDamage: level * 0.1 })
  },
  iron_skin: {
    id: 'iron_skin',
    name: 'Iron Skin',
    description: 'Increases defense by 5 per level',
    maxLevel: 5,
    type: 'defense',
    effect: (level) => ({ defense: level * 5 })
  },
  swift_feet: {
    id: 'swift_feet',
    name: 'Swift Feet',
    description: 'Reduces movement delay by 50ms per level',
    maxLevel: 5,
    type: 'utility',
    effect: (level) => ({ moveDelay: level * -50 })
  },
  
  // Magic Skills
  arcane_power: {
    id: 'arcane_power',
    name: 'Arcane Power',
    description: 'Increases magic damage by 15% per level',
    maxLevel: 5,
    type: 'magic',
    effect: (level) => ({ magicDamage: level * 0.15 })
  },
  mana_pool: {
    id: 'mana_pool',
    name: 'Mana Pool',
    description: 'Increases maximum mana by 20 per level',
    maxLevel: 5,
    type: 'magic',
    effect: (level) => ({ maxMana: level * 20 })
  },
  
  // Utility Skills
  treasure_hunter: {
    id: 'treasure_hunter',
    name: 'Treasure Hunter',
    description: 'Increases gold find by 20% per level',
    maxLevel: 5,
    type: 'utility',
    effect: (level) => ({ goldFind: level * 0.2 })
  },
  lucky_strike: {
    id: 'lucky_strike',
    name: 'Lucky Strike',
    description: 'Increases item drop quality by 5% per level',
    maxLevel: 5,
    type: 'utility',
    effect: (level) => ({ itemQuality: level * 0.05 })
  },
  endurance: {
    id: 'endurance',
    name: 'Endurance',
    description: 'Increases maximum HP by 10 per level',
    maxLevel: 5,
    type: 'defense',
    effect: (level) => ({ maxHp: level * 10 })
  },
  regeneration: {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Regenerate 2% HP per level after combat',
    maxLevel: 5,
    type: 'defense',
    effect: (level) => ({ hpRegen: level * 0.02 })
  }
};

class SkillSystem {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.learnedSkills = {}; // { skillId: level }
    this.availablePoints = 0;
    
    this.createSkillUI();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'k' || e.key === 'K') {
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  createSkillUI() {
    const skillDiv = document.createElement('div');
    skillDiv.id = 'skillUI';
    skillDiv.style.cssText = `
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

    skillDiv.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <h1 style="color: #4aff4a; font-size: 32px;">Skills</h1>
          <div style="color: #ffff4a; font-size: 20px;">
            <span style="color: #888;">Available Points:</span> <span id="skillPoints">0</span>
          </div>
        </div>

        <div style="display: grid; gap: 20px;">
          <div>
            <h2 style="color: #ff4a4a; font-size: 24px; margin-bottom: 15px;">Combat Skills</h2>
            <div id="combatSkills" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;"></div>
          </div>

          <div>
            <h2 style="color: #4a9eff; font-size: 24px; margin-bottom: 15px;">Magic Skills</h2>
            <div id="magicSkills" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;"></div>
          </div>

          <div>
            <h2 style="color: #4aff4a; font-size: 24px; margin-bottom: 15px;">Defense Skills</h2>
            <div id="defenseSkills" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;"></div>
          </div>

          <div>
            <h2 style="color: #ffff4a; font-size: 24px; margin-bottom: 15px;">Utility Skills</h2>
            <div id="utilitySkills" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;"></div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
          Press K or ESC to close
        </div>
      </div>
    `;

    document.body.appendChild(skillDiv);
    this.skillUI = skillDiv;
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
    this.skillUI.style.display = 'block';
    this.render();
  }

  close() {
    this.isOpen = false;
    this.skillUI.style.display = 'none';
  }

  checkLevelUp(newLevel) {
    if (SKILL_LEVELS.includes(newLevel)) {
      this.availablePoints++;
      this.game.setMessage(`Level ${newLevel}! You gained 1 skill point!`);
      if (this.isOpen) this.render();
    }
  }

  learnSkill(skillId) {
    const skill = SKILLS[skillId];
    if (!skill) return;

    const currentLevel = this.learnedSkills[skillId] || 0;

    // Check if can learn
    if (currentLevel >= skill.maxLevel) {
      this.game.setMessage(`${skill.name} is already at max level!`);
      return;
    }

    if (this.availablePoints <= 0) {
      this.game.setMessage('No skill points available!');
      return;
    }

    // Learn skill
    this.learnedSkills[skillId] = currentLevel + 1;
    this.availablePoints--;
    this.game.setMessage(`Learned ${skill.name} level ${this.learnedSkills[skillId]}!`);
    
    this.render();
  }

  getSkillLevel(skillId) {
    return this.learnedSkills[skillId] || 0;
  }

  getTotalEffects() {
    const effects = {
      meleeDamage: 0,
      rangedDamage: 0,
      magicDamage: 0,
      defense: 0,
      maxHp: 0,
      maxMana: 0,
      moveDelay: 0,
      goldFind: 0,
      itemQuality: 0,
      hpRegen: 0
    };

    Object.keys(this.learnedSkills).forEach(skillId => {
      const skill = SKILLS[skillId];
      const level = this.learnedSkills[skillId];
      const skillEffects = skill.effect(level);

      Object.keys(skillEffects).forEach(effectKey => {
        effects[effectKey] = (effects[effectKey] || 0) + skillEffects[effectKey];
      });
    });

    return effects;
  }

  render() {
    // Update skill points display
    document.getElementById('skillPoints').textContent = this.availablePoints;

    // Render skills by category
    this.renderSkillCategory('combat', 'combatSkills');
    this.renderSkillCategory('magic', 'magicSkills');
    this.renderSkillCategory('defense', 'defenseSkills');
    this.renderSkillCategory('utility', 'utilitySkills');
  }

  renderSkillCategory(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    Object.values(SKILLS).forEach(skill => {
      if (skill.type !== category) return;

      const currentLevel = this.learnedSkills[skill.id] || 0;
      const canLearn = this.availablePoints > 0 && currentLevel < skill.maxLevel;

      const skillCard = document.createElement('div');
      skillCard.style.cssText = `
        background-color: #1a1a1a;
        border: 2px solid ${currentLevel > 0 ? '#4a7c3e' : '#333'};
        border-radius: 8px;
        padding: 20px;
        cursor: ${canLearn ? 'pointer' : 'default'};
        transition: all 0.3s;
      `;

      skillCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <div style="color: #fff; font-size: 18px; font-weight: bold;">${skill.name}</div>
          <div style="color: ${currentLevel >= skill.maxLevel ? '#4aff4a' : '#888'}; font-size: 14px;">
            ${currentLevel}/${skill.maxLevel}
          </div>
        </div>
        <div style="color: #888; font-size: 14px; margin-bottom: 15px;">
          ${skill.description}
        </div>
        ${canLearn ? `
          <button class="learn-skill-btn" data-skill="${skill.id}" style="
            width: 100%;
            padding: 10px;
            background-color: #4a7c3e;
            border: none;
            border-radius: 4px;
            color: #fff;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s;
          ">
            Learn (1 point)
          </button>
        ` : ''}
      `;

      if (canLearn) {
        skillCard.addEventListener('mouseenter', (e) => {
          e.currentTarget.style.borderColor = '#4a7c3e';
          e.currentTarget.style.backgroundColor = '#222';
        });
        skillCard.addEventListener('mouseleave', (e) => {
          e.currentTarget.style.borderColor = currentLevel > 0 ? '#4a7c3e' : '#333';
          e.currentTarget.style.backgroundColor = '#1a1a1a';
        });

        const learnBtn = skillCard.querySelector('.learn-skill-btn');
        if (learnBtn) {
          learnBtn.addEventListener('mouseenter', (e) => {
            e.target.style.backgroundColor = '#5a8c4e';
          });
          learnBtn.addEventListener('mouseleave', (e) => {
            e.target.style.backgroundColor = '#4a7c3e';
          });
          learnBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.learnSkill(skill.id);
          });
        }
      }

      container.appendChild(skillCard);
    });
  }
}