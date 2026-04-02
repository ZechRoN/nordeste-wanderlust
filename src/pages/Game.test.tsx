import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import Game from "./Game";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/components/CharacterDashboard", () => ({
  CharacterDashboard: ({ character }: any) => <div>Dashboard {character.name}</div>,
}));

const characters = [
  {
    id: "1",
    name: "Ziv Guerreiro",
    class: "warrior",
    level: 10,
    experience: 1200,
    gold: 55,
    current_biome: "caatinga",
    strength: 15,
    agility: 10,
    intelligence: 8,
    vitality: 14,
    luck: 6,
    health: 90,
    max_health: 100,
    mana: 20,
    max_mana: 50,
  },
  {
    id: "2",
    name: "Ziv Mago",
    class: "mage",
    level: 5,
    experience: 200,
    gold: 30,
    current_biome: "litoral",
    strength: 7,
    agility: 9,
    intelligence: 18,
    vitality: 10,
    luck: 12,
    health: 60,
    max_health: 80,
    mana: 45,
    max_mana: 60,
  },
];

const mockUser = { id: "user-1", email: "user@example.com" };

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: vi.fn(async () => {}),
  }),
}));

vi.mock("@/integrations/supabase/client", async () => {
  const actual = await vi.importActual<any>("@/integrations/supabase/client");
  return {
    ...actual,
    supabase: {
      from: () => ({
        select: () => ({
          eq: async () => ({ data: characters, error: null }),
        }),
      }),
    },
  };
});

function renderGame() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <Game />
    </ThemeProvider>
  );
}

describe("Game - seleção de personagem", () => {
  it("renderiza lista e filtra por nome e classe", async () => {
    const user = userEvent.setup();
    renderGame();

    await screen.findByText("Character");
    expect(await screen.findByRole("button", { name: /Ziv Guerreiro/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ziv Mago/i })).toBeInTheDocument();

    const search = screen.getByPlaceholderText("Search");
    await user.type(search, "mago");
    expect(screen.queryByRole("button", { name: /Ziv Guerreiro/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ziv Mago/i })).toBeInTheDocument();

    await user.click(search);
    await user.keyboard("{Control>}{A}{/Control}{Backspace}");

    await user.click(screen.getByText(/🔮\s*Mago/i));

    expect(screen.queryByRole("button", { name: /Ziv Guerreiro/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ziv Mago/i })).toBeInTheDocument();
  });

  it("entra com personagem", async () => {
    const user = userEvent.setup();
    renderGame();

    await screen.findByRole("button", { name: /Ziv Guerreiro/i });
    await user.click(screen.getByRole("button", { name: /Ziv Mago/i }));
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Dashboard Ziv Mago")).toBeInTheDocument();
  });
});
