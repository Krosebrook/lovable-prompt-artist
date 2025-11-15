import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  created_at: string;
  details?: any;
}

interface ActivityFeedProps {
  projectId: string;
}

export const ActivityFeed = ({ projectId }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  useEffect(() => {
    loadActivities();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('activity')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activity_logs',
        filter: `project_id=eq.${projectId}`
      }, () => {
        loadActivities();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId]);

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: 'Created project',
      updated: 'Updated project',
      deleted: 'Deleted project',
      shared: 'Shared project',
      commented: 'Added comment',
      invited: 'Invited member'
    };
    return labels[action] || action;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 text-sm">
                <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                  <Activity className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1">
                  <p>{getActionLabel(activity.action)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
