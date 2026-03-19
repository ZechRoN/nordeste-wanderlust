import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Scroll, CheckCircle2, Clock, Award } from 'lucide-react';
import { toast } from 'sonner';
import { GamePanelTabs, GameButton } from '@/components/ui/game-panel';

interface Quest {
  id: string; title: string; description: string; quest_type: string;
  objective_type: string; objective_target: string; objective_count: number;
  reward_gold: number; reward_experience: number; required_level: number; biome: string;
}

interface CharacterQuest {
  id: string; quest_id: string; progress: number; completed: boolean; quests: Quest;
}

interface QuestsProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

const QUEST_TYPE_LABELS: Record<string, string> = { main: '📜 Principal', side: '📋 Secundária', daily: '🔄 Diária', event: '🎪 Evento' };

export function Quests({ character, onCharacterUpdate }: QuestsProps) {
  const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
  const [activeQuests, setActiveQuests] = useState<CharacterQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => { loadQuests(); }, [character.id, character.current_biome]);

  const loadQuests = async () => {
    setLoading(true);
    const { data: available } = await supabase.from('quests' as any).select('*').eq('biome', character.current_biome).lte('required_level', character.level);
    const { data: active } = await supabase.from('character_quests' as any).select('*, quests(*)').eq('character_id', character.id).eq('completed', false);

    const activeQuestIds = (active as any)?.map((q: any) => q.quest_id) || [];
    setAvailableQuests((available as any)?.filter((q: any) => !activeQuestIds.includes(q.id)) || []);
    setActiveQuests((active as any) || []);
    setLoading(false);
  };

  const acceptQuest = async (quest: Quest) => {
    const { error } = await supabase.from('character_quests' as any).insert({ character_id: character.id, quest_id: quest.id, progress: 0 });
    if (error) { toast.error('Erro ao aceitar missão'); return; }
    toast.success(`Missão "${quest.title}" aceita!`);
    loadQuests();
  };

  const completeQuest = async (cq: CharacterQuest) => {
    const quest = cq.quests;
    const { error } = await supabase.from('character_quests' as any).update({ completed: true }).eq('id', cq.id);
    if (error) { toast.error('Erro ao completar missão'); return; }

    const newGold = character.gold + quest.reward_gold;
    const newExp = character.experience + quest.reward_experience;
    await supabase.from('characters').update({ gold: newGold, experience: newExp }).eq('id', character.id);
    toast.success(`Missão completada! +${quest.reward_gold} ouro, +${quest.reward_experience} XP`);
    onCharacterUpdate({ ...character, gold: newGold, experience: newExp });
    loadQuests();
  };

  if (loading) return <div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando...</span></div>;

  return (
    <div>
      <GamePanelTabs
        tabs={[
          { key: 'active', label: `Ativas (${activeQuests.length})` },
          { key: 'available', label: 'Disponíveis' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'active' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {activeQuests.length === 0 ? (
            <p className="text-center text-xs opacity-40 py-8">Nenhuma missão ativa. Aceite uma missão!</p>
          ) : activeQuests.map((cq) => {
            const quest = cq.quests;
            const progress = (cq.progress / quest.objective_count) * 100;
            const isComplete = cq.progress >= quest.objective_count;
            return (
              <div key={cq.id} className={`rpg-class-card !cursor-default ${isComplete ? 'rpg-class-selected' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] opacity-50">{QUEST_TYPE_LABELS[quest.quest_type] || quest.quest_type}</span>
                  {isComplete && <span className="text-[9px]" style={{ color: 'hsl(120 60% 55%)' }}>✓ Completa</span>}
                </div>
                <div className="font-bold text-xs pixel-text">{quest.title}</div>
                <p className="text-[10px] opacity-50">{quest.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1">
                    <div className="rpg-bar" style={{ height: '6px' }}>
                      <div className="rpg-bar-fill" style={{ width: `${progress}%`, background: isComplete ? 'hsl(120 60% 45%)' : 'hsl(var(--rpg-gold))' }} />
                    </div>
                    <span className="text-[9px] opacity-50">{cq.progress}/{quest.objective_count}</span>
                  </div>
                  <span className="text-[9px] rpg-gold-display">🪙{quest.reward_gold} ⭐{quest.reward_experience}</span>
                </div>
                {isComplete && (
                  <GameButton size="sm" variant="gold" className="w-full mt-2" onClick={() => completeQuest(cq)}>
                    Coletar Recompensas
                  </GameButton>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'available' && (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {availableQuests.length === 0 ? (
            <p className="text-center text-xs opacity-40 py-8">Nenhuma missão disponível neste bioma.</p>
          ) : availableQuests.map((quest) => (
            <div key={quest.id} className="rpg-class-card">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] opacity-50">{QUEST_TYPE_LABELS[quest.quest_type] || quest.quest_type}</span>
                <span className="rpg-combatant-level text-[9px]">Nv.{quest.required_level}+</span>
              </div>
              <div className="font-bold text-xs pixel-text">{quest.title}</div>
              <p className="text-[10px] opacity-50">{quest.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] rpg-gold-display">🪙{quest.reward_gold} ⭐{quest.reward_experience}</span>
                <GameButton size="sm" variant="primary" onClick={() => acceptQuest(quest)}>Aceitar</GameButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
