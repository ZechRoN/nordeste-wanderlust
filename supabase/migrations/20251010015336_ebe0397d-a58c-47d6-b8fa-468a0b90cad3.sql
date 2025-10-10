-- Inserir dados iniciais para o jogo

-- Montarias por bioma
INSERT INTO public.mounts (name, description, biome, rarity, speed_bonus, stamina_bonus, capture_difficulty, special_ability) VALUES
('Camelo do Sertão', 'Resistente às condições áridas da caatinga', 'caatinga', 'common', 10, 15, 2, 'Resistência ao calor'),
('Ema Veloz', 'Ave rápida que atravessa a caatinga', 'caatinga', 'uncommon', 20, 10, 3, 'Corrida em terreno árido'),
('Jaguatirica Selvagem', 'Felino ágil e feroz', 'caatinga', 'rare', 15, 20, 5, 'Ataque furtivo'),
('Cavalo Crioulo', 'Cavalo resistente do agreste', 'agreste', 'common', 12, 18, 2, 'Marcha suave'),
('Mula Trabalhadora', 'Companheira fiel para longas jornadas', 'agreste', 'common', 8, 25, 1, 'Carga extra'),
('Bode Montês', 'Escalador habilidoso das serras', 'agreste', 'uncommon', 15, 15, 3, 'Escalada'),
('Cavalo Marinho Gigante', 'Criatura mágica das águas', 'litoral', 'epic', 25, 20, 7, 'Respiração aquática'),
('Tartaruga Marinha Ancestral', 'Guardião sábio dos oceanos', 'litoral', 'rare', 10, 30, 5, 'Navegação precisa'),
('Golfinho Prateado', 'Veloz nadador das ondas', 'litoral', 'uncommon', 30, 15, 4, 'Corrida aquática'),
('Dragão de Santa Cruz', 'Lendária criatura do forte', 'santa_cruz', 'legendary', 35, 25, 9, 'Voo e chamas'),
('Cavalo de Guerra', 'Corcel treinado para batalha', 'santa_cruz', 'rare', 18, 22, 5, 'Carga de cavalaria'),
('Lobo Cinzento', 'Predador ágil e inteligente', 'santa_cruz', 'uncommon', 22, 18, 4, 'Faro apurado')
ON CONFLICT DO NOTHING;

-- Conquistas do jogo
INSERT INTO public.achievements (name, description, requirement_type, requirement_value, reward_type, reward_value, icon) VALUES
('Primeira Vitória', 'Vença seu primeiro combate', 'combat_wins', 1, 'gold', '100', '🏆'),
('Veterano', 'Alcance o nível 10', 'level', 10, 'title', 'Veterano', '⭐'),
('Explorador', 'Descubra todos os biomas', 'biomes_discovered', 4, 'title', 'Explorador', '🗺️'),
('Caçador', 'Derrote 50 criaturas', 'combat_wins', 50, 'gold', '500', '🎯'),
('Mestre Craftsman', 'Crie 25 itens', 'items_crafted', 25, 'title', 'Artesão Mestre', '🔨'),
('Rico', 'Acumule 10.000 de ouro', 'gold', 10000, 'title', 'O Rico', '💰'),
('Lendário', 'Alcance o nível 50', 'level', 50, 'title', 'Lendário', '👑'),
('Gladiador', 'Vença 20 duelos na arena', 'arena_wins', 20, 'title', 'Gladiador', '⚔️'),
('Colecionador', 'Capture 5 montarias', 'mounts_captured', 5, 'title', 'Domador', '🐎'),
('Líder', 'Crie uma guilda', 'guilds_created', 1, 'title', 'Líder de Guilda', '🛡️')
ON CONFLICT DO NOTHING;

-- Locais de interesse por bioma
INSERT INTO public.locations (name, description, biome, location_type, position_x, position_y, is_discovered) VALUES
('Acampamento dos Cangaceiros', 'Refúgio de bandoleiros no sertão', 'caatinga', 'settlement', 5, 5, false),
('Oásis Escondido', 'Fonte de água pura no deserto', 'caatinga', 'landmark', 8, 3, false),
('Caverna dos Cristais', 'Gruta luminosa com cristais raros', 'caatinga', 'dungeon', 12, 7, false),
('Feira de Campina', 'Mercado movimentado do agreste', 'agreste', 'settlement', 15, 15, false),
('Serra do Teixeira', 'Montanha majestosa', 'agreste', 'landmark', 18, 12, false),
('Ruínas do Forte Antigo', 'Vestígios de uma fortaleza', 'agreste', 'dungeon', 20, 18, false),
('Porto de Cabedelo', 'Movimentado porto litorâneo', 'litoral', 'settlement', 25, 25, false),
('Ilha dos Náufragos', 'Ilha misteriosa com tesouros', 'litoral', 'landmark', 28, 22, false),
('Gruta Subaquática', 'Caverna sob as ondas', 'litoral', 'dungeon', 30, 28, false),
('Forte de Santa Cruz', 'Fortaleza histórica da cidade', 'santa_cruz', 'settlement', 35, 35, false),
('Torre do Farol', 'Farol que guia os navegantes', 'santa_cruz', 'landmark', 38, 32, false),
('Catacumbas Antigas', 'Túneis sob a fortaleza', 'santa_cruz', 'dungeon', 40, 38, false)
ON CONFLICT DO NOTHING;

-- NPCs por bioma
INSERT INTO public.npcs (name, description, npc_type, biome, dialogue, services, inventory) VALUES
('Lampião', 'Lendário cangaceiro do sertão', 'quest_giver', 'caatinga', 'Ei, cabra! Tá procurando aventura?', '{"quests": true}', '{}'),
('Maria Bonita', 'Guerreira destemida', 'merchant', 'caatinga', 'Tenho bons produtos do sertão.', '{"shop": true}', '{"items": ["Chapéu de Couro", "Facão", "Cantil"]}'),
('Padre Cícero', 'Sábio conselheiro', 'quest_giver', 'agreste', 'A fé move montanhas, meu filho.', '{"quests": true, "healing": true}', '{}'),
('Luiz Gonzaga', 'Músico e comerciante', 'merchant', 'agreste', 'Ô xote bom! Quer comprar algo?', '{"shop": true}', '{"items": ["Sanfona", "Gibão", "Alpercatas"]}'),
('Mestre Pescador', 'Veterano do mar', 'quest_giver', 'litoral', 'O mar tem seus segredos...', '{"quests": true}', '{}'),
('Vendedora de Peixes', 'Comerciante do porto', 'merchant', 'litoral', 'Peixe fresco! Acabou de chegar!', '{"shop": true}', '{"items": ["Rede de Pesca", "Arpão", "Bússola"]}'),
('Capitão da Guarda', 'Comandante do forte', 'quest_giver', 'santa_cruz', 'A ordem deve ser mantida.', '{"quests": true}', '{}'),
('Ferreiro Real', 'Mestre artesão de armas', 'merchant', 'santa_cruz', 'As melhores armas do reino!', '{"shop": true, "crafting": true}', '{"items": ["Espada Longa", "Armadura Completa", "Escudo Real"]}')
ON CONFLICT DO NOTHING;