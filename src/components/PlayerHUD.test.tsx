import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayerHUD } from "./PlayerHUD";

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/hooks/useCharacterIdentity", () => ({
  useCharacterIdentity: () => ({ roleTag: null, guildName: "Main Street", guildRoleLabel: "Guild Leader" }),
}));

describe("PlayerHUD", () => {
  const baseCharacter = {
    name: "CarecaDoSTF",
    class: "warrior",
    level: 81,
    experience: 2125,
    health: 149351,
    max_health: 166645,
    mana: 775,
    max_mana: 849,
    gold: 123456,
  };

  it("renderiza nome e nível", () => {
    render(<PlayerHUD character={baseCharacter} />);
    expect(screen.getByText("CarecaDoSTF")).toBeInTheDocument();
    expect(screen.getByLabelText("Nível 81")).toBeInTheDocument();
    expect(screen.getByText("Guild Leader")).toBeInTheDocument();
    expect(screen.getByText("<Main Street>")).toBeInTheDocument();
  });

  it("expõe progressbars acessíveis", () => {
    render(<PlayerHUD character={baseCharacter} />);
    expect(screen.getByLabelText("Progresso de vida")).toHaveAttribute("aria-valuenow", "149351");
    expect(screen.getByLabelText("Progresso de mana")).toHaveAttribute("aria-valuenow", "775");
    expect(screen.getByLabelText("Progresso de experiência")).toHaveAttribute("aria-valuenow", "2125");
  });

  it("expõe triggers de tooltip (estrutura)", () => {
    render(<PlayerHUD character={baseCharacter} />);
    expect(screen.getByLabelText("Vida")).toHaveAttribute("data-state");
    expect(screen.getByLabelText("Mana")).toHaveAttribute("data-state");
    expect(screen.getByLabelText("Experiência")).toHaveAttribute("data-state");
    expect(screen.getByLabelText("Gold")).toHaveAttribute("data-state");
    expect(screen.getByLabelText("XP")).toHaveAttribute("data-state");
  });
});
