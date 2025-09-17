import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Sword, Shield, Target, Heart, UserX } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  if (user) {
    navigate('/game');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: 'Erro no Login',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bem-vindo ao Sertão!',
        description: 'Login realizado com sucesso.',
      });
      navigate('/game');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const username = formData.get('username') as string;

    const { error } = await signUp(email, password, username);
    
    if (error) {
      toast({
        title: 'Erro no Cadastro',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Conta Criada!',
        description: 'Bem-vindo ao ZIV DUEL! Agora você pode fazer login.',
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Game Info Section */}
        <div className="hidden lg:block space-y-6">
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent mb-4">
              ZIV DUEL
            </h1>
            <p className="text-xl text-muted-foreground">
              O MMORPG do Sertão Brasileiro
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-amber-100 to-orange-100 border-amber-200">
              <CardContent className="p-4 text-center">
                <Sword className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                <h3 className="font-semibold">5 Classes Únicas</h3>
                <p className="text-sm text-muted-foreground">Guerreiro, Mago, Arqueiro, Curandeiro, Assassino</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-100 to-emerald-100 border-green-200">
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">4 Biomas</h3>
                <p className="text-sm text-muted-foreground">Caatinga, Agreste, Litoral, Santa Cruz</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-200">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Montarias Nativas</h3>
                <p className="text-sm text-muted-foreground">Capture e dome animais únicos</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200">
              <CardContent className="p-4 text-center">
                <Heart className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">35 Títulos</h3>
                <p className="text-sm text-muted-foreground">Sistema de prestígio avançado</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Auth Form Section */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Entre no Sertão</CardTitle>
            <CardDescription>
              Faça login ou crie sua conta para começar sua jornada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Cadastro</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      required
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar no Jogo'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Nome de Usuário</Label>
                    <Input
                      id="signup-username"
                      name="username"
                      type="text"
                      required
                      placeholder="SeuNomeDeJogador"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Criando Conta...' : 'Criar Conta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;