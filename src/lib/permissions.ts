import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin' | 'editor' | 'viewer';

export const hasPermission = async (
  projectId: string,
  action: 'view' | 'edit' | 'comment' | 'manage_collaborators' | 'delete'
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if user is project owner
    const { data: project } = await supabase
      .from('video_projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (project?.user_id === user.id) return true;

    // Check collaborator role
    const { data: collaborator } = await (supabase as any)
      .from('project_collaborators')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!collaborator) return false;

    const rolePermissions: Record<AppRole, string[]> = {
      admin: ['view', 'edit', 'comment', 'manage_collaborators', 'delete'],
      editor: ['view', 'edit', 'comment'],
      viewer: ['view', 'comment']
    };

    return rolePermissions[collaborator.role as AppRole]?.includes(action) || false;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};

export const getUserRole = async (projectId: string): Promise<AppRole | 'owner' | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: project } = await supabase
      .from('video_projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (project?.user_id === user.id) return 'owner';

    const { data: collaborator } = await (supabase as any)
      .from('project_collaborators')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    return (collaborator?.role as AppRole) || null;
  } catch (error) {
    console.error('Failed to get user role:', error);
    return null;
  }
};
