-- Criar tabela de quests (missões)
CREATE TABLE IF NOT EXISTS public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  biome biome_type NOT NULL,
  level_required INTEGER DEFAULT 1,
  gold_reward INTEGER DEFAULT 0,
  experience_reward INTEGER DEFAULT 0,
  quest_type TEXT NOT NULL, -- 'main', 'side', 'daily'
  objectives JSONB, -- Array de objetivos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de quests dos personagens
CREATE TABLE IF NOT EXISTS public.character_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'failed'
  progress JSONB, -- Progresso dos objetivos
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(character_id, quest_id)
);

-- Criar tabela de NPCs
CREATE TABLE IF NOT EXISTS public.npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  biome biome_type NOT NULL,
  npc_type TEXT NOT NULL, -- 'merchant', 'quest_giver', 'trainer'
  dialogue TEXT,
  inventory JSONB, -- Para merchants
  services JSONB, -- Serviços oferecidos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de conquistas (achievements)
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  requirement_type TEXT NOT NULL, -- 'level', 'kills', 'quests', 'gold', 'exploration'
  requirement_value INTEGER NOT NULL,
  reward_type TEXT, -- 'title', 'gold', 'item'
  reward_value TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de conquistas dos personagens
CREATE TABLE IF NOT EXISTS public.character_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(character_id, achievement_id)
);

-- Habilitar RLS
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_achievements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para quests (qualquer um pode ver)
CREATE POLICY "Anyone can view quests"
  ON public.quests FOR SELECT
  USING (true);

-- Políticas RLS para character_quests
CREATE POLICY "Users can view their character quests"
  ON public.character_quests FOR SELECT
  USING (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their character quests"
  ON public.character_quests FOR ALL
  USING (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ))
  WITH CHECK (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ));

-- Políticas RLS para NPCs (qualquer um pode ver)
CREATE POLICY "Anyone can view NPCs"
  ON public.npcs FOR SELECT
  USING (true);

-- Políticas RLS para achievements (qualquer um pode ver)
CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

-- Políticas RLS para character_achievements
CREATE POLICY "Users can view their character achievements"
  ON public.character_achievements FOR SELECT
  USING (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their character achievements"
  ON public.character_achievements FOR ALL
  USING (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ))
  WITH CHECK (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ));

-- Inserir dados iniciais de NPCs
INSERT INTO public.npcs (name, description, biome, npc_type, dialogue, services) VALUES
  ('Zé da Bodega', 'Comerciante local que vende itens básicos', 'caatinga', 'merchant', 'Ô, meu rei! Dê uma olhada no que tenho pra vender.', '["buy", "sell"]'),
  ('Dona Maria', 'Curandeira que oferece descanso e cura', 'caatinga', 'trainer', 'Venha descansar um pouco, meu filho.', '["rest", "heal"]'),
  ('Padre João', 'Dá missões relacionadas à comunidade', 'agreste', 'quest_giver', 'Preciso de sua ajuda com algo importante...', '["quests"]'),
  ('Mercador do Porto', 'Vende itens exóticos', 'litoral', 'merchant', 'Mercadorias frescas do mar!', '["buy", "sell"]'),
  ('Capitão Garcia', 'Líder militar em Santa Cruz', 'santa_cruz', 'quest_giver', 'Temos uma situação que requer coragem...', '["quests"]');

-- Inserir dados iniciais de quests
INSERT INTO public.quests (name, description, biome, level_required, gold_reward, experience_reward, quest_type, objectives) VALUES
  ('Caçada no Sertão', 'Elimine 5 criaturas na Caatinga', 'caatinga', 1, 50, 100, 'side', '[{"type": "kill", "target": "any", "count": 5, "current": 0}]'),
  ('Coleta de Recursos', 'Colete 10 materiais na região', 'caatinga', 1, 30, 75, 'daily', '[{"type": "collect", "item": "material", "count": 10, "current": 0}]'),
  ('Exploração do Agreste', 'Explore 3 localizações no Agreste', 'agreste', 5, 100, 200, 'main', '[{"type": "explore", "count": 3, "current": 0}]'),
  ('Defesa da Costa', 'Proteja o litoral de invasores', 'litoral', 10, 200, 400, 'main', '[{"type": "defend", "waves": 3, "current": 0}]'),
  ('Segredos de Santa Cruz', 'Investigue os mistérios antigos', 'santa_cruz', 15, 500, 1000, 'main', '[{"type": "investigate", "locations": 5, "current": 0}]');

-- Inserir dados iniciais de conquistas
INSERT INTO public.achievements (name, description, requirement_type, requirement_value, reward_type, reward_value, icon) VALUES
  ('Primeira Vitória', 'Vença seu primeiro combate', 'kills', 1, 'gold', '50', '🏆'),
  ('Guerreiro Iniciante', 'Alcance o nível 5', 'level', 5, 'title', 'Iniciante', '⭐'),
  ('Caçador Experiente', 'Derrote 50 criaturas', 'kills', 50, 'gold', '500', '⚔️'),
  ('Explorador', 'Visite todos os biomas', 'exploration', 4, 'title', 'Explorador', '🗺️'),
  ('Mestre das Missões', 'Complete 20 missões', 'quests', 20, 'title', 'Mestre das Missões', '📜'),
  ('Rico', 'Acumule 10.000 moedas de ouro', 'gold', 10000, 'title', 'Rico', '💰'),
  ('Lendário', 'Alcance o nível 50', 'level', 50, 'title', 'Lendário', '👑');