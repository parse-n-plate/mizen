-- Schema snapshot pulled from production 2026-03-17
-- Tables, indexes, RLS policies, and storage buckets

-- =============================================================================
-- RECIPES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.recipes (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  slug       text        NOT NULL,
  recipe     jsonb       NOT NULL,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT recipes_pkey PRIMARY KEY (id),
  CONSTRAINT recipes_slug_key UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS recipes_user_id_idx
  ON public.recipes USING btree (user_id);

CREATE INDEX IF NOT EXISTS recipes_source_url_idx
  ON public.recipes USING btree (user_id, source_url);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recipes"
  ON public.recipes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own"
  ON public.recipes FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- WAITLIST
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.waitlist (
  id         uuid        NOT NULL DEFAULT gen_random_uuid(),
  email      text        NOT NULL,
  source     text                 DEFAULT 'Website'::text,
  status     text                 DEFAULT 'new'::text,
  joined_at  timestamptz          DEFAULT now(),
  created_at timestamptz          DEFAULT now(),
  CONSTRAINT waitlist_pkey PRIMARY KEY (id),
  CONSTRAINT waitlist_email_key UNIQUE (email)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- STORAGE: feedback-images bucket (public, no RLS policies — uploads via admin)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-images', 'feedback-images', true)
ON CONFLICT (id) DO NOTHING;
