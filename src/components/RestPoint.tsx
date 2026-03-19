import { useState } from 'react';
import { Tent, Heart, Zap, Coins, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GamePanel, GameButton } from '@/components/ui/game-panel';

interface Character {
  id: string; health: number; max_health: number; mana: number; max_mana: number; gold: number; level: number;
}

interface RestPointProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
  biome: string;
}

const REST_COSTS: Record<string, number> = { caatinga: 5, agreste: 8, litoral: 12, santa_cruz: 15 };
const REST_NAMES: Record<string, string> = { caatinga: 'Acampamento da Caatinga', agreste: 'Pousada do Agreste', litoral: 'Resort do Litoral', santa_cruz: 'Hotel Santa Cruz' };

export function RestPoint({ character, onCharacterUpdate, biome }: RestPointProps) {
  const [isResting, setIsResting] = useState(false);
  const cost = REST_COSTS[biome] || 10;
  const name = REST_NAMES[biome] || 'Ponto de Descanso';
  const needsRest = character.health < character.max_health || character.mana < character.max_mana;

  const handleRest = async () => {
    if (character.gold < cost || !needsRest) return;
    setIsResting(true);
    await new Promise(r => setTimeout(r, 2000));
    const newGold = character.gold - cost;
    await supabase.from('characters').update({ health: character.max_health, mana: character.max_mana, gold: newGold }).eq('id', character.id);
    onCharacterUpdate({ ...character, health: character.max_health, mana: character.max_mana, gold: newGold });
    toast.success('Totalmente descansado!');
    setIsResting(false);
  };

  return (
    <div className="w-full max-w-md">
      <GamePanel title={name} icon={<Tent className="h-5 w-5" />}>
        <div className="space-y-3">
          <div className="rpg-item-detail">
            <div className="flex justify-between text-xs">
              <span className="opacity-60">Custo:</span>
              <span className="rpg-gold-display">🪙 {cost}</span>
            </div>
          </div>
          <div className="rpg-item-detail">
            <div className="flex items-center gap-2 text-xs mb-1">
              <Heart className="h-3 w-3" style={{ color: 'hsl(0 60% 55%)' }} />
              <span>Vida: {character.health}/{character.max_health}</span>
            </div>
            <div className="rpg-bar rpg-bar-hp">
              <div className="rpg-bar-fill rpg-bar-fill-hp" style={{ width: `${(character.health / character.max_health) * 100}%` }} />
            </div>
            <div className="flex items-center gap-2 text-xs mt-2 mb-1">
              <Zap className="h-3 w-3" style={{ color: 'hsl(220 70% 55%)' }} />
              <span>Mana: {character.mana}/{character.max_mana}</span>
            </div>
            <div className="rpg-bar rpg-bar-mp">
              <div className="rpg-bar-fill rpg-bar-fill-mp" style={{ width: `${(character.mana / character.max_mana) * 100}%` }} />
            </div>
          </div>
          <GameButton variant="gold" className="w-full" disabled={!needsRest || character.gold < cost || isResting} onClick={handleRest}>
            {isResting ? (<><Clock className="h-3 w-3 mr-1 animate-spin" /> Descansando...</>) :
              (<><Tent className="h-3 w-3 mr-1" /> Descansar (🪙{cost})</>)}
          </GameButton>
          {!needsRest && <p className="text-center text-[10px] opacity-40">Já está descansado!</p>}
        </div>
      </GamePanel>
    </div>
  );
}
