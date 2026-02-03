-- Conexões de plataformas do usuário
CREATE TABLE public.ad_platform_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta_ads', 'google_ads', 'google_analytics')),
  
  -- Tokens criptografados
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- IDs específicos da plataforma
  account_id TEXT,
  property_id TEXT,
  account_name TEXT,
  
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, platform)
);

-- Cache de métricas
CREATE TABLE public.ad_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.ad_platform_connections(id) ON DELETE CASCADE,
  
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  metric_type TEXT NOT NULL,
  
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(connection_id, date_range_start, date_range_end, metric_type)
);

-- Relatórios gerados
CREATE TABLE public.ad_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  title TEXT NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  platforms TEXT[] NOT NULL,
  
  report_data JSONB NOT NULL,
  pdf_storage_path TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_platform_connections
CREATE POLICY "Users can view own connections"
ON public.ad_platform_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own connections"
ON public.ad_platform_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
ON public.ad_platform_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
ON public.ad_platform_connections FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for ad_metrics_cache
CREATE POLICY "Users can view own metrics cache"
ON public.ad_metrics_cache FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.ad_platform_connections c
  WHERE c.id = ad_metrics_cache.connection_id AND c.user_id = auth.uid()
));

CREATE POLICY "Users can insert own metrics cache"
ON public.ad_metrics_cache FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.ad_platform_connections c
  WHERE c.id = ad_metrics_cache.connection_id AND c.user_id = auth.uid()
));

CREATE POLICY "Users can update own metrics cache"
ON public.ad_metrics_cache FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.ad_platform_connections c
  WHERE c.id = ad_metrics_cache.connection_id AND c.user_id = auth.uid()
));

CREATE POLICY "Users can delete own metrics cache"
ON public.ad_metrics_cache FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.ad_platform_connections c
  WHERE c.id = ad_metrics_cache.connection_id AND c.user_id = auth.uid()
));

-- RLS Policies for ad_reports
CREATE POLICY "Users can view own reports"
ON public.ad_reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reports"
ON public.ad_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
ON public.ad_reports FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
ON public.ad_reports FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_ad_connections_updated_at
BEFORE UPDATE ON public.ad_platform_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();