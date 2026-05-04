
-- Add optional columns for richer character info
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS subclass text,
  ADD COLUMN IF NOT EXISTS profession text;

-- Coupons balance per user
CREATE TABLE IF NOT EXISTS public.user_coupons (
  user_id uuid PRIMARY KEY,
  balance integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own coupons"
  ON public.user_coupons FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own coupon row"
  ON public.user_coupons FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Bazar listings
CREATE TABLE IF NOT EXISTS public.character_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  buyer_id uuid,
  price_coupons integer NOT NULL CHECK (price_coupons > 0),
  description text DEFAULT '',
  highlight text DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  sold_at timestamptz
);
ALTER TABLE public.character_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings are public"
  ON public.character_listings FOR SELECT TO authenticated
  USING (status = 'active' OR seller_id = auth.uid() OR buyer_id = auth.uid());

CREATE POLICY "Owner can list own character"
  ON public.character_listings FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND character_id IN (SELECT id FROM public.characters WHERE user_id = auth.uid())
  );

CREATE POLICY "Seller can cancel own listing"
  ON public.character_listings FOR UPDATE TO authenticated
  USING (seller_id = auth.uid() AND status = 'active');

-- Purchases history
CREATE TABLE IF NOT EXISTS public.listing_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  character_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  price_coupons integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.listing_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Purchase history readable by parties"
  ON public.listing_purchases FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_listings_status ON public.character_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_character ON public.character_listings(character_id);
CREATE INDEX IF NOT EXISTS idx_purchases_character ON public.listing_purchases(character_id);

-- Atomic purchase function
CREATE OR REPLACE FUNCTION public.purchase_character_listing(_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _buyer uuid := auth.uid();
  _listing public.character_listings%ROWTYPE;
  _buyer_balance integer;
BEGIN
  IF _buyer IS NULL THEN
    RAISE EXCEPTION 'Login required';
  END IF;

  SELECT * INTO _listing FROM public.character_listings
    WHERE id = _listing_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;
  IF _listing.status <> 'active' THEN
    RAISE EXCEPTION 'Listing not active';
  END IF;
  IF _listing.seller_id = _buyer THEN
    RAISE EXCEPTION 'Cannot buy your own character';
  END IF;

  SELECT balance INTO _buyer_balance FROM public.user_coupons
    WHERE user_id = _buyer FOR UPDATE;
  IF _buyer_balance IS NULL THEN
    _buyer_balance := 0;
    INSERT INTO public.user_coupons(user_id, balance) VALUES (_buyer, 0);
  END IF;

  IF _buyer_balance < _listing.price_coupons THEN
    RAISE EXCEPTION 'Insufficient coupons';
  END IF;

  -- Debit buyer
  UPDATE public.user_coupons SET balance = balance - _listing.price_coupons, updated_at = now()
    WHERE user_id = _buyer;

  -- Credit seller
  INSERT INTO public.user_coupons(user_id, balance) VALUES (_listing.seller_id, _listing.price_coupons)
    ON CONFLICT (user_id) DO UPDATE SET balance = public.user_coupons.balance + EXCLUDED.balance, updated_at = now();

  -- Transfer character
  UPDATE public.characters SET user_id = _buyer, updated_at = now()
    WHERE id = _listing.character_id;

  -- Mark listing sold
  UPDATE public.character_listings
    SET status = 'sold', buyer_id = _buyer, sold_at = now()
    WHERE id = _listing_id;

  -- History
  INSERT INTO public.listing_purchases(listing_id, character_id, seller_id, buyer_id, price_coupons)
    VALUES (_listing_id, _listing.character_id, _listing.seller_id, _buyer, _listing.price_coupons);

  RETURN jsonb_build_object('ok', true, 'character_id', _listing.character_id);
END;
$$;

REVOKE ALL ON FUNCTION public.purchase_character_listing(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.purchase_character_listing(uuid) TO authenticated;
