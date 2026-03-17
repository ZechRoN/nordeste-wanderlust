
-- Seed creatures
INSERT INTO public.creatures (name, description, biome, level, health, max_health, strength, agility, intelligence, vitality, luck, experience_reward, gold_reward, rarity, special_ability) VALUES
('Calango Flamejante', 'Um lagarto do sertão que cospe brasas', 'caatinga', 1, 30, 30, 6, 8, 3, 4, 2, 15, 5, 'common', 'Cuspe de Brasa'),
('Mandacaru Vivo', 'Cacto animado que ataca com espinhos', 'caatinga', 2, 50, 50, 8, 3, 4, 10, 2, 25, 8, 'common', 'Espinhos'),
('Cangaceiro Fantasma', 'Espírito de um antigo cangaceiro', 'caatinga', 4, 80, 80, 12, 10, 6, 8, 5, 50, 20, 'uncommon', 'Tiro Fantasma'),
('Cobra Grande da Caatinga', 'Serpente gigante do sertão', 'caatinga', 6, 120, 120, 14, 12, 5, 10, 3, 80, 35, 'rare', 'Veneno Sertanejo'),
('Boi Zebu Enfurecido', 'Um touro selvagem do agreste', 'agreste', 2, 60, 60, 10, 5, 2, 12, 2, 20, 10, 'common', 'Investida'),
('Pé-de-Garrafa', 'Criatura folclórica do agreste', 'agreste', 3, 70, 70, 9, 7, 8, 8, 5, 35, 15, 'uncommon', 'Rastro Fantasma'),
('Lobisomem do Agreste', 'Lenda viva das noites de lua cheia', 'agreste', 5, 100, 100, 15, 13, 4, 9, 4, 65, 30, 'rare', 'Uivo Lunar'),
('Mula-sem-Cabeça', 'Criatura flamejante que galopa à noite', 'agreste', 8, 160, 160, 18, 16, 8, 12, 6, 120, 50, 'epic', 'Chamas Infernais'),
('Caranguejo Gigante', 'Crustáceo enorme das praias', 'litoral', 2, 55, 55, 9, 4, 3, 13, 2, 20, 12, 'common', 'Pinça Trituradora'),
('Sereia Traiçoeira', 'Encanta viajantes com seu canto', 'litoral', 4, 75, 75, 6, 8, 14, 7, 8, 55, 25, 'uncommon', 'Canto Hipnótico'),
('Boto Cor-de-Rosa', 'O encantado das águas', 'litoral', 6, 110, 110, 10, 14, 16, 10, 10, 90, 40, 'rare', 'Encantamento'),
('Iara', 'Rainha das águas doces', 'litoral', 9, 180, 180, 14, 12, 20, 14, 8, 150, 70, 'epic', 'Abraço da Morte'),
('Zumbi Colonial', 'Morto-vivo dos tempos coloniais', 'santa_cruz', 3, 65, 65, 10, 4, 2, 14, 1, 30, 15, 'common', 'Mordida Podre'),
('Padre Fantasma', 'Espírito de um padre colonial', 'santa_cruz', 5, 90, 90, 6, 6, 16, 10, 6, 60, 28, 'uncommon', 'Exorcismo Invertido'),
('Capitão-do-Mato', 'Espírito vingativo da era colonial', 'santa_cruz', 7, 140, 140, 16, 14, 10, 12, 5, 100, 45, 'rare', 'Chicote Espectral'),
('Curupira', 'O protetor das matas', 'santa_cruz', 10, 200, 200, 20, 18, 15, 16, 10, 200, 100, 'legendary', 'Confusão de Trilhas');

-- Seed items
INSERT INTO public.items (name, description, type, rarity, value, strength_bonus, agility_bonus, intelligence_bonus, vitality_bonus, luck_bonus, required_level, biome) VALUES
('Facão de Cangaceiro', 'Lâmina afiada do sertão', 'weapon', 'common', 20, 3, 1, 0, 0, 0, 1, 'caatinga'),
('Chapéu de Couro', 'Proteção clássica do nordeste', 'armor', 'common', 15, 0, 1, 0, 2, 0, 1, 'caatinga'),
('Poção de Jurema', 'Bebida mística da caatinga', 'consumable', 'common', 10, 0, 0, 0, 0, 0, 1, 'caatinga'),
('Espinho de Mandacaru', 'Material raro da caatinga', 'material', 'uncommon', 25, 0, 0, 0, 0, 0, 1, 'caatinga'),
('Arco de Baraúna', 'Arco feito de madeira nobre', 'weapon', 'uncommon', 50, 2, 4, 0, 0, 1, 3, 'caatinga'),
('Foice do Agreste', 'Ferramenta de combate rural', 'weapon', 'common', 25, 4, 0, 0, 0, 0, 2, 'agreste'),
('Gibão de Couro', 'Armadura do vaqueiro nordestino', 'armor', 'uncommon', 45, 0, 0, 0, 5, 0, 3, 'agreste'),
('Leite de Jumento', 'Restaura saúde rapidamente', 'consumable', 'common', 8, 0, 0, 0, 0, 0, 1, 'agreste'),
('Pedra do Agreste', 'Mineral mágico da região', 'material', 'rare', 60, 0, 0, 0, 0, 0, 1, 'agreste'),
('Tridente do Pescador', 'Arma do litoral', 'weapon', 'common', 30, 3, 2, 0, 0, 0, 2, 'litoral'),
('Conchas Encantadas', 'Amuleto do mar', 'armor', 'uncommon', 40, 0, 0, 3, 2, 1, 3, 'litoral'),
('Água de Coco Mágica', 'Restaura mana rapidamente', 'consumable', 'common', 12, 0, 0, 0, 0, 0, 1, 'litoral'),
('Pérola Negra', 'Tesouro raro do mar', 'material', 'epic', 150, 0, 0, 0, 0, 0, 1, 'litoral'),
('Espada Colonial', 'Relíquia dos tempos antigos', 'weapon', 'rare', 80, 6, 2, 2, 0, 0, 5, 'santa_cruz'),
('Manto do Padre', 'Vestes sagradas com proteção', 'armor', 'rare', 70, 0, 0, 5, 4, 0, 5, 'santa_cruz'),
('Erva Santa', 'Cura ferimentos graves', 'consumable', 'uncommon', 20, 0, 0, 0, 0, 0, 1, 'santa_cruz'),
('Relíquia Colonial', 'Artefato antigo valioso', 'material', 'legendary', 300, 0, 0, 0, 0, 0, 1, 'santa_cruz');

-- Seed quests
INSERT INTO public.quests (title, description, quest_type, objective_type, objective_target, objective_count, objectives, reward_gold, reward_experience, required_level, biome) VALUES
('Caça aos Calangos', 'Elimine calangos flamejantes que ameaçam a vila', 'main', 'kill', 'Calango Flamejante', 3, '{"type":"kill","target":"Calango Flamejante","count":3}', 30, 50, 1, 'caatinga'),
('Espinhos Valiosos', 'Colete espinhos de mandacaru para o curandeiro', 'side', 'collect', 'Espinho de Mandacaru', 5, '{"type":"collect","target":"Espinho de Mandacaru","count":5}', 40, 40, 1, 'caatinga'),
('O Fantasma do Cangaço', 'Derrote o Cangaceiro Fantasma que assombra a região', 'main', 'kill', 'Cangaceiro Fantasma', 1, '{"type":"kill","target":"Cangaceiro Fantasma","count":1}', 80, 100, 3, 'caatinga'),
('Vaqueiro Valente', 'Derrote bois selvagens do agreste', 'main', 'kill', 'Boi Zebu Enfurecido', 4, '{"type":"kill","target":"Boi Zebu Enfurecido","count":4}', 50, 60, 2, 'agreste'),
('Noite de Lua Cheia', 'Enfrente o Lobisomem do Agreste', 'main', 'kill', 'Lobisomem do Agreste', 1, '{"type":"kill","target":"Lobisomem do Agreste","count":1}', 100, 130, 4, 'agreste'),
('Minerais Mágicos', 'Colete pedras mágicas do agreste', 'side', 'collect', 'Pedra do Agreste', 3, '{"type":"collect","target":"Pedra do Agreste","count":3}', 60, 50, 2, 'agreste'),
('Praga de Caranguejos', 'Limpe a praia dos caranguejos gigantes', 'main', 'kill', 'Caranguejo Gigante', 5, '{"type":"kill","target":"Caranguejo Gigante","count":5}', 45, 55, 2, 'litoral'),
('Canto da Sereia', 'Derrote a sereia que ameaça os pescadores', 'main', 'kill', 'Sereia Traiçoeira', 1, '{"type":"kill","target":"Sereia Traiçoeira","count":1}', 90, 110, 3, 'litoral'),
('Pérolas do Mar', 'Encontre pérolas negras raras', 'side', 'collect', 'Pérola Negra', 2, '{"type":"collect","target":"Pérola Negra","count":2}', 120, 80, 4, 'litoral'),
('Purificação Colonial', 'Elimine zumbis que rondam as ruínas', 'main', 'kill', 'Zumbi Colonial', 6, '{"type":"kill","target":"Zumbi Colonial","count":6}', 55, 70, 3, 'santa_cruz'),
('O Padre Amaldiçoado', 'Liberte o espírito do Padre Fantasma', 'main', 'kill', 'Padre Fantasma', 1, '{"type":"kill","target":"Padre Fantasma","count":1}', 100, 120, 4, 'santa_cruz'),
('Relíquias Perdidas', 'Encontre relíquias coloniais antigas', 'side', 'collect', 'Relíquia Colonial', 1, '{"type":"collect","target":"Relíquia Colonial","count":1}', 200, 150, 5, 'santa_cruz');

-- Seed NPCs
INSERT INTO public.npcs (name, npc_type, biome, dialogue) VALUES
('Zé do Sertão', 'merchant', 'caatinga', 'Ôxe, bem-vindo! Tenho as melhores armas do sertão!'),
('Maria Curandeira', 'healer', 'caatinga', 'Venha cá, menino... deixa eu cuidar dessas feridas.'),
('Mestre Lampião', 'quest_giver', 'caatinga', 'Tô precisando de alguém corajoso. Topa um desafio?'),
('Dona Chica do Agreste', 'merchant', 'agreste', 'Chegue mais! Tenho de tudo um pouco por aqui.'),
('Pai Tomé', 'healer', 'agreste', 'As ervas do agreste curam qualquer mal.'),
('Vaqueiro Zuca', 'quest_giver', 'agreste', 'O gado tá solto e tem bicho bravo por aí!'),
('Pescador Manuel', 'merchant', 'litoral', 'Frutos do mar e armas do litoral, o melhor da costa!'),
('Dona Janaína', 'healer', 'litoral', 'A água do mar cura tudo, confia em mim.'),
('Capitão do Porto', 'quest_giver', 'litoral', 'Temos problemas nas águas... preciso de ajuda!'),
('Padre Cícero', 'merchant', 'santa_cruz', 'Estas relíquias são sagradas, mas podem te proteger.'),
('Irmã Teresa', 'healer', 'santa_cruz', 'A fé cura mais que qualquer remédio, meu filho.'),
('Historiador Silva', 'quest_giver', 'santa_cruz', 'Há segredos escondidos nestas ruínas coloniais...');

-- Seed achievements
INSERT INTO public.achievements (title, description, category, objective_type, objective_count, reward_title) VALUES
('Primeiro Sangue', 'Derrote sua primeira criatura', 'combat', 'kill', 1, 'Iniciante'),
('Caçador do Sertão', 'Derrote 10 criaturas na Caatinga', 'combat', 'kill', 10, 'Caçador'),
('Matador de Lendas', 'Derrote 5 criaturas épicas ou lendárias', 'combat', 'kill_epic', 5, 'Matador de Lendas'),
('Explorador', 'Visite todos os 4 biomas', 'exploration', 'explore', 4, 'Explorador'),
('Colecionador', 'Colete 20 itens diferentes', 'collection', 'collect', 20, 'Colecionador'),
('Mestre Artesão', 'Crie 10 itens no sistema de crafting', 'crafting', 'craft', 10, 'Artesão'),
('Campeão da Arena', 'Vença 10 batalhas na arena', 'pvp', 'arena_win', 10, 'Campeão'),
('Nível 10', 'Alcance o nível 10', 'progression', 'level', 10, 'Veterano');

-- Seed mounts
INSERT INTO public.mounts (name, description, biome, rarity, speed_bonus, stamina_bonus, capture_difficulty, special_ability) VALUES
('Jumento Veloz', 'Mais rápido do que parece', 'caatinga', 'common', 10, 5, 20, 'Coice'),
('Cavalo do Sertão', 'Resistente ao calor intenso', 'caatinga', 'uncommon', 20, 15, 40, 'Galope do Sertão'),
('Boi de Sela', 'Montaria forte e resistente', 'agreste', 'common', 8, 20, 25, 'Investida'),
('Égua Lua', 'Dizem que brilha sob o luar', 'agreste', 'rare', 30, 20, 60, 'Passo Lunar'),
('Golfinho Encantado', 'Montaria aquática mágica', 'litoral', 'rare', 25, 25, 55, 'Salto'),
('Tartaruga Gigante', 'Lenta mas muito resistente', 'litoral', 'uncommon', 5, 40, 35, 'Casca de Ferro'),
('Cavalo Fantasma', 'Montaria espectral veloz', 'santa_cruz', 'epic', 40, 15, 75, 'Corrida Fantasma'),
('Sagui Gigante', 'Montaria ágil das florestas', 'santa_cruz', 'uncommon', 18, 12, 30, 'Escalada');

-- Seed locations
INSERT INTO public.locations (name, description, biome, position_x, position_y, location_type) VALUES
('Vila do Sertão', 'Pequena vila no coração da caatinga', 'caatinga', 15, 15, 'town'),
('Caverna dos Espinhos', 'Caverna cheia de mandacarus vivos', 'caatinga', 25, 10, 'dungeon'),
('Feira do Agreste', 'Centro comercial movimentado', 'agreste', 55, 15, 'town'),
('Fazenda Assombrada', 'Uma fazenda com histórias sombrias', 'agreste', 65, 20, 'dungeon'),
('Porto dos Pescadores', 'Vila de pescadores no litoral', 'litoral', 15, 45, 'town'),
('Gruta da Iara', 'Caverna subaquática misteriosa', 'litoral', 25, 50, 'dungeon'),
('Praça de Santa Cruz', 'Centro histórico colonial', 'santa_cruz', 55, 45, 'town'),
('Ruínas do Convento', 'Ruínas cheias de espíritos', 'santa_cruz', 65, 50, 'dungeon');

-- Seed crafting recipes (using item references)
INSERT INTO public.crafting_recipes (name, description, result_item_id, result_quantity, required_level)
SELECT 'Poção de Jurema Potente', 'Versão melhorada da poção de jurema', id, 2, 3
FROM public.items WHERE name = 'Poção de Jurema' LIMIT 1;
