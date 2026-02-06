
CREATE TABLE public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_name text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved can view active categories" ON public.service_categories
  FOR SELECT USING (is_approved() AND active = true);

CREATE POLICY "Admins manage categories" ON public.service_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.service_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric,
  price_label text,
  image_url text,
  contact_info text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved can view active items" ON public.service_items
  FOR SELECT USING (is_approved() AND active = true);

CREATE POLICY "Admins manage items" ON public.service_items
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
