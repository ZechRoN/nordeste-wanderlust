import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PixelCard, PixelCardContent, PixelCardHeader, PixelCardTitle } from '@/components/ui/pixel-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Package, Sword, Shield, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { ITEM_SPRITES, RARITY_COLORS } from '@/assets/sprites';

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

const getRarityColor = (rarity: string) => {
  const colors = {
    common: 'text-gray-600',
    uncommon: 'text-green-600',
    rare: 'text-blue-600',
    epic: 'text-purple-600',
    legendary: 'text-yellow-600'
  };
  return colors[rarity as keyof typeof colors] || 'text-gray-600';
};

const getTypeIcon = (type: string) => {
  const icons = {
    weapon: Sword,
    armor: Shield,
    consumable: Zap
  };
  return icons[type as keyof typeof icons] || Package;
};

export function Inventory({ character, onCharacterUpdate }: InventoryProps) {
  const [characterItems, setCharacterItems] = useState<CharacterItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('character_items')
        .select(`
          *,
          item:items(*)
        `)
        .eq('character_id', character.id);

      if (error) throw error;
      setCharacterItems(data || []);
    } catch (error) {
      toast.error('Erro ao carregar inventário');
    } finally {
      setLoading(false);
    }
  };

  const equipItem = async (characterItemId: string, item: Item) => {
    try {
      // Desequipar outros itens do mesmo tipo se for weapon/armor
      if (item.type === 'weapon' || item.type === 'armor') {
        await supabase
          .from('character_items')
          .update({ is_equipped: false })
          .eq('character_id', character.id)
          .neq('id', characterItemId);
      }

      // Equipar o item
      const { error } = await supabase
        .from('character_items')
        .update({ is_equipped: true })
        .eq('id', characterItemId);

      if (error) throw error;

      // Recalcular atributos do personagem
      const newStats = {
        strength: character.strength + item.strength_bonus,
        agility: character.agility + item.agility_bonus,
        intelligence: character.intelligence + item.intelligence_bonus,
        vitality: character.vitality + item.vitality_bonus,
        luck: character.luck + item.luck_bonus
      };

      await supabase
        .from('characters')
        .update(newStats)
        .eq('id', character.id);

      onCharacterUpdate({ ...character, ...newStats });
      loadInventory();
      toast.success(`${item.name} equipado!`);
    } catch (error) {
      toast.error('Erro ao equipar item');
    }
  };

  const unequipItem = async (characterItemId: string, item: Item) => {
    try {
      await supabase
        .from('character_items')
        .update({ is_equipped: false })
        .eq('id', characterItemId);

      // Recalcular atributos do personagem
      const newStats = {
        strength: character.strength - item.strength_bonus,
        agility: character.agility - item.agility_bonus,
        intelligence: character.intelligence - item.intelligence_bonus,
        vitality: character.vitality - item.vitality_bonus,
        luck: character.luck - item.luck_bonus
      };

      await supabase
        .from('characters')
        .update(newStats)
        .eq('id', character.id);

      onCharacterUpdate({ ...character, ...newStats });
      loadInventory();
      toast.success(`${item.name} desequipado!`);
    } catch (error) {
      toast.error('Erro ao desequipar item');
    }
  };

  const useConsumable = async (characterItemId: string, item: Item) => {
    try {
      const characterItem = characterItems.find(ci => ci.id === characterItemId);
      if (!characterItem) return;

      if (characterItem.quantity <= 1) {
        // Remover item se quantidade for 1
        await supabase
          .from('character_items')
          .delete()
          .eq('id', characterItemId);
      } else {
        // Reduzir quantidade
        await supabase
          .from('character_items')
          .update({ quantity: characterItem.quantity - 1 })
          .eq('id', characterItemId);
      }

      // Aplicar efeito do consumível (simplificado)
      let healthBonus = 0;
      let manaBonus = 0;

      if (item.name.includes('Cura Pequena')) healthBonus = 50;
      else if (item.name.includes('Cura Grande')) healthBonus = 150;
      else if (item.name.includes('Mana')) manaBonus = 30;

      if (healthBonus > 0 || manaBonus > 0) {
        const updates: any = {};
        if (healthBonus > 0) updates.health = Math.min(character.health + healthBonus, character.max_health);
        if (manaBonus > 0) updates.mana = Math.min(character.mana + manaBonus, character.max_mana);

        await supabase
          .from('characters')
          .update(updates)
          .eq('id', character.id);

        onCharacterUpdate({ ...character, ...updates });
      }

      loadInventory();
      toast.success(`${item.name} usado!`);
    } catch (error) {
      toast.error('Erro ao usar item');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Carregando inventário...</div>;
  }

  const weapons = characterItems.filter(ci => ci.item.type === 'weapon');
  const armor = characterItems.filter(ci => ci.item.type === 'armor');
  const consumables = characterItems.filter(ci => ci.item.type === 'consumable');
  const equippedItems = characterItems.filter(ci => ci.is_equipped);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventário
          </CardTitle>
          <CardDescription>
            Gerencie seus itens, equipamentos e consumíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {equippedItems.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 pixel-text flex items-center gap-2">
                <span className="text-xl">⚔️</span>
                Itens Equipados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {equippedItems.map((characterItem) => {
                  const itemSprite = ITEM_SPRITES[characterItem.item.type as keyof typeof ITEM_SPRITES] || '📦';
                  return (
                    <div key={characterItem.id} className="pixel-inventory-slot bg-card/80 p-3 gap-3 h-auto w-auto justify-start">
                      <span className="text-2xl">{itemSprite}</span>
                      <div className="flex-1">
                        <h4 className={`font-medium pixel-text`} style={{ color: RARITY_COLORS[characterItem.item.rarity as keyof typeof RARITY_COLORS] }}>
                          {characterItem.item.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {characterItem.item.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => unequipItem(characterItem.id, characterItem.item)}
                        className="pixel-button"
                      >
                        Desequipar
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Tabs defaultValue="weapons" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="weapons">Armas ({weapons.length})</TabsTrigger>
              <TabsTrigger value="armor">Armaduras ({armor.length})</TabsTrigger>
              <TabsTrigger value="consumables">Consumíveis ({consumables.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="weapons" className="space-y-3">
              {weapons.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma arma no inventário</p>
              ) : (
                weapons.map((characterItem) => (
                  <ItemCard
                    key={characterItem.id}
                    characterItem={characterItem}
                    onEquip={() => equipItem(characterItem.id, characterItem.item)}
                    onUnequip={() => unequipItem(characterItem.id, characterItem.item)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="armor" className="space-y-3">
              {armor.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma armadura no inventário</p>
              ) : (
                armor.map((characterItem) => (
                  <ItemCard
                    key={characterItem.id}
                    characterItem={characterItem}
                    onEquip={() => equipItem(characterItem.id, characterItem.item)}
                    onUnequip={() => unequipItem(characterItem.id, characterItem.item)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="consumables" className="space-y-3">
              {consumables.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhum consumível no inventário</p>
              ) : (
                consumables.map((characterItem) => (
                  <ItemCard
                    key={characterItem.id}
                    characterItem={characterItem}
                    onUse={() => useConsumable(characterItem.id, characterItem.item)}
                    isConsumable
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface ItemCardProps {
  characterItem: CharacterItem;
  onEquip?: () => void;
  onUnequip?: () => void;
  onUse?: () => void;
  isConsumable?: boolean;
}

function ItemCard({ characterItem, onEquip, onUnequip, onUse, isConsumable }: ItemCardProps) {
  const IconComponent = getTypeIcon(characterItem.item.type);
  const item = characterItem.item;

  return (
    <div className="flex items-center gap-3 p-4 border rounded-lg">
      <IconComponent className="h-6 w-6" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`font-medium ${getRarityColor(item.rarity)}`}>
            {item.name}
          </h4>
          <Badge variant="outline">{item.rarity}</Badge>
          {characterItem.quantity > 1 && (
            <Badge variant="secondary">x{characterItem.quantity}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
        <div className="flex gap-2 text-xs">
          {item.strength_bonus > 0 && <span className="text-red-600">+{item.strength_bonus} FOR</span>}
          {item.agility_bonus > 0 && <span className="text-green-600">+{item.agility_bonus} AGI</span>}
          {item.intelligence_bonus > 0 && <span className="text-blue-600">+{item.intelligence_bonus} INT</span>}
          {item.vitality_bonus > 0 && <span className="text-orange-600">+{item.vitality_bonus} VIT</span>}
          {item.luck_bonus > 0 && <span className="text-purple-600">+{item.luck_bonus} SOR</span>}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {isConsumable ? (
          <Button size="sm" onClick={onUse}>
            Usar
          </Button>
        ) : characterItem.is_equipped ? (
          <Button size="sm" variant="outline" onClick={onUnequip}>
            Desequipar
          </Button>
        ) : (
          <Button size="sm" onClick={onEquip}>
            Equipar
          </Button>
        )}
        <span className="text-xs text-muted-foreground text-center">
          {item.value} moedas
        </span>
      </div>
    </div>
  );
}