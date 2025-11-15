import { useEffect, useRef, useState } from "react";
import { AnimationEngine, Scene, SceneData } from "@/lib/animationEngine";
import { PreviewControls } from "./PreviewControls";
import { SceneTransition } from "./SceneTransition";
import { VoiceOverOverlay } from "./VoiceOverOverlay";
import { KenBurnsEffect } from "./KenBurnsEffect";

interface AnimatedPreviewProps {
  scenes: Scene[];
  storyboardImages: string[];
}

export const AnimatedPreview = ({ scenes, storyboardImages }: AnimatedPreviewProps) => {
  const [engine] = useState(() => new AnimationEngine(scenes, storyboardImages));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScene, setCurrentScene] = useState<SceneData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    engine.onSceneChange = (data: SceneData) => {
      setCurrentScene(data);
    };

    engine.onComplete = () => {
      setIsPlaying(false);
    };

    return () => {
      engine.destroy();
    };
  }, [engine]);

  const handlePlayPause = () => {
    if (isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    engine.restart();
    setIsPlaying(true);
  };

  const handleSeek = (sceneIndex: number) => {
    engine.seekToScene(sceneIndex);
    setCurrentScene({
      scene: scenes[sceneIndex],
      sceneIndex,
      sceneProgress: 0,
      imageUrl: storyboardImages[sceneIndex]
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden">
      <div className="aspect-video relative">
        {currentScene ? (
          <>
            <SceneTransition isActive={true}>
              <KenBurnsEffect
                imageUrl={currentScene.imageUrl || ''}
                progress={currentScene.sceneProgress}
              />
            </SceneTransition>
            <VoiceOverOverlay
              text={currentScene.scene.voiceOver}
              progress={currentScene.sceneProgress}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Click play to start preview</p>
          </div>
        )}
      </div>

      <PreviewControls
        isPlaying={isPlaying}
        currentScene={currentScene?.sceneIndex || 0}
        totalScenes={scenes.length}
        onPlayPause={handlePlayPause}
        onRestart={handleRestart}
        onSeek={handleSeek}
        onFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />
    </div>
  );
};
