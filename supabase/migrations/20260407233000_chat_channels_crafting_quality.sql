ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS channel_type text NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS channel_id text;

CREATE INDEX IF NOT EXISTS chat_messages_channel_idx
  ON public.chat_messages (channel_type, channel_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;

CREATE OR REPLACE FUNCTION public.chat_send_message(
  p_character_id uuid,
  p_channel_type text,
  p_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message text;
  v_owner uuid;
  v_biome text;
  v_channel_id text;
  v_guild_id uuid;
  v_party_id uuid;
  v_last_at timestamptz;
  v_recent_count integer;
  v_row public.chat_messages%rowtype;
BEGIN
  v_message := coalesce(nullif(trim(p_message), ''), '');
  IF length(v_message) < 1 OR length(v_message) > 220 THEN
    RAISE EXCEPTION 'Mensagem inválida';
  END IF;

  SELECT c.user_id, c.current_biome INTO v_owner, v_biome
  FROM public.characters c
  WHERE c.id = p_character_id;

  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissão para enviar';
  END IF;

  SELECT max(m.created_at) INTO v_last_at
  FROM public.chat_messages m
  WHERE m.character_id = p_character_id;

  IF v_last_at IS NOT NULL AND now() - v_last_at < interval '2 seconds' THEN
    RAISE EXCEPTION 'Envio muito rápido';
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM public.chat_messages m
  WHERE m.character_id = p_character_id
    AND m.created_at > now() - interval '20 seconds';

  IF v_recent_count >= 6 THEN
    RAISE EXCEPTION 'Limite de mensagens excedido';
  END IF;

  IF p_channel_type = 'global' THEN
    v_channel_id := NULL;
  ELSIF p_channel_type = 'local' THEN
    v_channel_id := v_biome;
  ELSIF p_channel_type = 'guild' THEN
    SELECT gm.guild_id INTO v_guild_id
    FROM public.guild_members gm
    WHERE gm.character_id = p_character_id
    LIMIT 1;
    IF v_guild_id IS NULL THEN
      RAISE EXCEPTION 'Você não está em uma guilda';
    END IF;
    v_channel_id := v_guild_id::text;
  ELSIF p_channel_type = 'party' THEN
    SELECT pm.party_id INTO v_party_id
    FROM public.party_members pm
    WHERE pm.character_id = p_character_id
    LIMIT 1;
    IF v_party_id IS NULL THEN
      RAISE EXCEPTION 'Você não está em um grupo';
    END IF;
    v_channel_id := v_party_id::text;
  ELSE
    RAISE EXCEPTION 'Canal inválido';
  END IF;

  INSERT INTO public.chat_messages (character_id, character_name, message, channel_type, channel_id)
  VALUES (
    p_character_id,
    (SELECT name FROM public.characters WHERE id = p_character_id),
    v_message,
    p_channel_type,
    v_channel_id
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'created_at', v_row.created_at,
    'character_id', v_row.character_id,
    'character_name', v_row.character_name,
    'message', v_row.message,
    'channel_type', v_row.channel_type,
    'channel_id', v_row.channel_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.chat_send_message(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_send_message(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.pm_send_by_name(
  p_character_id uuid,
  p_target_character_name text,
  p_message text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message text;
  v_owner uuid;
  v_target_id uuid;
  v_last_at timestamptz;
  v_recent_count integer;
  v_row public.private_messages%rowtype;
BEGIN
  v_message := coalesce(nullif(trim(p_message), ''), '');
  IF length(v_message) < 1 OR length(v_message) > 220 THEN
    RAISE EXCEPTION 'Mensagem inválida';
  END IF;

  SELECT c.user_id INTO v_owner
  FROM public.characters c
  WHERE c.id = p_character_id;

  IF v_owner IS NULL OR v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissão para enviar';
  END IF;

  SELECT c.id INTO v_target_id
  FROM public.characters c
  WHERE lower(c.name) = lower(trim(p_target_character_name))
  LIMIT 1;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'Jogador não encontrado';
  END IF;

  IF v_target_id = p_character_id THEN
    RAISE EXCEPTION 'Destino inválido';
  END IF;

  SELECT max(m.created_at) INTO v_last_at
  FROM public.private_messages m
  WHERE m.sender_character_id = p_character_id;

  IF v_last_at IS NOT NULL AND now() - v_last_at < interval '2 seconds' THEN
    RAISE EXCEPTION 'Envio muito rápido';
  END IF;

  SELECT count(*) INTO v_recent_count
  FROM public.private_messages m
  WHERE m.sender_character_id = p_character_id
    AND m.created_at > now() - interval '20 seconds';

  IF v_recent_count >= 6 THEN
    RAISE EXCEPTION 'Limite de mensagens excedido';
  END IF;

  INSERT INTO public.private_messages (sender_character_id, recipient_character_id, sender_name, recipient_name, message)
  VALUES (
    p_character_id,
    v_target_id,
    (SELECT name FROM public.characters WHERE id = p_character_id),
    (SELECT name FROM public.characters WHERE id = v_target_id),
    v_message
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'created_at', v_row.created_at,
    'sender_character_id', v_row.sender_character_id,
    'recipient_character_id', v_row.recipient_character_id,
    'sender_name', v_row.sender_name,
    'recipient_name', v_row.recipient_name,
    'message', v_row.message
  );
END;
$$;

REVOKE ALL ON FUNCTION public.pm_send_by_name(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pm_send_by_name(uuid, text, text) TO authenticated;

ALTER TABLE public.character_items
  ADD COLUMN IF NOT EXISTS quality_rank text;

ALTER TABLE public.character_items
  ADD CONSTRAINT IF NOT EXISTS character_items_quality_rank_check
  CHECK (quality_rank IS NULL OR quality_rank IN ('D', 'C', 'B', 'A', 'S', 'SS'));

CREATE TABLE IF NOT EXISTS public.item_quality_rank_rules (
  rank text PRIMARY KEY,
  order_index integer NOT NULL,
  stat_multiplier numeric NOT NULL,
  min_level integer NOT NULL DEFAULT 1,
  success_chance numeric NOT NULL DEFAULT 1,
  downgrade_on_fail boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.item_quality_rank_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_rank text NOT NULL REFERENCES public.item_quality_rank_rules(rank) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.item_quality_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  character_item_id uuid NOT NULL REFERENCES public.character_items(id) ON DELETE CASCADE,
  from_rank text NOT NULL,
  to_rank text NOT NULL,
  success boolean NOT NULL,
  roll numeric NOT NULL,
  success_chance numeric NOT NULL,
  materials_spent jsonb NOT NULL DEFAULT '[]'::jsonb,
  penalty jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.item_quality_rank_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_quality_rank_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_quality_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Quality rules are readable"
  ON public.item_quality_rank_rules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Quality materials are readable"
  ON public.item_quality_rank_materials
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own quality history"
  ON public.item_quality_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.character_items ci
      JOIN public.characters c ON c.id = ci.character_id
      WHERE ci.id = item_quality_history.character_item_id
        AND c.user_id = auth.uid()
    )
  );

INSERT INTO public.item_quality_rank_rules (rank, order_index, stat_multiplier, min_level, success_chance, downgrade_on_fail)
VALUES
  ('D', 1, 1.00, 1, 1.00, false),
  ('C', 2, 1.05, 2, 0.85, false),
  ('B', 3, 1.12, 5, 0.75, true),
  ('A', 4, 1.20, 10, 0.65, true),
  ('S', 5, 1.32, 18, 0.50, true),
  ('SS', 6, 1.48, 25, 0.35, true)
ON CONFLICT (rank) DO NOTHING;

INSERT INTO public.item_quality_rank_materials (target_rank, item_id, quantity)
SELECT 'C', i.id, 3
FROM public.items i
WHERE i.type = 'material' AND i.name ILIKE '%Espinho%'
LIMIT 1;

INSERT INTO public.item_quality_rank_materials (target_rank, item_id, quantity)
SELECT 'C', i.id, 3
FROM public.items i
WHERE i.type = 'material'
ORDER BY i.created_at
LIMIT 1;

INSERT INTO public.item_quality_rank_materials (target_rank, item_id, quantity)
SELECT 'B', i.id, 4
FROM public.items i
WHERE i.type = 'material' AND i.name ILIKE '%Pedra%'
LIMIT 1;

INSERT INTO public.item_quality_rank_materials (target_rank, item_id, quantity)
SELECT 'B', i.id, 4
FROM public.items i
WHERE i.type = 'material' AND i.name ILIKE '%Espinho%'
LIMIT 1;

INSERT INTO public.item_quality_rank_materials (target_rank, item_id, quantity)
SELECT 'A', i.id, 6
FROM public.items i
WHERE i.type = 'material' AND i.name ILIKE '%Pedra%'
LIMIT 1;

INSERT INTO public.item_quality_rank_materials (target_rank, item_id, quantity)
SELECT 'A', i.id, 3
FROM public.items i
WHERE i.type = 'material' AND i.name ILIKE '%Pérola%'
LIMIT 1;

INSERT INTO public.item_quality_rank_materials (target_rank, item_id, quantity)
SELECT 'S', i.id, 2
FROM public.items i
WHERE i.type = 'material' AND i.name ILIKE '%Relíquia%'
LIMIT 1;

INSERT INTO public.item_quality_rank_materials (target_rank, item_id, quantity)
SELECT 'S', i.id, 5
FROM public.items i
WHERE i.type = 'material' AND i.name ILIKE '%Pérola%'
LIMIT 1;

INSERT INTO public.item_quality_rank_materials (target_rank, item_id, quantity)
SELECT 'SS', i.id, 5
FROM public.items i
WHERE i.type = 'material' AND i.name ILIKE '%Relíquia%'
LIMIT 1;

INSERT INTO public.item_quality_rank_materials (target_rank, item_id, quantity)
SELECT 'SS', i.id, 8
FROM public.items i
WHERE i.type = 'material' AND i.name ILIKE '%Pérola%'
LIMIT 1;

INSERT INTO public.item_quality_rank_materials (target_rank, item_id, quantity)
SELECT 'SS', i.id, 10
FROM public.items i
WHERE i.type = 'material' AND i.name ILIKE '%Pedra%'
LIMIT 1;

CREATE OR REPLACE FUNCTION public.item_quality_upgrade(
  p_character_item_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_character_id uuid;
  v_user_id uuid;
  v_item_id uuid;
  v_item_type text;
  v_quantity integer;
  v_is_equipped boolean;
  v_character_level integer;
  v_from_rank text;
  v_to_rank text;
  v_success boolean;
  v_roll numeric;
  v_success_chance numeric;
  v_min_level integer;
  v_downgrade boolean;
  v_penalty jsonb := '{}'::jsonb;
  v_materials jsonb := '[]'::jsonb;
  v_stat_mult_from numeric;
  v_stat_mult_to numeric;
  v_str integer;
  v_agi integer;
  v_int integer;
  v_vit integer;
  v_luk integer;
  v_prev_rank text;
  r record;
BEGIN
  SELECT ci.character_id, c.user_id, c.level, ci.item_id, i.type, ci.quantity, ci.is_equipped, coalesce(ci.quality_rank, 'D')
  INTO v_character_id, v_user_id, v_character_level, v_item_id, v_item_type, v_quantity, v_is_equipped, v_from_rank
  FROM public.character_items ci
  JOIN public.characters c ON c.id = ci.character_id
  JOIN public.items i ON i.id = ci.item_id
  WHERE ci.id = p_character_item_id;

  IF v_character_id IS NULL OR v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissão';
  END IF;

  IF v_item_type NOT IN ('weapon', 'armor') THEN
    RAISE EXCEPTION 'Item não pode ser melhorado';
  END IF;

  IF v_quantity <> 1 THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;

  IF v_from_rank = 'SS' THEN
    RAISE EXCEPTION 'Rank máximo atingido';
  END IF;

  IF v_from_rank = 'D' THEN v_to_rank := 'C';
  ELSIF v_from_rank = 'C' THEN v_to_rank := 'B';
  ELSIF v_from_rank = 'B' THEN v_to_rank := 'A';
  ELSIF v_from_rank = 'A' THEN v_to_rank := 'S';
  ELSIF v_from_rank = 'S' THEN v_to_rank := 'SS';
  ELSE
    RAISE EXCEPTION 'Rank inválido';
  END IF;

  SELECT r.min_level, r.success_chance, r.downgrade_on_fail
  INTO v_min_level, v_success_chance, v_downgrade
  FROM public.item_quality_rank_rules r
  WHERE r.rank = v_to_rank;

  IF v_min_level IS NULL THEN
    RAISE EXCEPTION 'Regra de rank não encontrada';
  END IF;

  IF v_character_level < v_min_level THEN
    RAISE EXCEPTION 'Nível de habilidade insuficiente';
  END IF;

  FOR r IN
    SELECT m.item_id, m.quantity, it.name
    FROM public.item_quality_rank_materials m
    JOIN public.items it ON it.id = m.item_id
    WHERE m.target_rank = v_to_rank
  LOOP
    IF (
      SELECT coalesce(sum(ci2.quantity), 0)
      FROM public.character_items ci2
      WHERE ci2.character_id = v_character_id
        AND ci2.item_id = r.item_id
    ) < r.quantity THEN
      RAISE EXCEPTION 'Materiais insuficientes';
    END IF;
  END LOOP;

  FOR r IN
    SELECT m.item_id, m.quantity, it.name
    FROM public.item_quality_rank_materials m
    JOIN public.items it ON it.id = m.item_id
    WHERE m.target_rank = v_to_rank
  LOOP
    v_materials := v_materials || jsonb_build_array(jsonb_build_object('item_id', r.item_id, 'name', r.name, 'quantity', r.quantity));
    PERFORM 1;

    WITH targets AS (
      SELECT ci2.id, ci2.quantity
      FROM public.character_items ci2
      WHERE ci2.character_id = v_character_id
        AND ci2.item_id = r.item_id
      ORDER BY ci2.acquired_at ASC
      FOR UPDATE
    ),
    spent AS (
      SELECT id,
             CASE
               WHEN sum(quantity) OVER (ORDER BY acquired_at ASC) <= r.quantity THEN quantity
               ELSE greatest(0, r.quantity - (sum(quantity) OVER (ORDER BY acquired_at ASC) - quantity))
             END AS spend_qty
      FROM (
        SELECT t.id, t.quantity, ci2.acquired_at
        FROM targets t
        JOIN public.character_items ci2 ON ci2.id = t.id
      ) s
    )
    UPDATE public.character_items ciu
    SET quantity = ciu.quantity - spent.spend_qty
    FROM spent
    WHERE ciu.id = spent.id
      AND spent.spend_qty > 0;

    DELETE FROM public.character_items d
    WHERE d.character_id = v_character_id
      AND d.item_id = r.item_id
      AND d.quantity <= 0;
  END LOOP;

  v_roll := random();
  v_success := v_roll <= v_success_chance;

  IF v_success THEN
    UPDATE public.character_items
    SET quality_rank = v_to_rank
    WHERE id = p_character_item_id;
  ELSE
    IF v_downgrade AND v_from_rank <> 'D' THEN
      IF v_from_rank = 'C' THEN v_prev_rank := 'D';
      ELSIF v_from_rank = 'B' THEN v_prev_rank := 'C';
      ELSIF v_from_rank = 'A' THEN v_prev_rank := 'B';
      ELSIF v_from_rank = 'S' THEN v_prev_rank := 'A';
      ELSIF v_from_rank = 'SS' THEN v_prev_rank := 'S';
      ELSE v_prev_rank := 'D';
      END IF;
      UPDATE public.character_items
      SET quality_rank = v_prev_rank
      WHERE id = p_character_item_id;
      v_penalty := jsonb_build_object('downgraded_to', v_prev_rank);
      v_to_rank := v_prev_rank;
    ELSE
      v_penalty := jsonb_build_object('kept_rank', v_from_rank);
      v_to_rank := v_from_rank;
    END IF;
  END IF;

  SELECT stat_multiplier INTO v_stat_mult_from
  FROM public.item_quality_rank_rules
  WHERE rank = v_from_rank;

  SELECT stat_multiplier INTO v_stat_mult_to
  FROM public.item_quality_rank_rules
  WHERE rank = v_to_rank;

  IF v_stat_mult_from IS NULL THEN v_stat_mult_from := 1; END IF;
  IF v_stat_mult_to IS NULL THEN v_stat_mult_to := 1; END IF;

  IF v_is_equipped THEN
    SELECT i.strength_bonus, i.agility_bonus, i.intelligence_bonus, i.vitality_bonus, i.luck_bonus
    INTO v_str, v_agi, v_int, v_vit, v_luk
    FROM public.items i
    WHERE i.id = v_item_id;

    UPDATE public.characters
    SET strength = strength + round(v_str * v_stat_mult_to)::int - round(v_str * v_stat_mult_from)::int,
        agility = agility + round(v_agi * v_stat_mult_to)::int - round(v_agi * v_stat_mult_from)::int,
        intelligence = intelligence + round(v_int * v_stat_mult_to)::int - round(v_int * v_stat_mult_from)::int,
        vitality = vitality + round(v_vit * v_stat_mult_to)::int - round(v_vit * v_stat_mult_from)::int,
        luck = luck + round(v_luk * v_stat_mult_to)::int - round(v_luk * v_stat_mult_from)::int,
        updated_at = now()
    WHERE id = v_character_id;
  END IF;

  INSERT INTO public.item_quality_history (character_id, character_item_id, from_rank, to_rank, success, roll, success_chance, materials_spent, penalty)
  VALUES (v_character_id, p_character_item_id, v_from_rank, v_to_rank, v_success, v_roll, v_success_chance, v_materials, v_penalty);

  RETURN jsonb_build_object(
    'character_item_id', p_character_item_id,
    'from_rank', v_from_rank,
    'to_rank', v_to_rank,
    'success', v_success,
    'roll', v_roll,
    'success_chance', v_success_chance,
    'materials_spent', v_materials,
    'penalty', v_penalty
  );
END;
$$;

REVOKE ALL ON FUNCTION public.item_quality_upgrade(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.item_quality_upgrade(uuid) TO authenticated;
