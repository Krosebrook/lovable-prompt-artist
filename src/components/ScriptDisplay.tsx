import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Scene {
  sceneNumber: number;
  duration: string;
  voiceOver: string;
  visualDescription: string;
  notes?: string;
}

interface ScriptDisplayProps {
  title: string;
  scenes: Scene[];
}

const ScriptDisplay = ({ title, scenes }: ScriptDisplayProps) => {
  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {scenes.map((scene) => (
          <div
            key={scene.sceneNumber}
            className="border-l-4 border-primary pl-4 space-y-2 animate-scale-in"
            style={{ animationDelay: `${scene.sceneNumber * 100}ms` }}
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-semibold">
                Scene {scene.sceneNumber}
              </Badge>
              <span className="text-sm text-muted-foreground">{scene.duration}</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm font-semibold text-primary mb-1">Voice Over:</p>
                <p className="text-sm text-foreground leading-relaxed">{scene.voiceOver}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-accent mb-1">Visual:</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {scene.visualDescription}
                </p>
              </div>
              {scene.notes && (
                <div>
                  <p className="text-sm font-semibold text-secondary mb-1">Notes:</p>
                  <p className="text-sm text-muted-foreground italic">{scene.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ScriptDisplay;