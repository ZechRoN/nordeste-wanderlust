import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GamePanelTabs, GameButton } from '@/components/ui/game-panel';
import { Div } from '@/components/ui/Div';

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
const QUEST_TYPE_TABS = [
  { key: 'all', label: 'Todas' },
  { key: 'main', label: 'Principal' },
  { key: 'side', label: 'Secundária' },
  { key: 'daily', label: 'Diária' },
];

export function Quests({ character, onCharacterUpdate }: QuestsProps) {
  const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
  const [activeQuests, setActiveQuests] = useState<CharacterQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'available'>('active');
  const [typeTab, setTypeTab] = useState('all');
  const [sortKey, setSortKey] = useState<'title' | 'level' | 'reward' | 'progress'>('title');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(() => new Set());

  const trackedStorageKey = useMemo(() => `tracked_quests_${character.id}`, [character.id]);

  useEffect(() => { loadQuests(); }, [character.id, character.current_biome]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(trackedStorageKey);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      setTrackedIds(new Set(ids));
    } catch {
      setTrackedIds(new Set());
    }
  }, [trackedStorageKey]);

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

  const toggleTracked = (questId: string) => {
    setTrackedIds(prev => {
      const next = new Set(prev);
      if (next.has(questId)) next.delete(questId);
      else next.add(questId);
      localStorage.setItem(trackedStorageKey, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const combinedList = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const list = activeTab === 'active'
      ? activeQuests.map((cq) => ({ kind: 'active' as const, id: cq.id, questId: cq.quest_id, quest: cq.quests, progress: cq.progress, completed: cq.completed, cq }))
      : availableQuests.map((quest) => ({ kind: 'available' as const, id: quest.id, questId: quest.id, quest, progress: 0, completed: false, cq: null as any }));

    const filtered = list.filter((entry) => {
      if (typeTab !== 'all' && entry.quest.quest_type !== typeTab) return false;
      if (!normalizedQuery) return true;
      return entry.quest.title.toLowerCase().includes(normalizedQuery) || entry.quest.description.toLowerCase().includes(normalizedQuery);
    });

    const sorted = [...filtered].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'title') return dir * a.quest.title.localeCompare(b.quest.title);
      if (sortKey === 'level') return dir * ((a.quest.required_level ?? 0) - (b.quest.required_level ?? 0));
      if (sortKey === 'reward') return dir * ((a.quest.reward_gold + a.quest.reward_experience) - (b.quest.reward_gold + b.quest.reward_experience));
      if (sortKey === 'progress') {
        const ap = a.quest.objective_count ? (a.progress / a.quest.objective_count) : 0;
        const bp = b.quest.objective_count ? (b.progress / b.quest.objective_count) : 0;
        return dir * (ap - bp);
      }
      return 0;
    });

    sorted.sort((a, b) => {
      const aTracked = trackedIds.has(a.questId) ? 1 : 0;
      const bTracked = trackedIds.has(b.questId) ? 1 : 0;
      return bTracked - aTracked;
    });

    return sorted;
  }, [activeQuests, activeTab, availableQuests, query, sortDir, sortKey, trackedIds, typeTab]);

  const selected = useMemo(() => {
    if (!combinedList.length) return null;
    const found = selectedId ? combinedList.find((e) => e.questId === selectedId || e.id === selectedId) : null;
    return found ?? combinedList[0];
  }, [combinedList, selectedId]);

  useEffect(() => {
    if (!selected && combinedList[0]) setSelectedId(combinedList[0].questId);
  }, [combinedList, selected]);

  if (loading) return <Div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando...</span></Div>;

  return (
    <Div className="space-y-2">
      <Div className="flex items-center justify-between gap-2">
        <GamePanelTabs
          tabs={[
            { key: 'active', label: `Ativas (${activeQuests.length})` },
            { key: 'available', label: `Disponíveis (${availableQuests.length})` },
          ]}
          activeTab={activeTab}
          onTabChange={(key) => setActiveTab(key as any)}
        />

        <Div className="flex items-center gap-2">
          <select className="rpg-input !w-[120px]" value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
            <option value="title">Nome</option>
            <option value="level">Nível</option>
            <option value="reward">Recompensa</option>
            <option value="progress">Progresso</option>
          </select>
          <select className="rpg-input !w-[84px]" value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
            <option value="asc">↑</option>
            <option value="desc">↓</option>
          </select>
          <Div className="relative w-[180px]">
            <SearchInput value={query} onChange={setQuery} />
          </Div>
        </Div>
      </Div>

      <GamePanelTabs tabs={QUEST_TYPE_TABS} activeTab={typeTab} onTabChange={setTypeTab} />

      <Div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-2">
        <Div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
          {combinedList.length === 0 ? (
            <Div className="rpg-item-detail">
              <span className="text-[11px] opacity-70">
                {activeTab === 'active' ? 'Nenhuma missão ativa.' : 'Nenhuma missão disponível neste bioma.'}
              </span>
            </Div>
          ) : (
            combinedList.map((entry) => {
              const quest = entry.quest;
              const isSelected = selected?.questId === entry.questId;
              const isTracked = trackedIds.has(entry.questId);
              const isComplete = entry.kind === 'active' && entry.progress >= quest.objective_count;
              const pct = quest.objective_count ? Math.min(100, Math.floor((entry.progress / quest.objective_count) * 100)) : 0;

              return (
                <button
                  key={`${entry.kind}_${entry.id}`}
                  type="button"
                  onClick={() => setSelectedId(entry.questId)}
                  className={`rpg-class-card w-full text-left ${isSelected ? 'rpg-class-selected' : ''}`}
                >
                  <Div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] opacity-70">{QUEST_TYPE_LABELS[quest.quest_type] || quest.quest_type}</span>
                    <Div className="flex items-center gap-2">
                      {isTracked && <span className="text-[10px]">★</span>}
                      <span className="rpg-combatant-level text-[9px]">Nv.{quest.required_level}+</span>
                    </Div>
                  </Div>
                  <Div className="font-bold text-[12px]">{quest.title}</Div>
                  <Div className="text-[10px] opacity-60 line-clamp-2">{quest.description}</Div>

                  {entry.kind === 'active' && (
                    <Div className="mt-2">
                      <Div className="rpg-bar" style={{ height: '6px' }}>
                        <Div
                          className="rpg-bar-fill"
                          style={{ width: `${pct}%`, background: isComplete ? 'hsl(120 60% 45%)' : 'hsl(var(--rpg-gold))' }}
                        />
                      </Div>
                      <Div className="flex items-center justify-between text-[9px] opacity-70">
                        <span>{entry.progress}/{quest.objective_count}</span>
                        <span className="rpg-gold-display">🪙{quest.reward_gold} ⭐{quest.reward_experience}</span>
                      </Div>
                    </Div>
                  )}
                </button>
              );
            })
          )}
        </Div>

        <Div className="space-y-2">
          {!selected ? (
            <Div className="rpg-item-detail">Selecione uma missão.</Div>
          ) : (
            <>
              <Div className="rpg-item-detail" style={{ marginBottom: 0 }}>
                <Div className="flex items-center justify-between gap-2">
                  <Div className="font-bold text-[13px]">{selected.quest.title}</Div>
                  <Div className="flex items-center gap-2">
                    <GameButton size="sm" variant={trackedIds.has(selected.questId) ? 'gold' : 'secondary'} onClick={() => toggleTracked(selected.questId)}>
                      ★
                    </GameButton>
                    {selected.kind === 'available' && (
                      <GameButton size="sm" variant="primary" onClick={() => acceptQuest(selected.quest)}>
                        Aceitar
                      </GameButton>
                    )}
                  </Div>
                </Div>
                <Div className="text-[10px] opacity-70 mt-1">
                  {QUEST_TYPE_LABELS[selected.quest.quest_type] || selected.quest.quest_type} • Nv.{selected.quest.required_level}+ • {selected.quest.biome}
                </Div>
              </Div>

              <Div className="rpg-item-detail" style={{ marginBottom: 0 }}>
                <Div className="text-[11px] font-bold mb-1">Objetivo</Div>
                <Div className="text-[11px] opacity-80">
                  {selected.quest.objective_type}: {selected.quest.objective_target} ({selected.quest.objective_count})
                </Div>

                {selected.kind === 'active' && (
                  <Div className="mt-2">
                    <Div className="flex items-center justify-between text-[11px]">
                      <span>Progresso</span>
                      <span>{selected.progress}/{selected.quest.objective_count}</span>
                    </Div>
                    <Div className="rpg-bar" style={{ height: '8px' }}>
                      <Div
                        className="rpg-bar-fill"
                        style={{
                          width: `${selected.quest.objective_count ? Math.min(100, Math.floor((selected.progress / selected.quest.objective_count) * 100)) : 0}%`,
                          background: selected.progress >= selected.quest.objective_count ? 'hsl(120 60% 45%)' : 'hsl(var(--rpg-gold))',
                        }}
                      />
                    </Div>
                    {selected.progress >= selected.quest.objective_count && (
                      <GameButton size="sm" variant="gold" className="w-full mt-2" onClick={() => completeQuest(selected.cq)}>
                        Coletar Recompensas
                      </GameButton>
                    )}
                  </Div>
                )}
              </Div>

              <Div className="rpg-item-detail" style={{ marginBottom: 0 }}>
                <Div className="text-[11px] font-bold mb-1">Recompensas</Div>
                <Div className="flex items-center gap-4 text-[11px]">
                  <span className="rpg-gold-display">🪙 {selected.quest.reward_gold}</span>
                  <span className="rpg-gold-display">⭐ {selected.quest.reward_experience}</span>
                </Div>
              </Div>

              <Div className="rpg-item-detail">
                <Div className="text-[11px] font-bold mb-1">Descrição</Div>
                <Div className="text-[11px] opacity-80">{selected.quest.description}</Div>
              </Div>
            </>
          )}
        </Div>
      </Div>
    </Div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className="rpg-input"
      placeholder="Buscar"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
