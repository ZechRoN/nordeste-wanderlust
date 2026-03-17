
-- Characters table
CREATE TABLE public.characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  class text NOT NULL DEFAULT 'warrior',
  level integer NOT NULL DEFAULT 1,
  experience integer NOT NULL DEFAULT 0,
  health integer NOT NULL DEFAULT 100,
  max_health integer NOT NULL DEFAULT 100,
  mana integer NOT NULL DEFAULT 50,
  max_mana integer NOT NULL DEFAULT 50,
  strength integer NOT NULL DEFAULT 10,
  agility integer NOT NULL DEFAULT 10,
  intelligence integer NOT NULL DEFAULT 10,
  vitality integer NOT NULL DEFAULT 10,
  luck integer NOT NULL DEFAULT 5,
  gold integer NOT NULL DEFAULT 50,
  position_x integer NOT NULL DEFAULT 0,
  position_y integer NOT NULL DEFAULT 0,
  current_biome text NOT NULL DEFAULT 'caatinga',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Items table
CREATE TABLE public.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  type text NOT NULL DEFAULT 'consumable',
  rarity text NOT NULL DEFAULT 'common',
  value integer NOT NULL DEFAULT 0,
  strength_bonus integer NOT NULL DEFAULT 0,
  agility_bonus integer NOT NULL DEFAULT 0,
  intelligence_bonus integer NOT NULL DEFAULT 0,
  vitality_bonus integer NOT NULL DEFAULT 0,
  luck_bonus integer NOT NULL DEFAULT 0,
  required_level integer NOT NULL DEFAULT 1,
  biome text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Character Items (inventory)
CREATE TABLE public.character_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  is_equipped boolean NOT NULL DEFAULT false,
  acquired_at timestamptz NOT NULL DEFAULT now()
);

-- Creatures table
CREATE TABLE public.creatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  biome text NOT NULL DEFAULT 'caatinga',
  level integer NOT NULL DEFAULT 1,
  health integer NOT NULL DEFAULT 50,
  max_health integer NOT NULL DEFAULT 50,
  strength integer NOT NULL DEFAULT 5,
  agility integer NOT NULL DEFAULT 5,
  intelligence integer NOT NULL DEFAULT 5,
  vitality integer NOT NULL DEFAULT 5,
  luck integer NOT NULL DEFAULT 3,
  experience_reward integer NOT NULL DEFAULT 10,
  gold_reward integer NOT NULL DEFAULT 5,
  rarity text NOT NULL DEFAULT 'common',
  special_ability text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Creature Drops
CREATE TABLE public.creature_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creature_id uuid REFERENCES public.creatures(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  drop_chance numeric NOT NULL DEFAULT 0.1,
  quantity_min integer NOT NULL DEFAULT 1,
  quantity_max integer NOT NULL DEFAULT 1
);

-- Quests table
CREATE TABLE public.quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  quest_type text NOT NULL DEFAULT 'main',
  objective_type text NOT NULL DEFAULT 'kill',
  objective_target text NOT NULL DEFAULT '',
  objective_count integer NOT NULL DEFAULT 1,
  objectives jsonb DEFAULT '{}',
  reward_gold integer NOT NULL DEFAULT 10,
  reward_experience integer NOT NULL DEFAULT 20,
  required_level integer NOT NULL DEFAULT 1,
  biome text NOT NULL DEFAULT 'caatinga',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Character Quests
CREATE TABLE public.character_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  quest_id uuid REFERENCES public.quests(id) ON DELETE CASCADE NOT NULL,
  progress jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  completed boolean NOT NULL DEFAULT false,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Guilds
CREATE TABLE public.guilds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text DEFAULT '',
  leader_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  max_members integer NOT NULL DEFAULT 20,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Guild Members
CREATE TABLE public.guild_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id uuid REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(guild_id, character_id)
);

-- Arena Matches
CREATE TABLE public.arena_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  player2_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  winner_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  player1_health_remaining integer DEFAULT 0,
  player2_health_remaining integer DEFAULT 0,
  arena_points_awarded integer DEFAULT 0,
  combat_log text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Achievements
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  objective_type text NOT NULL DEFAULT 'kill',
  objective_count integer NOT NULL DEFAULT 1,
  reward_title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Character Achievements
CREATE TABLE public.character_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE(character_id, achievement_id)
);

-- Mounts
CREATE TABLE public.mounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  biome text NOT NULL DEFAULT 'caatinga',
  rarity text NOT NULL DEFAULT 'common',
  speed_bonus integer NOT NULL DEFAULT 5,
  stamina_bonus integer NOT NULL DEFAULT 5,
  capture_difficulty integer NOT NULL DEFAULT 50,
  special_ability text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Character Mounts
CREATE TABLE public.character_mounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  mount_id uuid REFERENCES public.mounts(id) ON DELETE CASCADE NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  captured_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(character_id, mount_id)
);

-- Character Titles
CREATE TABLE public.character_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  title_name text NOT NULL,
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  earned_at timestamptz NOT NULL DEFAULT now()
);

-- NPCs
CREATE TABLE public.npcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  npc_type text NOT NULL DEFAULT 'merchant',
  biome text NOT NULL DEFAULT 'caatinga',
  dialogue text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Crafting Recipes
CREATE TABLE public.crafting_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  result_item_id uuid REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  result_quantity integer NOT NULL DEFAULT 1,
  required_level integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recipe Materials
CREATE TABLE public.recipe_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES public.crafting_recipes(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1
);

-- RLS Policies

-- Characters: users can CRUD their own
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all characters" ON public.characters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own characters" ON public.characters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own characters" ON public.characters FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own characters" ON public.characters FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Items: readable by all authenticated
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items are readable" ON public.items FOR SELECT TO authenticated USING (true);

-- Character Items: own data only
ALTER TABLE public.character_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own items" ON public.character_items FOR SELECT TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own items" ON public.character_items FOR INSERT TO authenticated 
  WITH CHECK (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own items" ON public.character_items FOR UPDATE TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own items" ON public.character_items FOR DELETE TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- Creatures: readable by all
ALTER TABLE public.creatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creatures are readable" ON public.creatures FOR SELECT TO authenticated USING (true);

-- Creature Drops: readable by all
ALTER TABLE public.creature_drops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drops are readable" ON public.creature_drops FOR SELECT TO authenticated USING (true);

-- Quests: readable by all
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quests are readable" ON public.quests FOR SELECT TO authenticated USING (true);

-- Character Quests: own data
ALTER TABLE public.character_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own quests" ON public.character_quests FOR SELECT TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own quests" ON public.character_quests FOR INSERT TO authenticated 
  WITH CHECK (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own quests" ON public.character_quests FOR UPDATE TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- Guilds: readable by all, insertable by authenticated
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guilds are readable" ON public.guilds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create guilds" ON public.guilds FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Leaders can update guilds" ON public.guilds FOR UPDATE TO authenticated 
  USING (leader_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Leaders can delete guilds" ON public.guilds FOR DELETE TO authenticated 
  USING (leader_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- Guild Members
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guild members are readable" ON public.guild_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can join guilds" ON public.guild_members FOR INSERT TO authenticated 
  WITH CHECK (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can leave guilds" ON public.guild_members FOR DELETE TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- Arena Matches
ALTER TABLE public.arena_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Arena matches are readable" ON public.arena_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create matches" ON public.arena_matches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Players can update own matches" ON public.arena_matches FOR UPDATE TO authenticated 
  USING (player1_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- Achievements: readable
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are readable" ON public.achievements FOR SELECT TO authenticated USING (true);

-- Character Achievements
ALTER TABLE public.character_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON public.character_achievements FOR SELECT TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own achievements" ON public.character_achievements FOR INSERT TO authenticated 
  WITH CHECK (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own achievements" ON public.character_achievements FOR UPDATE TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- Mounts: readable
ALTER TABLE public.mounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mounts are readable" ON public.mounts FOR SELECT TO authenticated USING (true);

-- Character Mounts
ALTER TABLE public.character_mounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own mounts" ON public.character_mounts FOR SELECT TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own mounts" ON public.character_mounts FOR INSERT TO authenticated 
  WITH CHECK (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own mounts" ON public.character_mounts FOR UPDATE TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- Character Titles
ALTER TABLE public.character_titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own titles" ON public.character_titles FOR SELECT TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own titles" ON public.character_titles FOR INSERT TO authenticated 
  WITH CHECK (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own titles" ON public.character_titles FOR UPDATE TO authenticated 
  USING (character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

-- NPCs: readable
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "NPCs are readable" ON public.npcs FOR SELECT TO authenticated USING (true);

-- Crafting Recipes: readable
ALTER TABLE public.crafting_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipes are readable" ON public.crafting_recipes FOR SELECT TO authenticated USING (true);

-- Recipe Materials: readable
ALTER TABLE public.recipe_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materials are readable" ON public.recipe_materials FOR SELECT TO authenticated USING (true);
