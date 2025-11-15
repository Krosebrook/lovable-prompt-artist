import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Users } from "lucide-react";

interface Scene {
  sceneNumber: number;
  duration: string;
  voiceOverPrompt: string;
  visualPrompt: string;
}

interface TemplateStructure {
  totalScenes: number;
  targetDuration: string;
  scenes: Scene[];
  generationHints: string[];
}

interface TemplatePreviewProps {
  template: {
    title: string;
    description: string;
    category: string;
    target_duration: string;
    scene_count: number;
    template_structure: TemplateStructure;
  } | null;
  open: boolean;
  onClose: () => void;
}

export const TemplatePreview = ({ template, open, onClose }: TemplatePreviewProps) => {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{template.title}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Badge>{template.category.replace('_', ' ')}</Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{template.target_duration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{template.scene_count} scenes</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Scene Structure</h3>
            <div className="space-y-4">
              {template.template_structure.scenes.map((scene) => (
                <div key={scene.sceneNumber} className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Scene {scene.sceneNumber}</h4>
                    <Badge variant="outline">{scene.duration}</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Voice Over: </span>
                      <span>{scene.voiceOverPrompt}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Visual: </span>
                      <span>{scene.visualPrompt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {template.template_structure.generationHints && (
            <div>
              <h3 className="font-semibold mb-2">Generation Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {template.template_structure.generationHints.map((hint, i) => (
                  <li key={i}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
