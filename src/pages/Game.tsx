import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CharacterCreation } from '@/components/CharacterCreation';
import { CharacterDashboard } from '@/components/CharacterDashboard';

const Game = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<any[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadCharacters();
  }, [user, navigate]);

  const loadCharacters = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading characters:', error);
    } else {
      setCharacters(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCharacterCreated = (character: any) => {
    setCharacters(prev => [...prev, character]);
    setSelectedCharacter(character);
  };

  const handleCharacterSelect = (character: any) => {
    setSelectedCharacter(character);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando seus personagens...</p>
        </div>
      </div>
    );
  }

  if (selectedCharacter) {
    return (
      <CharacterDashboard 
        character={selectedCharacter} 
        onBack={() => setSelectedCharacter(null)}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent">
              ZIV DUEL
            </h1>
            <p className="text-muted-foreground">Bem-vindo ao Sertão, {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sair
          </Button>
        </div>

        {characters.length === 0 ? (
          <CharacterCreation onCharacterCreated={handleCharacterCreated} />
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Seus Personagens</h2>
              <Button 
                onClick={() => setSelectedCharacter('create')}
                disabled={characters.length >= 5}
              >
                Criar Novo Personagem ({characters.length}/5)
              </Button>
            </div>

            {selectedCharacter === 'create' ? (
              <CharacterCreation 
                onCharacterCreated={handleCharacterCreated}
                onCancel={() => setSelectedCharacter(null)}
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {characters.map((character) => (
                  <Card 
                    key={character.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleCharacterSelect(character)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {character.name}
                        <span className="text-sm font-normal bg-primary/10 px-2 py-1 rounded">
                          Nível {character.level}
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {character.class === 'warrior' && 'Guerreiro'}
                        {character.class === 'mage' && 'Mago'}
                        {character.class === 'archer' && 'Arqueiro'}
                        {character.class === 'healer' && 'Curandeiro'}
                        {character.class === 'assassin' && 'Assassino'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Bioma:</span>
                          <span className="capitalize">{character.current_biome}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Gold:</span>
                          <span>{character.gold}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Experiência:</span>
                          <span>{character.experience}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;