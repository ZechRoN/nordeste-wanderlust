
DROP POLICY "Users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (
  character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
  OR
  character_id IN (SELECT id FROM characters)
);
