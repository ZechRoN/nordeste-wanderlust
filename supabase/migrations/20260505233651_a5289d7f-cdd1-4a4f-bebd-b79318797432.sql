-- RPC to top up coupons (simulated purchase). Owner-only via auth.uid().
CREATE OR REPLACE FUNCTION public.add_coupons(_amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  RETURN jsonb_build_object('ok', true, 'balance', _new_balance);
END;
$$;