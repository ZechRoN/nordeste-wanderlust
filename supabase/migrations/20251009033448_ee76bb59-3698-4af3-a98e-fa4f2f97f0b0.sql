-- Create crafting_recipes table
CREATE TABLE public.crafting_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  result_item_id UUID NOT NULL REFERENCES public.items(id),
  result_quantity INTEGER NOT NULL DEFAULT 1,
  required_level INTEGER NOT NULL DEFAULT 1,
  biome biome_type,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recipe_materials table
CREATE TABLE public.recipe_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.crafting_recipes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crafting_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_materials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view crafting recipes"
  ON public.crafting_recipes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view recipe materials"
  ON public.recipe_materials
  FOR SELECT
  USING (true);

-- Insert sample crafting recipes
INSERT INTO public.crafting_recipes (name, description, result_item_id, result_quantity, required_level, biome)
SELECT 
  'Poção de Vida Básica',
  'Uma poção simples que restaura 50 de vida',
  (SELECT id FROM items WHERE name LIKE '%Poção%' OR type = 'consumable' LIMIT 1),
  1,
  1,
  'caatinga'
WHERE EXISTS (SELECT 1 FROM items WHERE type = 'consumable' LIMIT 1);

INSERT INTO public.crafting_recipes (name, description, result_item_id, result_quantity, required_level, biome)
SELECT 
  'Espada de Ferro',
  'Uma espada robusta feita de ferro fundido',
  (SELECT id FROM items WHERE type = 'weapon' AND rarity = 'uncommon' LIMIT 1),
  1,
  5,
  'caatinga'
WHERE EXISTS (SELECT 1 FROM items WHERE type = 'weapon' LIMIT 1);