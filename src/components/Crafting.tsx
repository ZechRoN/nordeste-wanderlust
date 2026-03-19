import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Hammer, Sparkles, Package } from 'lucide-react';
import { toast } from 'sonner';
import { GameButton } from '@/components/ui/game-panel';

interface CraftingRecipe {
  id: string; name: string; description: string; result_item_id: string;
  result_quantity: number; required_level: number; items: any;
  recipe_materials: Array<{ id: string; item_id: string; quantity: number; items: any; }>;
}

interface CraftingProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function Crafting({ character, onCharacterUpdate }: CraftingProps) {
  const [recipes, setRecipes] = useState<CraftingRecipe[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCraftingData(); }, [character.id]);

  const loadCraftingData = async () => {
    const { data: inv } = await supabase.from('character_items').select('*, items(*)').eq('character_id', character.id);
    setInventory(inv || []);
    const { data: recipesData } = await supabase.from('crafting_recipes' as any).select('*, items(*), recipe_materials(*, items(*))').lte('required_level', character.level);
    setRecipes((recipesData as any) || []);
    setLoading(false);
  };

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
    const existing = inventory.find((i) => i.item_id === recipe.result_item_id);
    if (existing) {
      await supabase.from('character_items').update({ quantity: existing.quantity + recipe.result_quantity }).eq('id', existing.id);
    } else {
      await supabase.from('character_items').insert({ character_id: character.id, item_id: recipe.result_item_id, quantity: recipe.result_quantity });
    }
    toast.success(`${recipe.items.name} craftado!`);
    loadCraftingData();
  };

  if (loading) return <div className="flex items-center justify-center h-40"><span className="rpg-loading">Carregando...</span></div>;

  return (
    <div>
      {/* Materials summary */}
      <div className="rpg-item-detail mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Package className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />
          <span className="rpg-label !mb-0">Materiais Disponíveis</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {inventory.length === 0 ? (
            <span className="text-[10px] opacity-40">Nenhum material</span>
          ) : inventory.map((item) => (
            <span key={item.id} className="rpg-stat-bonus text-[9px]">{item.items.name} x{item.quantity}</span>
          ))}
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-8">
          <Hammer className="h-8 w-8 mx-auto mb-2 opacity-30" style={{ color: 'hsl(var(--rpg-text-dim))' }} />
          <p className="text-xs opacity-40">Nenhuma receita disponível. Suba de nível!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {recipes.map((recipe) => {
            const craftable = canCraft(recipe);
            return (
              <div key={recipe.id} className={`rpg-class-card !cursor-default ${craftable ? '' : 'opacity-60'}`}>
                <div className="font-bold text-xs pixel-text flex items-center gap-1">
                  <Sparkles className="h-3 w-3" style={{ color: 'hsl(var(--rpg-gold))' }} />
                  {recipe.name}
                </div>
                <p className="text-[10px] opacity-50">{recipe.description}</p>

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[9px] opacity-50">Resultado:</span>
                  <span className="rpg-stat-bonus text-[9px]" style={{ color: 'hsl(var(--rpg-gold))' }}>
                    {recipe.items?.name} x{recipe.result_quantity}
                  </span>
                </div>

                <div className="mt-1">
                  <span className="text-[9px] opacity-50">Materiais:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {recipe.recipe_materials.map((mat: any) => {
                      const inv = inventory.find((i) => i.item_id === mat.item_id);
                      const hasEnough = inv && inv.quantity >= mat.quantity;
                      return (
                        <span key={mat.id} className={`rpg-stat-bonus text-[9px] ${hasEnough ? 'rpg-stat-agi' : 'rpg-stat-str'}`}>
                          {mat.items?.name} {inv?.quantity || 0}/{mat.quantity}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <GameButton size="sm" variant={craftable ? 'gold' : 'secondary'} disabled={!craftable} className="w-full mt-2" onClick={() => craftItem(recipe)}>
                  <Hammer className="h-3 w-3 mr-1" /> {craftable ? 'Craftar' : 'Materiais Insuficientes'}
                </GameButton>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
