import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { GameButton } from '@/components/ui/game-panel';

interface Pet {
  id: string;
  name: string;
  description: string;
  biome: string;
  rarity: string;
  strength_bonus: number;
  agility_bonus: number;
  intelligence_bonus: number;
  vitality_bonus: number;
  luck_bonus: number;
  special_passive: string;
}

interface CharacterPet {
  id: string;
  pet_id: string;
  is_active: boolean;
  nickname: string;
  level: number;
  experience: number;
  pet: Pet;
}

interface PetsProps {
  character: { id: string; current_biome: string; level: number; gold: number };
  onCharacterUpdate: (c: any) => void;
}

const PET_EMOJIS: Record<string, string> = {
  'Calango Veloz': '🦎', 'Preá Guerreiro': '🐹', 'Sagui Esperto': '🐒',
  'Tatu-Bola': '🐾', 'Arara Azul': '🦜', 'Jaguatirica': '🐆',
  'Boto Cor-de-Rosa': '🐬', 'Onça Pintada Filhote': '🐈',
};

const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF', uncommon: '#22C55E', rare: '#3B82F6', epic: '#A855F7',
};

const TAME_COST: Record<string, number> = {
  common: 50, uncommon: 150, rare: 400, epic: 1000,
};

export function Pets({ character, onCharacterUpdate }: PetsProps) {
  const [allPets, setAllPets] = useState<Pet[]>([]);
  const [myPets, setMyPets] = useState<CharacterPet[]>([]);
  const [tab, setTab] = useState<'owned' | 'wild'>('owned');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [petsRes, myRes] = await Promise.all([
      supabase.from('pets').select('*'),
      supabase.from('character_pets').select('*, pet:pets(*)').eq('character_id', character.id),
    ]);
    setAllPets(petsRes.data || []);
    setMyPets((myRes.data as any) || []);
    setLoading(false);
  };

  const tamePet = async (pet: Pet) => {
    const cost = TAME_COST[pet.rarity] || 100;
    if (character.gold < cost) { toast.error('Ouro insuficiente!'); return; }

    const { error } = await supabase.from('character_pets').insert({
      character_id: character.id, pet_id: pet.id,
    });
    if (error) { toast.error('Erro ao domar pet'); return; }

    const newGold = character.gold - cost;
    await supabase.from('characters').update({ gold: newGold }).eq('id', character.id);
    onCharacterUpdate({ ...character, gold: newGold });
    toast.success(`${pet.name} domado!`);
    loadData();
  };

  const activatePet = async (cp: CharacterPet) => {
    // Deactivate all first
    await supabase.from('character_pets').update({ is_active: false }).eq('character_id', character.id);
    await supabase.from('character_pets').update({ is_active: true }).eq('id', cp.id);
    toast.success(`${cp.pet.name} agora é seu familiar ativo!`);
    loadData();
  };

  const deactivatePet = async (cp: CharacterPet) => {
    await supabase.from('character_pets').update({ is_active: false }).eq('id', cp.id);
    toast.success(`${cp.pet.name} descansando`);
    loadData();
  };

  const wildPets = allPets.filter(p => !myPets.some(mp => mp.pet_id === p.id));
  const activePet = myPets.find(p => p.is_active);

  if (loading) return <div className="rpg-loading">Carregando...</div>;

  return (
    <div className="space-y-3">
      {/* Active pet display */}
      {activePet && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rpg-item-detail"
          style={{ borderColor: RARITY_COLORS[activePet.pet.rarity] }}
        >
          <div className="flex items-center gap-2">
            <span className="text-3xl">{PET_EMOJIS[activePet.pet.name] || '🐾'}</span>
            <div className="flex-1">
              <div className="font-bold pixel-text text-sm" style={{ color: RARITY_COLORS[activePet.pet.rarity] }}>
                {activePet.nickname || activePet.pet.name}
              </div>
              <div className="text-[10px] opacity-60">Familiar Ativo • Nível {activePet.level}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2 text-[10px]">
            {activePet.pet.strength_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-str">+{activePet.pet.strength_bonus} FOR</span>}
            {activePet.pet.agility_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-agi">+{activePet.pet.agility_bonus} AGI</span>}
            {activePet.pet.intelligence_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-int">+{activePet.pet.intelligence_bonus} INT</span>}
            {activePet.pet.vitality_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-vit">+{activePet.pet.vitality_bonus} VIT</span>}
            {activePet.pet.luck_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-luk">+{activePet.pet.luck_bonus} SOR</span>}
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'hsl(var(--rpg-gold))' }}>✦ {activePet.pet.special_passive}</div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="rpg-tabs">
        <button className={`rpg-tab ${tab === 'owned' ? 'rpg-tab-active' : ''}`} onClick={() => setTab('owned')}>
          Meus Pets ({myPets.length})
        </button>
        <button className={`rpg-tab ${tab === 'wild' ? 'rpg-tab-active' : ''}`} onClick={() => setTab('wild')}>
          Selvagens ({wildPets.length})
        </button>
      </div>

      {tab === 'owned' ? (
        <div className="space-y-2">
          {myPets.length === 0 && <p className="text-xs opacity-50 text-center py-4">Nenhum pet domado ainda</p>}
          {myPets.map(cp => (
            <motion.div
              key={cp.id}
              className={`rpg-class-card ${cp.is_active ? 'rpg-slot-equipped' : ''}`}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{PET_EMOJIS[cp.pet.name] || '🐾'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs" style={{ color: RARITY_COLORS[cp.pet.rarity] }}>{cp.pet.name}</div>
                  <div className="text-[10px] opacity-50">Nv.{cp.level} • {cp.pet.special_passive}</div>
                </div>
                {cp.is_active ? (
                  <GameButton size="sm" variant="danger" onClick={() => deactivatePet(cp)}>Desativar</GameButton>
                ) : (
                  <GameButton size="sm" variant="gold" onClick={() => activatePet(cp)}>Ativar</GameButton>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {wildPets.map(pet => (
            <motion.div key={pet.id} className="rpg-class-card" whileHover={{ scale: 1.01 }}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{PET_EMOJIS[pet.name] || '🐾'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs" style={{ color: RARITY_COLORS[pet.rarity] }}>{pet.name}</div>
                  <div className="text-[10px] opacity-50">{pet.description}</div>
                  <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                    {pet.strength_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-str">+{pet.strength_bonus} FOR</span>}
                    {pet.agility_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-agi">+{pet.agility_bonus} AGI</span>}
                    {pet.intelligence_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-int">+{pet.intelligence_bonus} INT</span>}
                    {pet.vitality_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-vit">+{pet.vitality_bonus} VIT</span>}
                    {pet.luck_bonus > 0 && <span className="rpg-stat-bonus rpg-stat-luk">+{pet.luck_bonus} SOR</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] opacity-60">🌍 {pet.biome}</div>
                  <GameButton
                    size="sm"
                    variant="primary"
                    onClick={() => tamePet(pet)}
                    disabled={character.gold < (TAME_COST[pet.rarity] || 100)}
                  >
                    🪙 {TAME_COST[pet.rarity] || 100}
                  </GameButton>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
