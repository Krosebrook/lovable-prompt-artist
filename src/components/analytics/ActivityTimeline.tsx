import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Image, Share2, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  event_type: string;
  created_at: string;
  metadata?: any;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'script_generated':
      return FileText;
    case 'storyboard_generated':
      return Image;
    case 'project_shared':
      return Share2;
    case 'project_exported':
      return Download;
    default:
      return FileText;
  }
};

const getEventLabel = (eventType: string) => {
  const labels: Record<string, string> = {
    script_generated: 'Generated script',
    storyboard_generated: 'Created storyboard',
    project_saved: 'Saved project',
    project_shared: 'Shared project',
    project_exported: 'Exported to PDF',
    template_used: 'Used template'
  };
  return labels[eventType] || eventType;
};

export const ActivityTimeline = ({ activities }: ActivityTimelineProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            activities.map((activity) => {
              const Icon = getEventIcon(activity.event_type);
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{getEventLabel(activity.event_type)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
