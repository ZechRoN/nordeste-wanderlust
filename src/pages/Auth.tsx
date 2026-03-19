import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Swords } from 'lucide-react';
import { GamePanel, GamePanelTabs, GameButton } from '@/components/ui/game-panel';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  if (user) { navigate('/game'); return null; }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const { error } = await signIn(formData.get('email') as string, formData.get('password') as string);
    if (error) {
      toast({ title: 'Erro no Login', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Bem-vindo ao Sertão!', description: 'Login realizado com sucesso.' });
      navigate('/game');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const { error } = await signUp(formData.get('email') as string, formData.get('password') as string, formData.get('username') as string);
    if (error) {
      toast({ title: 'Erro no Cadastro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Conta Criada!', description: 'Bem-vindo ao ZIV DUEL!' });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 rpg-game-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold pixel-text" style={{ color: 'hsl(var(--rpg-gold))' }}>
            ⚔ ZIV DUEL ⚔
          </h1>
          <p className="text-xs mt-1" style={{ color: 'hsl(var(--rpg-text-dim))' }}>O MMORPG do Sertão Brasileiro</p>
        </div>

        <GamePanel
          title="Autenticação"
          icon={<Swords className="h-5 w-5" />}
        >
          <GamePanelTabs
            tabs={[{ key: 'login', label: 'Login' }, { key: 'signup', label: 'Cadastro' }]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {activeTab === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="rpg-label">Email</label>
                <input name="email" type="email" required placeholder="seu@email.com" className="rpg-input" />
              </div>
              <div>
                <label className="rpg-label">Senha</label>
                <input name="password" type="password" required placeholder="••••••••" className="rpg-input" />
              </div>
              <GameButton variant="gold" size="lg" disabled={loading} className="w-full">
                {loading ? 'Entrando...' : '⚔ Entrar no Jogo'}
              </GameButton>
            </form>
          )}

          {activeTab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="rpg-label">Nome de Usuário</label>
                <input name="username" type="text" required placeholder="SeuNomeDeJogador" className="rpg-input" />
              </div>
              <div>
                <label className="rpg-label">Email</label>
                <input name="email" type="email" required placeholder="seu@email.com" className="rpg-input" />
              </div>
              <div>
                <label className="rpg-label">Senha</label>
                <input name="password" type="password" required placeholder="••••••••" minLength={6} className="rpg-input" />
              </div>
              <GameButton variant="gold" size="lg" disabled={loading} className="w-full">
                {loading ? 'Criando Conta...' : '✦ Criar Conta'}
              </GameButton>
            </form>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rpg-item-detail !p-2">
              <span className="text-lg">⚔️</span>
              <p className="text-[9px] opacity-60">5 Classes</p>
            </div>
            <div className="rpg-item-detail !p-2">
              <span className="text-lg">🌍</span>
              <p className="text-[9px] opacity-60">4 Biomas</p>
            </div>
            <div className="rpg-item-detail !p-2">
              <span className="text-lg">🐎</span>
              <p className="text-[9px] opacity-60">Montarias</p>
            </div>
            <div className="rpg-item-detail !p-2">
              <span className="text-lg">🏆</span>
              <p className="text-[9px] opacity-60">Arena PvP</p>
            </div>
          </div>
        </GamePanel>
      </div>
    </div>
  );
};

export default Auth;
