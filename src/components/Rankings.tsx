import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Target, Map, Coins, Swords } from 'lucide-react';

interface RankedCharacter {
  id: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  gold: number;
  current_biome: string;
}

interface RankingsProps {
  character: any;
}

export function Rankings({ character }: RankingsProps) {
  const [topByLevel, setTopByLevel] = useState<RankedCharacter[]>([]);
  const [topByGold, setTopByGold] = useState<RankedCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    // Top por nível
    const { data: levelData, error: levelError } = await supabase
      .from('characters')
      .select('id, name, class, level, experience, gold, current_biome')
      .order('level', { ascending: false })
      .order('experience', { ascending: false })
      .limit(50);

    // Top por ouro
    const { data: goldData, error: goldError } = await supabase
      .from('characters')
      .select('id, name, class, level, experience, gold, current_biome')
      .order('gold', { ascending: false })
      .limit(50);

    if (levelError) console.error('Erro ao carregar ranking por nível:', levelError);
    if (goldError) console.error('Erro ao carregar ranking por ouro:', goldError);

    setTopByLevel(levelData || []);
    setTopByGold(goldData || []);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getClassDisplayName = (className: string) => {
    const names: Record<string, string> = {
      warrior: 'Guerreiro',
      mage: 'Mago',
      archer: 'Arqueiro',
      healer: 'Curandeiro',
      assassin: 'Assassino'
    };
    return names[className] || className;
  };

  const renderRankingList = (
    characters: RankedCharacter[],
    valueKey: 'level' | 'gold',
    icon: React.ReactNode
  ) => (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-2">
        {characters.map((char, index) => {
          const rank = index + 1;
          const isCurrentUser = char.id === character.id;

          return (
            <Card
              key={char.id}
              className={`border ${
                isCurrentUser ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold w-12 text-center">
                    {getRankIcon(rank)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{char.name}</span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">
                          Você
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{getClassDisplayName(char.class)}</span>
                      <span>•</span>
                      <span className="capitalize">{char.current_biome}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 font-bold text-lg">
                      {icon}
                      {valueKey === 'level' && (
                        <>
                          <span>{char.level}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({char.experience} XP)
                          </span>
                        </>
                      )}
                      {valueKey === 'gold' && (
                        <span>{char.gold.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando rankings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Rankings Globais
          </CardTitle>
          <CardDescription>
            Veja os melhores jogadores do ZIV DUEL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="level" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="level">
                <Target className="h-4 w-4 mr-2" />
                Por Nível
              </TabsTrigger>
              <TabsTrigger value="gold">
                <Coins className="h-4 w-4 mr-2" />
                Por Riqueza
              </TabsTrigger>
            </TabsList>

            <TabsContent value="level" className="mt-4">
              {renderRankingList(
                topByLevel,
                'level',
                <Target className="h-5 w-5 text-blue-500" />
              )}
            </TabsContent>

            <TabsContent value="gold" className="mt-4">
              {renderRankingList(
                topByGold,
                'gold',
                <Coins className="h-5 w-5 text-yellow-500" />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
