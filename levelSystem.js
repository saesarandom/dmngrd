// Experience table for levels 1-150
const EXPERIENCE_TABLE = [
    0, 64, 77, 93, 113, 137, 166, 202, 244, 296,
    359, 434, 526, 638, 772, 936, 1134, 1373, 1663, 2015,
    2440, 2956, 3580, 4337, 5253, 6363, 7707, 9335, 11307, 13696,
    16589, 20093, 24337, 29478, 35705, 43248, 52384, 63449, 76852, 93086,
    112749, 136566, 165414, 200356, 242678, 293941, 356032, 431240, 522333, 632670,
    766313, 928187, 1124254, 1361738, 1649388, 1997799, 2419809, 2930962, 3550089, 4300000,
    4591991, 4903809, 5236802, 5592406, 5972158, 6377697, 6810774, 7273259, 7767149, 8294576,
    8857818, 9459308, 10101641, 10787592, 11520122, 12302395, 13137788, 14029908, 14982607, 16000000,
    17171217, 18428168, 19777129, 21224836, 22778517, 24445929, 26235397, 28155856, 30216894, 32428803,
    34802626, 37350215, 40084291, 43018504, 46167504, 49547015, 53173909, 57066295, 61243609, 65726706,
    70537971, 75701426, 81242851, 87189914, 93572308, 100421901, 107772891, 115661981, 124128562, 133214904,
    142966377, 153431668, 164663029, 176716538, 189652377, 203535133, 218434121, 234423731, 251583798, 270000000,
    298433158, 329860556, 364597510, 402992543, 445430880, 492338313, 544185474, 601492555, 664834531, 734846922,
    812232179, 897766721, 992308735, 1096806779, 1212309302, 1339975165, 1481085263, 1637055384, 1809450405, 2000000000,
    2297396709, 2639015821, 3031433133, 3482202253, 4000000000, 4594793419, 5278031643, 6062866266, 6964404506, 8000000000
];

// Calculate level from experience
function getLevelFromExperience(experience) {
    for (let i = EXPERIENCE_TABLE.length - 1; i >= 0; i--) {
        if (experience >= EXPERIENCE_TABLE[i]) {
            return i + 1; // Level is 1-indexed
        }
    }
    return 1; // Minimum level
}

// Get experience required for next level
function getExperienceForNextLevel(currentLevel) {
    if (currentLevel >= 150) return EXPERIENCE_TABLE[149]; // Max level
    return EXPERIENCE_TABLE[currentLevel]; // currentLevel is 1-indexed, array is 0-indexed
}

// Get experience progress to next level
function getExperienceProgress(experience, currentLevel) {
    if (currentLevel >= 150) return { current: 0, required: 0, percentage: 100 };

    const currentLevelExp = currentLevel > 1 ? EXPERIENCE_TABLE[currentLevel - 2] : 0;
    const nextLevelExp = EXPERIENCE_TABLE[currentLevel - 1];
    const current = experience - currentLevelExp;
    const required = nextLevelExp - currentLevelExp;
    const percentage = Math.min(100, (current / required) * 100);

    return { current, required, percentage };
}
