import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface StoryboardImage {
  sceneNumber: number;
  imageUrl: string;
}

interface Scene {
  sceneNumber: number;
  visualDescription: string;
}

interface StoryboardDisplayProps {
  images: StoryboardImage[];
  scenes: Scene[];
  isGenerating: boolean;
}

const StoryboardDisplay = ({ images, scenes, isGenerating }: StoryboardDisplayProps) => {
  return (
    <Card className="shadow-card animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Storyboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenes.map((scene) => {
            const image = images.find((img) => img.sceneNumber === scene.sceneNumber);
            const isLoading = isGenerating && !image;

            return (
              <div
                key={scene.sceneNumber}
                className="space-y-3 animate-scale-in"
                style={{ animationDelay: `${scene.sceneNumber * 150}ms` }}
              >
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                        <p className="text-sm text-muted-foreground">Generating scene {scene.sceneNumber}...</p>
                      </div>
                    </div>
                  ) : image ? (
                    <img
                      src={image.imageUrl}
                      alt={`Scene ${scene.sceneNumber}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">No image available</p>
                    </div>
                  )}
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">
                    Scene {scene.sceneNumber}
                  </Badge>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {scene.visualDescription}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StoryboardDisplay;