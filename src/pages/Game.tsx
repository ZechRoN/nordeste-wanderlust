import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CharacterCreation } from '@/components/CharacterCreation';
import { CharacterDashboard } from '@/components/CharacterDashboard';
import { GamePanel, GameButton } from '@/components/ui/game-panel';
import { Swords, LogOut, Plus } from 'lucide-react';

const Game = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    loadCharacters();
  }, [user, navigate]);

  const loadCharacters = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('characters').select('*').eq('user_id', user.id);
    if (error) console.error('Error loading characters:', error);
    else setCharacters(data || []);
    setLoading(false);
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };
  const handleCharacterCreated = (character: any) => { setCharacters(prev => [...prev, character]); setSelectedCharacter(character); };

  if (loading) {
    return (
      <div className="fixed inset-0 rpg-game-bg flex items-center justify-center">
        <span className="rpg-loading text-lg">Carregando personagens...</span>
      </div>
    );
  }

  if (selectedCharacter && selectedCharacter !== 'create') {
    return <CharacterDashboard character={selectedCharacter} onBack={() => setSelectedCharacter(null)} onSignOut={handleSignOut} />;
  }

  const classNames: Record<string, string> = {
    warrior: 'Guerreiro', mage: 'Mago', archer: 'Arqueiro', healer: 'Curandeiro', assassin: 'Assassino'
  };
  const classIcons: Record<string, string> = {
    warrior: '⚔️', mage: '🔮', archer: '🏹', healer: '💚', assassin: '🗡️'
  };

  return (
    <div className="fixed inset-0 rpg-game-bg flex items-center justify-center p-4">
      {selectedCharacter === 'create' ? (
        <CharacterCreation onCharacterCreated={handleCharacterCreated} onCancel={() => setSelectedCharacter(null)} />
      ) : characters.length === 0 ? (
        <CharacterCreation onCharacterCreated={handleCharacterCreated} />
      ) : (
        <div className="w-full max-w-lg">
          <GamePanel
            title="ZIV DUEL"
            icon={<Swords className="h-5 w-5" />}
            footer={
              <div className="flex gap-2 justify-between w-full">
                <GameButton variant="danger" onClick={handleSignOut}><LogOut className="h-3 w-3 mr-1" /> Sair</GameButton>
                <GameButton variant="gold" onClick={() => setSelectedCharacter('create')} disabled={characters.length >= 5}>
                  <Plus className="h-3 w-3 mr-1" /> Novo ({characters.length}/5)
                </GameButton>
              </div>
            }
          >
            <div className="text-center mb-4">
              <p className="text-xs opacity-60">Bem-vindo, {user?.email}</p>
              <p className="rpg-label mt-1">Selecione um Personagem</p>
            </div>

            <div className="space-y-2">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="rpg-class-card cursor-pointer"
                  onClick={() => setSelectedCharacter(char)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{classIcons[char.class] || '👤'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold pixel-text text-sm">{char.name}</span>
                        <span className="rpg-combatant-level">Nível {char.level}</span>
                      </div>
                      <div className="text-[10px] opacity-60">{classNames[char.class] || char.class}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 text-[10px]">
                    <span>🌍 {char.current_biome}</span>
                    <span>🪙 {char.gold}</span>
                    <span>⭐ {char.experience} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </GamePanel>
        </div>
      )}
    </div>
  );
};

export default Game;
