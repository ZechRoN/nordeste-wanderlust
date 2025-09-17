import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sword, Wand2, Target, Heart, UserX } from 'lucide-react';

interface CharacterCreationProps {
  onCharacterCreated: (character: any) => void;
  onCancel?: () => void;
}

const classes = [
  {
    id: 'warrior',
    name: 'Guerreiro',
    icon: Sword,
    description: 'Especialista em combate corpo a corpo e defesa',
    attributes: { strength: 15, intelligence: 8, agility: 10, vitality: 15, luck: 7 },
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200'
  },
  {
    id: 'mage',
    name: 'Mago',
    icon: Wand2,
    description: 'Mestre das artes mágicas e conhecimento',
    attributes: { strength: 7, intelligence: 18, agility: 8, vitality: 10, luck: 12 },
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'archer',
    name: 'Arqueiro',
    icon: Target,
    description: 'Habilidoso com armas à distância e precisão',
    attributes: { strength: 10, intelligence: 10, agility: 16, vitality: 12, luck: 7 },
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200'
  },
  {
    id: 'healer',
    name: 'Curandeiro',
    icon: Heart,
    description: 'Especialista em cura e magias de suporte',
    attributes: { strength: 8, intelligence: 14, agility: 10, vitality: 16, luck: 7 },
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200'
  },
  {
    id: 'assassin',
    name: 'Assassino',
    icon: UserX,
    description: 'Mestre da furtividade e ataques críticos',
    attributes: { strength: 12, intelligence: 10, agility: 18, vitality: 8, luck: 7 },
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200'
  }
];

export const CharacterCreation = ({ onCharacterCreated, onCancel }: CharacterCreationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [characterName, setCharacterName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass || !characterName.trim()) {
      toast({
        title: 'Erro',
        description: 'Selecione uma classe e digite um nome para o personagem.',
        variant: 'destructive',
      });
      return;
    }

    if (!user) return;

    setLoading(true);

    const selectedClassData = classes.find(c => c.id === selectedClass)!;
    
    const { data, error } = await supabase
      .from('characters')
      .insert({
        user_id: user.id,
        name: characterName.trim(),
        class: selectedClass as any,
        ...selectedClassData.attributes
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast({
        title: 'Erro ao criar personagem',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Personagem criado!',
        description: `${data.name} foi criado com sucesso!`,
      });
      onCharacterCreated(data);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Criar Personagem</h2>
        <p className="text-muted-foreground">
          Escolha sua classe e comece sua jornada pelo Sertão
        </p>
      </div>

      <form onSubmit={handleCreateCharacter} className="space-y-6">
        {/* Character Name */}
        <Card>
          <CardHeader>
            <CardTitle>Nome do Personagem</CardTitle>
            <CardDescription>
              Escolha um nome único para seu personagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="character-name">Nome</Label>
              <Input
                id="character-name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Digite o nome do personagem"
                maxLength={20}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Escolha sua Classe</CardTitle>
            <CardDescription>
              Cada classe tem atributos e habilidades únicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classData) => {
                const Icon = classData.icon;
                const isSelected = selectedClass === classData.id;
                
                return (
                  <Card
                    key={classData.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? `${classData.bgColor} ring-2 ring-primary` 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedClass(classData.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-6 w-6 ${classData.color}`} />
                        <CardTitle className="text-lg">{classData.name}</CardTitle>
                      </div>
                      <CardDescription className="text-sm">
                        {classData.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Atributos Iniciais:</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div className="flex justify-between">
                            <span>Força:</span>
                            <Badge variant="secondary">{classData.attributes.strength}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Inteligência:</span>
                            <Badge variant="secondary">{classData.attributes.intelligence}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Agilidade:</span>
                            <Badge variant="secondary">{classData.attributes.agility}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Vitalidade:</span>
                            <Badge variant="secondary">{classData.attributes.vitality}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Sorte:</span>
                            <Badge variant="secondary">{classData.attributes.luck}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading || !selectedClass || !characterName.trim()}
            className="min-w-[200px]"
          >
            {loading ? 'Criando...' : 'Criar Personagem'}
          </Button>
        </div>
      </form>
    </div>
  );
};