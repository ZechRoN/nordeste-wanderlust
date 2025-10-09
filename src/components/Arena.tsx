import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Swords, Trophy, Users, Flame, Shield, Target, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ArenaOpponent {
  id: string;
  name: string;
  class: string;
  level: number;
  health: number;
  max_health: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  luck: number;
  current_biome: string;
}

interface ArenaMatch {
  id: string;
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  created_at: string;
  completed_at: string | null;
}

interface ArenaProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function Arena({ character, onCharacterUpdate }: ArenaProps) {
  const [opponents, setOpponents] = useState<ArenaOpponent[]>([]);
  const [recentMatches, setRecentMatches] = useState<ArenaMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpponent, setSelectedOpponent] = useState<ArenaOpponent | null>(null);

  useEffect(() => {
    loadArenaData();
  }, [character.id]);

  const loadArenaData = async () => {
    // Carregar oponentes disponíveis (outros jogadores com nível similar)
    const levelRange = 5;
    const { data: potentialOpponents, error: opponentsError } = await supabase
      .from('characters')
      .select('*')
      .neq('id', character.id)
      .gte('level', character.level - levelRange)
      .lte('level', character.level + levelRange)
      .limit(20);

    if (opponentsError) {
      console.error('Erro ao carregar oponentes:', opponentsError);
    } else {
      setOpponents((potentialOpponents as any) || []);
    }

    setLoading(false);
  };

  const getClassDisplayName = (className: string) => {
    const names: Record<string, string> = {
      guerreiro: 'Guerreiro',
      mago: 'Mago',
      ladino: 'Ladino',
      clerigo: 'Clérigo',
      warrior: 'Guerreiro',
      mage: 'Mago',
      archer: 'Arqueiro',
      healer: 'Curandeiro',
      assassin: 'Assassino'
    };
    return names[className] || className;
  };

  const calculateMatchup = (opponent: ArenaOpponent) => {
    const playerPower = character.strength + character.agility + character.intelligence + character.vitality;
    const opponentPower = opponent.strength + opponent.agility + opponent.intelligence + opponent.vitality;
    const difference = playerPower - opponentPower;
    
    if (difference > 20) return { text: 'Fácil', color: 'text-green-500', chance: 85 };
    if (difference > 0) return { text: 'Vantagem', color: 'text-blue-500', chance: 65 };
    if (difference > -20) return { text: 'Equilibrado', color: 'text-yellow-500', chance: 50 };
    return { text: 'Difícil', color: 'text-red-500', chance: 35 };
  };

  const startDuel = async (opponent: ArenaOpponent) => {
    setSelectedOpponent(opponent);
    toast.info('Funcionalidade de duelo será implementada em breve!', {
      description: `Desafio contra ${opponent.name} iniciado`
    });
  };

  const getClassIcon = (className: string) => {
    if (className.includes('guerr') || className === 'warrior') return '⚔️';
    if (className.includes('mag') || className === 'mage') return '🔮';
    if (className.includes('lad') || className === 'archer' || className === 'assassin') return '🏹';
    if (className.includes('cler') || className === 'healer') return '✨';
    return '⚔️';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando arena...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas da Arena */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Vitórias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Em breve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Swords className="h-4 w-4 text-red-500" />
              Derrotas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Em breve</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Taxa de Vitória
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground mt-1">Em breve</p>
          </CardContent>
        </Card>
      </div>

      {/* Oponentes Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Oponentes Disponíveis
          </CardTitle>
          <CardDescription>
            Desafie outros aventureiros com nível similar ao seu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ranked" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ranked">
                <Trophy className="h-4 w-4 mr-2" />
                Ranqueado
              </TabsTrigger>
              <TabsTrigger value="casual">
                <Swords className="h-4 w-4 mr-2" />
                Casual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ranked" className="mt-4">
              {opponents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium mb-2">Nenhum oponente disponível</p>
                  <p className="text-sm">
                    Aguarde outros jogadores do seu nível entrarem na arena
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {opponents.map((opponent) => {
                      const matchup = calculateMatchup(opponent);
                      
                      return (
                        <Card key={opponent.id} className="border-2 hover:border-primary transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="text-4xl">
                                  {getClassIcon(opponent.class)}
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-lg">{opponent.name}</h4>
                                    <Badge variant="outline">Nv. {opponent.level}</Badge>
                                    <Badge className={matchup.color}>{matchup.text}</Badge>
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {getClassDisplayName(opponent.class)} • {opponent.current_biome}
                                  </p>
                                  
                                  <div className="grid grid-cols-5 gap-2 text-xs">
                                    <div className="text-center">
                                      <div className="font-bold text-red-500">{opponent.strength}</div>
                                      <div className="text-muted-foreground">FOR</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-bold text-green-500">{opponent.agility}</div>
                                      <div className="text-muted-foreground">AGI</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-bold text-blue-500">{opponent.intelligence}</div>
                                      <div className="text-muted-foreground">INT</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-bold text-orange-500">{opponent.vitality}</div>
                                      <div className="text-muted-foreground">VIT</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-bold text-purple-500">{opponent.luck}</div>
                                      <div className="text-muted-foreground">SOR</div>
                                    </div>
                                  </div>

                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="text-muted-foreground">Chance de vitória</span>
                                      <span className="font-medium">{matchup.chance}%</span>
                                    </div>
                                    <Progress value={matchup.chance} className="h-1.5" />
                                  </div>
                                </div>
                              </div>

                              <Button onClick={() => startDuel(opponent)} className="ml-4">
                                <Swords className="h-4 w-4 mr-2" />
                                Desafiar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="casual" className="mt-4">
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="font-medium mb-2">Modo Casual</p>
                <p className="text-sm">
                  Duelos casuais sem afetar seu ranking serão implementados em breve
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Regras da Arena */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Regras da Arena
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Flame className="h-4 w-4 mt-0.5 text-red-500" />
              <span>Combates PvP são balanceados pelo nível dos oponentes</span>
            </li>
            <li className="flex items-start gap-2">
              <Trophy className="h-4 w-4 mt-0.5 text-yellow-500" />
              <span>Vitórias ranqueadas concedem pontos de arena e recompensas especiais</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 text-blue-500" />
              <span>Não há perda de itens ou ouro em combates de arena</span>
            </li>
            <li className="flex items-start gap-2">
              <Target className="h-4 w-4 mt-0.5 text-green-500" />
              <span>Rankings semanais concedem títulos e recompensas exclusivas</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
