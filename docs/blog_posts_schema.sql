-- Odds Gods blog schema + policies
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  author TEXT DEFAULT 'Odds Gods',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_slug_idx ON public.posts (slug);
CREATE INDEX IF NOT EXISTS posts_published_idx
  ON public.posts (status, published_at DESC)
  WHERE status = 'published';

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published posts" ON public.posts;
CREATE POLICY "Public can read published posts"
  ON public.posts FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated users can manage posts" ON public.posts;
CREATE POLICY "Authenticated users can manage posts"
  ON public.posts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_updated_at ON public.posts;
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for public-assets bucket
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'public-assets');

DROP POLICY IF EXISTS "Public can read" ON storage.objects;
CREATE POLICY "Public can read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-assets');
