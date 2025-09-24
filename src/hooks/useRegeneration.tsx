import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Character {
  id: string;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  level: number;
}

export function useRegeneration(
  character: Character, 
  onCharacterUpdate: (character: Character) => void,
  isInCombat: boolean = false
) {
  useEffect(() => {
    if (isInCombat) return;
    
    const regenInterval = setInterval(async () => {
      const needsRegen = character.health < character.max_health || character.mana < character.max_mana;
      
      if (!needsRegen) return;

      // Regeneração baseada no nível
      const healthRegen = Math.floor(character.max_health * 0.02) + character.level;
      const manaRegen = Math.floor(character.max_mana * 0.03) + character.level;
      
      const newHealth = Math.min(character.max_health, character.health + healthRegen);
      const newMana = Math.min(character.max_mana, character.mana + manaRegen);
      
      if (newHealth !== character.health || newMana !== character.mana) {
        try {
          await supabase
            .from('characters')
            .update({
              health: newHealth,
              mana: newMana
            })
            .eq('id', character.id);
          
          onCharacterUpdate({
            ...character,
            health: newHealth,
            mana: newMana
          });
          
          if (newHealth === character.max_health && newMana === character.max_mana) {
            toast.success('Completamente recuperado!');
          }
        } catch (error) {
          console.error('Erro na regeneração:', error);
        }
      }
    }, 5000); // Regenera a cada 5 segundos
    
    return () => clearInterval(regenInterval);
  }, [character, onCharacterUpdate, isInCombat]);
}