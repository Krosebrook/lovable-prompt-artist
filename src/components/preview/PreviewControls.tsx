import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Maximize, Minimize, ChevronLeft, ChevronRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface PreviewControlsProps {
  isPlaying: boolean;
  currentScene: number;
  totalScenes: number;
  onPlayPause: () => void;
  onRestart: () => void;
  onSeek: (sceneIndex: number) => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
}

export const PreviewControls = ({
  isPlaying,
  currentScene,
  totalScenes,
  onPlayPause,
  onRestart,
  onSeek,
  onFullscreen,
  isFullscreen
}: PreviewControlsProps) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
      <div className="space-y-3">
        {/* Timeline */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white">Scene {currentScene + 1}</span>
          <Slider
            value={[currentScene]}
            min={0}
            max={totalScenes - 1}
            step={1}
            onValueChange={(value) => onSeek(value[0])}
            className="flex-1"
          />
          <span className="text-xs text-white">{totalScenes}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onRestart}
              className="text-white hover:bg-white/20"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSeek(Math.max(0, currentScene - 1))}
              disabled={currentScene === 0}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onPlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSeek(Math.min(totalScenes - 1, currentScene + 1))}
              disabled={currentScene === totalScenes - 1}
              className="text-white hover:bg-white/20"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onFullscreen}
            className="text-white hover:bg-white/20"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
