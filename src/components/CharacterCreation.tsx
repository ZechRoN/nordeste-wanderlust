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

  // Character preview - larger, framed pixel-art style
  const Preview = ({ size = "md" }: { size?: "md" | "lg" }) => {
    const scale = size === "lg" ? 2.2 : 1.4;
    const W = 64 * scale;
    return (
      <div
        className="rpg-item-detail flex items-center justify-center relative overflow-hidden"
        style={{
          minHeight: size === "lg" ? 280 : 180,
          background:
            "radial-gradient(ellipse at 50% 25%, hsl(var(--rpg-gold) / 0.18), transparent 70%), linear-gradient(180deg, hsl(var(--rpg-bg-dark) / 0.6), hsl(var(--rpg-bg) / 0.95))",
          marginBottom: 0,
        }}
      >
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, hsl(var(--rpg-gold) / 0.1) 0 2px, transparent 2px 8px)",
          }}
        />
        <div className="relative flex flex-col items-center gap-2">
          <div className="relative" style={{ imageRendering: "pixelated" as any }}>
            {/* Body/Skin */}
            <div
              className="rounded-md flex flex-col items-center justify-center relative"
              style={{
                width: W,
                height: W * 1.25,
                backgroundColor: SKIN_COLORS[appearance.skinColor],
                boxShadow: "0 4px 20px rgba(0,0,0,0.5), inset 0 -8px 12px rgba(0,0,0,0.25)",
              }}
            >
              {/* Hair */}
              <div
                className="absolute -top-2 left-0 right-0 rounded-t-md"
                style={{
                  height: W * 0.4,
                  backgroundColor: HAIR_COLORS[appearance.hairColor],
                  boxShadow: "inset 0 -4px 6px rgba(0,0,0,0.25)",
                }}
              >
                <span className="text-[9px] text-white/80 text-center block mt-1">{HAIR_STYLES[appearance.hairStyle]}</span>
              </div>
              {/* Eyes */}
              <div className="flex gap-3 mt-6" style={{ marginTop: W * 0.45 }}>
                <div className="rounded-full" style={{ width: W * 0.12, height: W * 0.12, backgroundColor: EYE_COLORS[appearance.eyeColor], boxShadow: "0 0 4px rgba(0,0,0,0.4)" }} />
                <div className="rounded-full" style={{ width: W * 0.12, height: W * 0.12, backgroundColor: EYE_COLORS[appearance.eyeColor], boxShadow: "0 0 4px rgba(0,0,0,0.4)" }} />
              </div>
              {/* Nose */}
              <span style={{ fontSize: W * 0.16, lineHeight: 1, marginTop: 2 }}>{FACE_OPTIONS.nose[appearance.nose]}</span>
              {/* Mouth */}
              <span style={{ fontSize: W * 0.22, lineHeight: 1 }}>{FACE_OPTIONS.mouth[appearance.mouth]}</span>
            </div>
            {/* Outfit */}
            <div
              className="rounded-b-md mt-1"
              style={{
                width: W,
                height: W * 0.55,
                backgroundColor: OUTFIT_COLORS[appearance.outfitColor],
                boxShadow: "inset 0 4px 6px rgba(255,255,255,0.1), inset 0 -4px 6px rgba(0,0,0,0.3)",
              }}
            />
            {/* Class icon */}
            {selectedClass && (
              <div
                className="absolute -bottom-1 -right-2 flex items-center justify-center rounded-full border-2"
                style={{
                  width: W * 0.5,
                  height: W * 0.5,
                  fontSize: W * 0.32,
                  background: "hsl(var(--rpg-bg-dark))",
                  borderColor: "hsl(var(--rpg-gold))",
                  boxShadow: "0 0 8px hsl(var(--rpg-gold) / 0.6)",
                }}
              >
                {classes.find((c) => c.id === selectedClass)?.icon}
              </div>
            )}
          </div>
          {selectedClass && (
            <div className="text-center">
              <div className="text-[12px] font-bold" style={{ fontFamily: "Cinzel, Georgia, serif" }}>
                {characterName.trim() || "Sem nome"}
              </div>
              <div className="text-[10px] opacity-70">{selectedClassData?.name}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-3xl">
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
          <div className="grid gap-3 md:grid-cols-[260px_1fr]">
            {/* Left column: live preview */}
            <div className="space-y-2">
              <Preview size="lg" />
              <div className="rpg-item-detail" style={{ marginBottom: 0 }}>
                <div className="rpg-label" style={{ marginBottom: 4 }}>Nome do Personagem</div>
                <input
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Digite o nome..."
                  maxLength={20}
                  className="rpg-input"
                />
              </div>
              {selectedClassData && (
                <div className="rpg-item-detail" style={{ marginBottom: 0 }}>
                  <div className="text-[11px] font-bold mb-1">Atributos iniciais</div>
                  <div className="flex gap-1 flex-wrap">
                    <span className="rpg-stat-bonus rpg-stat-str text-[10px]">FOR {selectedClassData.attributes.strength}</span>
                    <span className="rpg-stat-bonus rpg-stat-int text-[10px]">INT {selectedClassData.attributes.intelligence}</span>
                    <span className="rpg-stat-bonus rpg-stat-agi text-[10px]">AGI {selectedClassData.attributes.agility}</span>
                    <span className="rpg-stat-bonus rpg-stat-vit text-[10px]">VIT {selectedClassData.attributes.vitality}</span>
                    <span className="rpg-stat-bonus rpg-stat-luk text-[10px]">SOR {selectedClassData.attributes.luck}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right column: tabs */}
            <div>
              <GamePanelTabs tabs={CREATION_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

              {activeTab === 'class' && (
                <>
                  <label className="rpg-label">Escolha sua Classe</label>
                  <div className="grid grid-cols-1 gap-2 max-h-[360px] overflow-y-auto pr-1">
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
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'appearance' && (
                <div className="max-h-[420px] overflow-y-auto pr-1">
                  <ColorPicker label="Cor da Pele" colors={SKIN_COLORS} selected={appearance.skinColor} onChange={(i) => updateAppearance('skinColor', i)} />
                  <OptionPicker label="Estilo do Cabelo" options={HAIR_STYLES} selected={appearance.hairStyle} onChange={(i) => updateAppearance('hairStyle', i)} />
                  <ColorPicker label="Cor do Cabelo" colors={HAIR_COLORS} selected={appearance.hairColor} onChange={(i) => updateAppearance('hairColor', i)} />
                  <ColorPicker label="Cor dos Olhos" colors={EYE_COLORS} selected={appearance.eyeColor} onChange={(i) => updateAppearance('eyeColor', i)} />
                  <OptionPicker label="Boca" options={FACE_OPTIONS.mouth} selected={appearance.mouth} onChange={(i) => updateAppearance('mouth', i)} />
                  <OptionPicker label="Nariz" options={FACE_OPTIONS.nose} selected={appearance.nose} onChange={(i) => updateAppearance('nose', i)} />
                  <ColorPicker label="Cor da Roupa" colors={OUTFIT_COLORS} selected={appearance.outfitColor} onChange={(i) => updateAppearance('outfitColor', i)} />
                </div>
              )}
            </div>
          </div>
        </GamePanel>
      </div>
    </div>
  );
};
