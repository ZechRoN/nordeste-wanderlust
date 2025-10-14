import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuestObjectives {
  type: 'kill' | 'collect' | 'explore';
  target: string;
  count: number;
}

interface Quest {
  id: string;
  name: string;
  objectives: QuestObjectives | any;
  gold_reward: number;
  experience_reward: number;
}

interface UseQuestProgressReturn {
  updateKillProgress: (characterId: string, creatureName: string) => Promise<void>;
  updateCollectProgress: (characterId: string, itemName: string, quantity: number) => Promise<void>;
  updateExploreProgress: (characterId: string, locationName: string) => Promise<void>;
}

export function useQuestProgress(): UseQuestProgressReturn {
  const checkAndCompleteQuest = async (characterQuest: any, character: any) => {
    const quest = characterQuest.quests;
    const progress = characterQuest.progress || {};
    const objective = quest.objectives as QuestObjectives;

    if (!objective || typeof objective !== 'object') return;

    // Verificar se o objetivo foi alcançado
    const currentProgress = progress[objective.target] || 0;
    
    if (currentProgress >= objective.count) {
      // Quest completa! Atualizar status
      const { error: questError } = await supabase
        .from('character_quests')
        .update({ status: 'completed' })
        .eq('id', characterQuest.id);

      if (questError) {
        console.error('Erro ao completar quest:', questError);
        return;
      }

      // Aplicar recompensas
      const { error: charError } = await supabase
        .from('characters')
        .update({
          gold: character.gold + quest.gold_reward,
          experience: character.experience + quest.experience_reward
        })
        .eq('id', characterQuest.character_id);

      if (charError) {
        console.error('Erro ao aplicar recompensas:', charError);
        return;
      }

      toast.success(`Quest "${quest.name}" completada!`, {
        description: `+${quest.gold_reward} ouro, +${quest.experience_reward} XP`
      });
    }
  };

  const updateKillProgress = useCallback(async (characterId: string, creatureName: string) => {
    try {
      // Buscar quests ativas de kill para esta criatura
      const { data: activeQuests, error: fetchError } = await supabase
        .from('character_quests')
        .select('*, quests(*)')
        .eq('character_id', characterId)
        .eq('status', 'active');

      if (fetchError) throw fetchError;
      if (!activeQuests || activeQuests.length === 0) return;

      // Filtrar quests que têm objetivo de matar esta criatura
      const relevantQuests = activeQuests.filter((cq: any) => {
        const quest = cq.quests;
        const objectives = quest.objectives as QuestObjectives;
        return objectives?.type === 'kill' && 
               objectives?.target?.toLowerCase() === creatureName.toLowerCase();
      });

      // Atualizar progresso de cada quest relevante
      for (const characterQuest of relevantQuests) {
        const currentProgress = (characterQuest.progress as any) || {};
        const newProgress = {
          ...(typeof currentProgress === 'object' ? currentProgress : {}),
          [creatureName]: ((currentProgress as any)[creatureName] || 0) + 1
        };

        const { error: updateError } = await supabase
          .from('character_quests')
          .update({ progress: newProgress })
          .eq('id', characterQuest.id);

        if (updateError) throw updateError;

        // Verificar se completou a quest
        const { data: character } = await supabase
          .from('characters')
          .select('*')
          .eq('id', characterId)
          .single();

        if (character) {
          await checkAndCompleteQuest({ ...characterQuest, progress: newProgress }, character);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso de kill:', error);
    }
  }, []);

  const updateCollectProgress = useCallback(async (characterId: string, itemName: string, quantity: number = 1) => {
    try {
      // Buscar quests ativas de coleta para este item
      const { data: activeQuests, error: fetchError } = await supabase
        .from('character_quests')
        .select('*, quests(*)')
        .eq('character_id', characterId)
        .eq('status', 'active');

      if (fetchError) throw fetchError;
      if (!activeQuests || activeQuests.length === 0) return;

      // Filtrar quests que têm objetivo de coletar este item
      const relevantQuests = activeQuests.filter((cq: any) => {
        const quest = cq.quests;
        const objectives = quest.objectives as QuestObjectives;
        return objectives?.type === 'collect' && 
               objectives?.target?.toLowerCase() === itemName.toLowerCase();
      });

      // Atualizar progresso de cada quest relevante
      for (const characterQuest of relevantQuests) {
        const currentProgress = (characterQuest.progress as any) || {};
        const newProgress = {
          ...(typeof currentProgress === 'object' ? currentProgress : {}),
          [itemName]: ((currentProgress as any)[itemName] || 0) + quantity
        };

        const { error: updateError } = await supabase
          .from('character_quests')
          .update({ progress: newProgress })
          .eq('id', characterQuest.id);

        if (updateError) throw updateError;

        // Verificar se completou a quest
        const { data: character } = await supabase
          .from('characters')
          .select('*')
          .eq('id', characterId)
          .single();

        if (character) {
          await checkAndCompleteQuest({ ...characterQuest, progress: newProgress }, character);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso de coleta:', error);
    }
  }, []);

  const updateExploreProgress = useCallback(async (characterId: string, locationName: string) => {
    try {
      // Buscar quests ativas de exploração para este local
      const { data: activeQuests, error: fetchError } = await supabase
        .from('character_quests')
        .select('*, quests(*)')
        .eq('character_id', characterId)
        .eq('status', 'active');

      if (fetchError) throw fetchError;
      if (!activeQuests || activeQuests.length === 0) return;

      // Filtrar quests que têm objetivo de explorar este local
      const relevantQuests = activeQuests.filter((cq: any) => {
        const quest = cq.quests;
        const objectives = quest.objectives as QuestObjectives;
        return objectives?.type === 'explore' && 
               objectives?.target?.toLowerCase() === locationName.toLowerCase();
      });

      // Atualizar progresso de cada quest relevante
      for (const characterQuest of relevantQuests) {
        const currentProgress = (characterQuest.progress as any) || {};
        const newProgress = {
          ...(typeof currentProgress === 'object' ? currentProgress : {}),
          [locationName]: ((currentProgress as any)[locationName] || 0) + 1
        };

        const { error: updateError } = await supabase
          .from('character_quests')
          .update({ progress: newProgress })
          .eq('id', characterQuest.id);

        if (updateError) throw updateError;

        // Verificar se completou a quest
        const { data: character } = await supabase
          .from('characters')
          .select('*')
          .eq('id', characterId)
          .single();

        if (character) {
          await checkAndCompleteQuest({ ...characterQuest, progress: newProgress }, character);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso de exploração:', error);
    }
  }, []);

  return {
    updateKillProgress,
    updateCollectProgress,
    updateExploreProgress
  };
}
