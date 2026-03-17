
-- Fix permissive RLS policies
DROP POLICY "Authenticated can create guilds" ON public.guilds;
CREATE POLICY "Authenticated can create guilds" ON public.guilds FOR INSERT TO authenticated 
  WITH CHECK (leader_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));

DROP POLICY "Authenticated can create matches" ON public.arena_matches;
CREATE POLICY "Authenticated can create matches" ON public.arena_matches FOR INSERT TO authenticated 
  WITH CHECK (player1_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid()));
