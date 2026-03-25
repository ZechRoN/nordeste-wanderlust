
-- Trades table for player-to-player trading
CREATE TABLE public.trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  sender_gold integer NOT NULL DEFAULT 0,
  receiver_gold integer NOT NULL DEFAULT 0,
  sender_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  receiver_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  sender_confirmed boolean NOT NULL DEFAULT false,
  receiver_confirmed boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- RLS for trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades" ON public.trades
  FOR SELECT TO authenticated
  USING (
    sender_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create trades" ON public.trades
  FOR INSERT TO authenticated
  WITH CHECK (sender_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own trades" ON public.trades
  FOR UPDATE TO authenticated
  USING (
    sender_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
    OR receiver_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own trades" ON public.trades
  FOR DELETE TO authenticated
  USING (sender_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

-- Enable realtime for trades
ALTER PUBLICATION supabase_realtime ADD TABLE public.trades;

-- Insert test events
INSERT INTO public.events (title, description, boss_name, boss_level, boss_health, boss_max_health, boss_strength, boss_agility, boss_intelligence, boss_vitality, boss_luck, boss_special_ability, reward_experience, reward_gold, biome, event_type, starts_at, ends_at)
VALUES
  ('Fúria do Mandacaru', 'O Mandacaru Ancião despertou na Caatinga e ameaça destruir as vilas próximas!', 'Mandacaru Ancião', 15, 2000, 2000, 35, 20, 25, 40, 15, 'Espinhos Mortais - causa dano em área', 500, 250, 'caatinga', 'boss', now(), now() + interval '48 hours'),
  ('Maré Vermelha', 'Uma criatura ancestral emergiu das profundezas do Litoral!', 'Kraken do Recife', 20, 3500, 3500, 45, 30, 35, 50, 20, 'Tentáculos - ataca 3 vezes por turno', 800, 400, 'litoral', 'boss', now(), now() + interval '72 hours'),
  ('Tempestade no Agreste', 'O Boitatá apareceu no Agreste, incendiando tudo em seu caminho!', 'Boitatá Flamejante', 18, 2800, 2800, 40, 35, 30, 35, 18, 'Chama Eterna - queima por 3 turnos', 650, 350, 'agreste', 'boss', now(), now() + interval '36 hours'),
  ('Sombras de Santa Cruz', 'Uma entidade sombria dominou a região de Santa Cruz!', 'Caipora das Sombras', 25, 5000, 5000, 55, 40, 45, 60, 25, 'Ilusão - chance de esquivar ataques', 1200, 600, 'santa_cruz', 'boss', now(), now() + interval '96 hours');
