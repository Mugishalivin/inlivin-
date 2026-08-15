ALTER TABLE public.creator_badges
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.creator_badges
SET is_active = COALESCE(is_active, true),
    awarded_at = COALESCE(awarded_at, earned_at, created_at, now());

ALTER TABLE public.creator_badges ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE public.creator_badges ALTER COLUMN awarded_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS creator_badges_user_id_idx ON public.creator_badges (user_id);

DROP TRIGGER IF EXISTS update_creator_badges_updated_at ON public.creator_badges;
CREATE TRIGGER update_creator_badges_updated_at
BEFORE UPDATE ON public.creator_badges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

GRANT SELECT ON public.creator_badges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_badges TO authenticated;
GRANT ALL ON public.creator_badges TO service_role;