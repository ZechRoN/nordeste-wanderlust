
-- Add equipment_slot to items table for slot-based equipment
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS equipment_slot text DEFAULT NULL;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS class_restriction text DEFAULT NULL;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS subtype text DEFAULT NULL;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS durability integer DEFAULT 100;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS max_durability integer DEFAULT 100;

-- Insert class-specific weapons
-- Warrior weapons (swords)
INSERT INTO public.items (name, description, type, equipment_slot, class_restriction, subtype, rarity, value, strength_bonus, agility_bonus, intelligence_bonus, vitality_bonus, luck_bonus, required_level, biome, durability, max_durability)
VALUES
('Espada Curta', 'Uma espada simples de uma mão', 'weapon', 'main_hand', 'warrior', 'espada_uma_mao', 'common', 50, 5, 0, 0, 0, 0, 1, 'caatinga', 100, 100),
('Espada Longa', 'Uma espada de duas mãos poderosa', 'weapon', 'main_hand', 'warrior', 'espada_longa', 'uncommon', 150, 12, 0, 0, 2, 0, 5, 'caatinga', 120, 120),
('Espada Bastarda', 'Lâmina versátil de guerra', 'weapon', 'main_hand', 'warrior', 'espada_bastarda', 'rare', 400, 20, 3, 0, 5, 0, 10, 'agreste', 150, 150),
('Claymore Abissal', 'Espada lendária forjada em fogo negro', 'weapon', 'main_hand', 'warrior', 'espada_duas_maos', 'legendary', 2000, 45, 5, 0, 10, 5, 25, 'litoral', 200, 200),

-- Mage weapons (staffs)
('Cajado Simples', 'Cajado básico de madeira', 'weapon', 'main_hand', 'mage', 'cajado_simples', 'common', 45, 0, 0, 5, 0, 0, 1, 'caatinga', 80, 80),
('Cajado Elemental', 'Canaliza o poder dos elementos', 'weapon', 'main_hand', 'mage', 'cajado_elemental', 'uncommon', 160, 0, 0, 14, 2, 0, 5, 'litoral', 100, 100),
('Cajado Arcano', 'Pulsa com energia arcana pura', 'weapon', 'main_hand', 'mage', 'cajado_arcano', 'rare', 420, 0, 0, 22, 3, 2, 10, 'agreste', 120, 120),
('Bastão do Vórtice', 'Cajado lendário que controla o espaço-tempo', 'weapon', 'main_hand', 'mage', 'cajado_arcano', 'legendary', 2200, 0, 5, 50, 8, 8, 25, 'santa_cruz', 200, 200),

-- Archer weapons (bows)
('Arco Curto', 'Arco leve e rápido', 'weapon', 'main_hand', 'archer', 'arco_curto', 'common', 40, 2, 5, 0, 0, 0, 1, 'caatinga', 90, 90),
('Arco Longo', 'Arco de longo alcance', 'weapon', 'main_hand', 'archer', 'arco_longo', 'uncommon', 140, 4, 12, 0, 0, 2, 5, 'agreste', 110, 110),
('Arco Composto', 'Arco complexo de alta precisão', 'weapon', 'main_hand', 'archer', 'arco_composto', 'rare', 380, 6, 20, 0, 2, 5, 10, 'litoral', 140, 140),
('Arco Estelar', 'Arco lendário das estrelas', 'weapon', 'main_hand', 'archer', 'arco_composto', 'legendary', 1900, 10, 48, 5, 5, 10, 25, 'santa_cruz', 200, 200),

-- Healer weapons (books)
('Grimório Sagrado', 'Livro de orações curativas', 'weapon', 'main_hand', 'healer', 'grimorio_sagrado', 'common', 55, 0, 0, 4, 3, 0, 1, 'caatinga', 70, 70),
('Tomo da Luz', 'Tomo brilhante de cura divina', 'weapon', 'main_hand', 'healer', 'tomo_da_luz', 'uncommon', 170, 0, 0, 10, 8, 0, 5, 'litoral', 90, 90),
('Códex Divino', 'Escrituras sagradas de poder imenso', 'weapon', 'main_hand', 'healer', 'codex_divino', 'rare', 450, 0, 0, 18, 15, 3, 10, 'agreste', 120, 120),
('Bíblia Celestial', 'Livro lendário dos céus', 'weapon', 'main_hand', 'healer', 'codex_divino', 'legendary', 2500, 5, 0, 40, 30, 8, 25, 'santa_cruz', 200, 200),

-- Assassin weapons (daggers)
('Adaga Dupla', 'Par de adagas rápidas', 'weapon', 'main_hand', 'assassin', 'adaga_dupla', 'common', 42, 3, 4, 0, 0, 1, 1, 'caatinga', 85, 85),
('Adaga Venenosa', 'Adaga untada com veneno mortal', 'weapon', 'main_hand', 'assassin', 'adaga_venenosa', 'uncommon', 155, 6, 10, 0, 0, 4, 5, 'agreste', 100, 100),
('Katar', 'Lâmina perfurante letal', 'weapon', 'main_hand', 'assassin', 'katar', 'rare', 390, 15, 18, 0, 0, 8, 10, 'litoral', 130, 130),
('Fang das Sombras', 'Adaga lendária invisível', 'weapon', 'main_hand', 'assassin', 'katar', 'legendary', 2100, 30, 40, 5, 0, 15, 25, 'santa_cruz', 200, 200),

-- Off-hand items (universal)
('Escudo de Madeira', 'Escudo básico de madeira', 'armor', 'off_hand', NULL, 'escudo_madeira', 'common', 30, 0, 0, 0, 5, 0, 1, NULL, 100, 100),
('Escudo de Aço', 'Escudo resistente de aço', 'armor', 'off_hand', NULL, 'escudo_aco', 'uncommon', 120, 0, 0, 0, 12, 0, 5, NULL, 150, 150),
('Escudo Mágico', 'Escudo imbuído com magia protetora', 'armor', 'off_hand', NULL, 'escudo_magico', 'rare', 350, 0, 0, 5, 20, 3, 10, NULL, 180, 180),
('Runa de Fogo', 'Runa elemental de fogo', 'armor', 'off_hand', NULL, 'runa', 'uncommon', 100, 3, 0, 8, 0, 0, 5, NULL, 60, 60),
('Runa Arcana', 'Runa de poder arcano concentrado', 'armor', 'off_hand', NULL, 'runa', 'rare', 300, 0, 0, 15, 0, 5, 10, NULL, 80, 80),
('Orbe Elemental', 'Orbe que canaliza energia elemental', 'armor', 'off_hand', NULL, 'orbe', 'rare', 280, 0, 0, 18, 2, 2, 8, NULL, 70, 70),
('Bolsa de Flechas', 'Aljava com flechas afiadas', 'armor', 'off_hand', 'archer', 'bolsa_flechas', 'common', 25, 2, 3, 0, 0, 0, 1, NULL, 50, 50),

-- Helmets
('Elmo de Couro', 'Elmo simples de couro', 'armor', 'helmet', NULL, 'elmo', 'common', 25, 0, 0, 0, 3, 0, 1, NULL, 80, 80),
('Elmo de Ferro', 'Elmo resistente de ferro', 'armor', 'helmet', NULL, 'elmo', 'uncommon', 90, 0, 0, 0, 8, 0, 5, NULL, 120, 120),
('Elmo do Dragão', 'Elmo forjado com escamas de dragão', 'armor', 'helmet', NULL, 'elmo', 'epic', 600, 5, 0, 5, 15, 3, 15, NULL, 180, 180),

-- Chest armor
('Armadura de Couro', 'Peitoral leve de couro', 'armor', 'chest', NULL, 'armadura_peito', 'common', 40, 0, 0, 0, 5, 0, 1, NULL, 100, 100),
('Cota de Malha', 'Peitoral de elos de metal', 'armor', 'chest', NULL, 'armadura_peito', 'uncommon', 130, 0, 0, 0, 12, 0, 5, NULL, 140, 140),
('Armadura de Placas', 'Peitoral pesado de placas de aço', 'armor', 'chest', NULL, 'armadura_peito', 'rare', 400, 3, 0, 0, 22, 0, 10, NULL, 180, 180),
('Peitoral do Titã', 'Armadura lendária de um titã caído', 'armor', 'chest', NULL, 'armadura_peito', 'legendary', 2800, 10, 0, 5, 40, 5, 25, NULL, 250, 250),

-- Leggings
('Calças de Couro', 'Calças simples de couro', 'armor', 'legs', NULL, 'calcas', 'common', 30, 0, 2, 0, 3, 0, 1, NULL, 80, 80),
('Calças de Malha', 'Calças reforçadas com elos', 'armor', 'legs', NULL, 'calcas', 'uncommon', 100, 0, 3, 0, 8, 0, 5, NULL, 120, 120),
('Grevas de Aço', 'Proteção pesada para as pernas', 'armor', 'legs', NULL, 'calcas', 'rare', 320, 2, 5, 0, 16, 0, 10, NULL, 160, 160),

-- Gloves
('Luvas de Couro', 'Luvas leves de couro', 'armor', 'gloves', NULL, 'luvas', 'common', 20, 1, 2, 0, 1, 0, 1, NULL, 60, 60),
('Luvas de Ferro', 'Luvas reforçadas com ferro', 'armor', 'gloves', NULL, 'luvas', 'uncommon', 75, 3, 3, 0, 4, 0, 5, NULL, 100, 100),
('Manoplas Rúnicas', 'Luvas gravadas com runas de poder', 'armor', 'gloves', NULL, 'luvas', 'epic', 500, 5, 5, 5, 8, 3, 15, NULL, 150, 150),

-- Boots
('Botas de Couro', 'Botas leves e confortáveis', 'armor', 'boots', NULL, 'botas', 'common', 20, 0, 3, 0, 1, 0, 1, NULL, 70, 70),
('Botas de Ferro', 'Botas resistentes de ferro', 'armor', 'boots', NULL, 'botas', 'uncommon', 80, 0, 5, 0, 5, 0, 5, NULL, 110, 110),
('Botas do Vento', 'Botas que concedem velocidade sobre-humana', 'armor', 'boots', NULL, 'botas', 'epic', 550, 0, 15, 0, 3, 5, 15, NULL, 140, 140);
