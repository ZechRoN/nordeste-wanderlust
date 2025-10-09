import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Award, Star, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface CharacterTitle {
  id: string;
  title_name: string;
  description: string;
  earned_at: string;
  is_active?: boolean;
}

interface TitlesProps {
  character: any;
  onCharacterUpdate: (character: any) => void;
}

export function Titles({ character, onCharacterUpdate }: TitlesProps) {
  const [titles, setTitles] = useState<CharacterTitle[]>([]);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTitles();
  }, [character.id]);

  const loadTitles = async () => {
    const { data, error } = await supabase
      .from('character_titles')
      .select('*')
      .eq('character_id', character.id)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar títulos:', error);
    } else {
      setTitles(data || []);
      // Encontrar título ativo (se existir lógica para isso)
      const active = (data || []).find(t => (t as any).is_active);
      setActiveTitle(active?.title_name || null);
    }
    setLoading(false);
  };

  const selectTitle = (title: CharacterTitle) => {
    setActiveTitle(title.title_name);
    toast.success(`Título "${title.title_name}" equipado!`);
  };

  const removeTitle = () => {
    if (!activeTitle) return;
    setActiveTitle(null);
    toast.success('Título removido');
  };

  const getTitleIcon = (titleName: string) => {
    if (titleName.includes('Lendário') || titleName.includes('Mestre')) {
      return <Crown className="h-5 w-5 text-yellow-500" />;
    }
    if (titleName.includes('Campeão') || titleName.includes('Vencedor')) {
      return <Award className="h-5 w-5 text-blue-500" />;
    }
    return <Star className="h-5 w-5 text-purple-500" />;
  };

  const getTitleColor = (titleName: string) => {
    if (titleName.includes('Lendário')) return 'text-yellow-500 border-yellow-500';
    if (titleName.includes('Épico')) return 'text-purple-500 border-purple-500';
    if (titleName.includes('Raro')) return 'text-blue-500 border-blue-500';
    if (titleName.includes('Comum')) return 'text-gray-500 border-gray-500';
    return 'text-green-500 border-green-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando títulos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título Ativo */}
      <Card className="border-2 border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Título Equipado
          </CardTitle>
          <CardDescription>
            O título que será exibido junto ao seu nome
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeTitle ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTitleIcon(activeTitle)}
                  <div>
                    <h3 className="text-xl font-bold">{activeTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {titles.find(t => t.title_name === activeTitle)?.description}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={removeTitle}>
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum título equipado</p>
              <p className="text-sm mt-2">Selecione um título abaixo para equipá-lo</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Títulos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Seus Títulos ({titles.length})
          </CardTitle>
          <CardDescription>
            Títulos conquistados através de suas aventuras
          </CardDescription>
        </CardHeader>
        <CardContent>
          {titles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Award className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="font-medium mb-2">Nenhum título conquistado ainda</p>
              <p className="text-sm">
                Complete conquistas, missões épicas e desafios para ganhar títulos prestigiosos!
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {titles.map((title) => {
                  const isActive = title.title_name === activeTitle;
                  
                  return (
                    <Card
                      key={title.id}
                      className={`border-2 transition-all ${
                        isActive
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : getTitleColor(title.title_name)
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getTitleIcon(title.title_name)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg">
                                  {title.title_name}
                                </h4>
                                {isActive && (
                                  <Badge className="bg-primary">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Equipado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {title.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Conquistado em: {new Date(title.earned_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          
                          {!isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectTitle(title)}
                            >
                              Equipar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Informações sobre como ganhar títulos */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Como Ganhar Títulos?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Star className="h-4 w-4 mt-0.5 text-yellow-500" />
              <span>Complete conquistas épicas e desafios especiais</span>
            </li>
            <li className="flex items-start gap-2">
              <Award className="h-4 w-4 mt-0.5 text-blue-500" />
              <span>Vença combates difíceis contra criaturas lendárias</span>
            </li>
            <li className="flex items-start gap-2">
              <Crown className="h-4 w-4 mt-0.5 text-purple-500" />
              <span>Alcance posições altas nos rankings globais</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />
              <span>Complete séries de missões épicas e storylines principais</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
