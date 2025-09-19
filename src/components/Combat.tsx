import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PixelCard, PixelCardContent, PixelCardHeader, PixelCardTitle } from '@/components/ui/pixel-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Swords, Heart, Zap, Shield, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { UI_SPRITES } from '@/assets/sprites';

interface Character {
  id: string;
  name: string;
  level: number;
  health: number;
  max_health: number;
  mana: number;
  max_mana: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  luck: number;
  experience: number;
  gold: number;
}

interface Creature {
  id: string;
  name: string;
  description: string;
  level: number;
  health: number;
  max_health: number;
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  luck: number;
  experience_reward: number;
  gold_reward: number;
  rarity: string;
  special_ability: string;
}

interface CombatProps {
  character: Character;
  creature: Creature;
  onCombatEnd: (victory: boolean, updatedCharacter?: any) => void;
}

type CombatAction = 'attack' | 'defend' | 'special';

export function Combat({ character, creature, onCombatEnd }: CombatProps) {
  const [playerHealth, setPlayerHealth] = useState(character.health);
  const [playerMana, setPlayerMana] = useState(character.mana);
  const [creatureHealth, setCreatureHealth] = useState(creature.health);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [isDefending, setIsDefending] = useState(false);

  const addToCombatLog = (message: string) => {
    setCombatLog(prev => [...prev.slice(-4), message]);
  };

  const calculateDamage = (attacker: any, defender: any, isSpecial = false) => {
    const baseDamage = attacker.strength + (isSpecial ? attacker.intelligence : 0);
    const defense = defender.vitality;
    const critChance = attacker.luck / 100;
    
    let damage = Math.max(1, baseDamage - defense / 2);
    
    // Chance de crítico
    if (Math.random() < critChance) {
      damage *= 2;
      return { damage: Math.floor(damage), isCritical: true };
    }
    
    return { damage: Math.floor(damage), isCritical: false };
  };

  const playerAttack = (action: CombatAction) => {
    if (!isPlayerTurn) return;

    let damageResult = { damage: 0, isCritical: false };
    let manaCost = 0;

    switch (action) {
      case 'attack':
        damageResult = calculateDamage(character, creature);
        addToCombatLog(`${character.name} ataca com ${damageResult.damage} de dano${damageResult.isCritical ? ' (CRÍTICO!)' : ''}!`);
        break;
        
      case 'defend':
        setIsDefending(true);
        addToCombatLog(`${character.name} assume posição defensiva!`);
        break;
        
      case 'special':
        if (playerMana < 20) {
          toast.error('Mana insuficiente!');
          return;
        }
        manaCost = 20;
        damageResult = calculateDamage(character, creature, true);
        addToCombatLog(`${character.name} usa habilidade especial com ${damageResult.damage} de dano${damageResult.isCritical ? ' (CRÍTICO!)' : ''}!`);
        break;
    }

    const newCreatureHealth = Math.max(0, creatureHealth - damageResult.damage);
    const newPlayerMana = Math.max(0, playerMana - manaCost);
    
    setCreatureHealth(newCreatureHealth);
    setPlayerMana(newPlayerMana);

    if (newCreatureHealth <= 0) {
      handleVictory();
      return;
    }

    setIsPlayerTurn(false);
    setTimeout(creatureAttack, 1500);
  };

  const creatureAttack = () => {
    const damageResult = calculateDamage(creature, character);
    let finalDamage = damageResult.damage;

    if (isDefending) {
      finalDamage = Math.floor(finalDamage / 2);
      addToCombatLog(`${creature.name} ataca, mas ${character.name} defende! Dano reduzido para ${finalDamage}!`);
      setIsDefending(false);
    } else {
      addToCombatLog(`${creature.name} ataca com ${finalDamage} de dano${damageResult.isCritical ? ' (CRÍTICO!)' : ''}!`);
    }

    const newPlayerHealth = Math.max(0, playerHealth - finalDamage);
    setPlayerHealth(newPlayerHealth);

    if (newPlayerHealth <= 0) {
      handleDefeat();
      return;
    }

    setIsPlayerTurn(true);
  };

  const handleVictory = async () => {
    try {
      // Calcular experiência e level up
      const newExperience = character.experience + creature.experience_reward;
      const newGold = character.gold + creature.gold_reward;
      const currentLevel = character.level;
      const experienceForNextLevel = currentLevel * 100;
      
      let newLevel = currentLevel;
      let finalExperience = newExperience;
      
      if (newExperience >= experienceForNextLevel) {
        newLevel = currentLevel + 1;
        finalExperience = newExperience - experienceForNextLevel;
        
        // Aumentar atributos no level up
        const statIncrease = {
          max_health: character.max_health + 20,
          max_mana: character.max_mana + 10,
          strength: character.strength + 2,
          agility: character.agility + 2,
          intelligence: character.intelligence + 2,
          vitality: character.vitality + 2,
          luck: character.luck + 1
        };

        await supabase
          .from('characters')
          .update({
            level: newLevel,
            experience: finalExperience,
            gold: newGold,
            health: playerHealth,
            mana: playerMana,
            ...statIncrease
          })
          .eq('id', character.id);
          
        toast.success(`Level Up! Agora você é nível ${newLevel}!`);
      } else {
        await supabase
          .from('characters')
          .update({
            experience: finalExperience,
            gold: newGold,
            health: playerHealth,
            mana: playerMana
          })
          .eq('id', character.id);
      }

      // Chance de drop de item
      const { data: drops } = await supabase
        .from('creature_drops')
        .select('*, item:items(*)')
        .eq('creature_id', creature.id);

      if (drops && drops.length > 0) {
        for (const drop of drops) {
          if (Math.random() < drop.drop_chance) {
            await supabase
              .from('character_items')
              .insert({
                character_id: character.id,
                item_id: drop.item_id,
                quantity: Math.floor(Math.random() * (drop.quantity_max - drop.quantity_min + 1)) + drop.quantity_min
              });
            
            toast.success(`Item obtido: ${drop.item.name}!`);
          }
        }
      }

      addToCombatLog(`VITÓRIA! Ganhou ${creature.experience_reward} XP e ${creature.gold_reward} moedas!`);
      
      setTimeout(() => {
        onCombatEnd(true, {
          ...character,
          level: newLevel,
          experience: finalExperience,
          gold: newGold,
          health: playerHealth,
          mana: playerMana
        });
      }, 2000);

    } catch (error) {
      toast.error('Erro ao processar vitória');
      onCombatEnd(true);
    }
  };

  const handleDefeat = async () => {
    try {
      // Perder um pouco de gold
      const goldLoss = Math.floor(character.gold * 0.1);
      const newGold = Math.max(0, character.gold - goldLoss);
      
      await supabase
        .from('characters')
        .update({
          health: Math.floor(character.max_health * 0.1), // Revive com 10% da vida
          gold: newGold
        })
        .eq('id', character.id);

      addToCombatLog(`DERROTA! Perdeu ${goldLoss} moedas...`);
      
      setTimeout(() => {
        onCombatEnd(false, {
          ...character,
          health: Math.floor(character.max_health * 0.1),
          gold: newGold
        });
      }, 2000);
      
    } catch (error) {
      toast.error('Erro ao processar derrota');
      onCombatEnd(false);
    }
  };

  const playerHealthPercent = (playerHealth / character.max_health) * 100;
  const playerManaPercent = (playerMana / character.max_mana) * 100;
  const creatureHealthPercent = (creatureHealth / creature.max_health) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Combate
          </CardTitle>
          <CardDescription>
            {character.name} vs {creature.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Jogador */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-lg">{character.name}</h3>
                <Badge>Nível {character.level}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Vida: {playerHealth}/{character.max_health}</span>
                </div>
                <Progress value={playerHealthPercent} className="h-3" />
                
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Mana: {playerMana}/{character.max_mana}</span>
                </div>
                <Progress value={playerManaPercent} className="h-3" />
              </div>

              {isDefending && (
                <div className="flex items-center gap-2 text-green-600">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Defendendo</span>
                </div>
              )}
            </div>

            {/* Criatura */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-lg">{creature.name}</h3>
                <Badge variant={creature.rarity === 'common' ? 'secondary' : 
                              creature.rarity === 'uncommon' ? 'default' :
                              creature.rarity === 'rare' ? 'destructive' : 'outline'}>
                  Nível {creature.level}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Vida: {creatureHealth}/{creature.max_health}</span>
                </div>
                <Progress value={creatureHealthPercent} className="h-3" />
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">{creature.description}</p>
                <p className="text-xs text-primary mt-1">{creature.special_ability}</p>
              </div>
            </div>
          </div>

          {/* Ações do jogador */}
          {isPlayerTurn && playerHealth > 0 && creatureHealth > 0 && (
            <div className="flex gap-3 justify-center mb-6">
              <Button onClick={() => playerAttack('attack')}>
                <Swords className="h-4 w-4 mr-2" />
                Atacar
              </Button>
              <Button variant="outline" onClick={() => playerAttack('defend')}>
                <Shield className="h-4 w-4 mr-2" />
                Defender
              </Button>
              <Button 
                variant="secondary" 
                onClick={() => playerAttack('special')}
                disabled={playerMana < 20}
              >
                <Zap className="h-4 w-4 mr-2" />
                Especial (20 mana)
              </Button>
            </div>
          )}

          {/* Log de combate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Log de Combate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {combatLog.map((message, index) => (
                  <p key={index} className="text-sm">
                    {message}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}