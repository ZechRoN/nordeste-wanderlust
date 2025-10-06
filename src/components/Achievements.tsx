import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Award, Lock, CheckCircle2 } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  objective_type: string;
  objective_count: number;
  reward_title: string | null;
}

interface CharacterAchievement {
  id: string;
  achievement_id: string;
  progress: number;
  completed: boolean;
  achievements: Achievement;
}

interface AchievementsProps {
  character: any;
}

export function Achievements({ character }: AchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [characterAchievements, setCharacterAchievements] = useState<CharacterAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, [character.id]);

  const loadAchievements = async () => {
    // Carregar todas as conquistas
    const { data: allAchievements, error: achError } = await supabase
      .from('achievements' as any)
      .select('*')
      .order('category', { ascending: true });

    // Carregar conquistas do personagem
    const { data: charAchievements, error: charError } = await supabase
      .from('character_achievements' as any)
      .select('*, achievements(*)')
      .eq('character_id', character.id);

    if (achError) console.error('Erro ao carregar conquistas:', achError);
    if (charError) console.error('Erro ao carregar conquistas do personagem:', charError);

    setAchievements((allAchievements as any) || []);
    setCharacterAchievements((charAchievements as any) || []);
    setLoading(false);
  };

  const getAchievementProgress = (achievementId: string) => {
    const charAch = characterAchievements.find(ca => ca.achievement_id === achievementId);
    return charAch || null;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'combat':
        return '⚔️';
      case 'exploration':
        return '🗺️';
      case 'progression':
        return '📈';
      case 'collection':
        return '📦';
      case 'social':
        return '👥';
      default:
        return '🏆';
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      combat: 'Combate',
      exploration: 'Exploração',
      progression: 'Progressão',
      collection: 'Coleção',
      social: 'Social'
    };
    return names[category] || category;
  };

  const categories = [...new Set(achievements.map(a => a.category))];
  const completedCount = characterAchievements.filter(ca => ca.completed).length;
  const completionPercentage = achievements.length > 0
    ? (completedCount / achievements.length) * 100
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando conquistas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Conquistas
          </CardTitle>
          <CardDescription>
            {completedCount} de {achievements.length} conquistas desbloqueadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3 mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            {completionPercentage.toFixed(1)}% completo
          </p>
        </CardContent>
      </Card>

      {/* Conquistas por Categoria */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue={categories[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="text-xs">
                  <span className="mr-1">{getCategoryIcon(category)}</span>
                  {getCategoryName(category)}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {achievements
                      .filter(a => a.category === category)
                      .map((achievement) => {
                        const progress = getAchievementProgress(achievement.id);
                        const isCompleted = progress?.completed || false;
                        const currentProgress = progress?.progress || 0;
                        const progressPercent = (currentProgress / achievement.objective_count) * 100;

                        return (
                          <Card
                            key={achievement.id}
                            className={`border-2 ${
                              isCompleted
                                ? 'border-yellow-500 bg-yellow-500/5'
                                : 'border-border'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {isCompleted ? (
                                    <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center">
                                      <CheckCircle2 className="h-6 w-6 text-white" />
                                    </div>
                                  ) : (
                                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                      <Lock className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="font-bold">
                                        {achievement.title}
                                      </h4>
                                      <p className="text-sm text-muted-foreground">
                                        {achievement.description}
                                      </p>
                                    </div>
                                    {achievement.reward_title && (
                                      <Badge variant="outline" className="ml-2">
                                        <Award className="h-3 w-3 mr-1" />
                                        Título
                                      </Badge>
                                    )}
                                  </div>

                                  {!isCompleted && (
                                    <div>
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="text-muted-foreground">Progresso</span>
                                        <span className="font-medium">
                                          {currentProgress}/{achievement.objective_count}
                                        </span>
                                      </div>
                                      <Progress value={progressPercent} className="h-1.5" />
                                    </div>
                                  )}

                                  {isCompleted && achievement.reward_title && (
                                    <Badge className="mt-2 bg-yellow-500">
                                      {achievement.reward_title}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
