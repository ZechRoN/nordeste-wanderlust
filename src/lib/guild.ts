export type GuildRole = "leader" | "vice_leader" | "officer" | "member" | string;

export function guildLevelCost(nextLevel: number) {
  const lvl = Number.isFinite(nextLevel) ? Math.max(0, Math.floor(nextLevel)) : 0;
  return lvl * 10000;
}

export function canManageGuild(role: GuildRole) {
  return role === "leader" || role === "vice_leader";
}

export function canPromoteToViceLeader(role: GuildRole) {
  return role === "leader";
}

