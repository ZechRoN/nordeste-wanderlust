import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Swords, X } from 'lucide-react';
import { toast } from 'sonner';
import { RARITY_COLORS } from '@/assets/sprites';
import { GamePanel, GameButton, InventorySlot } from '@/components/ui/game-panel';
import { ItemTooltip } from '@/components/inventory/ItemTooltip';
import { Div } from '@/components/ui/Div';
import { CharacterPreview } from './CharacterPreview';
import { StatComparison } from './StatComparison';
import { motion, AnimatePresence } from 'framer-motion';

interface Character {
  id: string; name: string; class: string; level: number;
  strength: number; agility: number; intelligence: number; vitality: number; luck: number;
  health: number; max_health: number; mana: number; max_mana: number; gold: number;
}

interface Item {
  id: string; name: string; description: string; type: string; rarity: string;
  value: number; strength_bonus: number; agility_bonus: number; intelligence_bonus: number;
  vitality_bonus: number; luck_bonus: number; required_level: number;
  equipment_slot: string | null; class_restriction: string | null; subtype: string | null;
  durability: number | null; max_durability: number | null;
}

interface CharacterItem {
  id: string; item_id: string; is_equipped: boolean; quantity: number; item: Item;
}

interface EquipmentPanelProps {
  character: Character;
  onCharacterUpdate: (c: any) => void;
}

const EQUIPMENT_SLOTS = [
  { key: 'helmet', label: 'Elmo', icon: '🪖', position: 'top-center' },
  { key: 'chest', label: 'Peitoral', icon: '🛡️', position: 'mid-center' },
  { key: 'legs', label: 'Calças', icon: '👖', position: 'bot-center' },
  { key: 'gloves', label: 'Luvas', icon: '🧤', position: 'mid-left' },
  { key: 'boots', label: 'Botas', icon: '👢', position: 'bot-left' },
  { key: 'main_hand', label: 'Mão Principal', icon: '⚔️', position: 'mid-right-top' },
  { key: 'off_hand', label: 'Mão Secundária', icon: '🔮', position: 'mid-right-bot' },
] as const;

const CLASS_WEAPON_MAP: Record<string, { types: string[]; label: string }> = {
  warrior: { types: ['espada_uma_mao', 'espada_longa', 'espada_bastarda', 'espada_duas_maos'], label: 'Espadas' },
  mage: { types: ['cajado_simples', 'cajado_elemental', 'cajado_arcano'], label: 'Cajados' },
  archer: { types: ['arco_curto', 'arco_longo', 'arco_composto'], label: 'Arcos' },
  healer: { types: ['grimorio_sagrado', 'tomo_da_luz', 'codex_divino'], label: 'Livros' },
  assassin: { types: ['adaga_dupla', 'adaga_venenosa', 'katar'], label: 'Adagas' },
};

const SLOT_ICONS: Record<string, string> = {
  helmet: '🪖', chest: '🛡️', legs: '👖', gloves: '🧤', boots: '👢', main_hand: '⚔️', off_hand: '🔮',
};

export function EquipmentPanel({ character, onCharacterUpdate }: EquipmentPanelProps) {
  const [allItems, setAllItems] = useState<CharacterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<CharacterItem | null>(null);

  useEffect(() => { loadItems(); }, [character.id]);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('character_items')
        .select('*, item:items(*)')
        .eq('character_id', character.id);
      if (error) throw error;
      setAllItems((data || []) as any);
    } catch {
      toast.error('Erro ao carregar equipamentos');
    } finally {
      setLoading(false);
    }
  };

  const equippedBySlot = useMemo(() => {
    const map: Record<string, CharacterItem> = {};
    for (const ci of allItems) {
      if (ci.is_equipped && ci.item.equipment_slot) {
        map[ci.item.equipment_slot] = ci;
      }
    }
    return map;
  }, [allItems]);

  const availableForSlot = useMemo(() => {
    if (!selectedSlot) return [];
    return allItems.filter(ci => {
      if (ci.is_equipped) return false;
      if (ci.item.equipment_slot !== selectedSlot) return false;
      if (ci.item.required_level > character.level) return false;
      // Class restriction
      if (ci.item.class_restriction && ci.item.class_restriction !== character.class) return false;
      // Archer quiver requires bow
      if (ci.item.subtype === 'bolsa_flechas' && !equippedBySlot.main_hand) return false;
      return true;
    });
  }, [selectedSlot, allItems, character, equippedBySlot]);

  const validateEquip = useCallback((ci: CharacterItem): string | null => {
    const item = ci.item;
    if (item.required_level > character.level) return `Nível ${item.required_level} necessário`;
    if (item.class_restriction && item.class_restriction !== character.class) {
      const classNames: Record<string, string> = { warrior: 'Guerreiro', mage: 'Mago', archer: 'Arqueiro', healer: 'Curandeiro', assassin: 'Assassino' };
      return `Exclusivo para ${classNames[item.class_restriction] || item.class_restriction}`;
    }
    if (item.equipment_slot === 'main_hand' && item.class_restriction) {
      const allowed = CLASS_WEAPON_MAP[character.class];
      if (allowed && item.subtype && !allowed.types.includes(item.subtype)) {
        return `${allowed.label} apenas para sua classe`;
      }
    }
    return null;
  }, [character]);

  const equipItem = async (ci: CharacterItem) => {
    const err = validateEquip(ci);
    if (err) { toast.error(err); return; }

    try {
      const slot = ci.item.equipment_slot!;
      // Unequip current item in same slot
      const current = equippedBySlot[slot];
      if (current) {
        await supabase.from('character_items').update({ is_equipped: false }).eq('id', current.id);
      }
      await supabase.from('character_items').update({ is_equipped: true }).eq('id', ci.id);

      // Calculate stat changes
      const oldBonus = current ? {
        strength: current.item.strength_bonus, agility: current.item.agility_bonus,
        intelligence: current.item.intelligence_bonus, vitality: current.item.vitality_bonus,
        luck: current.item.luck_bonus,
      } : { strength: 0, agility: 0, intelligence: 0, vitality: 0, luck: 0 };

      const newStats = {
        strength: character.strength - oldBonus.strength + ci.item.strength_bonus,
        agility: character.agility - oldBonus.agility + ci.item.agility_bonus,
        intelligence: character.intelligence - oldBonus.intelligence + ci.item.intelligence_bonus,
        vitality: character.vitality - oldBonus.vitality + ci.item.vitality_bonus,
        luck: character.luck - oldBonus.luck + ci.item.luck_bonus,
      };
      await supabase.from('characters').update(newStats).eq('id', character.id);
      onCharacterUpdate({ ...character, ...newStats });
      loadItems();
      setSelectedSlot(null);
      setPreviewItem(null);
      toast.success(`${ci.item.name} equipado!`);
    } catch {
      toast.error('Erro ao equipar');
    }
  };

  const unequipItem = async (slot: string) => {
    const ci = equippedBySlot[slot];
    if (!ci) return;
    try {
      await supabase.from('character_items').update({ is_equipped: false }).eq('id', ci.id);
      const newStats = {
        strength: character.strength - ci.item.strength_bonus,
        agility: character.agility - ci.item.agility_bonus,
        intelligence: character.intelligence - ci.item.intelligence_bonus,
        vitality: character.vitality - ci.item.vitality_bonus,
        luck: character.luck - ci.item.luck_bonus,
      };
      await supabase.from('characters').update(newStats).eq('id', character.id);
      onCharacterUpdate({ ...character, ...newStats });
      loadItems();
      toast.success(`${ci.item.name} desequipado!`);
    } catch {
      toast.error('Erro ao desequipar');
    }
  };

  const totalStats = useMemo(() => {
    let str = 0, agi = 0, int_ = 0, vit = 0, luk = 0;
    Object.values(equippedBySlot).forEach(ci => {
      str += ci.item.strength_bonus;
      agi += ci.item.agility_bonus;
      int_ += ci.item.intelligence_bonus;
      vit += ci.item.vitality_bonus;
      luk += ci.item.luck_bonus;
    });
    return { strength: str, agility: agi, intelligence: int_, vitality: vit, luck: luk };
  }, [equippedBySlot]);

  if (loading) {
    return (
      <Div className="flex items-center justify-center h-40">
        <span className="rpg-loading">Carregando...</span>
      </Div>
    );
  }

  return (
    <Div className="flex flex-col gap-2 h-full overflow-y-auto">
      {/* Equipment Grid + Character Preview */}
      <Div className="equip-layout">
        {/* Left column: helmet, gloves, boots */}
        <Div className="equip-col-left">
          {(['helmet', 'gloves', 'boots'] as const).map(slot => (
            <EquipSlotButton
              key={slot}
              slot={slot}
              equipped={equippedBySlot[slot]}
              isSelected={selectedSlot === slot}
              onClick={() => setSelectedSlot(selectedSlot === slot ? null : slot)}
              onUnequip={() => unequipItem(slot)}
            />
          ))}
        </Div>

        {/* Center: Character Preview */}
        <Div className="equip-preview">
          <CharacterPreview
            characterClass={character.class}
            equipped={equippedBySlot}
          />
          <Div className="text-center mt-1">
            <span className="text-xs font-bold" style={{ color: 'hsl(var(--rpg-text))' }}>{character.name}</span>
            <span className="text-[9px] block" style={{ color: 'hsl(var(--rpg-text-dim))' }}>Nv.{character.level}</span>
          </Div>
        </Div>

        {/* Right column: chest, main_hand, off_hand, legs */}
        <Div className="equip-col-right">
          {(['chest', 'main_hand', 'off_hand', 'legs'] as const).map(slot => (
            <EquipSlotButton
              key={slot}
              slot={slot}
              equipped={equippedBySlot[slot]}
              isSelected={selectedSlot === slot}
              onClick={() => setSelectedSlot(selectedSlot === slot ? null : slot)}
              onUnequip={() => unequipItem(slot)}
            />
          ))}
        </Div>
      </Div>

      {/* Stats Summary */}
      <Div className="rpg-item-detail">
        <Div className="text-[10px] font-bold mb-1" style={{ color: 'hsl(var(--rpg-text-dim))' }}>BÔNUS DE EQUIPAMENTO</Div>
        <Div className="flex flex-wrap gap-2 text-xs">
          {totalStats.strength > 0 && <span className="rpg-stat-bonus rpg-stat-str">+{totalStats.strength} FOR</span>}
          {totalStats.agility > 0 && <span className="rpg-stat-bonus rpg-stat-agi">+{totalStats.agility} AGI</span>}
          {totalStats.intelligence > 0 && <span className="rpg-stat-bonus rpg-stat-int">+{totalStats.intelligence} INT</span>}
          {totalStats.vitality > 0 && <span className="rpg-stat-bonus rpg-stat-vit">+{totalStats.vitality} VIT</span>}
          {totalStats.luck > 0 && <span className="rpg-stat-bonus rpg-stat-luk">+{totalStats.luck} SOR</span>}
          {Object.values(totalStats).every(v => v === 0) && <span className="text-[10px] opacity-50">Nenhum equipamento</span>}
        </Div>
      </Div>

      {/* Item Selection Panel */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Div className="rpg-item-detail">
              <Div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold">
                  {SLOT_ICONS[selectedSlot]} {EQUIPMENT_SLOTS.find(s => s.key === selectedSlot)?.label}
                </span>
                <button onClick={() => { setSelectedSlot(null); setPreviewItem(null); }} className="rpg-panel-close" style={{ position: 'static', transform: 'none', width: 16, height: 16 }}>
                  <X className="h-3 w-3" />
                </button>
              </Div>

              {equippedBySlot[selectedSlot] && (
                <Div className="mb-2 p-2 border border-dashed rounded-sm" style={{ borderColor: 'hsl(120 50% 40%)', background: 'hsl(120 20% 10% / 0.3)' }}>
                  <Div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: RARITY_COLORS[equippedBySlot[selectedSlot].item.rarity as keyof typeof RARITY_COLORS] }}>
                      ✓ {equippedBySlot[selectedSlot].item.name}
                    </span>
                    <GameButton size="sm" variant="danger" onClick={() => unequipItem(selectedSlot)}>
                      Remover
                    </GameButton>
                  </Div>
                </Div>
              )}

              {availableForSlot.length === 0 ? (
                <p className="text-[10px] opacity-50 text-center py-2">Nenhum item disponível para este slot</p>
              ) : (
                <Div className="grid grid-cols-6 gap-1">
                  {availableForSlot.map(ci => (
                    <ItemTooltip key={ci.id} item={ci.item as any} isEquipped={false} quantity={ci.quantity}>
                      <Div
                        className="cursor-pointer"
                        onClick={() => setPreviewItem(previewItem?.id === ci.id ? null : ci)}
                        onDoubleClick={() => equipItem(ci)}
                      >
                        <InventorySlot
                          icon={SLOT_ICONS[selectedSlot] || '📦'}
                          quantity={ci.quantity}
                          rarity={ci.item.rarity}
                          className={previewItem?.id === ci.id ? 'rpg-slot-selected' : ''}
                        />
                      </Div>
                    </ItemTooltip>
                  ))}
                </Div>
              )}

              {/* Stat Comparison */}
              {previewItem && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                  <StatComparison
                    currentItem={equippedBySlot[selectedSlot]?.item || null}
                    newItem={previewItem.item}
                  />
                  <Div className="flex gap-1 mt-2">
                    <GameButton size="sm" variant="primary" onClick={() => equipItem(previewItem)}>Equipar</GameButton>
                    <GameButton size="sm" onClick={() => setPreviewItem(null)}>Cancelar</GameButton>
                  </Div>
                </motion.div>
              )}
            </Div>
          </motion.div>
        )}
      </AnimatePresence>
    </Div>
  );
}

// Sub-component for equipment slot buttons
function EquipSlotButton({ slot, equipped, isSelected, onClick, onUnequip }: {
  slot: string;
  equipped?: CharacterItem;
  isSelected: boolean;
  onClick: () => void;
  onUnequip: () => void;
}) {
  const slotInfo = EQUIPMENT_SLOTS.find(s => s.key === slot)!;
  const rarityColor = equipped ? RARITY_COLORS[equipped.item.rarity as keyof typeof RARITY_COLORS] : undefined;

  return (
    <Div className="equip-slot-wrapper" onClick={onClick}>
      <Div
        className={`equip-slot ${isSelected ? 'equip-slot-selected' : ''} ${equipped ? 'equip-slot-filled' : ''}`}
        style={equipped ? { borderColor: rarityColor } : undefined}
      >
        {equipped ? (
          <span className="text-lg">{SLOT_ICONS[slot]}</span>
        ) : (
          <span className="text-sm opacity-30">{SLOT_ICONS[slot]}</span>
        )}
      </Div>
      <span className="equip-slot-label">{slotInfo.label}</span>
    </Div>
  );
}
