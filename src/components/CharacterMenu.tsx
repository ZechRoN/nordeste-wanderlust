import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GameButton, GamePanelTabs, InventorySlot } from "@/components/ui/game-panel";
import { CLASS_COLORS } from "@/engine/constants";

type Character = {
  id: string;
  name: string;
  class: string;
  level: number;
  experience: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  luck: number;
  gold: number;
  current_biome: string;
};

type Item = {
  id: string;
  name: string;
  type: string;
  rarity: string;
  strength_bonus: number;
  agility_bonus: number;
  intelligence_bonus: number;
  vitality_bonus: number;
  luck_bonus: number;
};

type CharacterItem = {
  id: string;
  item_id: string;
  is_equipped: boolean;
  quantity: number;
  item: Item;
};

type MenuTab = "visual" | "equip" | "stats" | "points" | "info";

const MENU_TABS = [
  { key: "visual", label: "Visual" },
  { key: "equip", label: "Equip" },
  { key: "stats", label: "Atributos" },
  { key: "points", label: "Pontos" },
  { key: "info", label: "Info" },
];

const CLASS_BASE_STATS: Record<string, { strength: number; agility: number; intelligence: number; vitality: number; luck: number }> = {
  warrior: { strength: 15, intelligence: 8, agility: 10, vitality: 15, luck: 7 },
  mage: { strength: 7, intelligence: 18, agility: 8, vitality: 10, luck: 12 },
  archer: { strength: 10, intelligence: 10, agility: 16, vitality: 12, luck: 7 },
  healer: { strength: 8, intelligence: 14, agility: 10, vitality: 16, luck: 7 },
  assassin: { strength: 12, intelligence: 10, agility: 18, vitality: 8, luck: 7 },
};

const EQUIP_TYPES = ["weapon", "armor"];

export function CharacterMenu({
  character,
  onCharacterUpdate,
}: {
  character: Character;
  onCharacterUpdate: (updatedCharacter: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<MenuTab>("visual");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef(0);

  const [loadingEquip, setLoadingEquip] = useState(true);
  const [items, setItems] = useState<CharacterItem[]>([]);
  const [equipPickerType, setEquipPickerType] = useState<"weapon" | "armor" | null>(null);

  const spentKey = useMemo(() => `character_points_spent_${character.id}`, [character.id]);
  const [pending, setPending] = useState({ strength: 0, agility: 0, intelligence: 0, vitality: 0, luck: 0 });
  const [spent, setSpent] = useState(() => {
    const raw = localStorage.getItem(spentKey);
    const parsed = raw ? Number(raw) : 0;
    return Number.isFinite(parsed) ? parsed : 0;
  });

  useEffect(() => {
    const raw = localStorage.getItem(spentKey);
    const parsed = raw ? Number(raw) : 0;
    setSpent(Number.isFinite(parsed) ? parsed : 0);
  }, [spentKey]);

  const classLabel = useMemo(() => {
    const labels: Record<string, string> = {
      warrior: "Guerreiro",
      mage: "Mago",
      archer: "Arqueiro",
      healer: "Curandeiro",
      assassin: "Assassino",
    };
    return labels[character.class] ?? character.class;
  }, [character.class]);

  const derived = useMemo(() => {
    const atk = character.strength * 2 + character.agility;
    const def = character.vitality * 2 + Math.floor(character.strength / 2);
    const crit = Math.min(75, Math.floor(character.luck * 0.6));
    const haste = Math.min(60, Math.floor(character.agility * 0.5));
    return { atk, def, crit, haste };
  }, [character.agility, character.luck, character.strength, character.vitality]);

  const base = CLASS_BASE_STATS[character.class] ?? CLASS_BASE_STATS.warrior;
  const pointsBudget = character.level * 2;
  const pendingTotal = pending.strength + pending.agility + pending.intelligence + pending.vitality + pending.luck;
  const availablePoints = Math.max(0, pointsBudget - spent - pendingTotal);

  const equippedByType = useMemo(() => {
    const map: Record<string, CharacterItem | null> = { weapon: null, armor: null };
    for (const ci of items) {
      if (!ci.is_equipped) continue;
      if (ci.item.type === "weapon") map.weapon = ci;
      if (ci.item.type === "armor") map.armor = ci;
    }
    return map;
  }, [items]);

  const equippableByType = useMemo(() => {
    return items.filter((ci) => EQUIP_TYPES.includes(ci.item.type) && !ci.is_equipped);
  }, [items]);

  useEffect(() => {
    let raf = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      animRef.current++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      const colors = CLASS_COLORS[character.class] || CLASS_COLORS.warrior;
      const t = animRef.current;
      const bob = Math.sin(t * 0.08) * 2;

      const cx = Math.floor(canvas.width / 2);
      const cy = Math.floor(canvas.height / 2);

      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(cx - 12, cy + 18, 24, 6);

      ctx.fillStyle = colors.body;
      ctx.fillRect(cx - 10, cy - 2 + bob, 20, 20);

      ctx.fillStyle = colors.accent;
      ctx.fillRect(cx - 10, cy + 8 + bob, 20, 4);

      ctx.fillStyle = colors.skin;
      ctx.fillRect(cx - 8, cy - 16 + bob, 16, 14);

      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(cx - 4, cy - 10 + bob, 2, 2);
      ctx.fillRect(cx + 2, cy - 10 + bob, 2, 2);

      ctx.fillStyle = colors.body;
      ctx.fillRect(cx - 8, cy - 18 + bob, 16, 4);

      ctx.fillStyle = colors.body;
      ctx.fillRect(cx - 8, cy + 18 + bob, 6, 6);
      ctx.fillRect(cx + 2, cy + 18 + bob, 6, 6);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [character.class]);

  useEffect(() => {
    loadEquipment();
  }, [character.id]);

  const loadEquipment = async () => {
    setLoadingEquip(true);
    try {
      const { data, error } = await supabase
        .from("character_items")
        .select("*, item:items(*)")
        .eq("character_id", character.id);
      if (error) throw error;
      setItems((data as any) || []);
    } catch {
      toast.error("Erro ao carregar equipamentos");
      setItems([]);
    } finally {
      setLoadingEquip(false);
    }
  };

  const applyStatDelta = (delta: Partial<typeof pending>) => {
    setPending((prev) => ({
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
    } catch {
      toast.error("Erro ao aplicar pontos");
    }
  };

  const resetPoints = () => setPending({ strength: 0, agility: 0, intelligence: 0, vitality: 0, luck: 0 });

  const equipItem = async (characterItem: CharacterItem) => {
    try {
      if (characterItem.item.type !== "weapon" && characterItem.item.type !== "armor") return;
      await supabase.from("character_items").update({ is_equipped: false }).eq("character_id", character.id);

      const { error } = await supabase.from("character_items").update({ is_equipped: true }).eq("id", characterItem.id);
      if (error) throw error;

      const item = characterItem.item;
      const newStats = {
        strength: character.strength + item.strength_bonus,
        agility: character.agility + item.agility_bonus,
        intelligence: character.intelligence + item.intelligence_bonus,
        vitality: character.vitality + item.vitality_bonus,
        luck: character.luck + item.luck_bonus,
      };
      await supabase.from("characters").update(newStats).eq("id", character.id);
      onCharacterUpdate({ ...character, ...newStats });
      await loadEquipment();
      setEquipPickerType(null);
      toast.success(`${item.name} equipado!`);
    } catch {
      toast.error("Erro ao equipar item");
    }
  };

  const unequipItem = async (characterItem: CharacterItem) => {
    try {
      const item = characterItem.item;
      const { error } = await supabase.from("character_items").update({ is_equipped: false }).eq("id", characterItem.id);
      if (error) throw error;

      const newStats = {
        strength: character.strength - item.strength_bonus,
        agility: character.agility - item.agility_bonus,
        intelligence: character.intelligence - item.intelligence_bonus,
        vitality: character.vitality - item.vitality_bonus,
        luck: character.luck - item.luck_bonus,
      };
      await supabase.from("characters").update(newStats).eq("id", character.id);
      onCharacterUpdate({ ...character, ...newStats });
      await loadEquipment();
      toast.success(`${item.name} desequipado!`);
    } catch {
      toast.error("Erro ao desequipar item");
    }
  };

  const StatRow = ({
    label,
    value,
    pendingValue,
    onPlus,
    onMinus,
  }: {
    label: string;
    value: number;
    pendingValue: number;
    onPlus: () => void;
    onMinus: () => void;
  }) => (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="opacity-80">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-bold">
          {value}
          {pendingValue > 0 ? ` +${pendingValue}` : ""}
        </span>
        <GameButton size="sm" variant="secondary" disabled={pendingValue <= 0} onClick={onMinus}>
          -
        </GameButton>
        <GameButton size="sm" variant="primary" disabled={availablePoints <= 0} onClick={onPlus}>
          +
        </GameButton>
      </div>
    </div>
  );

  return (
    <div>
      <GamePanelTabs tabs={MENU_TABS} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as any)} />

      {activeTab === "visual" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rpg-item-detail" style={{ marginBottom: 0 }}>
            <div className="font-bold text-[12px] mb-2">Sprite (Idle)</div>
            <div className="flex justify-center">
              <canvas ref={canvasRef} width={160} height={160} style={{ imageRendering: "pixelated" }} />
            </div>
          </div>
          <div className="rpg-item-detail" style={{ marginBottom: 0 }}>
            <div className="font-bold text-[12px] mb-2">Info rápida</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span>Nome</span><span className="font-bold">{character.name}</span></div>
              <div className="flex justify-between"><span>Classe</span><span>{classLabel}</span></div>
              <div className="flex justify-between"><span>Nível</span><span>{character.level}</span></div>
              <div className="flex justify-between"><span>EXP</span><span>{character.experience}</span></div>
              <div className="flex justify-between"><span>Bioma</span><span>{character.current_biome}</span></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "equip" && (
        <div className="space-y-2">
          <div className="rpg-item-detail" style={{ marginBottom: 0 }}>
            <div className="font-bold text-[12px] mb-2">Equipamentos</div>
            {loadingEquip ? (
              <span className="rpg-loading">Carregando...</span>
            ) : (
              <div className="flex items-start gap-6">
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] opacity-70 mb-1">Weapon</div>
                    <div className="flex items-center gap-2">
                      <InventorySlot
                        icon={equippedByType.weapon ? "⚔️" : undefined}
                        rarity={equippedByType.weapon?.item.rarity ?? "common"}
                        isEmpty={!equippedByType.weapon}
                        isEquipped={!!equippedByType.weapon}
                        onClick={() => equippedByType.weapon ? unequipItem(equippedByType.weapon) : setEquipPickerType("weapon")}
                      />
                      <span className="text-[11px] opacity-80">{equippedByType.weapon?.item.name ?? "Vazio"}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] opacity-70 mb-1">Armor</div>
                    <div className="flex items-center gap-2">
                      <InventorySlot
                        icon={equippedByType.armor ? "🛡️" : undefined}
                        rarity={equippedByType.armor?.item.rarity ?? "common"}
                        isEmpty={!equippedByType.armor}
                        isEquipped={!!equippedByType.armor}
                        onClick={() => equippedByType.armor ? unequipItem(equippedByType.armor) : setEquipPickerType("armor")}
                      />
                      <span className="text-[11px] opacity-80">{equippedByType.armor?.item.name ?? "Vazio"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-[10px] opacity-70 mb-1">Selecionar item</div>
                  <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                    {equipPickerType === null ? (
                      <div className="text-[11px] opacity-70">Clique em um slot vazio para escolher.</div>
                    ) : (
                      equippableByType.filter((ci) => ci.item.type === equipPickerType).map((ci) => (
                        <button key={ci.id} type="button" className="rpg-class-card w-full text-left" onClick={() => equipItem(ci)}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[12px]">{ci.item.name}</span>
                            <span className="text-[10px] opacity-70">{ci.item.rarity}</span>
                          </div>
                          <div className="text-[10px] opacity-70">
                            +STR {ci.item.strength_bonus} +AGI {ci.item.agility_bonus} +INT {ci.item.intelligence_bonus} +VIT {ci.item.vitality_bonus} +LUK {ci.item.luck_bonus}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rpg-item-detail" style={{ marginBottom: 0 }}>
            <div className="font-bold text-[12px] mb-2">Recursos</div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px]"><span>HP</span><span>{character.health}/{character.max_health}</span></div>
                <div className="rpg-bar" style={{ height: "8px" }}>
                  <div className="rpg-bar-fill rpg-bar-fill-hp" style={{ width: `${Math.max(0, Math.min(100, (character.health / character.max_health) * 100))}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px]"><span>MP</span><span>{character.mana}/{character.max_mana}</span></div>
                <div className="rpg-bar" style={{ height: "8px" }}>
                  <div className="rpg-bar-fill rpg-bar-fill-mp" style={{ width: `${Math.max(0, Math.min(100, (character.mana / character.max_mana) * 100))}%` }} />
                </div>
              </div>
              <div className="flex justify-between text-[11px]"><span>Gold</span><span>🪙 {character.gold}</span></div>
            </div>
          </div>

          <div className="rpg-item-detail" style={{ marginBottom: 0 }}>
            <div className="font-bold text-[12px] mb-2">Atributos</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div className="flex justify-between"><span>STR</span><span className="font-bold">{character.strength}</span></div>
              <div className="flex justify-between"><span>AGI</span><span className="font-bold">{character.agility}</span></div>
              <div className="flex justify-between"><span>INT</span><span className="font-bold">{character.intelligence}</span></div>
              <div className="flex justify-between"><span>VIT</span><span className="font-bold">{character.vitality}</span></div>
              <div className="flex justify-between"><span>LUK</span><span className="font-bold">{character.luck}</span></div>
            </div>
            <div className="mt-2 text-[10px] opacity-70">
              Base ({classLabel}): STR {base.strength} AGI {base.agility} INT {base.intelligence} VIT {base.vitality} LUK {base.luck}
            </div>
          </div>
        </div>
      )}

      {activeTab === "points" && (
        <div className="rpg-item-detail">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="font-bold text-[12px]">Distribuição de pontos</div>
            <div className="text-[11px] opacity-80">Disponíveis: <span className="font-bold">{availablePoints}</span></div>
          </div>
          <div className="space-y-2">
            <StatRow label="STR" value={character.strength} pendingValue={pending.strength} onMinus={() => applyStatDelta({ strength: -1 })} onPlus={() => applyStatDelta({ strength: 1 })} />
            <StatRow label="AGI" value={character.agility} pendingValue={pending.agility} onMinus={() => applyStatDelta({ agility: -1 })} onPlus={() => applyStatDelta({ agility: 1 })} />
            <StatRow label="INT" value={character.intelligence} pendingValue={pending.intelligence} onMinus={() => applyStatDelta({ intelligence: -1 })} onPlus={() => applyStatDelta({ intelligence: 1 })} />
            <StatRow label="VIT" value={character.vitality} pendingValue={pending.vitality} onMinus={() => applyStatDelta({ vitality: -1 })} onPlus={() => applyStatDelta({ vitality: 1 })} />
            <StatRow label="LUK" value={character.luck} pendingValue={pending.luck} onMinus={() => applyStatDelta({ luck: -1 })} onPlus={() => applyStatDelta({ luck: 1 })} />
          </div>
          <div className="flex items-center justify-end gap-2 mt-3">
            <GameButton variant="secondary" onClick={resetPoints} disabled={pendingTotal <= 0}>Reset</GameButton>
            <GameButton variant="gold" onClick={confirmPoints} disabled={pendingTotal <= 0}>Confirmar</GameButton>
          </div>
          <div className="text-[10px] opacity-70 mt-2">
            Orçamento: {pointsBudget} • Gastos: {spent} • Pendentes: {pendingTotal}
          </div>
        </div>
      )}

      {activeTab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="rpg-item-detail" style={{ marginBottom: 0 }}>
            <div className="font-bold text-[12px] mb-2">Informações</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span>Nome</span><span className="font-bold">{character.name}</span></div>
              <div className="flex justify-between"><span>Classe</span><span>{classLabel}</span></div>
              <div className="flex justify-between"><span>Nível</span><span>{character.level}</span></div>
              <div className="flex justify-between"><span>EXP</span><span>{character.experience}</span></div>
              <div className="flex justify-between"><span>Bioma</span><span>{character.current_biome}</span></div>
            </div>
          </div>
          <div className="rpg-item-detail" style={{ marginBottom: 0 }}>
            <div className="font-bold text-[12px] mb-2">Derivados</div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between"><span>ATK</span><span className="font-bold">{derived.atk}</span></div>
              <div className="flex justify-between"><span>DEF</span><span className="font-bold">{derived.def}</span></div>
              <div className="flex justify-between"><span>CRIT</span><span className="font-bold">{derived.crit}%</span></div>
              <div className="flex justify-between"><span>HASTE</span><span className="font-bold">{derived.haste}%</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

