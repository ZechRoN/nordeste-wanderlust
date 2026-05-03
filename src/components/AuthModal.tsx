import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Div } from "@/components/ui/Div";
import { Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido."),
  password: z.string().min(6, "Mínimo 6 caracteres."),
});
const signupSchema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres."),
  email: z.string().email("Email inválido."),
  password: z.string().min(6, "Mínimo 6 caracteres."),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

export function AuthModal({
  open,
  onOpenChange,
  defaultTab = "login",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTab?: "login" | "signup";
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [showPwd, setShowPwd] = useState(false);

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: "onChange", defaultValues: { email: "", password: "" } });
  const signupForm = useForm<SignupValues>({ resolver: zodResolver(signupSchema), mode: "onChange", defaultValues: { username: "", email: "", password: "" } });

  const handleLogin = loginForm.handleSubmit(async (v) => {
    const { error } = await signIn(v.email, v.password);
    if (error) return toast({ title: "Erro no login", description: error.message, variant: "destructive" });
    toast({ title: "Bem-vindo!", description: "Login realizado." });
    onOpenChange(false);
    navigate("/game");
  });

  const handleSignup = signupForm.handleSubmit(async (v) => {
    const { error } = await signUp(v.email, v.password, v.username);
    if (error) return toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
    toast({ title: "Conta criada!", description: "Confira seu email para confirmar." });
    setTab("login");
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Acessar Ziv Duel</DialogTitle>
          <DialogDescription>Entre na sua conta ou cadastre-se para começar.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Cadastro</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-3">
              <Div className="space-y-1.5">
                <Label htmlFor="m-email">Email</Label>
                <Input id="m-email" placeholder="seu@email.com" {...loginForm.register("email")} />
                {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
              </Div>
              <Div className="space-y-1.5">
                <Label htmlFor="m-pwd">Senha</Label>
                <Div className="relative">
                  <Input id="m-pwd" type={showPwd ? "text" : "password"} placeholder="••••••••" {...loginForm.register("password")} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2" onClick={() => setShowPwd((v) => !v)}>
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </Div>
                {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
              </Div>
              <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
                {loginForm.formState.isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignup} className="space-y-3">
              <Div className="space-y-1.5">
                <Label htmlFor="s-user">Nome de usuário</Label>
                <Input id="s-user" placeholder="SeuNome" {...signupForm.register("username")} />
                {signupForm.formState.errors.username && <p className="text-xs text-destructive">{signupForm.formState.errors.username.message}</p>}
              </Div>
              <Div className="space-y-1.5">
                <Label htmlFor="s-email">Email</Label>
                <Input id="s-email" placeholder="seu@email.com" {...signupForm.register("email")} />
                {signupForm.formState.errors.email && <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>}
              </Div>
              <Div className="space-y-1.5">
                <Label htmlFor="s-pwd">Senha</Label>
                <Input id="s-pwd" type="password" placeholder="Crie uma senha forte" {...signupForm.register("password")} />
                {signupForm.formState.errors.password && <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>}
              </Div>
              <Button type="submit" className="w-full" disabled={signupForm.formState.isSubmitting}>
                {signupForm.formState.isSubmitting ? "Criando..." : "Criar conta"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
