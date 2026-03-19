import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Award, Star, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { GameButton } from '@/components/ui/game-panel';

interface CharacterTitle {
  id: string; title_name: string; description: string; earned_at: string; is_active?: boolean;
}

interface TitlesProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function Titles({ character, onCharacterUpdate }: TitlesProps) {
  const [titles, setTitles] = useState<CharacterTitle[]>([]);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTitles(); }, [character.id]);

  const loadTitles = async () => {
    const { data } = await supabase.from('character_titles').select('*').eq('character_id', character.id).order('earned_at', { ascending: false });
    setTitles(data || []);
    const active = (data || []).find(t => (t as any).is_active);
    setActiveTitle(active?.title_name || null);
    setLoading(false);
  };

  const selectTitle = (t: CharacterTitle) => {
    setActiveTitle(t.title_name);
    toast.success(`Título "${t.title_name}" equipado!`);
  };

  if (loading) return <div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando...</span></div>;

  return (
    <div>
      {/* Active title */}
      <div className="rpg-item-detail mb-3 text-center">
        {activeTitle ? (
          <div>
            <Crown className="h-5 w-5 mx-auto mb-1" style={{ color: 'hsl(var(--rpg-gold))' }} />
            <span className="font-bold pixel-text" style={{ color: 'hsl(var(--rpg-gold))' }}>{activeTitle}</span>
            <p className="text-[10px] opacity-50 mt-1">{titles.find(t => t.title_name === activeTitle)?.description}</p>
            <GameButton size="sm" className="mt-2" onClick={() => { setActiveTitle(null); toast.success('Título removido'); }}>
              Remover
            </GameButton>
          </div>
        ) : (
          <div>
            <Lock className="h-5 w-5 mx-auto mb-1 opacity-40" />
            <span className="text-xs opacity-40">Nenhum título equipado</span>
          </div>
        )}
      </div>

      <label className="rpg-label">Seus Títulos ({titles.length})</label>
      {titles.length === 0 ? (
        <div className="text-center py-8">
          <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs opacity-40">Nenhum título. Complete conquistas e missões épicas!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {titles.map((t) => {
            const isActive = t.title_name === activeTitle;
            return (
              <div key={t.id} className={`rpg-class-card !cursor-default ${isActive ? 'rpg-class-selected' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" style={{ color: 'hsl(var(--rpg-gold))' }} />
                    <div>
                      <span className="font-bold text-xs pixel-text">{t.title_name}</span>
                      {isActive && <span className="rpg-equipped-tag ml-1">Equipado</span>}
                      <p className="text-[10px] opacity-50">{t.description}</p>
                    </div>
                  </div>
                  {!isActive && (
                    <GameButton size="sm" variant="primary" onClick={() => selectTitle(t)}>Equipar</GameButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rpg-item-detail mt-3">
        <label className="rpg-label">Como Ganhar Títulos?</label>
        <ul className="text-[10px] opacity-50 space-y-1">
          <li>⚔️ Complete conquistas épicas</li>
          <li>🏆 Vença criaturas lendárias</li>
          <li>👑 Alcance posições altas nos rankings</li>
          <li>📜 Complete séries de missões</li>
        </ul>
      </div>
    </div>
  );
}
