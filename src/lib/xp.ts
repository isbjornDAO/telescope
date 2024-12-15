export function calculateLevel(xp: number): number {
  if (xp <= 10) return 1;

  const level = Math.floor((xp - 11) / 30) + 2;
  return level;
}

export function getXpForNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);

  if (currentLevel === 1) {
    return 11 - currentXp; // XP needed to reach level 2
  }

  const xpNeededForCurrentLevel = (currentLevel - 2) * 30 + 11;
  console.log("xpNeededForCurrentLevel", xpNeededForCurrentLevel);
  const xpNeededForNextLevel = (currentLevel - 1) * 30 + 11;
  console.log("xpNeededForNextLevel", xpNeededForNextLevel);

  return xpNeededForNextLevel - currentXp;
}
