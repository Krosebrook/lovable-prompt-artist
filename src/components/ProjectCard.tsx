import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Download, Share2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  id: string;
  title: string;
  topic: string;
  created_at: string;
  total_duration?: string;
  storyboard_images?: { sceneNumber: number; imageUrl: string }[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
  onShare: (id: string) => void;
}

const ProjectCard = ({
  id,
  title,
  topic,
  created_at,
  total_duration,
  storyboard_images,
  onView,
  onDelete,
  onExport,
  onShare,
}: ProjectCardProps) => {
  const thumbnailUrl = storyboard_images?.[0]?.imageUrl;
  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-muted overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={`${title} thumbnail`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <span className="text-sm">No preview</span>
          </div>
        )}
        {total_duration && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm"
          >
            <Clock className="w-3 h-3 mr-1" />
            {total_duration}
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-1">{topic}</p>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button
          variant="default"
          size="sm"
          onClick={() => onView(id)}
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onShare(id)}
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExport(id)}
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
