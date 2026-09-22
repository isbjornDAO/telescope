export function calculateLevel(xp: number): number {
  if (xp <= 10) return 1;

  const level = Math.floor((xp - 11) / 30) + 2;
  return level;
}

export function getXpForNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);

  if (currentLevel === 1) {
    return 11; // Total XP needed for level 2 (11 XP total)
  }

  // Calculate XP needed to reach next level
  const xpForNextLevel = (currentLevel - 1) * 30 + 11; // XP needed for next level
  
  return xpForNextLevel - currentXp;
}

export function getXpProgress(currentXp: number): { currentProgress: number; totalNeeded: number } {
  const currentLevel = calculateLevel(currentXp);
  
  if (currentLevel === 1) {
    return {
      currentProgress: currentXp,
      totalNeeded: 11
    };
  }
  
  const xpForCurrentLevel = (currentLevel - 2) * 30 + 11;
  const xpForNextLevel = (currentLevel - 1) * 30 + 11;
  
  return {
    currentProgress: currentXp - xpForCurrentLevel,
    totalNeeded: xpForNextLevel - xpForCurrentLevel
  };
}

export interface RankInfo {
  title: string;
  theme: string;
  level: number;
}

export function getRankInfo(level: number): RankInfo {
  if (level <= 1) return { title: "Stargazer", theme: "tarja-slate", level };
  if (level === 2) return { title: "Observer", theme: "tarja-sky", level };
  if (level === 3) return { title: "Signal Seeker", theme: "tarja-cyan", level };
  if (level === 4) return { title: "Orbit Pilot", theme: "tarja-emerald", level };
  if (level === 5) return { title: "Star Cartographer", theme: "tarja-amber", level };
  if (level === 6) return { title: "Cosmic Voyager", theme: "tarja-orange", level };
  if (level === 7) return { title: "Nebula Walker", theme: "tarja-purple", level };
  if (level === 8) return { title: "Deep Sky Seeker", theme: "tarja-rose", level };
  if (level === 9) return { title: "Vanguard", theme: "tarja-red", level };
  return { title: "Galactic Elder", theme: "tarja-gold", level };
}

