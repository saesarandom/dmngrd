// Party experience calculation utilities

// Level difference modifiers when player is HIGHER than monster
const HIGHER_LEVEL_MODIFIERS = {
    0: 1.00,   // same level
    1: 0.85,
    2: 0.70,
    3: 0.55,
    4: 0.40,
    5: 0.25,
    6: 0.10,
    7: 0.05    // 7+ levels
};

// Level difference modifiers when player is LOWER than monster
const LOWER_LEVEL_MODIFIERS = {
    0: 1.00,   // same level
    1: 0.95,
    2: 0.90,
    3: 0.85,
    4: 0.80,
    5: 0.75,
    6: 0.70,
    7: 0.65,
    8: 0.60,
    9: 0.55,
    10: 0.50,
    11: 0.45,
    12: 0.40,
    13: 0.35,
    14: 0.30,
    15: 0.25,
    16: 0.20,
    17: 0.15,
    18: 0.10,
    19: 0.05   // 19+ levels (minimum)
};

function getLevelDifferenceModifier(playerLevel, monsterLevel) {
    const levelDiff = playerLevel - monsterLevel;

    if (levelDiff >= 0) {
        // Player is higher or same level
        if (levelDiff >= 7) return HIGHER_LEVEL_MODIFIERS[7];
        return HIGHER_LEVEL_MODIFIERS[levelDiff];
    } else {
        // Player is lower level
        const absLevelDiff = Math.abs(levelDiff);
        if (absLevelDiff >= 19) return LOWER_LEVEL_MODIFIERS[19];
        return LOWER_LEVEL_MODIFIERS[absLevelDiff];
    }
}

function calculatePartyExperience(baseExp, partyMembers, killerLevel, monsterLevel) {
    // partyMembers is array of { name, level }
    const results = {};

    if (partyMembers.length === 1) {
        // Solo, no party split or bonus
        const modifier = getLevelDifferenceModifier(killerLevel, monsterLevel);
        results[partyMembers[0].name] = Math.floor(baseExp * modifier);
        return results;
    }

    // Calculate party split for each member
    const killerMember = partyMembers.find(m => m.level === killerLevel) || partyMembers[0];

    // Party bonus: 1.25x for 2 players, 1.5x for 3, 1.75x for 4, etc.
    const partyBonus = 1.0 + (partyMembers.length - 1) * 0.25;

    partyMembers.forEach(member => {
        // Party split ratio: killerLevel / memberLevel (capped at 1.0)
        // This means lower level players get FULL share, higher level players get reduced share
        const partySplit = Math.min(1.0, killerMember.level / member.level);

        // Level difference modifier
        const levelModifier = getLevelDifferenceModifier(member.level, monsterLevel);

        // Calculate final experience with party bonus
        const memberExp = baseExp * partySplit * levelModifier * partyBonus;
        results[member.name] = Math.floor(memberExp);
    });

    return results;
}

// Export for use in server
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getLevelDifferenceModifier,
        calculatePartyExperience
    };
}
