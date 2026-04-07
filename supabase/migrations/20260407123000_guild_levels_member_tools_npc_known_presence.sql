-- Guild levels, member tools, NPC known registry, presence heartbeat

-- ===== Guild progression data =====
ALTER TABLE public.guilds
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS gold_bank bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS announcement text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.guild_members
  ADD COLUMN IF NOT EXISTS donated_gold bigint NOT NULL DEFAULT 0;

-- ===== Presence =====
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

-- ===== Known NPCs per character (also stores last interaction for shop gating) =====
CREATE TABLE IF NOT EXISTS public.character_known_npcs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  npc_id uuid NOT NULL REFERENCES public.npcs(id) ON DELETE CASCADE,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_interacted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, npc_id)
);

-- ===== Private messages (PM) =====
CREATE TABLE IF NOT EXISTS public.private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  recipient_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

-- ===== RLS =====
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_known_npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY guilds_select ON public.guilds
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY guilds_insert ON public.guilds
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.characters c
        WHERE c.id = leader_id
          AND c.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY guilds_update ON public.guilds
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.guild_members gm
        JOIN public.characters c ON c.id = gm.character_id
        WHERE gm.guild_id = public.guilds.id
          AND gm.role IN ('leader', 'vice_leader')
          AND c.user_id = auth.uid()
      )
    )
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY guilds_delete ON public.guilds
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.characters c
        WHERE c.id = public.guilds.leader_id
          AND c.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY guild_members_select ON public.guild_members
    FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY guild_members_insert_self ON public.guild_members
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.characters c
        WHERE c.id = character_id
          AND c.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY guild_members_delete_self ON public.guild_members
    FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.characters c
        WHERE c.id = public.guild_members.character_id
          AND c.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY known_npcs_select ON public.character_known_npcs
    FOR SELECT TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.id = character_known_npcs.character_id
          AND c.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY known_npcs_write ON public.character_known_npcs
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.id = character_known_npcs.character_id
          AND c.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY known_npcs_update ON public.character_known_npcs
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.characters c
        WHERE c.id = character_known_npcs.character_id
          AND c.user_id = auth.uid()
      )
    )
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY pm_select ON public.private_messages
    FOR SELECT TO authenticated
    USING (
      EXISTS (SELECT 1 FROM public.characters c WHERE c.id = sender_character_id AND c.user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.characters c WHERE c.id = recipient_character_id AND c.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY pm_insert_sender ON public.private_messages
    FOR INSERT TO authenticated
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.characters c WHERE c.id = sender_character_id AND c.user_id = auth.uid())
      AND length(message) BETWEEN 1 AND 200
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===== Functions (backend validations) =====
CREATE OR REPLACE FUNCTION public.guild_level_cost(next_level integer)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT GREATEST(0, next_level) * 10000::bigint;
$$;

CREATE OR REPLACE FUNCTION public.profile_heartbeat(p_character_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
BEGIN
  SELECT user_id INTO v_user FROM public.characters WHERE id = p_character_id;
  IF v_user IS NULL OR v_user <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  UPDATE public.profiles
  SET is_online = true,
      last_seen_at = now(),
      updated_at = now()
  WHERE id = v_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.guild_deposit_gold(p_character_id uuid, p_amount bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_guild_id uuid;
  v_gold bigint;
  v_bank bigint;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT user_id, gold::bigint INTO v_user, v_gold
  FROM public.characters
  WHERE id = p_character_id;

  IF v_user IS NULL OR v_user <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT guild_id INTO v_guild_id
  FROM public.guild_members
  WHERE character_id = p_character_id;

  IF v_guild_id IS NULL THEN
    RAISE EXCEPTION 'not_in_guild';
  END IF;

  IF v_gold < p_amount THEN
    RAISE EXCEPTION 'insufficient_gold';
  END IF;

  UPDATE public.characters
  SET gold = (gold::bigint - p_amount)::integer,
      updated_at = now()
  WHERE id = p_character_id;

  UPDATE public.guilds
  SET gold_bank = gold_bank + p_amount,
      updated_at = now()
  WHERE id = v_guild_id
  RETURNING gold_bank INTO v_bank;

  UPDATE public.guild_members
  SET donated_gold = donated_gold + p_amount
  WHERE guild_id = v_guild_id AND character_id = p_character_id;

  RETURN jsonb_build_object('guild_id', v_guild_id, 'bank', v_bank);
END;
$$;

CREATE OR REPLACE FUNCTION public.guild_upgrade(p_character_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_guild_id uuid;
  v_role text;
  v_level integer;
  v_bank bigint;
  v_next integer;
  v_cost bigint;
BEGIN
  SELECT user_id INTO v_user FROM public.characters WHERE id = p_character_id;
  IF v_user IS NULL OR v_user <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT guild_id, role INTO v_guild_id, v_role
  FROM public.guild_members
  WHERE character_id = p_character_id;

  IF v_guild_id IS NULL THEN
    RAISE EXCEPTION 'not_in_guild';
  END IF;

  IF v_role NOT IN ('leader', 'vice_leader') THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT level, gold_bank INTO v_level, v_bank FROM public.guilds WHERE id = v_guild_id FOR UPDATE;
  v_next := v_level + 1;
  v_cost := public.guild_level_cost(v_next);

  IF v_bank < v_cost THEN
    RAISE EXCEPTION 'insufficient_guild_gold';
  END IF;

  UPDATE public.guilds
  SET level = v_next,
      gold_bank = gold_bank - v_cost,
      max_members = GREATEST(max_members, 20) + 2,
      updated_at = now()
  WHERE id = v_guild_id
  RETURNING level, gold_bank INTO v_level, v_bank;

  RETURN jsonb_build_object('guild_id', v_guild_id, 'level', v_level, 'bank', v_bank, 'spent', v_cost);
END;
$$;

CREATE OR REPLACE FUNCTION public.guild_set_announcement(p_character_id uuid, p_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_guild_id uuid;
  v_role text;
BEGIN
  IF p_text IS NULL THEN p_text := ''; END IF;
  IF length(p_text) > 200 THEN
    RAISE EXCEPTION 'too_long';
  END IF;

  SELECT user_id INTO v_user FROM public.characters WHERE id = p_character_id;
  IF v_user IS NULL OR v_user <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT guild_id, role INTO v_guild_id, v_role
  FROM public.guild_members
  WHERE character_id = p_character_id;

  IF v_guild_id IS NULL OR v_role NOT IN ('leader', 'vice_leader') THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  UPDATE public.guilds
  SET announcement = p_text,
      updated_at = now()
  WHERE id = v_guild_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.guild_kick_member(p_actor_character_id uuid, p_target_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_guild_id uuid;
  v_role text;
  v_target_guild uuid;
  v_target_role text;
BEGIN
  SELECT user_id INTO v_user FROM public.characters WHERE id = p_actor_character_id;
  IF v_user IS NULL OR v_user <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT guild_id, role INTO v_guild_id, v_role
  FROM public.guild_members
  WHERE character_id = p_actor_character_id;

  IF v_guild_id IS NULL OR v_role NOT IN ('leader', 'vice_leader') THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT guild_id, role INTO v_target_guild, v_target_role
  FROM public.guild_members
  WHERE id = p_target_member_id;

  IF v_target_guild IS NULL OR v_target_guild <> v_guild_id THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  IF v_target_role = 'leader' THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  DELETE FROM public.guild_members WHERE id = p_target_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.guild_set_member_role(p_actor_character_id uuid, p_target_member_id uuid, p_new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_guild_id uuid;
  v_role text;
  v_target_guild uuid;
  v_target_role text;
BEGIN
  IF p_new_role NOT IN ('vice_leader', 'officer', 'member') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  SELECT user_id INTO v_user FROM public.characters WHERE id = p_actor_character_id;
  IF v_user IS NULL OR v_user <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT guild_id, role INTO v_guild_id, v_role
  FROM public.guild_members
  WHERE character_id = p_actor_character_id;

  IF v_guild_id IS NULL OR v_role NOT IN ('leader', 'vice_leader') THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  IF v_role = 'vice_leader' AND p_new_role = 'vice_leader' THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT guild_id, role INTO v_target_guild, v_target_role
  FROM public.guild_members
  WHERE id = p_target_member_id;

  IF v_target_guild IS NULL OR v_target_guild <> v_guild_id THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  IF v_target_role = 'leader' THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  UPDATE public.guild_members
  SET role = p_new_role
  WHERE id = p_target_member_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.npc_register_interaction_by_name(p_character_id uuid, p_npc_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_biome biome_type;
  v_npc_id uuid;
BEGIN
  IF p_npc_name IS NULL OR length(trim(p_npc_name)) = 0 THEN
    RAISE EXCEPTION 'invalid_npc';
  END IF;

  SELECT user_id, current_biome INTO v_user, v_biome
  FROM public.characters
  WHERE id = p_character_id;

  IF v_user IS NULL OR v_user <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT id INTO v_npc_id
  FROM public.npcs
  WHERE name = p_npc_name AND biome = v_biome
  LIMIT 1;

  IF v_npc_id IS NULL THEN
    RAISE EXCEPTION 'npc_not_found';
  END IF;

  INSERT INTO public.character_known_npcs (character_id, npc_id, first_seen_at, last_interacted_at)
  VALUES (p_character_id, v_npc_id, now(), now())
  ON CONFLICT (character_id, npc_id)
  DO UPDATE SET last_interacted_at = now();

  RETURN v_npc_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.npc_purchase(p_character_id uuid, p_npc_id uuid, p_item_id uuid, p_quantity integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_biome biome_type;
  v_gold bigint;
  v_price bigint;
  v_total bigint;
  v_last timestamptz;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 OR p_quantity > 99 THEN
    RAISE EXCEPTION 'invalid_quantity';
  END IF;

  SELECT user_id, current_biome, gold::bigint INTO v_user, v_biome, v_gold
  FROM public.characters
  WHERE id = p_character_id
  FOR UPDATE;

  IF v_user IS NULL OR v_user <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT last_interacted_at INTO v_last
  FROM public.character_known_npcs
  WHERE character_id = p_character_id AND npc_id = p_npc_id;

  IF v_last IS NULL OR v_last < (now() - interval '30 seconds') THEN
    RAISE EXCEPTION 'not_near_npc';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.npcs n WHERE n.id = p_npc_id AND n.biome = v_biome) THEN
    RAISE EXCEPTION 'npc_wrong_biome';
  END IF;

  SELECT value::bigint INTO v_price
  FROM public.items
  WHERE id = p_item_id
    AND (biome = v_biome OR biome IS NULL)
  LIMIT 1;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'item_not_available';
  END IF;

  v_total := v_price * p_quantity;
  IF v_gold < v_total THEN
    RAISE EXCEPTION 'insufficient_gold';
  END IF;

  INSERT INTO public.character_items (character_id, item_id, quantity, is_equipped)
  VALUES (p_character_id, p_item_id, p_quantity, false);

  UPDATE public.characters
  SET gold = (gold::bigint - v_total)::integer,
      updated_at = now()
  WHERE id = p_character_id
  RETURNING gold::bigint INTO v_gold;

  RETURN jsonb_build_object('gold', v_gold, 'spent', v_total);
END;
$$;

CREATE OR REPLACE FUNCTION public.npc_heal(p_character_id uuid, p_npc_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_biome biome_type;
  v_level integer;
  v_gold bigint;
  v_cost bigint;
  v_last timestamptz;
BEGIN
  SELECT user_id, current_biome, level, gold::bigint INTO v_user, v_biome, v_level, v_gold
  FROM public.characters
  WHERE id = p_character_id
  FOR UPDATE;

  IF v_user IS NULL OR v_user <> auth.uid() THEN
    RAISE EXCEPTION 'not_allowed';
  END IF;

  SELECT last_interacted_at INTO v_last
  FROM public.character_known_npcs
  WHERE character_id = p_character_id AND npc_id = p_npc_id;

  IF v_last IS NULL OR v_last < (now() - interval '30 seconds') THEN
    RAISE EXCEPTION 'not_near_npc';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.npcs n
    WHERE n.id = p_npc_id AND n.biome = v_biome AND n.npc_type = 'healer'
  ) THEN
    RAISE EXCEPTION 'invalid_npc';
  END IF;

  v_cost := GREATEST(1, floor(v_level * 5))::bigint;
  IF v_gold < v_cost THEN
    RAISE EXCEPTION 'insufficient_gold';
  END IF;

  UPDATE public.characters
  SET health = max_health,
      mana = max_mana,
      gold = (gold::bigint - v_cost)::integer,
      updated_at = now()
  WHERE id = p_character_id
  RETURNING gold::bigint INTO v_gold;

  RETURN jsonb_build_object('gold', v_gold, 'spent', v_cost);
END;
$$;
