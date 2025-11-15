import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEvent = 
  | 'script_generated'
  | 'storyboard_generated'
  | 'project_saved'
  | 'project_shared'
  | 'project_exported'
  | 'project_deleted'
  | 'template_used';

export const logAnalyticsEvent = async (
  eventType: AnalyticsEvent,
  projectId?: string,
  metadata?: Record<string, any>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('project_analytics').insert({
      event_type: eventType,
      project_id: projectId,
      metadata: metadata
    });
  } catch (error) {
    console.error('Failed to log analytics event:', error);
  }
};

export const getAnalyticsSummary = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('project_analytics')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    const totalProjects = new Set(data?.map(d => d.project_id)).size;
    const scriptsGenerated = data?.filter(d => d.event_type === 'script_generated').length || 0;
    const storyboardsGenerated = data?.filter(d => d.event_type === 'storyboard_generated').length || 0;
    const projectsShared = data?.filter(d => d.event_type === 'project_shared').length || 0;

    return {
      totalProjects,
      scriptsGenerated,
      storyboardsGenerated,
      projectsShared,
      recentActivity: data?.slice(-10) || []
    };
  } catch (error) {
    console.error('Failed to get analytics summary:', error);
    return null;
  }
};
