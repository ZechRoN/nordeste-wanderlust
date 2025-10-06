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
  result_item_id: string;
  result_item: any;
  required_materials: Array<{
    item_id: string;
    quantity: number;
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

    // Aqui você pode adicionar lógica para carregar receitas
    // Por enquanto, vamos criar receitas simples baseadas nos itens
    setLoading(false);
  };

  const canCraft = (recipe: CraftingRecipe): boolean => {
    return recipe.required_materials.every((mat) => {
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
    for (const material of recipe.required_materials) {
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

    // Adicionar item craftado ao inventário
    const { error } = await supabase
      .from('character_items')
      .insert({
        character_id: character.id,
        item_id: recipe.result_item_id,
        quantity: 1
      });

    if (error) {
      toast.error('Erro ao craftar item');
      console.error(error);
      return;
    }

    toast.success(`${recipe.result_item.name} craftado com sucesso!`, {
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

              <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                <Hammer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-2">Sistema de Crafting</p>
                <p className="text-sm">
                  Receitas serão adicionadas em breve!
                  <br />
                  Explore o mundo para descobrir materiais raros.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
