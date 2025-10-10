-- Criar tabela para partidas de arena
CREATE TABLE IF NOT EXISTS public.arena_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player1_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  winner_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,
  player1_health_remaining INTEGER DEFAULT 0,
  player2_health_remaining INTEGER DEFAULT 0,
  arena_points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  combat_log JSONB DEFAULT '[]'::jsonb
);

-- Adicionar coluna de pontos de arena aos personagens
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS arena_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS arena_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS arena_losses INTEGER DEFAULT 0;

-- Habilitar RLS
ALTER TABLE public.arena_matches ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para arena_matches
CREATE POLICY "Users can view their arena matches"
ON public.arena_matches
FOR SELECT
USING (
  player1_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  OR player2_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create arena matches with their characters"
ON public.arena_matches
FOR INSERT
WITH CHECK (
  player1_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their arena matches"
ON public.arena_matches
FOR UPDATE
USING (
  player1_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  OR player2_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_arena_matches_player1 ON public.arena_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_arena_matches_player2 ON public.arena_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_arena_matches_created_at ON public.arena_matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_characters_arena_points ON public.characters(arena_points DESC);