import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Rabbit, Zap, Trophy, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { GamePanelTabs, GameButton } from '@/components/ui/game-panel';

interface Mount {
  id: string; name: string; description: string; biome: string; rarity: string;
  speed_bonus: number; stamina_bonus: number; capture_difficulty: number; special_ability: string;
}

interface CharacterMount {
  id: string; mount_id: string; is_active: boolean; captured_at: string; mounts: Mount;
}

interface MountsProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function Mounts({ character, onCharacterUpdate }: MountsProps) {
  const [availableMounts, setAvailableMounts] = useState<Mount[]>([]);
  const [capturedMounts, setCapturedMounts] = useState<CharacterMount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('captured');

  useEffect(() => { loadMounts(); }, [character.id, character.current_biome]);

  const loadMounts = async () => {
    const { data: available } = await supabase.from('mounts').select('*').eq('biome', character.current_biome);
    const { data: captured } = await supabase.from('character_mounts').select('*, mounts(*)').eq('character_id', character.id);
    setAvailableMounts(available || []);
    setCapturedMounts((captured as any) || []);
    setLoading(false);
  };

  const captureMount = async (mount: Mount) => {
    const chance = Math.max(10, 100 - mount.capture_difficulty * 10);
    if (Math.floor(Math.random() * 100) + 1 > chance) {
      toast.error(`Falha ao capturar ${mount.name}!`);
      return;
    }
    const { error } = await supabase.from('character_mounts').insert({
      character_id: character.id, mount_id: mount.id, is_active: capturedMounts.length === 0,
    });
    if (error) { toast.error('Erro ao capturar'); return; }
    toast.success(`${mount.name} capturado!`);
    loadMounts();
  };

  const activateMount = async (cm: CharacterMount) => {
    await supabase.from('character_mounts').update({ is_active: false }).eq('character_id', character.id);
    await supabase.from('character_mounts').update({ is_active: true }).eq('id', cm.id);
    toast.success(`${cm.mounts.name} ativado!`);
    loadMounts();
  };

  if (loading) return <div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando...</span></div>;

  const activeMount = capturedMounts.find(m => m.is_active);

  return (
    <div>
      {/* Active mount */}
      {activeMount && (
        <div className="rpg-item-detail mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🐎</span>
            <span className="font-bold pixel-text rpg-rarity-label-${activeMount.mounts.rarity}">{activeMount.mounts.name}</span>
            <span className="rpg-equipped-tag">Ativa</span>
          </div>
          <p className="text-[10px] opacity-50">{activeMount.mounts.description}</p>
          <div className="flex gap-2 mt-1">
            <span className="rpg-stat-bonus rpg-stat-agi text-[9px]">+{activeMount.mounts.speed_bonus} Velocidade</span>
            <span className="rpg-stat-bonus rpg-stat-vit text-[9px]">+{activeMount.mounts.stamina_bonus} Stamina</span>
          </div>
        </div>
      )}

      <GamePanelTabs
        tabs={[
          { key: 'captured', label: `Suas (${capturedMounts.length})` },
          { key: 'available', label: `Selvagens` },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'captured' && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {capturedMounts.length === 0 ? (
            <p className="text-center text-xs opacity-40 py-8">Nenhuma montaria capturada.</p>
          ) : capturedMounts.map((cm) => (
            <div key={cm.id} className={`rpg-class-card !cursor-default ${cm.is_active ? 'rpg-class-selected' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">🐎</span>
                <div className="flex-1">
                  <div className="font-bold text-xs pixel-text rpg-rarity-label-${cm.mounts.rarity}">{cm.mounts.name}</div>
                  <span className="text-[9px] opacity-40">+{cm.mounts.speed_bonus} Vel • +{cm.mounts.stamina_bonus} Sta</span>
                </div>
                {cm.is_active ? (
                  <span className="rpg-equipped-tag">Ativa</span>
                ) : (
                  <GameButton size="sm" variant="primary" onClick={() => activateMount(cm)}>Ativar</GameButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'available' && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {availableMounts.filter(m => !capturedMounts.some(cm => cm.mount_id === m.id)).length === 0 ? (
            <p className="text-center text-xs opacity-40 py-8">Todas as montarias deste bioma foram capturadas!</p>
          ) : availableMounts.filter(m => !capturedMounts.some(cm => cm.mount_id === m.id)).map((mount) => {
            const chance = Math.max(10, 100 - mount.capture_difficulty * 10);
            return (
              <div key={mount.id} className="rpg-class-card">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 opacity-40" />
                  <div className="flex-1">
                    <div className={`font-bold text-xs pixel-text rpg-rarity-label-${mount.rarity}`}>{mount.name}</div>
                    <p className="text-[10px] opacity-50">{mount.description}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="rpg-stat-bonus text-[9px]">+{mount.speed_bonus} Vel</span>
                      <span className="rpg-stat-bonus text-[9px]">+{mount.stamina_bonus} Sta</span>
                      <span className="text-[9px] opacity-40">Captura: {chance}%</span>
                    </div>
                  </div>
                  <GameButton size="sm" variant="gold" onClick={() => captureMount(mount)}>Capturar</GameButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
