import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GameButton, GamePanelTabs, InventorySlot } from "@/components/ui/game-panel";
import { CLASS_COLORS } from "@/engine/constants";
import { RARITY_COLORS } from "@/assets/sprites";
import { ItemTooltip } from "@/components/inventory/ItemTooltip";
import { Div } from "@/components/ui/Div";
import { applyQuality } from "@/lib/itemQuality";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Character = {
  id: string; name: string; class: string; level: number; experience: number;
  health: number; max_health: number; mana: number; max_mana: number;
  strength: number; agility: number; intelligence: number; vitality: number; luck: number;
  gold: number; current_biome: string;
};

type Item = {
  id: string; name: string; description: string; type: string; rarity: string;
  value: number; strength_bonus: number; agility_bonus: number; intelligence_bonus: number;
  vitality_bonus: number; luck_bonus: number; required_level: number;
  equipment_slot: string | null; class_restriction: string | null; subtype: string | null;
  durability: number | null; max_durability: number | null;
};

type CharacterItem = {
  id: string; item_id: string; is_equipped: boolean; quantity: number; item: Item;
};

type MenuTab = "gear" | "info";

const MENU_TABS = [
  { key: "gear", label: "Gear" },
  { key: "info", label: "Info" },
];

const CLASS_LABELS: Record<string, string> = {
  warrior: "Guerreiro", mage: "Mago", archer: "Arqueiro", healer: "Curandeiro", assassin: "Assassino",
};

const CLASS_BASE_STATS: Record<string, Record<string, number>> = {
  warrior: { strength: 15, intelligence: 8, agility: 10, vitality: 15, luck: 7 },
  mage: { strength: 7, intelligence: 18, agility: 8, vitality: 10, luck: 12 },
  archer: { strength: 10, intelligence: 10, agility: 16, vitality: 12, luck: 7 },
  healer: { strength: 8, intelligence: 14, agility: 10, vitality: 16, luck: 7 },
  assassin: { strength: 12, intelligence: 10, agility: 18, vitality: 8, luck: 7 },
};

const SLOT_ICONS: Record<string, string> = {
  helmet: '🪖', chest: '🛡️', legs: '👖', gloves: '🧤', boots: '👢', main_hand: '⚔️', off_hand: '🔮',
};

const SLOT_LABELS: Record<string, string> = {
  helmet: 'Elmo', chest: 'Peitoral', legs: 'Calças', gloves: 'Luvas', boots: 'Botas',
  main_hand: 'Mão Principal', off_hand: 'Mão Secundária',
};

const CLASS_WEAPON_MAP: Record<string, { types: string[]; label: string }> = {
  warrior: { types: ['espada_uma_mao', 'espada_longa', 'espada_bastarda', 'espada_duas_maos'], label: 'Espadas' },
  mage: { types: ['cajado_simples', 'cajado_elemental', 'cajado_arcano'], label: 'Cajados' },
  archer: { types: ['arco_curto', 'arco_longo', 'arco_composto'], label: 'Arcos' },
  healer: { types: ['grimorio_sagrado', 'tomo_da_luz', 'codex_divino'], label: 'Livros' },
  assassin: { types: ['adaga_dupla', 'adaga_venenosa', 'katar'], label: 'Adagas' },
};

export function CharacterMenu({
  character,
  onCharacterUpdate,
}: {
  character: Character;
  onCharacterUpdate: (updatedCharacter: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<MenuTab>("gear");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef(0);
  const [items, setItems] = useState<CharacterItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [petName, setPetName] = useState<string | null>(null);

  // Points system
  const spentKey = useMemo(() => `character_points_spent_${character.id}`, [character.id]);
  const [pending, setPending] = useState({ strength: 0, agility: 0, intelligence: 0, vitality: 0, luck: 0 });
  const [spent, setSpent] = useState(() => {
    const raw = localStorage.getItem(`character_points_spent_${character.id}`);
    return Number(raw) || 0;
  });

  useEffect(() => {
    const raw = localStorage.getItem(spentKey);
    setSpent(Number(raw) || 0);
  }, [spentKey]);

  const classLabel = CLASS_LABELS[character.class] ?? character.class;
  const base = CLASS_BASE_STATS[character.class] ?? CLASS_BASE_STATS.warrior;
  const pointsBudget = character.level * 2;
  const pendingTotal = pending.strength + pending.agility + pending.intelligence + pending.vitality + pending.luck;
  const availablePoints = Math.max(0, pointsBudget - spent - pendingTotal);

  const derived = useMemo(() => {
    const atk = character.strength * 2 + character.agility;
    const def = character.vitality * 2 + Math.floor(character.strength / 2);
    const crit = Math.min(75, Math.floor(character.luck * 0.6));
    const haste = Math.min(60, Math.floor(character.agility * 0.5));
    const atkSpd = Math.min(50, Math.floor(character.agility * 0.3));
    const skillEnhc = Math.floor(character.intelligence * 0.8);
    return { atk, def, crit, haste, atkSpd, skillEnhc };
  }, [character]);

  // Load items + active pet
  useEffect(() => { loadItems(); loadActivePet(); }, [character.id]);

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const { data, error } = await supabase
        .from("character_items").select("*, item:items(*)").eq("character_id", character.id);
      if (error) throw error;
      setItems((data as any) || []);
    } catch { toast.error("Erro ao carregar itens"); }
    finally { setLoadingItems(false); }
  };

  const loadActivePet = async () => {
    try {
      const { data } = await supabase
        .from("character_pets").select("*, pet:pets(name)")
        .eq("character_id", character.id).eq("is_active", true).maybeSingle();
      setPetName(data?.pet?.name || null);
    } catch {}
  };

  const equippedBySlot = useMemo(() => {
    const map: Record<string, CharacterItem> = {};
    for (const ci of items) {
      if (ci.is_equipped && ci.item.equipment_slot) map[ci.item.equipment_slot] = ci;
    }
    return map;
  }, [items]);

  const availableForSlot = useMemo(() => {
    if (!selectedSlot) return [];
    return items.filter(ci => {
      if (ci.is_equipped) return false;
      if (ci.item.equipment_slot !== selectedSlot) return false;
      if (ci.item.required_level > character.level) return false;
      if (ci.item.class_restriction && ci.item.class_restriction !== character.class) return false;
      return true;
    });
  }, [selectedSlot, items, character]);

  const equipItem = useCallback(async (ci: CharacterItem) => {
    try {
      const slot = ci.item.equipment_slot!;
      const current = equippedBySlot[slot];
      if (current) {
        await supabase.from('character_items').update({ is_equipped: false }).eq('id', current.id);
      }
      await supabase.from('character_items').update({ is_equipped: true }).eq('id', ci.id);
      const oldBonus = current ? {
        strength: applyQuality(current.item.strength_bonus, (current as any).quality_rank),
        agility: applyQuality(current.item.agility_bonus, (current as any).quality_rank),
        intelligence: applyQuality(current.item.intelligence_bonus, (current as any).quality_rank),
        vitality: applyQuality(current.item.vitality_bonus, (current as any).quality_rank),
        luck: applyQuality(current.item.luck_bonus, (current as any).quality_rank),
      } : { strength: 0, agility: 0, intelligence: 0, vitality: 0, luck: 0 };
      const newStats = {
        strength: character.strength - oldBonus.strength + applyQuality(ci.item.strength_bonus, (ci as any).quality_rank),
        agility: character.agility - oldBonus.agility + applyQuality(ci.item.agility_bonus, (ci as any).quality_rank),
        intelligence: character.intelligence - oldBonus.intelligence + applyQuality(ci.item.intelligence_bonus, (ci as any).quality_rank),
        vitality: character.vitality - oldBonus.vitality + applyQuality(ci.item.vitality_bonus, (ci as any).quality_rank),
        luck: character.luck - oldBonus.luck + applyQuality(ci.item.luck_bonus, (ci as any).quality_rank),
      };
      await supabase.from('characters').update(newStats).eq('id', character.id);
      onCharacterUpdate({ ...character, ...newStats });
      loadItems();
      setSelectedSlot(null);
      toast.success(`${ci.item.name} equipado!`);
    } catch { toast.error('Erro ao equipar'); }
  }, [character, equippedBySlot, onCharacterUpdate]);

  const unequipItem = useCallback(async (slot: string) => {
    const ci = equippedBySlot[slot];
    if (!ci) return;
    try {
      await supabase.from('character_items').update({ is_equipped: false }).eq('id', ci.id);
      const newStats = {
        strength: character.strength - applyQuality(ci.item.strength_bonus, (ci as any).quality_rank),
        agility: character.agility - applyQuality(ci.item.agility_bonus, (ci as any).quality_rank),
        intelligence: character.intelligence - applyQuality(ci.item.intelligence_bonus, (ci as any).quality_rank),
        vitality: character.vitality - applyQuality(ci.item.vitality_bonus, (ci as any).quality_rank),
        luck: character.luck - applyQuality(ci.item.luck_bonus, (ci as any).quality_rank),
      };
      await supabase.from('characters').update(newStats).eq('id', character.id);
      onCharacterUpdate({ ...character, ...newStats });
      loadItems();
      toast.success(`${ci.item.name} desequipado!`);
    } catch { toast.error('Erro ao desequipar'); }
  }, [character, equippedBySlot, onCharacterUpdate]);

  const applyStatDelta = (delta: Partial<typeof pending>) => {
    setPending(prev => ({
      strength: prev.strength + (delta.strength ?? 0),
      agility: prev.agility + (delta.agility ?? 0),
      intelligence: prev.intelligence + (delta.intelligence ?? 0),
      vitality: prev.vitality + (delta.vitality ?? 0),
      luck: prev.luck + (delta.luck ?? 0),
    }));
  };

  const confirmPoints = async () => {
    if (pendingTotal <= 0) return;
    try {
      const updates = {
        strength: character.strength + pending.strength,
        agility: character.agility + pending.agility,
        intelligence: character.intelligence + pending.intelligence,
        vitality: character.vitality + pending.vitality,
        luck: character.luck + pending.luck,
      };
      const { error } = await supabase.from("characters").update(updates).eq("id", character.id);
      if (error) throw error;
      const newSpent = spent + pendingTotal;
      localStorage.setItem(spentKey, String(newSpent));
      setSpent(newSpent);
      setPending({ strength: 0, agility: 0, intelligence: 0, vitality: 0, luck: 0 });
      onCharacterUpdate({ ...character, ...updates });
      toast.success("Pontos aplicados!");
    } catch { toast.error("Erro ao aplicar pontos"); }
  };

  // Canvas sprite
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const draw = () => {
      animRef.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      const colors = CLASS_COLORS[character.class] || CLASS_COLORS.warrior;
      const bob = Math.sin(animRef.current * 0.08) * 2;
      const cx = Math.floor(canvas.width / 2);
      const cy = Math.floor(canvas.height / 2);
      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(cx - 14, cy + 22, 28, 6);
      // Body
      ctx.fillStyle = colors.body;
      ctx.fillRect(cx - 12, cy - 4 + bob, 24, 24);
      // Belt
      ctx.fillStyle = colors.accent;
      ctx.fillRect(cx - 12, cy + 10 + bob, 24, 4);
      // Head
      ctx.fillStyle = colors.skin;
      ctx.fillRect(cx - 10, cy - 20 + bob, 20, 16);
      // Eyes
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(cx - 5, cy - 12 + bob, 3, 3);
      ctx.fillRect(cx + 3, cy - 12 + bob, 3, 3);
      // Hair
      ctx.fillStyle = colors.body;
      ctx.fillRect(cx - 10, cy - 22 + bob, 20, 5);
      // Legs
      ctx.fillStyle = colors.body;
      ctx.fillRect(cx - 10, cy + 20 + bob, 8, 8);
      ctx.fillRect(cx + 2, cy + 20 + bob, 8, 8);

      // Equipment overlays
      if (equippedBySlot.helmet) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(cx - 11, cy - 24 + bob, 22, 5);
      }
      if (equippedBySlot.chest) {
        ctx.fillStyle = 'rgba(192,192,192,0.4)';
        ctx.fillRect(cx - 12, cy - 2 + bob, 24, 14);
      }
      if (equippedBySlot.main_hand) {
        ctx.fillStyle = '#AAA';
        ctx.fillRect(cx + 14, cy - 2 + bob, 4, 20);
      }
      if (equippedBySlot.off_hand) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(cx - 18, cy + 0 + bob, 4, 14);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [character.class, equippedBySlot]);

  const totalEquipBonus = useMemo(() => {
    let str = 0, agi = 0, int_ = 0, vit = 0, luk = 0;
    Object.values(equippedBySlot).forEach(ci => {
      str += applyQuality(ci.item.strength_bonus, (ci as any).quality_rank);
      agi += applyQuality(ci.item.agility_bonus, (ci as any).quality_rank);
      int_ += applyQuality(ci.item.intelligence_bonus, (ci as any).quality_rank);
      vit += applyQuality(ci.item.vitality_bonus, (ci as any).quality_rank);
      luk += applyQuality(ci.item.luck_bonus, (ci as any).quality_rank);
    });
    return { strength: str, agility: agi, intelligence: int_, vitality: vit, luck: luk };
  }, [equippedBySlot]);

  const hpPercent = Math.max(0, Math.min(100, (character.health / character.max_health) * 100));
  const mpPercent = Math.max(0, Math.min(100, (character.mana / character.max_mana) * 100));
  const expForLevel = character.level * 100;
  const expPercent = Math.min(100, (character.experience / expForLevel) * 100);

  return (
    <Div className="flex flex-col gap-0 h-full overflow-hidden">
      <GamePanelTabs tabs={MENU_TABS} activeTab={activeTab} onTabChange={(k) => setActiveTab(k as MenuTab)} />

      {activeTab === "gear" && (
        <Div className="flex-1 overflow-y-auto">
          <Div className="char-sheet">
            {/* LEFT: Character info + sprite + equipment slots */}
            <Div className="char-sheet-left">
              {/* Name & class */}
              <Div className="char-sheet-header">
                <Div className="font-bold text-sm pixel-text" style={{ color: 'hsl(var(--rpg-text))' }}>{character.name}</Div>
                <Div className="text-[10px]" style={{ color: 'hsl(var(--rpg-text-dim))' }}>
                  Lv. {character.level} {classLabel}
                </Div>
              </Div>

              {/* Pet slots */}
              <Div className="flex gap-2 mb-1">
                <Div className="flex items-center gap-1 text-[10px]" style={{ color: 'hsl(var(--rpg-text-dim))' }}>
                  <span>🐾</span>
                  <span>{petName || 'Nenhum'}</span>
                </Div>
              </Div>

              {/* Sprite + equipment slots grid */}
              <Div className="char-equip-grid">
                {/* Top row: helmet */}
                <Div className="char-equip-top">
                  <EquipSlot slot="helmet" equipped={equippedBySlot.helmet} selected={selectedSlot === 'helmet'}
                    onClick={() => setSelectedSlot(selectedSlot === 'helmet' ? null : 'helmet')}
                    onUnequip={() => unequipItem('helmet')} />
                </Div>

                {/* Middle row: gloves | sprite | main_hand */}
                <Div className="char-equip-mid">
                  <Div className="flex flex-col gap-1">
                    <EquipSlot slot="gloves" equipped={equippedBySlot.gloves} selected={selectedSlot === 'gloves'}
                      onClick={() => setSelectedSlot(selectedSlot === 'gloves' ? null : 'gloves')}
                      onUnequip={() => unequipItem('gloves')} />
                    <EquipSlot slot="off_hand" equipped={equippedBySlot.off_hand} selected={selectedSlot === 'off_hand'}
                      onClick={() => setSelectedSlot(selectedSlot === 'off_hand' ? null : 'off_hand')}
                      onUnequip={() => unequipItem('off_hand')} />
                  </Div>

                  <Div className="char-sprite-box">
                    <canvas ref={canvasRef} width={120} height={120} style={{ imageRendering: "pixelated" }} />
                  </Div>

                  <Div className="flex flex-col gap-1">
                    <EquipSlot slot="chest" equipped={equippedBySlot.chest} selected={selectedSlot === 'chest'}
                      onClick={() => setSelectedSlot(selectedSlot === 'chest' ? null : 'chest')}
                      onUnequip={() => unequipItem('chest')} />
                    <EquipSlot slot="main_hand" equipped={equippedBySlot.main_hand} selected={selectedSlot === 'main_hand'}
                      onClick={() => setSelectedSlot(selectedSlot === 'main_hand' ? null : 'main_hand')}
                      onUnequip={() => unequipItem('main_hand')} />
                  </Div>
                </Div>

                {/* Bottom row: boots, legs */}
                <Div className="char-equip-bot">
                  <EquipSlot slot="boots" equipped={equippedBySlot.boots} selected={selectedSlot === 'boots'}
                    onClick={() => setSelectedSlot(selectedSlot === 'boots' ? null : 'boots')}
                    onUnequip={() => unequipItem('boots')} />
                  <EquipSlot slot="legs" equipped={equippedBySlot.legs} selected={selectedSlot === 'legs'}
                    onClick={() => setSelectedSlot(selectedSlot === 'legs' ? null : 'legs')}
                    onUnequip={() => unequipItem('legs')} />
                </Div>
              </Div>

              {/* Equipment slot picker */}
              <AnimatePresence>
                {selectedSlot && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-1">
                    <Div className="rpg-item-detail !p-2">
                      <Div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold">{SLOT_ICONS[selectedSlot]} {SLOT_LABELS[selectedSlot]}</span>
                        <button onClick={() => setSelectedSlot(null)} className="rpg-panel-close" style={{ position: 'static', transform: 'none', width: 14, height: 14 }}>
                          <X className="h-3 w-3" />
                        </button>
                      </Div>
                      {equippedBySlot[selectedSlot] && (
                        <Div className="mb-1 p-1 border border-dashed rounded-sm text-[10px] flex items-center justify-between" style={{ borderColor: 'hsl(120 50% 40%)', background: 'hsl(120 20% 10% / 0.3)' }}>
                          <span style={{ color: RARITY_COLORS[equippedBySlot[selectedSlot].item.rarity as keyof typeof RARITY_COLORS] }}>
                            ✓ {equippedBySlot[selectedSlot].item.name}
                          </span>
                          <GameButton size="sm" variant="danger" onClick={() => unequipItem(selectedSlot)}>Remover</GameButton>
                        </Div>
                      )}
                      {availableForSlot.length === 0 ? (
                        <p className="text-[9px] opacity-50 text-center py-1">Nenhum item disponível</p>
                      ) : (
                        <Div className="grid grid-cols-5 gap-1">
                          {availableForSlot.map(ci => (
                            <ItemTooltip key={ci.id} item={ci.item as any} isEquipped={false} quantity={ci.quantity}>
                              <Div className="cursor-pointer" onDoubleClick={() => equipItem(ci)}>
                                <InventorySlot icon={SLOT_ICONS[selectedSlot] || '📦'} quantity={ci.quantity} rarity={ci.item.rarity} />
                              </Div>
                            </ItemTooltip>
                          ))}
                        </Div>
                      )}
                    </Div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Div>

            {/* RIGHT: Stats */}
            <Div className="char-sheet-right">
              {/* Resources */}
              <Div className="rpg-item-detail !p-2 !mb-1">
                <Div className="space-y-1.5">
                  <StatBar label="HP" current={character.health} max={character.max_health} percent={hpPercent} color="hsl(0 70% 50%)" />
                  <StatBar label="MP" current={character.mana} max={character.max_mana} percent={mpPercent} color="hsl(210 70% 50%)" />
                  <StatBar label="EXP" current={character.experience} max={expForLevel} percent={expPercent} color="hsl(45 80% 50%)" />
                </Div>
                <Div className="flex justify-between text-[10px] mt-1.5" style={{ color: 'hsl(var(--rpg-text-dim))' }}>
                  <span>🪙 {character.gold}</span>
                  <span>📍 {character.current_biome}</span>
                </Div>
              </Div>

              {/* Combat stats */}
              <Div className="rpg-item-detail !p-2 !mb-1">
                <Div className="text-[9px] font-bold mb-1 opacity-60 uppercase">Combate</Div>
                <Div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                  <StatLine label="ATK" value={derived.atk} />
                  <StatLine label="DEF" value={derived.def} />
                  <StatLine label="ATK SPD" value={derived.atkSpd} suffix="%" />
                  <StatLine label="SKILL ENHC" value={derived.skillEnhc} />
                  <StatLine label="CRIT" value={derived.crit} suffix="%" />
                  <StatLine label="HASTE" value={derived.haste} suffix="%" />
                </Div>
              </Div>

              {/* Base attributes */}
              <Div className="rpg-item-detail !p-2 !mb-1">
                <Div className="text-[9px] font-bold mb-1 opacity-60 uppercase">Atributos</Div>
                <Div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                  <StatLine label="STR" value={character.strength} bonus={totalEquipBonus.strength} />
                  <StatLine label="AGI" value={character.agility} bonus={totalEquipBonus.agility} />
                  <StatLine label="INT" value={character.intelligence} bonus={totalEquipBonus.intelligence} />
                  <StatLine label="VIT" value={character.vitality} bonus={totalEquipBonus.vitality} />
                  <StatLine label="LUK" value={character.luck} bonus={totalEquipBonus.luck} />
                </Div>
              </Div>

              {/* Equipment bonus summary */}
              <Div className="rpg-item-detail !p-2 !mb-0">
                <Div className="text-[9px] font-bold mb-1 opacity-60 uppercase">Bônus Equip</Div>
                <Div className="flex flex-wrap gap-1.5 text-[9px]">
                  {totalEquipBonus.strength > 0 && <span className="rpg-stat-bonus rpg-stat-str">+{totalEquipBonus.strength} FOR</span>}
                  {totalEquipBonus.agility > 0 && <span className="rpg-stat-bonus rpg-stat-agi">+{totalEquipBonus.agility} AGI</span>}
                  {totalEquipBonus.intelligence > 0 && <span className="rpg-stat-bonus rpg-stat-int">+{totalEquipBonus.intelligence} INT</span>}
                  {totalEquipBonus.vitality > 0 && <span className="rpg-stat-bonus rpg-stat-vit">+{totalEquipBonus.vitality} VIT</span>}
                  {totalEquipBonus.luck > 0 && <span className="rpg-stat-bonus rpg-stat-luk">+{totalEquipBonus.luck} SOR</span>}
                  {Object.values(totalEquipBonus).every(v => v === 0) && <span className="opacity-40">Nenhum</span>}
                </Div>
              </Div>
            </Div>
          </Div>
        </Div>
      )}

      {activeTab === "info" && (
        <Div className="flex-1 overflow-y-auto p-1 space-y-2">
          {/* Point distribution */}
          <Div className="rpg-item-detail !mb-0">
            <Div className="flex items-center justify-between mb-2">
              <Div className="font-bold text-[11px]">Distribuição de Pontos</Div>
              <Div className="text-[10px] opacity-80">Disponíveis: <span className="font-bold">{availablePoints}</span></Div>
            </Div>
            <Div className="space-y-1.5">
              {(['strength', 'agility', 'intelligence', 'vitality', 'luck'] as const).map(stat => {
                const labels: Record<string, string> = { strength: 'STR', agility: 'AGI', intelligence: 'INT', vitality: 'VIT', luck: 'LUK' };
                return (
                  <Div key={stat} className="flex items-center justify-between text-[10px]">
                    <span className="opacity-80 w-8">{labels[stat]}</span>
                    <Div className="flex items-center gap-1.5">
                      <span className="font-bold w-6 text-right">{character[stat]}{pending[stat] > 0 ? ` +${pending[stat]}` : ''}</span>
                      <GameButton size="sm" variant="secondary" disabled={pending[stat] <= 0} onClick={() => applyStatDelta({ [stat]: -1 })}>-</GameButton>
                      <GameButton size="sm" variant="primary" disabled={availablePoints <= 0} onClick={() => applyStatDelta({ [stat]: 1 })}>+</GameButton>
                    </Div>
                  </Div>
                );
              })}
            </Div>
            <Div className="flex items-center justify-end gap-2 mt-2">
              <GameButton variant="secondary" size="sm" onClick={() => setPending({ strength: 0, agility: 0, intelligence: 0, vitality: 0, luck: 0 })} disabled={pendingTotal <= 0}>Reset</GameButton>
              <GameButton variant="gold" size="sm" onClick={confirmPoints} disabled={pendingTotal <= 0}>Confirmar</GameButton>
            </Div>
            <Div className="text-[9px] opacity-50 mt-1">
              Orçamento: {pointsBudget} • Gastos: {spent} • Pendentes: {pendingTotal}
            </Div>
          </Div>

          {/* Character info */}
          <Div className="rpg-item-detail !mb-0">
            <Div className="font-bold text-[11px] mb-1">Informações</Div>
            <Div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
              <StatLine label="Nome" value={character.name} isText />
              <StatLine label="Classe" value={classLabel} isText />
              <StatLine label="Nível" value={character.level} />
              <StatLine label="EXP" value={character.experience} />
              <StatLine label="Bioma" value={character.current_biome} isText />
            </Div>
          </Div>

          {/* Base class stats */}
          <Div className="rpg-item-detail !mb-0">
            <Div className="font-bold text-[11px] mb-1">Base ({classLabel})</Div>
            <Div className="grid grid-cols-3 gap-x-3 gap-y-0.5 text-[10px]">
              <StatLine label="STR" value={base.strength} />
              <StatLine label="AGI" value={base.agility} />
              <StatLine label="INT" value={base.intelligence} />
              <StatLine label="VIT" value={base.vitality} />
              <StatLine label="LUK" value={base.luck} />
            </Div>
          </Div>
        </Div>
      )}
    </Div>
  );
}

// Sub-components

function EquipSlot({ slot, equipped, selected, onClick, onUnequip }: {
  slot: string; equipped?: CharacterItem; selected: boolean;
  onClick: () => void; onUnequip: () => void;
}) {
  const rarityColor = equipped ? RARITY_COLORS[equipped.item.rarity as keyof typeof RARITY_COLORS] : undefined;
  return (
    <Div className="equip-slot-wrapper" onClick={onClick} title={SLOT_LABELS[slot]}>
      <Div
        className={`equip-slot ${selected ? 'equip-slot-selected' : ''} ${equipped ? 'equip-slot-filled' : ''}`}
        style={equipped ? { borderColor: rarityColor } : undefined}
      >
        <span className={`${equipped ? 'text-base' : 'text-sm opacity-30'}`}>{SLOT_ICONS[slot]}</span>
      </Div>
    </Div>
  );
}

function StatBar({ label, current, max, percent, color }: {
  label: string; current: number; max: number; percent: number; color: string;
}) {
  return (
    <Div>
      <Div className="flex justify-between text-[10px] mb-0.5">
        <span style={{ color: 'hsl(var(--rpg-text-dim))' }}>{label}</span>
        <span style={{ color: 'hsl(var(--rpg-text))' }}>{current}/{max}</span>
      </Div>
      <Div className="rpg-bar" style={{ height: 6 }}>
        <Div className="rpg-bar-fill" style={{ width: `${percent}%`, background: color }} />
      </Div>
    </Div>
  );
}

function StatLine({ label, value, bonus, suffix, isText }: {
  label: string; value: string | number; bonus?: number; suffix?: string; isText?: boolean;
}) {
  return (
    <Div className="flex justify-between">
      <span style={{ color: 'hsl(var(--rpg-text-dim))' }}>{label}</span>
      <span className="font-bold" style={{ color: 'hsl(var(--rpg-text))' }}>
        {isText ? value : <>{value}{suffix || ''}</>}
        {bonus && bonus > 0 ? <span className="text-green-400 ml-1">(+{bonus})</span> : null}
      </span>
    </Div>
  );
}
