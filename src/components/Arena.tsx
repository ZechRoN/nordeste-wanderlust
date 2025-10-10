import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Swords, Trophy, Users, Flame, Shield, Target, Clock, Heart, Zap } from 'lucide-react';
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
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpponent, setSelectedOpponent] = useState<ArenaOpponent | null>(null);
  const [combatInProgress, setCombatInProgress] = useState(false);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [playerHealth, setPlayerHealth] = useState(character.health);
  const [opponentHealth, setOpponentHealth] = useState(0);

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

    // Carregar histórico de partidas
    const { data: matches, error: matchesError } = await supabase
      .from('arena_matches')
      .select(`
        *,
        player1:characters!arena_matches_player1_id_fkey(name, level, class),
        player2:characters!arena_matches_player2_id_fkey(name, level, class),
        winner:characters!arena_matches_winner_id_fkey(name)
      `)
      .or(`player1_id.eq.${character.id},player2_id.eq.${character.id}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!matchesError && matches) {
      setRecentMatches(matches);
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
    setPlayerHealth(character.max_health);
    setOpponentHealth(opponent.max_health);
    setCombatLog([]);
    setCombatInProgress(true);
    
    // Criar partida no banco de dados
    const { data: match, error } = await supabase
      .from('arena_matches')
      .insert({
        player1_id: character.id,
        player2_id: opponent.id
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao iniciar duelo');
      console.error(error);
      setCombatInProgress(false);
      return;
    }

    // Iniciar simulação de combate
    simulateCombat(opponent, match.id);
  };

  const simulateCombat = async (opponent: ArenaOpponent, matchId: string) => {
    const log: string[] = [];
    let pHealth = character.max_health;
    let oHealth = opponent.max_health;

    log.push(`🥊 Combate iniciado entre ${character.name} e ${opponent.name}!`);

    // Simular rodadas de combate
    while (pHealth > 0 && oHealth > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Turno do jogador
      const playerDamage = Math.floor(
        character.strength * 0.8 + 
        character.intelligence * 0.5 + 
        Math.random() * character.luck
      );
      oHealth -= playerDamage;
      log.push(`⚔️ ${character.name} causou ${playerDamage} de dano! (HP oponente: ${Math.max(0, oHealth)})`);
      setOpponentHealth(Math.max(0, oHealth));
      setCombatLog([...log]);

      if (oHealth <= 0) break;

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Turno do oponente
      const opponentDamage = Math.floor(
        opponent.strength * 0.8 + 
        opponent.intelligence * 0.5 + 
        Math.random() * opponent.luck
      );
      pHealth -= opponentDamage;
      log.push(`🗡️ ${opponent.name} causou ${opponentDamage} de dano! (Seu HP: ${Math.max(0, pHealth)})`);
      setPlayerHealth(Math.max(0, pHealth));
      setCombatLog([...log]);
    }

    // Determinar vencedor
    const playerWon = pHealth > 0;
    const winnerId = playerWon ? character.id : opponent.id;
    const arenaPoints = playerWon ? 50 : 10;

    log.push(
      playerWon 
        ? `🏆 Vitória! Você derrotou ${opponent.name}!` 
        : `💀 Derrota! ${opponent.name} venceu o duelo.`
    );
    log.push(`✨ +${arenaPoints} pontos de arena`);
    setCombatLog([...log]);

    // Atualizar partida no banco
    await supabase
      .from('arena_matches')
      .update({
        winner_id: winnerId,
        player1_health_remaining: pHealth,
        player2_health_remaining: oHealth,
        arena_points_awarded: arenaPoints,
        completed_at: new Date().toISOString(),
        combat_log: log
      })
      .eq('id', matchId);

    // Atualizar estatísticas do personagem
    const updates: any = {
      arena_points: character.arena_points + arenaPoints
    };

    if (playerWon) {
      updates.arena_wins = (character.arena_wins || 0) + 1;
      updates.gold = character.gold + arenaPoints * 10;
      updates.experience = character.experience + arenaPoints * 5;
    } else {
      updates.arena_losses = (character.arena_losses || 0) + 1;
    }

    const { data: updatedChar } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', character.id)
      .select()
      .single();

    if (updatedChar) {
      onCharacterUpdate(updatedChar);
    }

    toast.success(
      playerWon ? 'Vitória na Arena!' : 'Combate Concluído',
      { description: `+${arenaPoints} pontos de arena` }
    );

    // Recarregar dados
    setTimeout(() => {
      setCombatInProgress(false);
      setSelectedOpponent(null);
      loadArenaData();
    }, 3000);
  };

  const closeCombat = () => {
    setCombatInProgress(false);
    setSelectedOpponent(null);
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
            <div className="text-3xl font-bold">{character.arena_wins || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Duelos vencidos</p>
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
            <div className="text-3xl font-bold">{character.arena_losses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Duelos perdidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Pontos de Arena
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{character.arena_points || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Pontuação total</p>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ranked">
                <Trophy className="h-4 w-4 mr-2" />
                Ranqueado
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="h-4 w-4 mr-2" />
                Histórico
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

            <TabsContent value="history" className="mt-4">
              {recentMatches.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium mb-2">Sem Histórico</p>
                  <p className="text-sm">Você ainda não participou de nenhum duelo</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {recentMatches.map((match: any) => {
                      const isPlayer1 = match.player1_id === character.id;
                      const won = match.winner_id === character.id;
                      const opponent = isPlayer1 ? match.player2 : match.player1;
                      
                      return (
                        <Card key={match.id} className={won ? 'border-green-500' : 'border-red-500'}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {won ? (
                                    <Trophy className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Swords className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className="font-bold">
                                    {won ? 'Vitória' : 'Derrota'}
                                  </span>
                                  <span className="text-muted-foreground text-sm">vs</span>
                                  <span>{opponent.name}</span>
                                  <Badge variant="outline">Nv. {opponent.level}</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(match.created_at).toLocaleDateString('pt-BR')} às{' '}
                                  {new Date(match.created_at).toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-yellow-500">
                                  +{match.arena_points_awarded} pts
                                </div>
                              </div>
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
                <Swords className="h-16 w-16 mx-auto mb-4 opacity-30" />
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

      {/* Modal de Combate */}
      <Dialog open={combatInProgress} onOpenChange={closeCombat}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5" />
              Combate de Arena
            </DialogTitle>
            <DialogDescription>
              {character.name} vs {selectedOpponent?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Barras de vida */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{character.name}</span>
                  <span className="text-sm">{playerHealth}/{character.max_health}</span>
                </div>
                <Progress 
                  value={(playerHealth / character.max_health) * 100} 
                  className="h-3"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{selectedOpponent?.name}</span>
                  <span className="text-sm">{opponentHealth}/{selectedOpponent?.max_health}</span>
                </div>
                <Progress 
                  value={selectedOpponent ? (opponentHealth / selectedOpponent.max_health) * 100 : 0} 
                  className="h-3"
                />
              </div>
            </div>

            {/* Log de combate */}
            <Card>
              <CardContent className="p-4">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {combatLog.map((entry, index) => (
                      <div 
                        key={index}
                        className="text-sm animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        {entry}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
