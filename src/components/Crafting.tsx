import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Hammer, Sparkles, Package, ArrowUpRight, ScrollText, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { GameButton } from '@/components/ui/game-panel';
import { Div } from '@/components/ui/Div';

interface CraftingRecipe {
  id: string; name: string; description: string; result_item_id: string;
  result_quantity: number; required_level: number; items: any;
  recipe_materials: Array<{ id: string; item_id: string; quantity: number; items: any; }>;
}

type QualityRank = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';

type QualityRule = {
  rank: QualityRank;
  order_index: number;
  stat_multiplier: number;
  min_level: number;
  success_chance: number;
  downgrade_on_fail: boolean;
};

type QualityMaterial = {
  id: string;
  target_rank: QualityRank;
  item_id: string;
  quantity: number;
  items?: any;
};

interface CraftingProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function Crafting({ character, onCharacterUpdate }: CraftingProps) {
  const [recipes, setRecipes] = useState<CraftingRecipe[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'craft' | 'upgrade'>('craft');
  const [qualityRules, setQualityRules] = useState<QualityRule[]>([]);
  const [qualityMaterials, setQualityMaterials] = useState<QualityMaterial[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [upgradeHistory, setUpgradeHistory] = useState<any[]>([]);
  const [upgradeBusy, setUpgradeBusy] = useState(false);

  useEffect(() => { loadCraftingData(); }, [character.id]);

  const loadCraftingData = async () => {
    const { data: inv } = await supabase.from('character_items').select('*, items(*)').eq('character_id', character.id);
    setInventory(inv || []);
    const { data: recipesData } = await supabase.from('crafting_recipes' as any).select('*, items(*), recipe_materials(*, items(*))').lte('required_level', character.level);
    setRecipes((recipesData as any) || []);
    const { data: rules } = await supabase.from('item_quality_rank_rules' as any).select('*').order('order_index', { ascending: true });
    setQualityRules((rules as any) || []);
    const { data: mats } = await supabase.from('item_quality_rank_materials' as any).select('*, items(*)');
    setQualityMaterials((mats as any) || []);
    setLoading(false);
  };

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    return inventory.find((ci) => ci.id === selectedItemId) ?? null;
  }, [inventory, selectedItemId]);

  const currentRank = useMemo<QualityRank>(() => {
    const raw = (selectedItem as any)?.quality_rank;
    if (raw === 'C' || raw === 'B' || raw === 'A' || raw === 'S' || raw === 'SS') return raw;
    return 'D';
  }, [selectedItem]);

  const nextRank = useMemo<QualityRank | null>(() => {
    if (currentRank === 'D') return 'C';
    if (currentRank === 'C') return 'B';
    if (currentRank === 'B') return 'A';
    if (currentRank === 'A') return 'S';
    if (currentRank === 'S') return 'SS';
    return null;
  }, [currentRank]);

  const ruleByRank = useMemo(() => {
    const map = new Map<QualityRank, QualityRule>();
    for (const r of qualityRules) map.set(r.rank, r);
    return map;
  }, [qualityRules]);

  const materialsByRank = useMemo(() => {
    const map = new Map<QualityRank, QualityMaterial[]>();
    for (const m of qualityMaterials) {
      const list = map.get(m.target_rank) ?? [];
      list.push(m);
      map.set(m.target_rank, list);
    }
    return map;
  }, [qualityMaterials]);

  const selectedBaseBonuses = useMemo(() => {
    const item = selectedItem?.items;
    const str = Number(item?.strength_bonus ?? 0);
    const agi = Number(item?.agility_bonus ?? 0);
    const intl = Number(item?.intelligence_bonus ?? 0);
    const vit = Number(item?.vitality_bonus ?? 0);
    const luk = Number(item?.luck_bonus ?? 0);
    return { str, agi, intl, vit, luk };
  }, [selectedItem]);

  const computeBonusesAtRank = useCallback((rank: QualityRank) => {
    const mult = Number(ruleByRank.get(rank)?.stat_multiplier ?? 1);
    const { str, agi, intl, vit, luk } = selectedBaseBonuses;
    return {
      mult,
      str: Math.round(str * mult),
      agi: Math.round(agi * mult),
      intl: Math.round(intl * mult),
      vit: Math.round(vit * mult),
      luk: Math.round(luk * mult),
    };
  }, [ruleByRank, selectedBaseBonuses]);

  const loadUpgradeHistory = useCallback(async (characterItemId: string) => {
    const { data } = await supabase
      .from('item_quality_history' as any)
      .select('*')
      .eq('character_item_id', characterItemId)
      .order('created_at', { ascending: false })
      .limit(25);
    setUpgradeHistory((data as any) || []);
  }, []);

  useEffect(() => {
    if (selectedItemId) loadUpgradeHistory(selectedItemId);
  }, [loadUpgradeHistory, selectedItemId]);

  const canCraft = (recipe: CraftingRecipe): boolean => {
    if (!recipe.recipe_materials?.length) return false;
    return recipe.recipe_materials.every((mat) => {
      const inv = inventory.find((i) => i.item_id === mat.item_id);
      return inv && inv.quantity >= mat.quantity;
    });
  };

  const craftItem = async (recipe: CraftingRecipe) => {
    if (!canCraft(recipe)) { toast.error('Materiais insuficientes!'); return; }
    for (const mat of recipe.recipe_materials) {
      const inv = inventory.find((i) => i.item_id === mat.item_id);
      if (inv) {
        const newQty = inv.quantity - mat.quantity;
        if (newQty <= 0) await supabase.from('character_items').delete().eq('id', inv.id);
        else await supabase.from('character_items').update({ quantity: newQty }).eq('id', inv.id);
      }
    }
    const resultType = String(recipe.items?.type ?? '');
    const isEquipment = resultType === 'weapon' || resultType === 'armor';
    if (isEquipment) {
      await supabase.from('character_items').insert({ character_id: character.id, item_id: recipe.result_item_id, quantity: 1, quality_rank: 'D' } as any);
    } else {
      const existing = inventory.find((i) => i.item_id === recipe.result_item_id);
      if (existing) {
        await supabase.from('character_items').update({ quantity: existing.quantity + recipe.result_quantity }).eq('id', existing.id);
      } else {
        await supabase.from('character_items').insert({ character_id: character.id, item_id: recipe.result_item_id, quantity: recipe.result_quantity });
      }
    }
    toast.success(`${recipe.items.name} craftado!`);
    loadCraftingData();
  };

  const eligibleForUpgrade = useMemo(() => {
    return inventory.filter((ci) => {
      const t = String(ci.items?.type ?? '');
      if (t !== 'weapon' && t !== 'armor') return false;
      if (Number(ci.quantity ?? 0) !== 1) return false;
      return true;
    });
  }, [inventory]);

  const upgradeRequirements = useMemo(() => {
    if (!nextRank) return null;
    const rule = ruleByRank.get(nextRank);
    const mats = materialsByRank.get(nextRank) ?? [];
    return { rule, mats };
  }, [materialsByRank, nextRank, ruleByRank]);

  const canUpgrade = useMemo(() => {
    if (!selectedItem || !nextRank) return false;
    const rule = upgradeRequirements?.rule;
    if (!rule) return false;
    if (character.level < Number(rule.min_level ?? 1)) return false;
    const mats = upgradeRequirements?.mats ?? [];
    return mats.every((m) => {
      const inv = inventory.find((i) => i.item_id === m.item_id);
      return inv && inv.quantity >= m.quantity;
    });
  }, [character.level, inventory, nextRank, selectedItem, upgradeRequirements]);

  const doUpgrade = useCallback(async () => {
    if (!selectedItem) return;
    setUpgradeBusy(true);
    try {
      const { data, error } = await (supabase as any).rpc('item_quality_upgrade', { p_character_item_id: selectedItem.id });
      if (error) throw error;
      const success = Boolean((data as any)?.success);
      if (success) toast.success(`Upgrade concluído: ${currentRank} → ${nextRank}`);
      else toast.error('Falhou! Penalidade aplicada.');
      await loadCraftingData();
      await loadUpgradeHistory(selectedItem.id);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao melhorar');
    } finally {
      setUpgradeBusy(false);
    }
  }, [currentRank, loadCraftingData, loadUpgradeHistory, nextRank, selectedItem]);

  if (loading) return <Div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando...</span></Div>;

  return (
    <Div>
      <Div className="flex gap-1 mb-3">
        <GameButton size="sm" variant={tab === 'craft' ? 'gold' : 'secondary'} className="flex-1" onClick={() => setTab('craft')}>
          <Hammer className="h-3 w-3 mr-1" /> Criar
        </GameButton>
        <GameButton size="sm" variant={tab === 'upgrade' ? 'gold' : 'secondary'} className="flex-1" onClick={() => setTab('upgrade')}>
          <ArrowUpRight className="h-3 w-3 mr-1" /> Melhorar
        </GameButton>
      </Div>

      {tab === 'craft' && (
        <Div>
          <Div className="rpg-item-detail mb-3">
            <Div className="flex items-center gap-2 mb-1">
          <Package className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />
          <span className="rpg-label !mb-0">Materiais Disponíveis</span>
            </Div>
            <Div className="flex flex-wrap gap-1">
              {inventory.filter((i) => String(i.items?.type ?? '') === 'material').length === 0 ? (
                <span className="text-[10px] opacity-40">Nenhum material</span>
              ) : inventory.filter((i) => String(i.items?.type ?? '') === 'material').map((item) => (
                <span key={item.id} className="rpg-stat-bonus text-[9px]">{item.items.name} x{item.quantity}</span>
              ))}
            </Div>
          </Div>

          {recipes.length === 0 ? (
            <Div className="text-center py-8">
              <Hammer className="h-8 w-8 mx-auto mb-2 opacity-30" style={{ color: 'hsl(var(--rpg-text-dim))' }} />
              <p className="text-xs opacity-40">Nenhuma receita disponível. Suba de nível!</p>
            </Div>
          ) : (
            <Div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {recipes.map((recipe) => {
                const craftable = canCraft(recipe);
                return (
                  <Div key={recipe.id} className={`rpg-class-card !cursor-default ${craftable ? '' : 'opacity-60'}`}>
                    <Div className="font-bold text-xs pixel-text flex items-center gap-1">
                      <Sparkles className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />
                      {recipe.name}
                    </Div>
                    <p className="text-[10px] opacity-50">{recipe.description}</p>

                    <Div className="mt-2 flex items-center gap-2">
                      <span className="text-[9px] opacity-50">Resultado:</span>
                      <span className="rpg-stat-bonus text-[9px]" style={{ color: 'hsl(var(--rpg-gold))' }}>
                        {recipe.items?.name} x{recipe.result_quantity}
                      </span>
                    </Div>

                    <Div className="mt-1">
                      <span className="text-[9px] opacity-50">Materiais:</span>
                      <Div className="flex flex-wrap gap-1 mt-0.5">
                        {recipe.recipe_materials.map((mat: any) => {
                          const inv = inventory.find((i) => i.item_id === mat.item_id);
                          const hasEnough = inv && inv.quantity >= mat.quantity;
                          return (
                            <span key={mat.id} className={`rpg-stat-bonus text-[9px] ${hasEnough ? 'rpg-stat-agi' : 'rpg-stat-str'}`}>
                              {mat.items?.name} {inv?.quantity || 0}/{mat.quantity}
                            </span>
                          );
                        })}
                      </Div>
                    </Div>

                    <GameButton size="sm" variant={craftable ? 'gold' : 'secondary'} disabled={!craftable} className="w-full mt-2" onClick={() => craftItem(recipe)}>
                      <Hammer className="h-3 w-3 mr-1" /> {craftable ? 'Craftar' : 'Materiais Insuficientes'}
                    </GameButton>
                  </Div>
                );
              })}
            </Div>
          )}
        </Div>
      )}

      {tab === 'upgrade' && (
        <Div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Div className="rpg-item-detail">
            <Div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />
              <span className="rpg-label !mb-0">Itens para melhorar</span>
            </Div>
            {eligibleForUpgrade.length === 0 ? (
              <span className="text-[10px] opacity-40">Nenhum item elegível (arma/armadura, quantidade 1).</span>
            ) : (
              <Div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                {eligibleForUpgrade.map((ci) => {
                  const rank = (ci as any).quality_rank ?? 'D';
                  const active = selectedItemId === ci.id;
                  return (
                    <GameButton
                      key={ci.id}
                      size="sm"
                      variant={active ? 'gold' : 'secondary'}
                      className="w-full justify-between"
                      onClick={() => setSelectedItemId(ci.id)}
                    >
                      <span className="truncate text-left">{ci.items?.name}</span>
                      <span className="text-[10px] font-bold ml-2">[{rank}]</span>
                    </GameButton>
                  );
                })}
              </Div>
            )}
          </Div>

          <Div className="rpg-item-detail">
            {!selectedItem ? (
              <span className="text-[10px] opacity-40">Selecione um item.</span>
            ) : (
              <Div>
                <Div className="flex items-center justify-between gap-2">
                  <Div className="font-bold text-xs pixel-text">{selectedItem.items?.name}</Div>
                  <span className="text-[10px] font-bold">Rank {currentRank}</span>
                </Div>

                <Div className="mt-2">
                  <span className="text-[9px] opacity-50">Atributos (base vs rank)</span>
                  <Div className="mt-1 grid grid-cols-2 gap-1">
                    {(() => {
                      const now = computeBonusesAtRank(currentRank);
                      const nxt = nextRank ? computeBonusesAtRank(nextRank) : null;
                      const rows = [
                        { k: 'STR', a: now.str, b: nxt?.str },
                        { k: 'AGI', a: now.agi, b: nxt?.agi },
                        { k: 'INT', a: now.intl, b: nxt?.intl },
                        { k: 'VIT', a: now.vit, b: nxt?.vit },
                        { k: 'LUK', a: now.luk, b: nxt?.luk },
                      ];
                      return rows.map((r) => (
                        <Div key={r.k} className="text-[10px] flex items-center justify-between rpg-stat-bonus">
                          <span className="opacity-70">{r.k}</span>
                          <span className="font-bold">
                            {r.a}{nextRank ? <span className="opacity-60"> → {r.b}</span> : null}
                          </span>
                        </Div>
                      ));
                    })()}
                  </Div>
                </Div>

                {!nextRank ? (
                  <Div className="mt-3 rpg-stat-bonus text-[10px]">
                    <span className="font-bold">SS</span> é o rank máximo.
                  </Div>
                ) : (
                  <Div className="mt-3">
                    <Div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] opacity-50">Requisitos para {nextRank}</span>
                      <span className="text-[9px] opacity-60">
                        Chance {(Number(upgradeRequirements?.rule?.success_chance ?? 0) * 100).toFixed(0)}%
                      </span>
                    </Div>

                    {character.level < Number(upgradeRequirements?.rule?.min_level ?? 1) && (
                      <Div className="mt-2 rpg-stat-bonus text-[10px] rpg-stat-str flex items-center gap-2">
                        <ShieldAlert className="h-3 w-3" />
                        Requer nível {upgradeRequirements?.rule?.min_level}
                      </Div>
                    )}

                    <Div className="mt-2">
                      <span className="text-[9px] opacity-50">Materiais</span>
                      <Div className="flex flex-wrap gap-1 mt-0.5">
                        {(upgradeRequirements?.mats ?? []).length === 0 ? (
                          <span className="text-[10px] opacity-40">Sem materiais configurados.</span>
                        ) : (
                          (upgradeRequirements?.mats ?? []).map((m) => {
                            const inv = inventory.find((i) => i.item_id === m.item_id);
                            const hasEnough = inv && inv.quantity >= m.quantity;
                            return (
                              <span key={m.id} className={`rpg-stat-bonus text-[9px] ${hasEnough ? 'rpg-stat-agi' : 'rpg-stat-str'}`}>
                                {m.items?.name ?? 'Material'} {inv?.quantity || 0}/{m.quantity}
                              </span>
                            );
                          })
                        )}
                      </Div>
                    </Div>

                    <Div className="mt-2">
                      <span className="text-[9px] opacity-50">Penalidade (falha)</span>
                      <Div className="text-[10px] opacity-70 mt-0.5">
                        {upgradeRequirements?.rule?.downgrade_on_fail ? 'Pode reduzir 1 rank.' : 'Mantém o rank atual.'}
                      </Div>
                    </Div>

                    <GameButton
                      size="sm"
                      variant={canUpgrade ? 'gold' : 'secondary'}
                      disabled={!canUpgrade || upgradeBusy}
                      className="w-full mt-3"
                      onClick={doUpgrade}
                    >
                      <ArrowUpRight className="h-3 w-3 mr-1" /> {upgradeBusy ? 'Melhorando...' : `Melhorar para ${nextRank}`}
                    </GameButton>

                    <Div className="mt-3">
                      <Div className="flex items-center gap-2 mb-1">
                        <ScrollText className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />
                        <span className="rpg-label !mb-0">Histórico</span>
                      </Div>
                      {upgradeHistory.length === 0 ? (
                        <span className="text-[10px] opacity-40">Sem tentativas registradas.</span>
                      ) : (
                        <Div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                          {upgradeHistory.map((h) => (
                            <Div key={h.id} className="rpg-stat-bonus text-[10px] flex items-center justify-between">
                              <span className="opacity-70">
                                {new Date(h.created_at).toLocaleString()}
                              </span>
                              <span className="font-bold">
                                {h.from_rank} → {h.to_rank} {h.success ? <span className="rpg-stat-agi">OK</span> : <span className="rpg-stat-str">FAIL</span>}
                              </span>
                            </Div>
                          ))}
                        </Div>
                      )}
                    </Div>
                  </Div>
                )}
              </Div>
            )}
          </Div>
        </Div>
      )}
    </Div>
  );
}
