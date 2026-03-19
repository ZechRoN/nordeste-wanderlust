import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Award, Lock, CheckCircle2 } from 'lucide-react';
import { GamePanelTabs } from '@/components/ui/game-panel';

interface Achievement {
  id: string; title: string; description: string; category: string;
  objective_type: string; objective_count: number; reward_title: string | null;
}

interface CharacterAchievement {
  id: string; achievement_id: string; progress: number; completed: boolean; achievements: Achievement;
}

interface AchievementsProps { character: any; }

const CATEGORY_ICONS: Record<string, string> = {
  combat: '⚔️', exploration: '🗺️', progression: '📈', collection: '📦', social: '👥',
};
const CATEGORY_NAMES: Record<string, string> = {
  combat: 'Combate', exploration: 'Exploração', progression: 'Progressão', collection: 'Coleção', social: 'Social',
};

export function Achievements({ character }: AchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [charAchievements, setCharAchievements] = useState<CharacterAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => { loadAchievements(); }, [character.id]);

  const loadAchievements = async () => {
    const { data: all } = await supabase.from('achievements' as any).select('*').order('category');
    const { data: mine } = await supabase.from('character_achievements' as any).select('*, achievements(*)').eq('character_id', character.id);
    const allData = (all as any) || [];
    setAchievements(allData);
    setCharAchievements((mine as any) || []);
    const cats = [...new Set(allData.map((a: any) => a.category))];
    if (cats.length > 0 && !activeTab) setActiveTab(cats[0] as string);
    setLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando...</span></div>;

  const categories = [...new Set(achievements.map(a => a.category))];
  const completedCount = charAchievements.filter(ca => ca.completed).length;
  const pct = achievements.length > 0 ? (completedCount / achievements.length) * 100 : 0;

  return (
    <div>
      {/* Overview */}
      <div className="rpg-item-detail mb-3 text-center">
        <span className="text-lg">🏆</span>
        <div className="rpg-bar mt-1" style={{ height: '8px' }}>
          <div className="rpg-bar-fill" style={{ width: `${pct}%`, background: 'hsl(var(--rpg-gold))' }} />
        </div>
        <span className="text-[10px] opacity-50">{completedCount}/{achievements.length} ({pct.toFixed(0)}%)</span>
      </div>

      <GamePanelTabs
        tabs={categories.map(c => ({ key: c, label: `${CATEGORY_ICONS[c] || '🏆'} ${CATEGORY_NAMES[c] || c}` }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {achievements.filter(a => a.category === activeTab).map((ach) => {
          const progress = charAchievements.find(ca => ca.achievement_id === ach.id);
          const done = progress?.completed || false;
          const cur = progress?.progress || 0;
          const pctAch = (cur / ach.objective_count) * 100;

          return (
            <div key={ach.id} className={`rpg-class-card !cursor-default ${done ? 'rpg-class-selected' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{done ? '✅' : '🔒'}</span>
                <div className="flex-1">
                  <div className="font-bold text-xs pixel-text">{ach.title}</div>
                  <p className="text-[10px] opacity-50">{ach.description}</p>
                  {!done && (
                    <div className="mt-1">
                      <div className="rpg-bar" style={{ height: '4px' }}>
                        <div className="rpg-bar-fill" style={{ width: `${pctAch}%`, background: 'hsl(var(--rpg-gold))' }} />
                      </div>
                      <span className="text-[8px] opacity-40">{cur}/{ach.objective_count}</span>
                    </div>
                  )}
                  {done && ach.reward_title && (
                    <span className="rpg-equipped-tag mt-1 inline-block">🎖 {ach.reward_title}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
