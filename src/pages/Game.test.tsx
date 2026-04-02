import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "user@example.com" },
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

    await screen.findByText("Seleção de personagem");
    expect(screen.getByText("Ziv Guerreiro")).toBeInTheDocument();
    expect(screen.getByText("Ziv Mago")).toBeInTheDocument();

    const search = screen.getByLabelText("Buscar");
    await user.type(search, "mago");
    expect(screen.queryByText("Ziv Guerreiro")).not.toBeInTheDocument();
    expect(screen.getByText("Ziv Mago")).toBeInTheDocument();

    await user.click(search);
    await user.keyboard("{Control>}{A}{/Control}{Backspace}");

    const classTrigger = screen.getAllByRole("combobox")[0]!;
    await user.click(classTrigger);
    await user.click(await screen.findByRole("option", { name: /Mago/i }));

    expect(screen.queryByText("Ziv Guerreiro")).not.toBeInTheDocument();
    expect(screen.getByText("Ziv Mago")).toBeInTheDocument();
  });

  it("abre preview e entra com personagem", async () => {
    const user = userEvent.setup();
    renderGame();

    await screen.findByText("Ziv Guerreiro");
    await user.click(screen.getAllByRole("button", { name: "Preview" })[0]!);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Ziv Guerreiro")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /Entrar com Ziv Guerreiro/i }));
    expect(await screen.findByText("Dashboard Ziv Guerreiro")).toBeInTheDocument();
  });
});
