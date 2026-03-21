
-- Notifications system
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  related_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (
  character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (
  character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Party system
CREATE TABLE public.parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  leader_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  max_members integer NOT NULL DEFAULT 4,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties are readable" ON public.parties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create parties" ON public.parties FOR INSERT TO authenticated WITH CHECK (
  leader_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);
CREATE POLICY "Leaders can update parties" ON public.parties FOR UPDATE TO authenticated USING (
  leader_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);
CREATE POLICY "Leaders can delete parties" ON public.parties FOR DELETE TO authenticated USING (
  leader_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);

CREATE TABLE public.party_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid REFERENCES public.parties(id) ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(party_id, character_id)
);

ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Party members are readable" ON public.party_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join parties" ON public.party_members FOR INSERT TO authenticated WITH CHECK (
  character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);
CREATE POLICY "Users can leave parties" ON public.party_members FOR DELETE TO authenticated USING (
  character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
);
