-- Add total_duration column to video_projects
ALTER TABLE public.video_projects ADD COLUMN total_duration text;

-- Create public_shares table
CREATE TABLE public.public_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.video_projects(id) ON DELETE CASCADE NOT NULL,
  share_token text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone,
  view_count integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

-- Create index on share_token for fast lookups
CREATE INDEX idx_public_shares_share_token ON public.public_shares(share_token);

-- Enable RLS
ALTER TABLE public.public_shares ENABLE ROW LEVEL SECURITY;

-- Users can create shares for their own projects
CREATE POLICY "Users can create shares for own projects"
ON public.public_shares
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.video_projects
    WHERE id = project_id AND user_id = auth.uid()
  )
);

-- Users can view their own shares
CREATE POLICY "Users can view their own shares"
ON public.public_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.video_projects
    WHERE id = project_id AND user_id = auth.uid()
  )
);

-- Users can update their own shares
CREATE POLICY "Users can update their own shares"
ON public.public_shares
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.video_projects
    WHERE id = project_id AND user_id = auth.uid()
  )
);

-- Users can delete their own shares
CREATE POLICY "Users can delete their own shares"
ON public.public_shares
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.video_projects
    WHERE id = project_id AND user_id = auth.uid()
  )
);

-- Public read access for active, non-expired shares
CREATE POLICY "Anyone can view active shares"
ON public.public_shares
FOR SELECT
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
);