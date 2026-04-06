import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import { RARITY_COLORS } from '@/assets/sprites';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { GamePanel, GamePanelTabs, InventorySlot, GameButton } from '@/components/ui/game-panel';
import { ItemTooltip } from '@/components/inventory/ItemTooltip';
import { Div } from '@/components/ui/Div';

interface Character {
  id: string;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  luck: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  gold: number;
  level: number;
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

interface CharacterItem {
  id: string;
  item_id: string;
  is_equipped: boolean;
  quantity: number;
  item: Item;
}

interface InventoryProps {
  character: Character;
  onCharacterUpdate: (updatedCharacter: any) => void;
}

const MAX_SLOTS = 60;

const ITEM_ICONS: Record<string, string> = {
  weapon: '⚔️',
  armor: '🛡️',
  consumable: '🧪',
  material: '💎',
  potion: '🧪',
  quest: '📜',
  gem: '💠',
};

const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'weapon', label: 'Armas' },
  { key: 'armor', label: 'Armad.' },
  { key: 'consumable', label: 'Poções' },
  { key: 'material', label: 'Matl.' },
  { key: 'quest', label: 'Quest' },
  { key: 'misc', label: 'Misc' },
];

export function Inventory({ character, onCharacterUpdate }: InventoryProps) {
  const [characterItems, setCharacterItems] = useState<CharacterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { updateCollectProgress } = useQuestProgress();

  useEffect(() => { loadInventory(); }, []);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('character_items')
        .select('*, item:items(*)')
        .eq('character_id', character.id);
      if (error) throw error;
      setCharacterItems(data || []);
    } catch {
      toast.error('Erro ao carregar inventário');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return characterItems;
    if (activeTab === 'misc') return characterItems.filter(ci => !['weapon', 'armor', 'consumable', 'material', 'quest'].includes(ci.item.type));
    return characterItems.filter(ci => ci.item.type === activeTab);
  }, [characterItems, activeTab]);

  const selectedItem = selectedSlot !== null && selectedSlot < filteredItems.length
    ? filteredItems[selectedSlot] : null;

  // Drag and drop handlers
  const handleDragStart = useCallback((idx: number) => {
    setDragIndex(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  }, []);

  const handleDrop = useCallback((targetIdx: number) => {
    if (dragIndex === null || dragIndex === targetIdx) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder items locally
    setCharacterItems(prev => {
      const allItems = activeTab === 'all' ? [...prev] : [...prev];
      const filtered = activeTab === 'all' ? allItems :
        activeTab === 'misc' ? allItems.filter(ci => !['weapon', 'armor', 'consumable', 'material', 'quest'].includes(ci.item.type)) :
        allItems.filter(ci => ci.item.type === activeTab);

      if (dragIndex < filtered.length && targetIdx < filtered.length) {
        const dragItem = filtered[dragIndex];
        const targetItem = filtered[targetIdx];

        // If dropping on empty or swap positions
        const dragAllIdx = allItems.findIndex(i => i.id === dragItem.id);
        const targetAllIdx = allItems.findIndex(i => i.id === targetItem.id);

        if (dragAllIdx !== -1 && targetAllIdx !== -1) {
          [allItems[dragAllIdx], allItems[targetAllIdx]] = [allItems[targetAllIdx], allItems[dragAllIdx]];
        }
      }
      return allItems;
    });

    setDragIndex(null);
    setDragOverIndex(null);
    setSelectedSlot(null);
  }, [dragIndex, activeTab]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  // Drop on equipment area (auto-equip)
  const handleDropEquip = useCallback(async (idx: number) => {
    if (dragIndex === null) return;
    const item = filteredItems[dragIndex];
    if (item && !item.is_equipped && (item.item.type === 'weapon' || item.item.type === 'armor')) {
      await equipItem(item);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, filteredItems]);

  const equipItem = async (characterItem: CharacterItem) => {
    try {
      const item = characterItem.item;
      if (item.type === 'weapon' || item.type === 'armor') {
        await supabase.from('character_items').update({ is_equipped: false })
          .eq('character_id', character.id).neq('id', characterItem.id);
      }
      const { error } = await supabase.from('character_items')
        .update({ is_equipped: true }).eq('id', characterItem.id);
      if (error) throw error;

      const newStats = {
        strength: character.strength + item.strength_bonus,
        agility: character.agility + item.agility_bonus,
        intelligence: character.intelligence + item.intelligence_bonus,
        vitality: character.vitality + item.vitality_bonus,
        luck: character.luck + item.luck_bonus,
      };
      await supabase.from('characters').update(newStats).eq('id', character.id);
      onCharacterUpdate({ ...character, ...newStats });
      loadInventory();
      toast.success(`${item.name} equipado!`);
    } catch {
      toast.error('Erro ao equipar item');
    }
  };

  const unequipItem = async (characterItem: CharacterItem) => {
    try {
      const item = characterItem.item;
      await supabase.from('character_items').update({ is_equipped: false }).eq('id', characterItem.id);
      const newStats = {
        strength: character.strength - item.strength_bonus,
        agility: character.agility - item.agility_bonus,
        intelligence: character.intelligence - item.intelligence_bonus,
        vitality: character.vitality - item.vitality_bonus,
        luck: character.luck - item.luck_bonus,
      };
      await supabase.from('characters').update(newStats).eq('id', character.id);
      onCharacterUpdate({ ...character, ...newStats });
      loadInventory();
      toast.success(`${item.name} desequipado!`);
    } catch {
      toast.error('Erro ao desequipar item');
    }
  };

  const consumeItem = async (characterItem: CharacterItem) => {
    try {
      const item = characterItem.item;
      if (characterItem.quantity <= 1) {
        await supabase.from('character_items').delete().eq('id', characterItem.id);
      } else {
        await supabase.from('character_items').update({ quantity: characterItem.quantity - 1 }).eq('id', characterItem.id);
      }
      await updateCollectProgress(character.id, item.name, 1);

      let healthBonus = 0, manaBonus = 0;
      if (item.name.includes('Cura Pequena')) healthBonus = 50;
      else if (item.name.includes('Cura Grande')) healthBonus = 150;
      else if (item.name.includes('Mana')) manaBonus = 30;

      if (healthBonus > 0 || manaBonus > 0) {
        const updates: any = {};
        if (healthBonus > 0) updates.health = Math.min(character.health + healthBonus, character.max_health);
        if (manaBonus > 0) updates.mana = Math.min(character.mana + manaBonus, character.max_mana);
        await supabase.from('characters').update(updates).eq('id', character.id);
        onCharacterUpdate({ ...character, ...updates });
      }
      loadInventory();
      toast.success(`${item.name} usado!`);
    } catch {
      toast.error('Erro ao usar item');
    }
  };

  const sellItem = async (characterItem: CharacterItem) => {
    try {
      const item = characterItem.item;
      const sellValue = Math.floor(item.value * 0.6);
      if (characterItem.quantity <= 1) {
        await supabase.from('character_items').delete().eq('id', characterItem.id);
      } else {
        await supabase.from('character_items').update({ quantity: characterItem.quantity - 1 }).eq('id', characterItem.id);
      }
      const newGold = (character.gold || 0) + sellValue;
      await supabase.from('characters').update({ gold: newGold }).eq('id', character.id);
      onCharacterUpdate({ ...character, gold: newGold });
      setSelectedSlot(null);
      loadInventory();
      toast.success(`${item.name} vendido por ${sellValue} 🪙`);
    } catch {
      toast.error('Erro ao vender item');
    }
  };

  const totalItems = characterItems.reduce((sum, ci) => sum + ci.quantity, 0);

  return (
    <GamePanel
      title="Inventário"
      icon={<Package className="h-5 w-5" />}
      footer={
        <Div className="flex items-center justify-between w-full">
          <Div className="flex gap-1">
            <GameButton size="sm" onClick={() => {}}>Ordenar</GameButton>
            {selectedItem && selectedItem.item.type === 'consumable' && (
              <GameButton size="sm" variant="primary" onClick={() => consumeItem(selectedItem)}>Usar</GameButton>
            )}
            {selectedItem && !selectedItem.is_equipped && (selectedItem.item.type === 'weapon' || selectedItem.item.type === 'armor') && (
              <GameButton size="sm" variant="primary" onClick={() => equipItem(selectedItem)}>Equipar</GameButton>
            )}
            {selectedItem && selectedItem.is_equipped && (
              <GameButton size="sm" onClick={() => unequipItem(selectedItem)}>Desequipar</GameButton>
            )}
            {selectedItem && (
              <GameButton size="sm" variant="danger" onClick={() => sellItem(selectedItem)}>Vender</GameButton>
            )}
          </Div>
          <Div className="flex items-center gap-3">
            <span className="rpg-gold-display">🪙 {(character.gold || 0).toLocaleString()}</span>
            <span className="rpg-capacity">Capacidade: {totalItems}/{MAX_SLOTS}</span>
          </Div>
        </Div>
      }
    >
      {loading ? (
        <Div className="flex items-center justify-center h-40">
          <span className="rpg-loading">Carregando...</span>
        </Div>
      ) : (
        <>
          <GamePanelTabs tabs={TABS} activeTab={activeTab} onTabChange={(t) => { setActiveTab(t); setSelectedSlot(null); }} />

          {selectedItem && (
            <Div className="rpg-item-detail">
              <Div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{ITEM_ICONS[selectedItem.item.type] || '📦'}</span>
                <span className="font-bold pixel-text" style={{ color: RARITY_COLORS[selectedItem.item.rarity as keyof typeof RARITY_COLORS] || '#9CA3AF' }}>
                  {selectedItem.item.name}
                </span>
                {selectedItem.is_equipped && <span className="rpg-equipped-tag">Equipado</span>}
              </Div>
              <p className="text-xs opacity-70 mb-1">{selectedItem.item.description}</p>
              <Div className="flex flex-wrap gap-2 text-xs">
                {selectedItem.item.strength_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-str">+{selectedItem.item.strength_bonus} FOR</span>}
                {selectedItem.item.agility_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-agi">+{selectedItem.item.agility_bonus} AGI</span>}
                {selectedItem.item.intelligence_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-int">+{selectedItem.item.intelligence_bonus} INT</span>}
                {selectedItem.item.vitality_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-vit">+{selectedItem.item.vitality_bonus} VIT</span>}
                {selectedItem.item.luck_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-luk">+{selectedItem.item.luck_bonus} SOR</span>}
                <span className="rpg-stat-bonus">🪙 {selectedItem.item.value}</span>
              </Div>
            </Div>
          )}

          <Div className="rpg-grid">
            {filteredItems.map((ci, idx) => (
              <ItemTooltip key={ci.id} item={ci.item} isEquipped={ci.is_equipped} quantity={ci.quantity}>
                <Div
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                >
                  <InventorySlot
                    icon={ITEM_ICONS[ci.item.type] || '📦'}
                    quantity={ci.quantity}
                    rarity={ci.item.rarity}
                    isEquipped={ci.is_equipped}
                    onClick={() => setSelectedSlot(selectedSlot === idx ? null : idx)}
                    className={`${selectedSlot === idx ? 'rpg-slot-selected' : ''} ${dragIndex === idx ? 'rpg-slot-dragging' : ''} ${dragOverIndex === idx ? 'rpg-slot-dragover' : ''}`}
                  />
                </Div>
              </ItemTooltip>
            ))}
            {Array.from({ length: Math.max(0, Math.min(MAX_SLOTS, 30) - filteredItems.length) }).map((_, i) => (
              <Div
                key={`empty-${i}`}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={() => { if (dragIndex !== null) handleDrop(filteredItems.length + i); }}
              >
                <InventorySlot isEmpty />
              </Div>
            ))}
          </Div>
        </>
      )}
    </GamePanel>
  );
}
