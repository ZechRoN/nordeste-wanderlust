import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Scroll, CheckCircle2, Clock, Award } from 'lucide-react';
import { toast } from 'sonner';

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  objective_type: string;
  objective_target: string;
  objective_count: number;
  reward_gold: number;
  reward_experience: number;
  required_level: number;
  biome: string;
}

interface CharacterQuest {
  id: string;
  quest_id: string;
  progress: number;
  completed: boolean;
  quests: Quest;
}

interface QuestsProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function Quests({ character, onCharacterUpdate }: QuestsProps) {
  const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
  const [activeQuests, setActiveQuests] = useState<CharacterQuest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuests();
  }, [character.id, character.current_biome]);

  const loadQuests = async () => {
    setLoading(true);

    // Carregar quests disponíveis para o bioma e nível atual
    const { data: available, error: availError } = await supabase
      .from('quests' as any)
      .select('*')
      .eq('biome', character.current_biome)
      .lte('required_level', character.level);

    // Carregar quests ativas do personagem
    const { data: active, error: activeError } = await supabase
      .from('character_quests' as any)
      .select('*, quests(*)')
      .eq('character_id', character.id)
      .eq('completed', false);

    if (availError) console.error('Erro ao carregar quests disponíveis:', availError);
    if (activeError) console.error('Erro ao carregar quests ativas:', activeError);

    // Filtrar quests já aceitas
    const activeQuestIds = (active as any)?.map((q: any) => q.quest_id) || [];
    const filteredAvailable = (available as any)?.filter((q: any) => !activeQuestIds.includes(q.id)) || [];

    setAvailableQuests(filteredAvailable);
    setActiveQuests((active as any) || []);
    setLoading(false);
  };

  const acceptQuest = async (quest: Quest) => {
    const { error } = await supabase
      .from('character_quests' as any)
      .insert({
        character_id: character.id,
        quest_id: quest.id,
        progress: 0
      });

    if (error) {
      toast.error('Erro ao aceitar missão');
      console.error(error);
      return;
    }

    toast.success(`Missão "${quest.title}" aceita!`);
    loadQuests();
  };

  const completeQuest = async (characterQuest: CharacterQuest) => {
    const quest = characterQuest.quests;

    // Atualizar quest como completa
    const { error: questError } = await supabase
      .from('character_quests' as any)
      .update({ completed: true })
      .eq('id', characterQuest.id);

    if (questError) {
      toast.error('Erro ao completar missão');
      return;
    }

    // Atualizar personagem com recompensas
    const newGold = character.gold + quest.reward_gold;
    const newExperience = character.experience + quest.reward_experience;

    const { error: charError } = await supabase
      .from('characters')
      .update({
        gold: newGold,
        experience: newExperience
      })
      .eq('id', character.id);

    if (charError) {
      toast.error('Erro ao aplicar recompensas');
      return;
    }

    toast.success(`Missão completada! +${quest.reward_gold} ouro, +${quest.reward_experience} XP`);
    
    onCharacterUpdate({
      ...character,
      gold: newGold,
      experience: newExperience
    });

    loadQuests();
  };

  const getQuestTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      main: 'bg-amber-500',
      side: 'bg-blue-500',
      daily: 'bg-green-500',
      event: 'bg-purple-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Quests Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Missões Ativas ({activeQuests.length})
          </CardTitle>
          <CardDescription>
            Missões em progresso - Complete para ganhar recompensas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeQuests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma missão ativa. Aceite uma missão abaixo!
            </p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {activeQuests.map((cq) => {
                  const quest = cq.quests;
                  const progress = (cq.progress / quest.objective_count) * 100;
                  const isComplete = cq.progress >= quest.objective_count;

                  return (
                    <Card key={cq.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getQuestTypeColor(quest.quest_type)}>
                                {quest.quest_type}
                              </Badge>
                              {isComplete && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Completa
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">{quest.title}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {quest.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progresso</span>
                              <span className="font-medium">
                                {cq.progress}/{quest.objective_count}
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Award className="h-4 w-4" />
                              {quest.reward_gold} ouro
                            </div>
                            <div className="text-muted-foreground">
                              {quest.reward_experience} XP
                            </div>
                          </div>

                          {isComplete && (
                            <Button
                              onClick={() => completeQuest(cq)}
                              className="w-full"
                            >
                              Coletar Recompensas
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Quests Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scroll className="h-5 w-5" />
            Missões Disponíveis
          </CardTitle>
          <CardDescription>
            Novas missões em {character.current_biome}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : availableQuests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma missão disponível neste bioma no momento
            </p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {availableQuests.map((quest) => (
                  <Card key={quest.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getQuestTypeColor(quest.quest_type)}>
                          {quest.quest_type}
                        </Badge>
                        <Badge variant="outline">Nível {quest.required_level}+</Badge>
                      </div>
                      <CardTitle className="text-lg">{quest.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {quest.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Award className="h-4 w-4" />
                            {quest.reward_gold} ouro
                          </div>
                          <div className="text-muted-foreground">
                            {quest.reward_experience} XP
                          </div>
                        </div>
                        <Button
                          onClick={() => acceptQuest(quest)}
                          variant="outline"
                          className="w-full"
                        >
                          Aceitar Missão
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
