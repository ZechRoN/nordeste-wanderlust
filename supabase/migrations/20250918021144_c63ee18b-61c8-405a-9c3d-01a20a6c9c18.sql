-- Inserir itens base para cada bioma
INSERT INTO public.items (name, description, type, rarity, value, strength_bonus, agility_bonus, intelligence_bonus, vitality_bonus, luck_bonus, required_level, required_class) VALUES
-- Armas Caatinga
('Facão Nordestino', 'Facão tradicional forjado no sertão', 'weapon', 'common', 50, 5, 0, 0, 0, 0, 1, null),
('Espada de Mandacaru', 'Espada feita com espinhos de mandacaru', 'weapon', 'uncommon', 150, 8, 2, 0, 0, 1, 3, null),
('Lâmina do Sol Escaldante', 'Arma lendária forjada no calor do sertão', 'weapon', 'legendary', 500, 15, 0, 0, 3, 2, 8, null),

-- Armaduras Caatinga
('Gibão de Couro', 'Proteção tradicional do vaqueiro', 'armor', 'common', 40, 0, 1, 0, 3, 0, 1, null),
('Armadura de Cascavel', 'Armadura feita com escamas de cascavel', 'armor', 'rare', 200, 1, 3, 0, 5, 1, 5, null),

-- Armas Agreste
('Arco de Pau-Brasil', 'Arco élfico feito da madeira sagrada', 'weapon', 'uncommon', 120, 2, 8, 0, 0, 0, 2, null),
('Cajado da Floresta', 'Cajado imbuído com magia natural', 'weapon', 'rare', 250, 0, 0, 10, 2, 3, 4, null),
('Espada das Folhas', 'Lâmina que corta como folha ao vento', 'weapon', 'epic', 400, 5, 8, 2, 0, 2, 7, null),

-- Armaduras Agreste
('Capa de Folhas', 'Capa que se camufla na floresta', 'armor', 'common', 35, 0, 2, 1, 2, 1, 1, null),
('Armadura de Cipó', 'Proteção flexível feita de cipós', 'armor', 'uncommon', 100, 1, 4, 0, 3, 0, 3, null),

-- Armas Litoral
('Lança de Pescador', 'Lança com ponta afiada para pesca', 'weapon', 'common', 60, 6, 1, 0, 0, 0, 1, null),
('Martelo de Recife', 'Martelo pesado feito de corais', 'weapon', 'uncommon', 180, 10, -2, 0, 2, 0, 4, null),
('Tridente das Marés', 'Tridente que controla as águas', 'weapon', 'rare', 300, 12, 3, 0, 1, 1, 6, null),

-- Armaduras Litoral
('Couro de Peixe-Boi', 'Armadura resistente como couro marinho', 'armor', 'common', 45, 1, 0, 0, 4, 0, 1, null),
('Escudo de Concha', 'Escudo leve das conchas do mar', 'armor', 'rare', 220, 2, -1, 0, 8, 0, 5, null),

-- Armas Santa Cruz
('Arpão de Baleia', 'Arpão forjado para grandes criaturas', 'weapon', 'uncommon', 140, 4, 4, 0, 1, 2, 2, null),
('Machado dos Ventos', 'Machado que corta com força dos ventos', 'weapon', 'epic', 380, 3, 6, 8, 2, 3, 6, null),
('Lâmina Cristalina', 'Espada de cristal translúcido', 'weapon', 'rare', 280, 1, 7, 2, 0, 4, 5, null),

-- Armaduras Santa Cruz
('Armadura de Escamas', 'Proteção flexível escamosa', 'armor', 'uncommon', 90, 2, 1, 0, 4, 1, 2, null),
('Manto dos Cristais', 'Proteção mágica cristalina', 'armor', 'rare', 210, 1, 3, 1, 6, 2, 4, null),

-- Poções e Consumíveis
('Poção de Cura Pequena', 'Restaura 50 pontos de vida', 'consumable', 'common', 25, 0, 0, 0, 0, 0, 1, null),
('Poção de Mana', 'Restaura 30 pontos de mana', 'consumable', 'common', 30, 0, 0, 0, 0, 0, 1, null),
('Elixir de Força', 'Aumenta força temporariamente', 'consumable', 'uncommon', 75, 0, 0, 0, 0, 0, 3, null),
('Poção de Cura Grande', 'Restaura 150 pontos de vida', 'consumable', 'rare', 100, 0, 0, 0, 0, 0, 5, null);

-- Inserir montarias para cada bioma
INSERT INTO public.mounts (name, description, biome, rarity, speed_bonus, stamina_bonus, capture_difficulty, special_ability) VALUES
-- Montarias Caatinga
('Jumento do Sertão', 'Companheiro fiel dos sertanejos', 'caatinga', 'common', 5, 10, 1, 'Resistência ao calor'),
('Cavalo Mangalarga', 'Cavalo elegante adaptado ao clima seco', 'caatinga', 'uncommon', 12, 15, 3, 'Marcha batida suave'),
('Ema Gigante', 'Ave corredora domesticada', 'caatinga', 'rare', 20, 8, 5, 'Corrida em alta velocidade'),
('Bode Montês Alado', 'Criatura lendária do folclore', 'caatinga', 'legendary', 25, 20, 8, 'Voo planado curto'),

-- Montarias Agreste
('Preguiça Gigante', 'Preguiça domesticada de grande porte', 'agreste', 'common', 3, 25, 2, 'Camuflagem na floresta'),
('Onça Pintada', 'Felino poderoso e ágil', 'agreste', 'rare', 18, 12, 6, 'Ataque furtivo'),
('Harpia Real', 'Águia majestosa dos céus', 'agreste', 'epic', 30, 15, 7, 'Voo livre'),
('Curupira Lobo', 'Lobo místico guardião da floresta', 'agreste', 'legendary', 22, 18, 9, 'Regeneração natural'),

-- Montarias Litoral
('Cavalo Marinho Gigante', 'Criatura aquática domesticada', 'litoral', 'common', 8, 20, 2, 'Natação veloz'),
('Tartaruga Gigante', 'Quelônio de grande porte', 'litoral', 'uncommon', 10, 22, 4, 'Defesa aumentada'),
('Golfinho Voador', 'Mamífero aquático com asas', 'litoral', 'rare', 16, 14, 5, 'Natação e voo'),
('Sereia Montaria', 'Criatura mítica aquática', 'litoral', 'epic', 28, 16, 7, 'Respiração aquática'),

-- Montarias Santa Cruz
('Dragão de Cristal', 'Dragão menor cristalizado', 'santa_cruz', 'uncommon', 6, 18, 3, 'Respiração de cristal'),
('Fênix Jovem', 'Ave mítica em crescimento', 'santa_cruz', 'common', 7, 24, 2, 'Regeneração de fogo'),
('Unicórnio Alado', 'Criatura pura com asas', 'santa_cruz', 'rare', 12, 30, 6, 'Cura mágica'),
('Grifo Real', 'Criatura majestosa dos céus', 'santa_cruz', 'legendary', 35, 25, 9, 'Voo imperial');

-- Criar tabela para mobs/criaturas
CREATE TABLE public.creatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    biome biome_type NOT NULL,
    level INTEGER DEFAULT 1,
    health INTEGER DEFAULT 100,
    max_health INTEGER DEFAULT 100,
    strength INTEGER DEFAULT 10,
    agility INTEGER DEFAULT 10,
    intelligence INTEGER DEFAULT 10,
    vitality INTEGER DEFAULT 10,
    luck INTEGER DEFAULT 10,
    experience_reward INTEGER DEFAULT 50,
    gold_reward INTEGER DEFAULT 25,
    rarity rarity_type DEFAULT 'common',
    special_ability TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para creatures
ALTER TABLE public.creatures ENABLE ROW LEVEL SECURITY;

-- Política para visualizar criaturas (todos podem ver)
CREATE POLICY "Anyone can view creatures" 
ON public.creatures 
FOR SELECT 
USING (true);

-- Inserir criaturas por bioma
INSERT INTO public.creatures (name, description, biome, level, health, max_health, strength, agility, intelligence, vitality, luck, experience_reward, gold_reward, rarity, special_ability) VALUES
-- Criaturas Caatinga
('Cobra Cascavel', 'Serpente perigosa do sertão', 'caatinga', 2, 40, 40, 8, 12, 6, 8, 10, 60, 20, 'common', 'Veneno paralisante'),
('Carcará Selvagem', 'Ave de rapina agressiva', 'caatinga', 3, 55, 55, 10, 15, 8, 9, 12, 80, 35, 'common', 'Ataque aéreo'),
('Onça Parda', 'Felino territorial do sertão', 'caatinga', 5, 90, 90, 15, 18, 10, 12, 8, 150, 75, 'uncommon', 'Emboscada'),
('Mandacaru Espinhoso', 'Planta carnívora gigante', 'caatinga', 4, 70, 70, 12, 6, 4, 18, 5, 120, 50, 'uncommon', 'Espinhos venenosos'),
('Mula Sem Cabeça', 'Criatura lendária do folclore', 'caatinga', 8, 150, 150, 20, 12, 15, 16, 20, 300, 150, 'rare', 'Chamas infernais'),

-- Criaturas Agreste
('Macaco Bugio', 'Primata territorial barulhento', 'agreste', 1, 30, 30, 6, 14, 12, 6, 8, 40, 15, 'common', 'Grito ensurdecedor'),
('Jaguatirica', 'Felino ágil da floresta', 'agreste', 3, 50, 50, 12, 20, 8, 8, 15, 90, 40, 'common', 'Agilidade extrema'),
('Preguiça Gigante', 'Criatura lenta mas resistente', 'agreste', 4, 100, 100, 8, 4, 6, 20, 5, 100, 30, 'uncommon', 'Regeneração lenta'),
('Curupira', 'Guardião místico da floresta', 'agreste', 6, 120, 120, 14, 22, 18, 14, 25, 200, 100, 'rare', 'Confusão mágica'),
('Boitatá', 'Serpente de fogo lendária', 'agreste', 9, 200, 200, 18, 16, 22, 18, 30, 400, 200, 'epic', 'Fogo selvagem'),

-- Criaturas Litoral
('Caranguejo Gigante', 'Crustáceo territorial das praias', 'litoral', 2, 45, 45, 6, 8, 4, 16, 6, 50, 25, 'common', 'Garras perfurantes'),
('Tubarão Terrestre', 'Predador adaptado à terra', 'litoral', 4, 65, 65, 14, 16, 12, 10, 12, 110, 55, 'uncommon', 'Mordida selvagem'),
('Golfinho Guerreiro', 'Mamífero aquático combativo', 'litoral', 3, 50, 50, 11, 18, 9, 8, 14, 85, 40, 'common', 'Ataque sonar'),
('Polvo Gigante', 'Cefalópode de grandes tentáculos', 'litoral', 5, 85, 85, 16, 10, 6, 15, 8, 140, 70, 'uncommon', 'Tentáculos constritores'),
('Kraken Jovem', 'Lenda dos mares em crescimento', 'litoral', 7, 140, 140, 12, 20, 25, 16, 35, 280, 140, 'rare', 'Tempestade marinha'),

-- Criaturas Santa Cruz
('Cristal Vivente', 'Mineral consciente e hostil', 'santa_cruz', 1, 25, 25, 8, 16, 4, 4, 6, 35, 10, 'common', 'Reflexo cortante'),
('Dragão de Pedra', 'Pequeno dragão cristalizado', 'santa_cruz', 4, 80, 80, 16, 8, 6, 18, 7, 130, 65, 'uncommon', 'Respiração de cristal'),
('Fênix de Cristal', 'Ave mítica cristalizada', 'santa_cruz', 3, 60, 60, 10, 12, 14, 12, 10, 95, 45, 'common', 'Renascimento cristalino'),
('Golem de Cristal', 'Construto de cristais puros', 'santa_cruz', 6, 110, 110, 18, 14, 8, 16, 12, 180, 90, 'uncommon', 'Resistência cristalina'),
('Unicórnio Sombrio', 'Criatura pura corrompida', 'santa_cruz', 8, 130, 130, 12, 24, 20, 14, 30, 250, 125, 'rare', 'Magia das trevas');

-- Criar tabela para drops de itens por criatura
CREATE TABLE public.creature_drops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creature_id UUID REFERENCES creatures(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    drop_chance DECIMAL(3,2) DEFAULT 0.10,
    quantity_min INTEGER DEFAULT 1,
    quantity_max INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para creature_drops
ALTER TABLE public.creature_drops ENABLE ROW LEVEL SECURITY;

-- Política para visualizar drops (todos podem ver)
CREATE POLICY "Anyone can view creature drops" 
ON public.creature_drops 
FOR SELECT 
USING (true);

-- Inserir alguns drops básicos
INSERT INTO public.creature_drops (creature_id, item_id, drop_chance, quantity_min, quantity_max)
SELECT 
    c.id as creature_id,
    i.id as item_id,
    CASE 
        WHEN i.rarity = 'common' THEN 0.30
        WHEN i.rarity = 'uncommon' THEN 0.15
        WHEN i.rarity = 'rare' THEN 0.05
        WHEN i.rarity = 'epic' THEN 0.02
        WHEN i.rarity = 'legendary' THEN 0.01
        ELSE 0.10
    END as drop_chance,
    1 as quantity_min,
    1 as quantity_max
FROM creatures c
CROSS JOIN items i
WHERE 
    (c.biome = 'caatinga' AND i.name IN ('Facão Nordestino', 'Gibão de Couro', 'Poção de Cura Pequena', 'Poção de Mana'))
    OR
    (c.biome = 'agreste' AND i.name IN ('Arco de Pau-Brasil', 'Capa de Folhas', 'Poção de Cura Pequena', 'Elixir de Força'))
    OR
    (c.biome = 'litoral' AND i.name IN ('Lança de Pescador', 'Couro de Peixe-Boi', 'Poção de Mana', 'Poção de Cura Pequena'))
    OR  
    (c.biome = 'santa_cruz' AND i.name IN ('Arpão de Baleia', 'Armadura de Escamas', 'Poção de Cura Grande', 'Poção de Mana'));

-- Criar tabela para locais/pontos de interesse
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    biome biome_type NOT NULL,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    location_type TEXT NOT NULL,
    is_discovered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Política para visualizar locais (todos podem ver)
CREATE POLICY "Anyone can view locations" 
ON public.locations 
FOR SELECT 
USING (true);

-- Inserir locais por bioma
INSERT INTO public.locations (name, description, biome, position_x, position_y, location_type) VALUES
-- Locais Caatinga
('Vila do Mandacaru', 'Pequena vila de sertanejos resistentes', 'caatinga', 10, 15, 'city'),
('Caverna dos Cristais', 'Caverna misteriosa cheia de cristais', 'caatinga', 25, 8, 'dungeon'),
('Oásis Escondido', 'Fonte de água pura no deserto', 'caatinga', 18, 22, 'resource'),
('Pedra do Cruzeiro', 'Marco histórico dos antigos', 'caatinga', 30, 12, 'landmark'),

-- Locais Agreste
('Aldeia Verdejante', 'Comunidade em harmonia com a natureza', 'agreste', 45, 35, 'city'),
('Templo das Árvores', 'Ruínas antigas cobertas pela floresta', 'agreste', 52, 28, 'dungeon'),
('Cachoeira Sagrada', 'Quedas d água com propriedades curativas', 'agreste', 38, 42, 'resource'),
('Árvore Milenar', 'Gigantesca árvore guardiã da floresta', 'agreste', 48, 18, 'landmark'),

-- Locais Litoral  
('Porto das Águas', 'Vila de pescadores nas margens', 'litoral', 70, 55, 'city'),
('Cavernas Submersas', 'Labirinto aquático perigoso', 'litoral', 85, 48, 'dungeon'),
('Lagoa dos Corais', 'Lagoa com recifes coloridos', 'litoral', 78, 62, 'resource'),
('Farol dos Navegantes', 'Torre antiga que guia os perdidos', 'litoral', 65, 40, 'landmark'),

-- Locais Santa Cruz
('Cidade de Cristal', 'Metrópole feita de cristal puro', 'santa_cruz', 25, 85, 'city'),
('Minas de Cristal', 'Complexo de túneis cristalizados', 'santa_cruz', 15, 78, 'dungeon'),
('Vale dos Espelhos', 'Vale com propriedades refletivas', 'santa_cruz', 32, 92, 'resource'),
('Torre de Luz', 'Construção que emite luz própria', 'santa_cruz', 8, 88, 'landmark');