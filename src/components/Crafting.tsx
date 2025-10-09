import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Hammer, Sparkles, Package } from 'lucide-react';
import { toast } from 'sonner';

interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  result_item_id: string;
  result_quantity: number;
  required_level: number;
  items: any;
  recipe_materials: Array<{
    id: string;
    item_id: string;
    quantity: number;
    items: any;
  }>;
}

interface CraftingProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function Crafting({ character, onCharacterUpdate }: CraftingProps) {
  const [recipes, setRecipes] = useState<CraftingRecipe[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCraftingData();
  }, [character.id]);

  const loadCraftingData = async () => {
    // Carregar inventário do personagem
    const { data: inv, error: invError } = await supabase
      .from('character_items')
      .select('*, items(*)')
      .eq('character_id', character.id);

    if (invError) {
      console.error('Erro ao carregar inventário:', invError);
    } else {
      setInventory(inv || []);
    }

    // Carregar receitas disponíveis
    const { data: recipesData, error: recipesError } = await supabase
      .from('crafting_recipes' as any)
      .select(`
        *,
        items(*),
        recipe_materials(*, items(*))
      `)
      .lte('required_level', character.level);

    if (recipesError) {
      console.error('Erro ao carregar receitas:', recipesError);
    } else {
      setRecipes((recipesData as any) || []);
    }

    setLoading(false);
  };

  const canCraft = (recipe: CraftingRecipe): boolean => {
    if (!recipe.recipe_materials || recipe.recipe_materials.length === 0) {
      return false;
    }
    return recipe.recipe_materials.every((mat) => {
      const inventoryItem = inventory.find(
        (inv) => inv.item_id === mat.item_id
      );
      return inventoryItem && inventoryItem.quantity >= mat.quantity;
    });
  };

  const craftItem = async (recipe: CraftingRecipe) => {
    if (!canCraft(recipe)) {
      toast.error('Materiais insuficientes!');
      return;
    }

    // Remover materiais do inventário
    for (const material of recipe.recipe_materials) {
      const inventoryItem = inventory.find(
        (inv) => inv.item_id === material.item_id
      );

      if (inventoryItem) {
        const newQuantity = inventoryItem.quantity - material.quantity;

        if (newQuantity <= 0) {
          await supabase
            .from('character_items')
            .delete()
            .eq('id', inventoryItem.id);
        } else {
          await supabase
            .from('character_items')
            .update({ quantity: newQuantity })
            .eq('id', inventoryItem.id);
        }
      }
    }

    // Verificar se o item já existe no inventário
    const existingItem = inventory.find(
      (inv) => inv.item_id === recipe.result_item_id
    );

    if (existingItem) {
      // Atualizar quantidade
      await supabase
        .from('character_items')
        .update({ quantity: existingItem.quantity + recipe.result_quantity })
        .eq('id', existingItem.id);
    } else {
      // Adicionar novo item
      await supabase
        .from('character_items')
        .insert({
          character_id: character.id,
          item_id: recipe.result_item_id,
          quantity: recipe.result_quantity
        });
    }

    toast.success(`${recipe.items.name} craftado com sucesso!`, {
      icon: <Sparkles className="h-4 w-4" />
    });

    loadCraftingData();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hammer className="h-5 w-5" />
            Oficina de Crafting
          </CardTitle>
          <CardDescription>
            Combine materiais para criar itens poderosos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">Materiais Disponíveis</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {inventory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum material no inventário
                    </p>
                  ) : (
                    inventory.map((item) => (
                      <Badge key={item.id} variant="outline">
                        {item.items.name} x{item.quantity}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              {recipes.length === 0 ? (
                <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                  <Hammer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-2">Nenhuma receita disponível</p>
                  <p className="text-sm">
                    Aumente seu nível para desbloquear mais receitas!
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {recipes.map((recipe) => {
                      const canCraftRecipe = canCraft(recipe);
                      
                      return (
                        <Card key={recipe.id} className="border-2">
                          <CardHeader>
                            <CardTitle className="text-lg">{recipe.name}</CardTitle>
                            <CardDescription>{recipe.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Item Resultante */}
                              <div className="bg-muted/50 p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-2">Resultado:</p>
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-4 w-4 text-yellow-500" />
                                  <span className="font-bold">{recipe.items.name}</span>
                                  <Badge variant="outline">x{recipe.result_quantity}</Badge>
                                </div>
                              </div>

                              {/* Materiais Necessários */}
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">Materiais necessários:</p>
                                <div className="space-y-2">
                                  {recipe.recipe_materials.map((material: any) => {
                                    const inventoryItem = inventory.find(
                                      (inv) => inv.item_id === material.item_id
                                    );
                                    const hasEnough = inventoryItem && inventoryItem.quantity >= material.quantity;

                                    return (
                                      <div 
                                        key={material.id} 
                                        className="flex items-center justify-between p-2 rounded bg-muted/30"
                                      >
                                        <span className="text-sm">{material.items.name}</span>
                                        <Badge 
                                          variant={hasEnough ? "default" : "destructive"}
                                          className="text-xs"
                                        >
                                          {inventoryItem?.quantity || 0} / {material.quantity}
                                        </Badge>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Requisitos */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">Nível {recipe.required_level}+</Badge>
                              </div>

                              {/* Botão de Crafting */}
                              <Button
                                onClick={() => craftItem(recipe)}
                                disabled={!canCraftRecipe}
                                className="w-full"
                              >
                                <Hammer className="h-4 w-4 mr-2" />
                                {canCraftRecipe ? 'Craftar' : 'Materiais Insuficientes'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
