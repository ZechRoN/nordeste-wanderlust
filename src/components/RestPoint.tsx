import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tent, Heart, Zap, Coins, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Character {
  id: string;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  gold: number;
  level: number;
}

interface RestPointProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
  biome: string;
}

const REST_COSTS = {
  caatinga: 5,
  agreste: 8,
  litoral: 12,
  santa_cruz: 15
};

const REST_POINT_NAMES = {
  caatinga: 'Acampamento da Caatinga',
  agreste: 'Pousada do Agreste', 
  litoral: 'Resort do Litoral',
  santa_cruz: 'Hotel Santa Cruz'
};

export function RestPoint({ character, onCharacterUpdate, biome }: RestPointProps) {
  const [isResting, setIsResting] = useState(false);
  
  const restCost = REST_COSTS[biome as keyof typeof REST_COSTS] || 10;
  const restPointName = REST_POINT_NAMES[biome as keyof typeof REST_POINT_NAMES] || 'Ponto de Descanso';
  
  const needsRest = character.health < character.max_health || character.mana < character.max_mana;
  const canAfford = character.gold >= restCost;
  
  const handleRest = async () => {
    if (!canAfford || !needsRest) return;
    
    setIsResting(true);
    
    try {
      // Simular tempo de descanso
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newGold = character.gold - restCost;
      
      await supabase
        .from('characters')
        .update({
          health: character.max_health,
          mana: character.max_mana,
          gold: newGold
        })
        .eq('id', character.id);
      
      onCharacterUpdate({
        ...character,
        health: character.max_health,
        mana: character.max_mana,
        gold: newGold
      });
      
      toast.success('Você se sente completamente descansado!');
    } catch (error) {
      toast.error('Erro ao descansar');
    } finally {
      setIsResting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tent className="h-5 w-5" />
          {restPointName}
        </CardTitle>
        <CardDescription>
          Recupere sua energia e recursos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span>Custo: {restCost} moedas</span>
          </div>
          {!canAfford && (
            <Badge variant="destructive">Sem ouro</Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-red-500" />
            <span>Vida: {character.health}/{character.max_health}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-blue-500" />
            <span>Mana: {character.mana}/{character.max_mana}</span>
          </div>
        </div>
        
        <Button 
          onClick={handleRest}
          disabled={!needsRest || !canAfford || isResting}
          className="w-full"
        >
          {isResting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Descansando...
            </>
          ) : (
            <>
              <Tent className="h-4 w-4 mr-2" />
              Descansar ({restCost} moedas)
            </>
          )}
        </Button>
        
        {!needsRest && (
          <p className="text-center text-sm text-muted-foreground">
            Você já está completamente descansado!
          </p>
        )}
      </CardContent>
    </Card>
  );
}