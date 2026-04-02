import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import Auth from "./Auth";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const signInMock = vi.fn(async () => ({ error: null }));
const signUpMock = vi.fn(async () => ({ error: null }));
const resetPasswordMock = vi.fn(async () => ({ error: null }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    signIn: signInMock,
    signUp: signUpMock,
    resetPassword: resetPasswordMock,
  }),
}));

function renderAuth() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <Auth />
    </ThemeProvider>
  );
}

describe("Auth", () => {
  it("valida em tempo real e faz login", async () => {
    const user = userEvent.setup();
    renderAuth();

    const loginTab = screen.getByRole("tab", { name: "Login" });
    expect(loginTab).toHaveAttribute("aria-selected", "true");

    const loginRegion = screen.getByRole("tabpanel", { name: "Login" });
    const usernameInput = within(loginRegion).getByLabelText("Nome de usuário");
    const passwordInput = within(loginRegion).getByLabelText("Senha");
    const submitButton = within(loginRegion).getByRole("button", { name: "Entrar" });

    expect(submitButton).toBeDisabled();

    await user.type(usernameInput, "ab");
    expect(within(loginRegion).getByText("Informe seu nome de usuário ou email.")).toBeInTheDocument();

    await user.clear(usernameInput);
    await user.type(usernameInput, "user@example.com");
    await user.type(passwordInput, "12345");
    expect(within(loginRegion).getByText("A senha precisa ter no mínimo 6 caracteres.")).toBeInTheDocument();

    await user.type(passwordInput, "6");
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
    expect(signInMock).toHaveBeenCalledWith("user@example.com", "123456");
    expect(navigateMock).toHaveBeenCalledWith("/game");
  });

  it("abre recuperação de senha e chama resetPassword", async () => {
    const user = userEvent.setup();
    renderAuth();

    await user.click(screen.getByRole("button", { name: "Esqueci minha senha" }));

    const dialog = await screen.findByRole("dialog");
    const emailInput = within(dialog).getByLabelText("Email");
    const submit = within(dialog).getByRole("button", { name: "Enviar link" });

    await user.type(emailInput, "reset@example.com");
    await user.click(submit);

    expect(resetPasswordMock).toHaveBeenCalledWith("reset@example.com");
  });
});
