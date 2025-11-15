import { Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  calculateTotalDuration,
  getTotalSeconds,
  calculateScenePercentages,
  formatDuration,
} from "@/lib/durationCalculator";

interface Scene {
  sceneNumber: number;
  duration: string;
  voiceOver: string;
  visualDescription: string;
  notes?: string;
}

interface DurationSummaryProps {
  scenes: Scene[];
}

const DurationSummary = ({ scenes }: DurationSummaryProps) => {
  const totalDuration = calculateTotalDuration(scenes);
  const totalSeconds = getTotalSeconds(scenes);
  const scenePercentages = calculateScenePercentages(scenes);

  // Warning if video is too long (>5 minutes for social media)
  const isLongVideo = totalSeconds > 300;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-primary" />
          Duration Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Duration:</span>
          <Badge variant="secondary" className="text-base font-semibold">
            {totalDuration}
          </Badge>
        </div>

        {isLongVideo && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-600 dark:text-amber-400">
              <span className="font-semibold">Long video detected:</span> Consider keeping
              social media videos under 5 minutes for better engagement.
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Scene Breakdown:</h4>
          {scenes.map((scene, index) => {
            const percentage = scenePercentages[index]?.percentage || 0;
            return (
              <div key={scene.sceneNumber} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Scene {scene.sceneNumber}
                  </span>
                  <span className="text-foreground font-medium">
                    {scene.duration} ({percentage}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-1.5" />
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Total Scenes:</span>
              <span className="text-foreground font-medium">{scenes.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg. Scene Duration:</span>
              <span className="text-foreground font-medium">
                {formatDuration(Math.round(totalSeconds / scenes.length))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DurationSummary;
