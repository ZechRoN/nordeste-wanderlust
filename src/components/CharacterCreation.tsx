import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sword, Wand2, Target, Heart, UserX } from 'lucide-react';
import { GamePanel, GameButton } from '@/components/ui/game-panel';

interface CharacterCreationProps {
  onCharacterCreated: (character: any) => void;
  onCancel?: () => void;
}

const classes = [
  { id: 'warrior', name: 'Guerreiro', icon: '⚔️', emoji: Sword, description: 'Especialista em combate corpo a corpo e defesa',
    attributes: { strength: 15, intelligence: 8, agility: 10, vitality: 15, luck: 7 } },
  { id: 'mage', name: 'Mago', icon: '🔮', emoji: Wand2, description: 'Mestre das artes mágicas e conhecimento',
    attributes: { strength: 7, intelligence: 18, agility: 8, vitality: 10, luck: 12 } },
  { id: 'archer', name: 'Arqueiro', icon: '🏹', emoji: Target, description: 'Habilidoso com armas à distância e precisão',
    attributes: { strength: 10, intelligence: 10, agility: 16, vitality: 12, luck: 7 } },
  { id: 'healer', name: 'Curandeiro', icon: '💚', emoji: Heart, description: 'Especialista em cura e magias de suporte',
    attributes: { strength: 8, intelligence: 14, agility: 10, vitality: 16, luck: 7 } },
  { id: 'assassin', name: 'Assassino', icon: '🗡️', emoji: UserX, description: 'Mestre da furtividade e ataques críticos',
    attributes: { strength: 12, intelligence: 10, agility: 18, vitality: 8, luck: 7 } },
];

export const CharacterCreation = ({ onCharacterCreated, onCancel }: CharacterCreationProps) => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [characterName, setCharacterName] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedClassData = classes.find(c => c.id === selectedClass);

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !characterName.trim()) {
      toast.error('Selecione uma classe e digite um nome.');
      return;
    }
    if (!user) return;
    setLoading(true);
    const classData = classes.find(c => c.id === selectedClass)!;
    const { data, error } = await supabase.from('characters')
      .insert({ user_id: user.id, name: characterName.trim(), class: selectedClass as any, ...classData.attributes })
      .select().single();
    setLoading(false);
    if (error) { toast.error(error.message); }
    else { toast.success(`${data.name} foi criado!`); onCharacterCreated(data); }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-xl">
        <GamePanel
          title="Criar Personagem"
          icon={<Sword className="h-5 w-5" />}
          onClose={onCancel}
          footer={
            <div className="flex gap-2 justify-center w-full">
              {onCancel && <GameButton onClick={onCancel}>Cancelar</GameButton>}
              <GameButton
                variant="gold"
                size="lg"
                disabled={loading || !selectedClass || !characterName.trim()}
                onClick={handleCreateCharacter as any}
              >
                {loading ? 'Criando...' : '✦ Criar Personagem'}
              </GameButton>
            </div>
          }
        >
          {/* Name input */}
          <div className="mb-4">
            <label className="rpg-label">Nome do Personagem</label>
            <input
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Digite o nome..."
              maxLength={20}
              className="rpg-input"
            />
          </div>

          {/* Class grid */}
          <label className="rpg-label">Escolha sua Classe</label>
          <div className="grid grid-cols-1 gap-2">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className={`rpg-class-card ${selectedClass === cls.id ? 'rpg-class-selected' : ''}`}
                onClick={() => setSelectedClass(cls.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cls.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm pixel-text">{cls.name}</div>
                    <div className="text-[10px] opacity-60">{cls.description}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="rpg-stat-bonus rpg-stat-str text-[10px]">FOR {cls.attributes.strength}</span>
                  <span className="rpg-stat-bonus rpg-stat-int text-[10px]">INT {cls.attributes.intelligence}</span>
                  <span className="rpg-stat-bonus rpg-stat-agi text-[10px]">AGI {cls.attributes.agility}</span>
                  <span className="rpg-stat-bonus rpg-stat-vit text-[10px]">VIT {cls.attributes.vitality}</span>
                  <span className="rpg-stat-bonus rpg-stat-luk text-[10px]">SOR {cls.attributes.luck}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Selected class preview */}
          {selectedClassData && (
            <div className="rpg-item-detail mt-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{selectedClassData.icon}</span>
                <span className="font-bold pixel-text" style={{ color: 'hsl(var(--rpg-gold))' }}>{selectedClassData.name}</span>
              </div>
              <p className="text-xs opacity-70">{selectedClassData.description}</p>
            </div>
          )}
        </GamePanel>
      </div>
    </div>
  );
};
