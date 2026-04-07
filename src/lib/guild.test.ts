import { describe, expect, it } from "vitest";
import { canManageGuild, canPromoteToViceLeader, guildLevelCost } from "./guild";

describe("guild", () => {
  it("calcula custo por nível (base 10k)", () => {
    expect(guildLevelCost(2)).toBe(20000);
    expect(guildLevelCost(0)).toBe(0);
    expect(guildLevelCost(-2)).toBe(0);
  });

  it("valida permissões por cargo", () => {
    expect(canManageGuild("leader")).toBe(true);
    expect(canManageGuild("vice_leader")).toBe(true);
    expect(canManageGuild("officer")).toBe(false);

    expect(canPromoteToViceLeader("leader")).toBe(true);
    expect(canPromoteToViceLeader("vice_leader")).toBe(false);
  });
});

