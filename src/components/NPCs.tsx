import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Package } from 'lucide-react';
import { toast } from 'sonner';
import { GamePanelTabs, GameButton } from '@/components/ui/game-panel';
import { ItemTooltip } from '@/components/inventory/ItemTooltip';

interface NPC {
  id: string;
  name: string;
  npc_type: string;
  biome: string;
  dialogue: string;
}

interface Item {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: string;
  value: number;
  strength_bonus: number;
  agility_bonus: number;
  intelligence_bonus: number;
  vitality_bonus: number;
  luck_bonus: number;
  required_level: number;
}

interface NPCsProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
  shopContext?: { npcId: string; at: number } | null;
  onCloseShopContext?: () => void;
}

const NPC_TYPE_LABELS: Record<string, string> = {
  merchant: 'Mercador',
  quest_giver: 'Mestre de Missões',
  healer: 'Curandeiro',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Comum', uncommon: 'Incomum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário',
};

export function NPCs({ character, onCharacterUpdate, shopContext, onCloseShopContext }: NPCsProps) {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [shopItems, setShopItems] = useState<Item[]>([]);
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeShopTab, setActiveShopTab] = useState('buy');

  useEffect(() => {
    loadNPCs();
    loadShopItems();
  }, [character.current_biome]);

  const loadNPCs = async () => {
    const { data, error } = await supabase
      .from('character_known_npcs' as any)
      .select('npc_id, npcs(*)')
      .eq('character_id', character.id);

    if (error) {
      console.error('Erro ao carregar NPCs conhecidos:', error);
      setNpcs([]);
      setLoading(false);
      return;
    }

    const npcsData = ((data as any) || [])
      .map((row: any) => row.npcs)
      .filter(Boolean)
      .filter((npc: any) => npc.biome === character.current_biome) as NPC[];

    setNpcs(npcsData);

    if (shopContext?.npcId) {
      const npc = npcsData.find((n) => n.id === shopContext.npcId) || null;
      if (npc) setSelectedNPC(npc);
    } else if (npcsData.length > 0) {
      setSelectedNPC(npcsData.find((n: any) => n.npc_type === 'merchant') || npcsData[0]);
    } else {
      setSelectedNPC(null);
    }
    setLoading(false);
  };

  const loadShopItems = async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .or(`biome.eq.${character.current_biome},biome.is.null`)
      .lte('required_level', character.level + 5)
      .order('value', { ascending: true });

    if (error) console.error('Erro ao carregar itens:', error);
    else setShopItems(data || []);
  };

  const canTransactWithSelectedNPC = (() => {
    if (!shopContext?.npcId) return false;
    if (!selectedNPC || selectedNPC.id !== shopContext.npcId) return false;
    return Date.now() - shopContext.at <= 30_000;
  })();

  const buyItem = async (item: Item) => {
    if (!selectedNPC) return;
    if (!canTransactWithSelectedNPC) {
      toast.info('Interaja com o NPC no mapa para comprar.');
      return;
    }
    const { data, error } = await (supabase as any).rpc('npc_purchase', {
      p_character_id: character.id,
      p_npc_id: selectedNPC.id,
      p_item_id: item.id,
      p_quantity: 1,
    });

    if (error) {
      toast.error('Não foi possível comprar agora.');
      return;
    }
    const newGold = Number((data as any)?.gold ?? character.gold);
    toast.success(`${item.name} comprado!`);
    onCharacterUpdate({ ...character, gold: newGold });
  };

  const healCharacter = async () => {
    if (!selectedNPC) return;
    if (!canTransactWithSelectedNPC) {
      toast.error('Aproxime-se do Curandeiro e interaja para curar.');
      return;
    }
    if (character.health >= character.max_health && character.mana >= character.max_mana) {
      toast.error('Você já está com a vida cheia!');
      return;
    }
    const { data, error } = await (supabase as any).rpc('npc_heal', {
      p_character_id: character.id,
      p_npc_id: selectedNPC.id,
    });

    if (error) { toast.error('Erro ao curar'); return; }
    const newGold = Number((data as any)?.gold ?? character.gold);
    toast.success('Totalmente curado!');
    onCharacterUpdate({ ...character, health: character.max_health, mana: character.max_mana, gold: newGold });
  };

  const getRarityClass = (rarity: string) => `rpg-rarity-label-${rarity}`;

  if (loading) {
    return <div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando NPCs...</span></div>;
  }

  return (
    <div className="space-y-3">
      {/* NPC List */}
      <div className="flex flex-wrap gap-1">
        {npcs.map((npc) => (
          <GameButton
            key={npc.id}
            variant={selectedNPC?.id === npc.id ? 'gold' : 'secondary'}
            size="sm"
            onClick={() => { onCloseShopContext?.(); setSelectedNPC(npc); }}
          >
            {npc.npc_type === 'merchant' ? '🛒' : npc.npc_type === 'healer' ? '💚' : '📜'} {npc.name}
          </GameButton>
        ))}
        {npcs.length === 0 && (
          <span className="text-xs opacity-60 px-1">
            Nenhum NPC conhecido neste bioma. Interaja com NPCs no mapa para registrá-los.
          </span>
        )}
      </div>

      {/* Selected NPC */}
      {selectedNPC && (
        <div className="rpg-item-detail">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{selectedNPC.npc_type === 'merchant' ? '🛒' : selectedNPC.npc_type === 'healer' ? '💚' : '📜'}</span>
            <div>
              <span className="font-bold pixel-text" style={{ color: 'hsl(var(--rpg-gold))' }}>{selectedNPC.name}</span>
              <span className="rpg-combatant-level ml-2">{NPC_TYPE_LABELS[selectedNPC.npc_type] || 'NPC'}</span>
            </div>
          </div>
          <p className="text-[11px] opacity-60 italic">"{selectedNPC.dialogue}"</p>
        </div>
      )}

      {/* Healer NPC */}
      {selectedNPC?.npc_type === 'healer' && (
        <div className="rpg-item-detail">
          <p className="text-xs opacity-70 mb-2">Restaura HP e MP completamente.</p>
          <div className="flex items-center justify-between">
            <span className="rpg-gold-display text-xs">Custo: 🪙 {Math.floor(character.level * 5)}</span>
            <GameButton size="sm" variant="primary" onClick={healCharacter}
              disabled={character.gold < Math.floor(character.level * 5) || (character.health >= character.max_health && character.mana >= character.max_mana)}>
              💚 Curar
            </GameButton>
          </div>
        </div>
      )}

      {/* Merchant NPC - Shop */}
      {selectedNPC?.npc_type === 'merchant' && (
        <div>
          <GamePanelTabs
            tabs={[{ key: 'buy', label: 'Ofertas' }]}
            activeTab={activeShopTab}
            onTabChange={setActiveShopTab}
          />

          <div className="flex items-center justify-between text-xs mb-2 px-1">
            <span className="opacity-60">Seu ouro:</span>
            <span className="rpg-gold-display">🪙 {character.gold.toLocaleString()}</span>
          </div>

          {activeShopTab === 'buy' && (
            <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
              {shopItems.map((item) => (
                <div key={item.id} className="rpg-class-card !p-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`font-bold text-xs pixel-text ${getRarityClass(item.rarity)}`}>{item.name}</span>
                        <span className="text-[9px] opacity-40">{RARITY_LABELS[item.rarity]}</span>
                      </div>
                      <p className="text-[10px] opacity-50 truncate">{item.description}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.strength_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-str text-[9px]">+{item.strength_bonus} FOR</span>}
                        {item.agility_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-agi text-[9px]">+{item.agility_bonus} AGI</span>}
                        {item.intelligence_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-int text-[9px]">+{item.intelligence_bonus} INT</span>}
                        {item.vitality_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-vit text-[9px]">+{item.vitality_bonus} VIT</span>}
                        {item.luck_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-luk text-[9px]">+{item.luck_bonus} SOR</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {item.required_level > 1 && <span className="text-[9px] opacity-40">Nv.{item.required_level}</span>}
                      <span className="rpg-gold-display text-[11px]">🪙 {item.value}</span>
                      <GameButton size="sm" variant="gold"
                        onClick={() => buyItem(item)}
                        disabled={canTransactWithSelectedNPC ? (character.gold < item.value || character.level < item.required_level) : false}
                      >
                        {canTransactWithSelectedNPC ? 'Comprar' : 'Ver'}
                      </GameButton>
                    </div>
                  </div>
                </div>
              ))}
              {shopItems.length === 0 && (
                <p className="text-center text-xs opacity-40 py-4">Nenhum item à venda neste bioma.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
