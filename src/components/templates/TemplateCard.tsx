import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

interface TemplateCardProps {
  template: {
    id: string;
    title: string;
    description: string;
    category: string;
    target_duration: string;
    scene_count: number;
    usage_count: number;
  };
  onSelect: (templateId: string) => void;
  onPreview: (templateId: string) => void;
}

export const TemplateCard = ({ template, onSelect, onPreview }: TemplateCardProps) => {
  const categoryColors: Record<string, string> = {
    ad: 'bg-red-500/10 text-red-500',
    explainer: 'bg-blue-500/10 text-blue-500',
    product_demo: 'bg-green-500/10 text-green-500',
    tutorial: 'bg-purple-500/10 text-purple-500',
    testimonial: 'bg-yellow-500/10 text-yellow-500',
    social_media: 'bg-pink-500/10 text-pink-500'
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.title}</CardTitle>
            <CardDescription className="mt-2">{template.description}</CardDescription>
          </div>
          <Badge className={categoryColors[template.category] || 'bg-muted'}>
            {template.category.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{template.target_duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{template.scene_count} scenes</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onPreview(template.id)} className="flex-1">
            Preview
          </Button>
          <Button size="sm" onClick={() => onSelect(template.id)} className="flex-1">
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
