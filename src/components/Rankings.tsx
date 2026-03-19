import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Target, Coins } from 'lucide-react';
import { GamePanelTabs } from '@/components/ui/game-panel';

interface RankedCharacter {
  id: string; name: string; class: string; level: number;
  experience: number; gold: number; current_biome: string;
}

interface RankingsProps { character: any; }

const CLASS_NAMES: Record<string, string> = {
  warrior: 'Guerreiro', mage: 'Mago', archer: 'Arqueiro', healer: 'Curandeiro', assassin: 'Assassino'
};

export function Rankings({ character }: RankingsProps) {
  const [topByLevel, setTopByLevel] = useState<RankedCharacter[]>([]);
  const [topByGold, setTopByGold] = useState<RankedCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('level');

  useEffect(() => { loadRankings(); }, []);

  const loadRankings = async () => {
    const { data: lvl } = await supabase.from('characters').select('id, name, class, level, experience, gold, current_biome')
      .order('level', { ascending: false }).order('experience', { ascending: false }).limit(50);
    const { data: gld } = await supabase.from('characters').select('id, name, class, level, experience, gold, current_biome')
      .order('gold', { ascending: false }).limit(50);
    setTopByLevel(lvl || []);
    setTopByGold(gld || []);
    setLoading(false);
  };

  const getRankIcon = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;

  if (loading) return <div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando...</span></div>;

  const renderList = (chars: RankedCharacter[], key: 'level' | 'gold') => (
    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
      {chars.map((c, i) => {
        const isSelf = c.id === character.id;
        return (
          <div key={c.id} className={`rpg-class-card !cursor-default !p-2 ${isSelf ? 'rpg-class-selected' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold w-8 text-center">{getRankIcon(i + 1)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-xs pixel-text">{c.name}</span>
                  {isSelf && <span className="rpg-equipped-tag text-[8px]">Você</span>}
                </div>
                <span className="text-[9px] opacity-40">{CLASS_NAMES[c.class] || c.class} • {c.current_biome}</span>
              </div>
              <span className="font-bold text-xs pixel-text">
                {key === 'level' ? `Nv.${c.level}` : `🪙${c.gold.toLocaleString()}`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <GamePanelTabs
        tabs={[{ key: 'level', label: '🏅 Por Nível' }, { key: 'gold', label: '🪙 Por Riqueza' }]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {activeTab === 'level' && renderList(topByLevel, 'level')}
      {activeTab === 'gold' && renderList(topByGold, 'gold')}
    </div>
  );
}
