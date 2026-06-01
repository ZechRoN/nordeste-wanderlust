
-- 1. Coupon transactions history
CREATE TABLE public.coupon_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  pack_id text,
  status text NOT NULL DEFAULT 'completed',
  description text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.coupon_transactions TO authenticated;
GRANT ALL ON public.coupon_transactions TO service_role;
ALTER TABLE public.coupon_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own coupon tx" ON public.coupon_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own coupon tx" ON public.coupon_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_coupon_tx_user ON public.coupon_transactions(user_id, created_at DESC);

-- Update add_coupons to also record transaction
CREATE OR REPLACE FUNCTION public.add_coupons(_amount integer, _pack_id text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _new_balance integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > 1000000 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  INSERT INTO public.user_coupons(user_id, balance) VALUES (_uid, _amount)
    ON CONFLICT (user_id)
    DO UPDATE SET balance = public.user_coupons.balance + EXCLUDED.balance, updated_at = now();

  SELECT balance INTO _new_balance FROM public.user_coupons WHERE user_id = _uid;

  INSERT INTO public.coupon_transactions(user_id, amount, pack_id, status, description)
    VALUES (_uid, _amount, _pack_id, 'completed', 'Recarga de Cupons');

  RETURN jsonb_build_object('ok', true, 'balance', _new_balance);
END;
$function$;

-- 2. App roles (ADM / GM / TUTOR)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'gm', 'tutor', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roles are readable" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- 3. Guild invites
CREATE TABLE public.guild_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guild_id uuid NOT NULL,
  inviter_character_id uuid NOT NULL,
  invitee_character_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone
);
GRANT SELECT, INSERT, UPDATE ON public.guild_invites TO authenticated;
GRANT ALL ON public.guild_invites TO service_role;
ALTER TABLE public.guild_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invites visible to involved parties" ON public.guild_invites FOR SELECT TO authenticated
USING (
  invitee_character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  OR inviter_character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);

CREATE POLICY "Members can create invites" ON public.guild_invites FOR INSERT TO authenticated
WITH CHECK (
  inviter_character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);

CREATE POLICY "Invitee can update own invite" ON public.guild_invites FOR UPDATE TO authenticated
USING (
  invitee_character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
);

CREATE INDEX idx_guild_invites_invitee ON public.guild_invites(invitee_character_id, status);

-- RPC: accept guild invite (joins guild atomically)
CREATE OR REPLACE FUNCTION public.accept_guild_invite(_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _inv public.guild_invites%ROWTYPE;
  _uid uuid := auth.uid();
  _is_mine boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  SELECT * INTO _inv FROM public.guild_invites WHERE id = _invite_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invite not found'; END IF;
  IF _inv.status <> 'pending' THEN RAISE EXCEPTION 'Invite not pending'; END IF;

  SELECT EXISTS(SELECT 1 FROM public.characters WHERE id = _inv.invitee_character_id AND user_id = _uid) INTO _is_mine;
  IF NOT _is_mine THEN RAISE EXCEPTION 'Not your invite'; END IF;

  -- Remove from any current guild
  DELETE FROM public.guild_members WHERE character_id = _inv.invitee_character_id;
  -- Join new guild
  INSERT INTO public.guild_members(guild_id, character_id, role)
    VALUES (_inv.guild_id, _inv.invitee_character_id, 'member');

  UPDATE public.guild_invites SET status = 'accepted', responded_at = now() WHERE id = _invite_id;
  RETURN jsonb_build_object('ok', true, 'guild_id', _inv.guild_id);
END;
$$;

-- 4. Add more creatures (Brazilian Northeast fauna)
INSERT INTO public.creatures (name, description, biome, level, health, max_health, strength, agility, intelligence, vitality, luck, experience_reward, gold_reward, rarity, special_ability) VALUES
('Cangaceiro Errante', 'Bandoleiro da Caatinga armado com punhal.', 'caatinga', 5, 80, 80, 12, 10, 5, 8, 6, 35, 15, 'common', 'Golpe Rápido'),
('Onça-Parda Faminta', 'Felino selvagem do sertão.', 'caatinga', 8, 140, 140, 18, 16, 4, 12, 8, 60, 25, 'uncommon', 'Bote Feroz'),
('Bode-Demônio', 'Bode possuído com chifres flamejantes.', 'caatinga', 12, 220, 220, 24, 12, 6, 18, 5, 95, 40, 'uncommon', 'Investida Ardente'),
('Tatu-Bola Gigante', 'Tatu colossal de couraça impenetrável.', 'agreste', 15, 320, 320, 22, 8, 4, 28, 6, 130, 55, 'rare', 'Concha de Aço'),
('Mula-sem-Cabeça', 'Lenda viva que cospe fogo na escuridão.', 'agreste', 22, 480, 480, 32, 14, 18, 24, 10, 220, 90, 'rare', 'Chama Espectral'),
('Sereia do São Francisco', 'Encantadora de águas doces.', 'litoral', 18, 360, 360, 18, 22, 26, 16, 12, 180, 75, 'rare', 'Canto Hipnótico'),
('Caranguejo-Rei', 'Crustáceo gigantesco das praias.', 'litoral', 14, 280, 280, 26, 10, 4, 22, 5, 110, 50, 'uncommon', 'Pinça Esmagadora'),
('Cobra Norato', 'Serpente lendária dos rios.', 'litoral', 25, 540, 540, 30, 20, 22, 26, 14, 260, 110, 'rare', 'Veneno Sombrio'),
('Saci-Pererê', 'Brincalhão de uma perna só.', 'agreste', 10, 160, 160, 14, 26, 16, 10, 22, 80, 45, 'uncommon', 'Redemoinho'),
('Lobisomem do Cariri', 'Lenda peluda das noites de lua cheia.', 'caatinga', 28, 620, 620, 38, 22, 10, 30, 8, 320, 130, 'rare', 'Uivo Aterrorizante'),
('Curupira', 'Guardião das matas com pés invertidos.', 'agreste', 20, 420, 420, 28, 24, 18, 22, 16, 200, 85, 'rare', 'Confusão Florestal'),
('Boitatá', 'Cobra de fogo que protege a mata.', 'agreste', 30, 720, 720, 36, 16, 28, 30, 10, 380, 150, 'rare', 'Labareda'),
('Iara Sombria', 'Mãe d''água corrompida.', 'litoral', 32, 780, 780, 30, 20, 34, 28, 14, 420, 170, 'rare', 'Abraço Aquático'),
('Comendador Lampião', 'Espectro do rei do cangaço.', 'santa_cruz', 40, 1100, 1100, 48, 28, 20, 38, 14, 600, 260, 'rare', 'Rajada de Naboo'),
('Mãe-do-Ouro', 'Espírito brilhante das minas.', 'santa_cruz', 35, 900, 900, 36, 18, 30, 32, 24, 480, 220, 'rare', 'Brilho Cegante');
