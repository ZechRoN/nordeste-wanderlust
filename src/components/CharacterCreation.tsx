import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sword, Wand2, Target, Heart, UserX } from 'lucide-react';
import { GamePanel, GamePanelTabs, GameButton } from '@/components/ui/game-panel';

interface CharacterCreationProps {
  onCharacterCreated: (character: any) => void;
  onCancel?: () => void;
}

const classes = [
  { id: 'warrior', name: 'Guerreiro', icon: '⚔️', description: 'Especialista em combate corpo a corpo e defesa',
    attributes: { strength: 15, intelligence: 8, agility: 10, vitality: 15, luck: 7 } },
  { id: 'mage', name: 'Mago', icon: '🔮', description: 'Mestre das artes mágicas e conhecimento',
    attributes: { strength: 7, intelligence: 18, agility: 8, vitality: 10, luck: 12 } },
  { id: 'archer', name: 'Arqueiro', icon: '🏹', description: 'Habilidoso com armas à distância e precisão',
    attributes: { strength: 10, intelligence: 10, agility: 16, vitality: 12, luck: 7 } },
  { id: 'healer', name: 'Curandeiro', icon: '💚', description: 'Especialista em cura e magias de suporte',
    attributes: { strength: 8, intelligence: 14, agility: 10, vitality: 16, luck: 7 } },
  { id: 'assassin', name: 'Assassino', icon: '🗡️', description: 'Mestre da furtividade e ataques críticos',
    attributes: { strength: 12, intelligence: 10, agility: 18, vitality: 8, luck: 7 } },
];

const HAIR_STYLES = ['Curto', 'Longo', 'Moicano', 'Trançado', 'Careca', 'Afro'];
const HAIR_COLORS = ['#2C1B0E', '#6B3A2A', '#D4A54A', '#C0392B', '#1A1A2E', '#F5F5F5', '#5B2C6F', '#1ABC9C'];
const EYE_COLORS = ['#2E4053', '#1E8449', '#7D3C98', '#2874A6', '#B7950B', '#922B21'];
const SKIN_COLORS = ['#FDDBB4', '#E8B88A', '#C68642', '#8D5524', '#5C3317', '#361F0E'];
const OUTFIT_COLORS = ['#C0392B', '#2980B9', '#27AE60', '#8E44AD', '#F39C12', '#2C3E50', '#E74C3C', '#1ABC9C'];

const FACE_OPTIONS = {
  mouth: ['😐', '😊', '😏', '😤'],
  nose: ['👃', '⸝', '△', '▽'],
};

interface Appearance {
  hairStyle: number;
  hairColor: number;
  eyeColor: number;
  skinColor: number;
  mouth: number;
  nose: number;
  outfitColor: number;
}

const CREATION_TABS = [
  { key: 'class', label: 'Classe' },
  { key: 'appearance', label: 'Aparência' },
];

export const CharacterCreation = ({ onCharacterCreated, onCancel }: CharacterCreationProps) => {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [characterName, setCharacterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('class');
  const [appearance, setAppearance] = useState<Appearance>({
    hairStyle: 0, hairColor: 0, eyeColor: 0, skinColor: 2, mouth: 0, nose: 0, outfitColor: 0,
  });

  const selectedClassData = classes.find(c => c.id === selectedClass);

  const handleCreateCharacter = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const updateAppearance = (key: keyof Appearance, value: number) => {
    setAppearance(prev => ({ ...prev, [key]: value }));
  };

  const ColorPicker = ({ colors, selected, onChange, label }: { colors: string[]; selected: number; onChange: (i: number) => void; label: string }) => (
    <div className="mb-3">
      <label className="rpg-label">{label}</label>
      <div className="flex gap-1 flex-wrap">
        {colors.map((color, i) => (
          <button
            key={i}
            className={`w-7 h-7 rounded-sm border-2 transition-all ${selected === i ? 'border-[hsl(var(--rpg-gold))] scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(i)}
            type="button"
          />
        ))}
      </div>
    </div>
  );

  const OptionPicker = ({ options, selected, onChange, label }: { options: string[]; selected: number; onChange: (i: number) => void; label: string }) => (
    <div className="mb-3">
      <label className="rpg-label">{label}</label>
      <div className="flex gap-1 flex-wrap">
        {options.map((opt, i) => (
          <button
            key={i}
            className={`rpg-tab text-xs ${selected === i ? 'rpg-tab-active' : ''}`}
            onClick={() => onChange(i)}
            type="button"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  // Character preview
  const Preview = () => (
    <div className="rpg-item-detail flex items-center justify-center py-4">
      <div className="relative">
        {/* Body/Skin */}
        <div className="w-16 h-20 rounded-md flex flex-col items-center justify-center relative"
          style={{ backgroundColor: SKIN_COLORS[appearance.skinColor] }}>
          {/* Hair */}
          <div className="absolute -top-3 left-0 right-0 h-6 rounded-t-md"
            style={{ backgroundColor: HAIR_COLORS[appearance.hairColor] }}>
            <span className="text-[8px] text-center block mt-1 opacity-60">{HAIR_STYLES[appearance.hairStyle]}</span>
          </div>
          {/* Eyes */}
          <div className="flex gap-2 mt-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EYE_COLORS[appearance.eyeColor] }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EYE_COLORS[appearance.eyeColor] }} />
          </div>
          {/* Nose */}
          <span className="text-[8px] mt-0.5">{FACE_OPTIONS.nose[appearance.nose]}</span>
          {/* Mouth */}
          <span className="text-xs">{FACE_OPTIONS.mouth[appearance.mouth]}</span>
        </div>
        {/* Outfit */}
        <div className="w-16 h-8 rounded-b-md mt-0.5"
          style={{ backgroundColor: OUTFIT_COLORS[appearance.outfitColor] }} />
        {/* Class icon */}
        {selectedClass && (
          <div className="absolute -bottom-2 -right-2 text-lg">{classes.find(c => c.id === selectedClass)?.icon}</div>
        )}
      </div>
    </div>
  );

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

          <GamePanelTabs tabs={CREATION_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'class' && (
            <>
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
            </>
          )}

          {activeTab === 'appearance' && (
            <div>
              <Preview />
              <ColorPicker label="Cor da Pele" colors={SKIN_COLORS} selected={appearance.skinColor} onChange={(i) => updateAppearance('skinColor', i)} />
              <OptionPicker label="Estilo do Cabelo" options={HAIR_STYLES} selected={appearance.hairStyle} onChange={(i) => updateAppearance('hairStyle', i)} />
              <ColorPicker label="Cor do Cabelo" colors={HAIR_COLORS} selected={appearance.hairColor} onChange={(i) => updateAppearance('hairColor', i)} />
              <ColorPicker label="Cor dos Olhos" colors={EYE_COLORS} selected={appearance.eyeColor} onChange={(i) => updateAppearance('eyeColor', i)} />
              <OptionPicker label="Boca" options={FACE_OPTIONS.mouth} selected={appearance.mouth} onChange={(i) => updateAppearance('mouth', i)} />
              <OptionPicker label="Nariz" options={FACE_OPTIONS.nose} selected={appearance.nose} onChange={(i) => updateAppearance('nose', i)} />
              <ColorPicker label="Cor da Roupa" colors={OUTFIT_COLORS} selected={appearance.outfitColor} onChange={(i) => updateAppearance('outfitColor', i)} />
            </div>
          )}
        </GamePanel>
      </div>
    </div>
  );
};
