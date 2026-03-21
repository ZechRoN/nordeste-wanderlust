
-- Events system
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  event_type text NOT NULL DEFAULT 'boss',
  biome text NOT NULL DEFAULT 'caatinga',
  boss_name text NOT NULL DEFAULT '',
  boss_level integer NOT NULL DEFAULT 10,
  boss_health integer NOT NULL DEFAULT 500,
  boss_max_health integer NOT NULL DEFAULT 500,
  boss_strength integer NOT NULL DEFAULT 20,
  boss_agility integer NOT NULL DEFAULT 15,
  boss_intelligence integer NOT NULL DEFAULT 15,
  boss_vitality integer NOT NULL DEFAULT 20,
  boss_luck integer NOT NULL DEFAULT 10,
  boss_special_ability text DEFAULT '',
  reward_experience integer NOT NULL DEFAULT 100,
  reward_gold integer NOT NULL DEFAULT 50,
  reward_item_id uuid REFERENCES public.items(id),
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are readable" ON public.events FOR SELECT TO authenticated USING (true);

-- Event participation tracking
CREATE TABLE public.event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  damage_dealt integer NOT NULL DEFAULT 0,
  reward_claimed boolean NOT NULL DEFAULT false,
  participated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, character_id)
);

ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view event participation" ON public.event_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can participate in events" ON public.event_participants FOR INSERT TO authenticated WITH CHECK (
  character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own participation" ON public.event_participants FOR UPDATE TO authenticated USING (
  character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);

-- Global chat
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  character_name text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat messages are readable" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (
  character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
