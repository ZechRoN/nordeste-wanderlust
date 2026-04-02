import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { setAuthPersistence } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroBanner from "@/assets/hero-banner.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, EyeOff, Moon, Sun } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(3, "Informe seu nome de usuário ou email."),
  password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres."),
  rememberMe: z.boolean().default(true),
});

const signupSchema = z.object({
  username: z.string().min(3, "Seu nome de usuário precisa ter no mínimo 3 caracteres."),
  email: z.string().email("Informe um email válido."),
  password: z.string().min(6, "A senha precisa ter no mínimo 6 caracteres."),
});

const resetSchema = z.object({
  email: z.string().email("Informe um email válido."),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;
type ResetValues = z.infer<typeof resetSchema>;

function isProbablyEmail(value: string) {
  return value.includes("@") && value.includes(".");
}

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resolvedTheme, setTheme } = useTheme();
  const { signIn, signUp, resetPassword, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { username: "", password: "", rememberMe: true },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: { username: "", email: "", password: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (user) navigate("/game");
  }, [navigate, user]);

  const themeLabel = useMemo(() => (resolvedTheme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"), [resolvedTheme]);

  const handleLogin = loginForm.handleSubmit(async (values) => {
    setAuthPersistence(values.rememberMe);

    if (!isProbablyEmail(values.username)) {
      toast({
        title: "Login por usuário",
        description: "Por enquanto, o login funciona com email. Use seu email no campo de usuário.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await signIn(values.username, values.password);
    if (error) {
      toast({ title: "Erro no login", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
    navigate("/game");
  });

  const handleSignup = signupForm.handleSubmit(async (values) => {
    const { error } = await signUp(values.email, values.password, values.username);
    if (error) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Conta criada!", description: "Confere teu email pra confirmar o cadastro." });
    setActiveTab("login");
  });

  const handleResetPassword = resetForm.handleSubmit(async (values) => {
    const { error } = await resetPassword(values.email);
    if (error) {
      toast({ title: "Erro ao enviar recuperação", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Email enviado", description: "Se existir uma conta com esse email, você vai receber um link." });
    resetForm.reset();
  });

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[image:var(--gradient-hero)]">
      <div className="min-h-full px-4 py-8 sm:py-12">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="relative overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-warm)] lg:flex-1">
            <img
              src={heroBanner}
              alt="Paisagem do sertão ao pôr do sol"
              className="h-52 w-full object-cover sm:h-64 lg:h-full"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/35 to-transparent lg:bg-gradient-to-r lg:from-background/90 lg:via-background/40 lg:to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 lg:justify-center lg:p-10">
              <div className="max-w-md">
                <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  ZIV DUEL
                </h1>
                <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
                  Entre, escolha teu personagem e bora pro mundo. Mobile-first, rápido, acessível e com modo escuro/claro.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border bg-background/70 p-3 backdrop-blur">
                    <div className="font-medium">Personagens</div>
                    <div className="text-xs text-muted-foreground">Cards e filtros</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="w-full shadow-[var(--shadow-cool)] lg:w-[420px]">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">Acessar</CardTitle>
                  <CardDescription>Faz teu login e vem pro jogo.</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={themeLabel}
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                >
                  {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Cadastro</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-4">
                  <form onSubmit={handleLogin} className="space-y-4" aria-label="Formulário de login">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Nome de usuário</Label>
                      <Input
                        id="login-username"
                        autoComplete="username"
                        placeholder="seu@email.com"
                        {...loginForm.register("username")}
                        aria-invalid={!!loginForm.formState.errors.username}
                      />
                      {loginForm.formState.errors.username && (
                        <p className="text-sm text-destructive" role="alert">
                          {loginForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          {...loginForm.register("password")}
                          aria-invalid={!!loginForm.formState.errors.password}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive" role="alert">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <Label className="flex items-center gap-2 text-sm font-normal">
                        <Checkbox
                          checked={loginForm.watch("rememberMe")}
                          onCheckedChange={(checked) => loginForm.setValue("rememberMe", checked === true, { shouldValidate: true })}
                        />
                        Lembrar-me
                      </Label>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button type="button" variant="link" className="h-auto p-0 text-sm">
                            Esqueci minha senha
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Recuperar senha</DialogTitle>
                            <DialogDescription>Enviamos um link pra você redefinir sua senha.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="reset-email">Email</Label>
                              <Input id="reset-email" placeholder="seu@email.com" {...resetForm.register("email")} />
                              {resetForm.formState.errors.email && (
                                <p className="text-sm text-destructive" role="alert">
                                  {resetForm.formState.errors.email.message}
                                </p>
                              )}
                            </div>
                            <Button type="submit" className="w-full" disabled={!resetForm.formState.isValid || resetForm.formState.isSubmitting}>
                              {resetForm.formState.isSubmitting ? "Enviando..." : "Enviar link"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!loginForm.formState.isValid || loginForm.formState.isSubmitting}
                    >
                      {loginForm.formState.isSubmitting ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-4">
                  <form onSubmit={handleSignup} className="space-y-4" aria-label="Formulário de cadastro">
                    <div className="space-y-2">
                      <Label htmlFor="signup-username">Nome de usuário</Label>
                      <Input
                        id="signup-username"
                        autoComplete="nickname"
                        placeholder="SeuNomeDeJogador"
                        {...signupForm.register("username")}
                        aria-invalid={!!signupForm.formState.errors.username}
                      />
                      {signupForm.formState.errors.username && (
                        <p className="text-sm text-destructive" role="alert">
                          {signupForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        placeholder="seu@email.com"
                        {...signupForm.register("email")}
                        aria-invalid={!!signupForm.formState.errors.email}
                      />
                      {signupForm.formState.errors.email && (
                        <p className="text-sm text-destructive" role="alert">
                          {signupForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Crie uma senha forte"
                        {...signupForm.register("password")}
                        aria-invalid={!!signupForm.formState.errors.password}
                      />
                      {signupForm.formState.errors.password && (
                        <p className="text-sm text-destructive" role="alert">
                          {signupForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!signupForm.formState.isValid || signupForm.formState.isSubmitting}
                    >
                      {signupForm.formState.isSubmitting ? "Criando..." : "Criar conta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
