-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.character_class AS ENUM ('warrior', 'mage', 'archer', 'healer', 'assassin');
CREATE TYPE public.biome_type AS ENUM ('caatinga', 'agreste', 'litoral', 'santa_cruz');
CREATE TYPE public.item_type AS ENUM ('weapon', 'armor', 'consumable', 'material', 'mount');
CREATE TYPE public.rarity_type AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');

-- Profiles table (user data)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN DEFAULT FALSE
);

-- Characters table
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT UNIQUE NOT NULL,
  class character_class NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 100,
  current_biome biome_type DEFAULT 'caatinga',
  
  -- Attributes
  strength INTEGER DEFAULT 10,
  intelligence INTEGER DEFAULT 10,
  agility INTEGER DEFAULT 10,
  vitality INTEGER DEFAULT 10,
  luck INTEGER DEFAULT 10,
  
  -- Combat stats
  health INTEGER DEFAULT 100,
  max_health INTEGER DEFAULT 100,
  mana INTEGER DEFAULT 50,
  max_mana INTEGER DEFAULT 50,
  
  -- Location
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type item_type NOT NULL,
  rarity rarity_type DEFAULT 'common',
  value INTEGER DEFAULT 0,
  
  -- Equipment stats (null for non-equipment items)
  strength_bonus INTEGER DEFAULT 0,
  intelligence_bonus INTEGER DEFAULT 0,
  agility_bonus INTEGER DEFAULT 0,
  vitality_bonus INTEGER DEFAULT 0,
  luck_bonus INTEGER DEFAULT 0,
  
  -- Requirements
  required_level INTEGER DEFAULT 1,
  required_class character_class,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Character inventory
CREATE TABLE public.character_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  is_equipped BOOLEAN DEFAULT FALSE,
  obtained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mounts table
CREATE TABLE public.mounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  biome biome_type NOT NULL,
  rarity rarity_type DEFAULT 'common',
  
  -- Mount stats
  speed_bonus INTEGER DEFAULT 0,
  stamina_bonus INTEGER DEFAULT 0,
  special_ability TEXT,
  
  capture_difficulty INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Character mounts (captured mounts)
CREATE TABLE public.character_mounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  mount_id UUID NOT NULL REFERENCES public.mounts(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guilds table
CREATE TABLE public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  leader_id UUID NOT NULL REFERENCES public.characters(id),
  max_members INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guild members
CREATE TABLE public.guild_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(guild_id, character_id)
);

-- Skills/Titles table
CREATE TABLE public.character_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  title_name TEXT NOT NULL,
  description TEXT,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_mounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_titles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for characters
CREATE POLICY "Users can view their own characters" ON public.characters
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create their own characters" ON public.characters
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own characters" ON public.characters
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own characters" ON public.characters
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS Policies for character_items
CREATE POLICY "Users can view their character items" ON public.character_items
  FOR SELECT TO authenticated USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage their character items" ON public.character_items
  FOR ALL TO authenticated USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  ) WITH CHECK (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

-- RLS Policies for character_mounts
CREATE POLICY "Users can view their character mounts" ON public.character_mounts
  FOR SELECT TO authenticated USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage their character mounts" ON public.character_mounts
  FOR ALL TO authenticated USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  ) WITH CHECK (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

-- RLS Policies for guilds (readable by all, manageable by leader)
CREATE POLICY "Anyone can view guilds" ON public.guilds
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Guild leaders can update their guild" ON public.guilds
  FOR UPDATE TO authenticated USING (
    leader_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create guilds" ON public.guilds
  FOR INSERT TO authenticated WITH CHECK (
    leader_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

-- RLS Policies for guild_members
CREATE POLICY "Anyone can view guild members" ON public.guild_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their character's guild membership" ON public.guild_members
  FOR ALL TO authenticated USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  ) WITH CHECK (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

-- RLS Policies for character_titles
CREATE POLICY "Users can view their character titles" ON public.character_titles
  FOR SELECT TO authenticated USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage their character titles" ON public.character_titles
  FOR ALL TO authenticated USING (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  ) WITH CHECK (
    character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

-- Items and mounts are readable by all (game data)
CREATE POLICY "Anyone can view items" ON public.items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view mounts" ON public.mounts
  FOR SELECT TO authenticated USING (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();