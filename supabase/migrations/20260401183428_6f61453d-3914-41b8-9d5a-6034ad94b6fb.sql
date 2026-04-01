
-- Pets/Familiars table
CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  biome text NOT NULL DEFAULT 'caatinga',
  rarity text NOT NULL DEFAULT 'common',
  strength_bonus integer NOT NULL DEFAULT 0,
  agility_bonus integer NOT NULL DEFAULT 0,
  intelligence_bonus integer NOT NULL DEFAULT 0,
  vitality_bonus integer NOT NULL DEFAULT 0,
  luck_bonus integer NOT NULL DEFAULT 0,
  special_passive text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.character_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT false,
  nickname text DEFAULT '',
  level integer NOT NULL DEFAULT 1,
  experience integer NOT NULL DEFAULT 0,
  tamed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(character_id, pet_id)
);

-- Item enchantments table
CREATE TABLE public.item_enchantments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_item_id uuid NOT NULL REFERENCES public.character_items(id) ON DELETE CASCADE,
  enchantment_level integer NOT NULL DEFAULT 0,
  bonus_strength integer NOT NULL DEFAULT 0,
  bonus_agility integer NOT NULL DEFAULT 0,
  bonus_intelligence integer NOT NULL DEFAULT 0,
  bonus_vitality integer NOT NULL DEFAULT 0,
  bonus_luck integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(character_item_id)
);

-- RLS for pets
CREATE POLICY "Pets are readable" ON public.pets FOR SELECT TO authenticated USING (true);

-- RLS for character_pets
CREATE POLICY "Users can view own pets" ON public.character_pets FOR SELECT TO authenticated
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own pets" ON public.character_pets FOR INSERT TO authenticated
  WITH CHECK (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own pets" ON public.character_pets FOR UPDATE TO authenticated
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own pets" ON public.character_pets FOR DELETE TO authenticated
  USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- RLS for item_enchantments
CREATE POLICY "Users can view own enchantments" ON public.item_enchantments FOR SELECT TO authenticated
  USING (character_item_id IN (SELECT id FROM character_items WHERE character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())));
CREATE POLICY "Users can insert own enchantments" ON public.item_enchantments FOR INSERT TO authenticated
  WITH CHECK (character_item_id IN (SELECT id FROM character_items WHERE character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())));
CREATE POLICY "Users can update own enchantments" ON public.item_enchantments FOR UPDATE TO authenticated
  USING (character_item_id IN (SELECT id FROM character_items WHERE character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())));

-- Insert sample pets
INSERT INTO public.pets (name, description, biome, rarity, strength_bonus, agility_bonus, intelligence_bonus, vitality_bonus, luck_bonus, special_passive) VALUES
('Calango Veloz', 'Um calango rápido do sertão', 'caatinga', 'common', 0, 3, 0, 1, 1, 'Velocidade +5%'),
('Preá Guerreiro', 'Um preá corajoso da caatinga', 'caatinga', 'common', 2, 1, 0, 2, 0, 'Defesa +3%'),
('Sagui Esperto', 'Um pequeno sagui muito inteligente', 'agreste', 'uncommon', 0, 2, 4, 0, 1, 'XP +5%'),
('Tatu-Bola', 'Um tatu-bola resistente', 'caatinga', 'uncommon', 1, 0, 0, 5, 1, 'Defesa +8%'),
('Arara Azul', 'Uma rara arara azul do litoral', 'litoral', 'rare', 0, 3, 5, 0, 3, 'Mana +10%'),
('Jaguatirica', 'Uma jaguatirica ágil e mortal', 'agreste', 'rare', 4, 4, 0, 2, 2, 'Crítico +5%'),
('Boto Cor-de-Rosa', 'O mítico boto encantado', 'litoral', 'epic', 2, 2, 6, 3, 4, 'Regeneração +15%'),
('Onça Pintada Filhote', 'Um filhote de onça pintada', 'santa_cruz', 'epic', 6, 3, 2, 4, 3, 'Força +10%');
