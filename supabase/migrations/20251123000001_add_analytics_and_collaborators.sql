-- Create project_analytics table for tracking user activity
CREATE TABLE IF NOT EXISTS public.project_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.video_projects(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_project_analytics_user_id ON public.project_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_project_analytics_project_id ON public.project_analytics(project_id);
CREATE INDEX IF NOT EXISTS idx_project_analytics_event_type ON public.project_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_project_analytics_created_at ON public.project_analytics(created_at DESC);

-- Enable RLS on project_analytics
ALTER TABLE public.project_analytics ENABLE ROW LEVEL SECURITY;

-- Users can only view their own analytics
CREATE POLICY "Users can view own analytics"
ON public.project_analytics
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own analytics
CREATE POLICY "Users can insert own analytics"
ON public.project_analytics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create project_collaborators table for team collaboration
CREATE TABLE IF NOT EXISTS public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.video_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(project_id, user_id)
);

-- Create indexes for collaborators
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON public.project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON public.project_collaborators(user_id);

-- Enable RLS on project_collaborators
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- Project owners can manage collaborators
CREATE POLICY "Project owners can manage collaborators"
ON public.project_collaborators
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.video_projects
    WHERE id = project_id AND user_id = auth.uid()
  )
);

-- Users can view collaborations they are part of
CREATE POLICY "Users can view their collaborations"
ON public.project_collaborators
FOR SELECT
USING (user_id = auth.uid());

-- Admins can manage other collaborators
CREATE POLICY "Admins can manage collaborators"
ON public.project_collaborators
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.project_collaborators pc
    WHERE pc.project_id = project_collaborators.project_id
    AND pc.user_id = auth.uid()
    AND pc.role = 'admin'
  )
);

-- Create rate_limits table for API rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, endpoint)
);

-- Create index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits(user_id, endpoint, window_start);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
-- No user policies needed as this is managed by edge functions

-- Add function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Try to get existing rate limit record
  SELECT request_count INTO v_count
  FROM rate_limits
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start > v_window_start
  FOR UPDATE;

  IF FOUND THEN
    IF v_count >= p_max_requests THEN
      RETURN FALSE; -- Rate limit exceeded
    END IF;

    -- Increment counter
    UPDATE rate_limits
    SET request_count = request_count + 1
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
  ELSE
    -- Clean up old records and insert new
    DELETE FROM rate_limits
    WHERE user_id = p_user_id AND endpoint = p_endpoint;

    INSERT INTO rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, NOW());
  END IF;

  RETURN TRUE; -- Request allowed
END;
$$;
