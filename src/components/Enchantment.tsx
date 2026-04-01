import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { GameButton } from '@/components/ui/game-panel';

interface Item {
  id: string; name: string; type: string; rarity: string; value: number;
  strength_bonus: number; agility_bonus: number; intelligence_bonus: number;
  vitality_bonus: number; luck_bonus: number;
}

interface CharacterItem {
  id: string; item_id: string; is_equipped: boolean; quantity: number; item: Item;
}

interface Enchantment {
  id: string;
  character_item_id: string;
  enchantment_level: number;
  bonus_strength: number;
  bonus_agility: number;
  bonus_intelligence: number;
  bonus_vitality: number;
  bonus_luck: number;
}

interface EnchantmentProps {
  character: { id: string; gold: number; level: number };
  onCharacterUpdate: (c: any) => void;
}

const ENCHANT_COST = [50, 100, 200, 400, 800, 1500, 3000, 5000, 10000, 20000];
const SUCCESS_RATE = [90, 80, 70, 60, 50, 40, 30, 25, 20, 15];
const BREAK_CHANCE = [0, 0, 0, 5, 10, 15, 20, 25, 30, 40];

const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF', uncommon: '#22C55E', rare: '#3B82F6', epic: '#A855F7', legendary: '#F59E0B',
};

const ITEM_ICONS: Record<string, string> = {
  weapon: '⚔️', armor: '🛡️', consumable: '🧪', material: '💎',
};

export function Enchantment({ character, onCharacterUpdate }: EnchantmentProps) {
  const [items, setItems] = useState<(CharacterItem & { enchantment?: Enchantment })[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | 'break' | null>(null);

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    const { data: charItems } = await supabase
      .from('character_items')
      .select('*, item:items(*)')
      .eq('character_id', character.id);

    const { data: enchantments } = await supabase
      .from('item_enchantments')
      .select('*');

    const enriched = (charItems || [])
      .filter((ci: any) => ci.item.type === 'weapon' || ci.item.type === 'armor')
      .map((ci: any) => ({
        ...ci,
        enchantment: (enchantments || []).find((e: any) => e.character_item_id === ci.id),
      }));

    setItems(enriched);
    setLoading(false);
  };

  const selectedItem = items.find(i => i.id === selected);
  const currentLevel = selectedItem?.enchantment?.enchantment_level || 0;
  const cost = ENCHANT_COST[Math.min(currentLevel, ENCHANT_COST.length - 1)];
  const rate = SUCCESS_RATE[Math.min(currentLevel, SUCCESS_RATE.length - 1)];
  const breakChance = BREAK_CHANCE[Math.min(currentLevel, BREAK_CHANCE.length - 1)];

  const enchantItem = async () => {
    if (!selectedItem || character.gold < cost) {
      toast.error('Ouro insuficiente!');
      return;
    }

    setAnimating(true);
    setResult(null);

    // Simulate animation delay
    await new Promise(r => setTimeout(r, 1500));

    const roll = Math.random() * 100;
    const success = roll < rate;
    const broke = !success && Math.random() * 100 < breakChance;

    // Deduct gold
    const newGold = character.gold - cost;
    await supabase.from('characters').update({ gold: newGold }).eq('id', character.id);
    onCharacterUpdate({ ...character, gold: newGold });

    if (success) {
      const newLevel = currentLevel + 1;
      const bonusPerLevel = Math.ceil(newLevel * 1.5);

      if (selectedItem.enchantment) {
        await supabase.from('item_enchantments').update({
          enchantment_level: newLevel,
          bonus_strength: bonusPerLevel,
          bonus_agility: bonusPerLevel,
          bonus_intelligence: bonusPerLevel,
          bonus_vitality: bonusPerLevel,
          bonus_luck: Math.ceil(bonusPerLevel / 2),
        }).eq('id', selectedItem.enchantment.id);
      } else {
        await supabase.from('item_enchantments').insert({
          character_item_id: selectedItem.id,
          enchantment_level: newLevel,
          bonus_strength: bonusPerLevel,
          bonus_agility: bonusPerLevel,
          bonus_intelligence: bonusPerLevel,
          bonus_vitality: bonusPerLevel,
          bonus_luck: Math.ceil(bonusPerLevel / 2),
        });
      }

      setResult('success');
      toast.success(`Aprimoramento +${newLevel} bem-sucedido!`);
    } else if (broke) {
      // Destroy item
      await supabase.from('character_items').delete().eq('id', selectedItem.id);
      setResult('break');
      setSelected(null);
      toast.error(`${selectedItem.item.name} foi destruído no aprimoramento!`);
    } else {
      setResult('fail');
      toast.warning('Aprimoramento falhou! Item mantido.');
    }

    setAnimating(false);
    loadItems();
  };

  if (loading) return <div className="rpg-loading">Carregando...</div>;

  return (
    <div className="space-y-3">
      <p className="text-[10px] opacity-60 text-center">Aprimore seus equipamentos para ganhar stats adicionais</p>

      {/* Enchant station */}
      <div className="rpg-item-detail text-center relative overflow-hidden">
        <AnimatePresence>
          {animating && (
            <motion.div
              className="absolute inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)' }}
              >
                <motion.span
                  className="text-4xl"
                  animate={{ rotate: 360, scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ✨
                </motion.span>
              </motion.div>
            </motion.div>
          )}
          {result === 'success' && !animating && (
            <motion.div
              className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring' }}
            >
              <span className="text-3xl font-bold pixel-text" style={{ color: '#22C55E', textShadow: '0 0 10px #22C55E' }}>SUCESSO!</span>
            </motion.div>
          )}
          {result === 'fail' && !animating && (
            <motion.div
              className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5 }}
            >
              <span className="text-3xl font-bold pixel-text" style={{ color: '#EF4444' }}>FALHOU</span>
            </motion.div>
          )}
          {result === 'break' && !animating && (
            <motion.div
              className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2 }}
            >
              <span className="text-2xl font-bold pixel-text" style={{ color: '#DC2626' }}>💥 DESTRUÍDO!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedItem ? (
          <div className="py-4">
            <span className="text-3xl">{ITEM_ICONS[selectedItem.item.type] || '📦'}</span>
            <div className="font-bold pixel-text mt-1" style={{ color: RARITY_COLORS[selectedItem.item.rarity] }}>
              {selectedItem.item.name} {currentLevel > 0 ? `+${currentLevel}` : ''}
            </div>
            <div className="flex justify-center gap-3 mt-2 text-[10px]">
              <span style={{ color: '#22C55E' }}>✓ {rate}% sucesso</span>
              {breakChance > 0 && <span style={{ color: '#EF4444' }}>💥 {breakChance}% quebra</span>}
              <span>🪙 {cost}</span>
            </div>
            {currentLevel > 0 && selectedItem.enchantment && (
              <div className="flex flex-wrap gap-1 mt-2 justify-center text-[10px]">
                <span className="rpg-stat-bonus rpg-stat-str">+{selectedItem.enchantment.bonus_strength} FOR</span>
                <span className="rpg-stat-bonus rpg-stat-agi">+{selectedItem.enchantment.bonus_agility} AGI</span>
                <span className="rpg-stat-bonus rpg-stat-int">+{selectedItem.enchantment.bonus_intelligence} INT</span>
                <span className="rpg-stat-bonus rpg-stat-vit">+{selectedItem.enchantment.bonus_vitality} VIT</span>
              </div>
            )}
            <div className="mt-3 flex gap-2 justify-center">
              <GameButton
                variant="gold"
                onClick={enchantItem}
                disabled={animating || character.gold < cost}
              >
                ✨ Aprimorar (+{currentLevel + 1})
              </GameButton>
              <GameButton onClick={() => { setSelected(null); setResult(null); }}>Trocar</GameButton>
            </div>
          </div>
        ) : (
          <p className="py-6 opacity-50 text-xs">Selecione um equipamento abaixo</p>
        )}
      </div>

      {/* Item list */}
      <div className="space-y-1 max-h-[200px] overflow-y-auto">
        {items.map(ci => (
          <motion.div
            key={ci.id}
            className={`rpg-class-card cursor-pointer ${selected === ci.id ? 'rpg-slot-equipped' : ''}`}
            onClick={() => { setSelected(ci.id); setResult(null); }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{ITEM_ICONS[ci.item.type] || '📦'}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs" style={{ color: RARITY_COLORS[ci.item.rarity] }}>
                  {ci.item.name} {ci.enchantment ? `+${ci.enchantment.enchantment_level}` : ''}
                </div>
                <div className="text-[10px] opacity-50">
                  {ci.is_equipped ? '⚡ Equipado' : ci.item.type}
                </div>
              </div>
              {ci.enchantment && ci.enchantment.enchantment_level > 0 && (
                <span className="text-[10px]" style={{ color: 'hsl(var(--rpg-gold))' }}>
                  ✦ +{ci.enchantment.enchantment_level}
                </span>
              )}
            </div>
          </motion.div>
        ))}
        {items.length === 0 && (
          <p className="text-xs opacity-50 text-center py-4">Nenhum equipamento para aprimorar</p>
        )}
      </div>

      {/* Legend */}
      <div className="rpg-item-detail text-[10px]">
        <div className="font-bold pixel-text mb-1">Tabela de Chances</div>
        <div className="grid grid-cols-3 gap-x-3 gap-y-0.5">
          {[0, 1, 2, 3, 4].map(lvl => (
            <span key={lvl}>+{lvl + 1}: {SUCCESS_RATE[lvl]}% | 🪙{ENCHANT_COST[lvl]}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
