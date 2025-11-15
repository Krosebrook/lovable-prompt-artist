import { parseDuration } from "./durationCalculator";

export interface Scene {
  sceneNumber: number;
  duration: string;
  voiceOver: string;
  visualDescription: string;
}

export interface SceneData {
  scene: Scene;
  sceneIndex: number;
  sceneProgress: number;
  imageUrl?: string;
}

export class AnimationEngine {
  private scenes: Scene[];
  private storyboardImages: string[];
  private currentSceneIndex: number = 0;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1;
  public onSceneChange?: (data: SceneData) => void;
  public onComplete?: () => void;
  private animationFrameId?: number;

  constructor(
    scenes: Scene[],
    images: string[],
    callbacks?: {
      onSceneChange?: (data: SceneData) => void;
      onComplete?: () => void;
    }
  ) {
    this.scenes = scenes;
    this.storyboardImages = images;
    this.onSceneChange = callbacks?.onSceneChange;
    this.onComplete = callbacks?.onComplete;
  }

  play() {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.startTime = Date.now() - this.pausedTime;
    this.animate();
  }

  pause() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    this.pausedTime = Date.now() - this.startTime;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  restart() {
    this.pause();
    this.currentSceneIndex = 0;
    this.startTime = 0;
    this.pausedTime = 0;
    this.play();
  }

  seekToScene(sceneIndex: number) {
    if (sceneIndex < 0 || sceneIndex >= this.scenes.length) return;
    
    let cumulativeTime = 0;
    for (let i = 0; i < sceneIndex; i++) {
      cumulativeTime += parseDuration(this.scenes[i].duration) * 1000;
    }
    
    this.pausedTime = cumulativeTime;
    this.currentSceneIndex = sceneIndex;
    
    if (this.isPlaying) {
      this.startTime = Date.now() - this.pausedTime;
    }
  }

  setPlaybackSpeed(speed: number) {
    const currentTime = this.getCurrentTime();
    this.playbackSpeed = speed;
    this.pausedTime = currentTime;
    
    if (this.isPlaying) {
      this.startTime = Date.now() - this.pausedTime;
    }
  }

  getCurrentTime(): number {
    if (this.isPlaying) {
      return (Date.now() - this.startTime) * this.playbackSpeed;
    }
    return this.pausedTime;
  }

  getTotalDuration(): number {
    return this.scenes.reduce((total, scene) => {
      return total + parseDuration(scene.duration) * 1000;
    }, 0);
  }

  private animate() {
    if (!this.isPlaying) return;

    const elapsed = this.getCurrentTime();
    const sceneData = this.getSceneAtTime(elapsed);

    if (sceneData) {
      this.renderScene(sceneData);
      this.animationFrameId = requestAnimationFrame(() => this.animate());
    } else {
      // Animation complete
      this.isPlaying = false;
      this.onComplete?.();
    }
  }

  private getSceneAtTime(elapsedMs: number): SceneData | null {
    let cumulativeTime = 0;
    
    for (let i = 0; i < this.scenes.length; i++) {
      const sceneDuration = parseDuration(this.scenes[i].duration) * 1000;
      
      if (elapsedMs < cumulativeTime + sceneDuration) {
        return {
          scene: this.scenes[i],
          sceneIndex: i,
          sceneProgress: (elapsedMs - cumulativeTime) / sceneDuration,
          imageUrl: this.storyboardImages[i]
        };
      }
      
      cumulativeTime += sceneDuration;
    }
    
    return null;
  }

  private renderScene(data: SceneData) {
    if (this.currentSceneIndex !== data.sceneIndex) {
      this.currentSceneIndex = data.sceneIndex;
      this.onSceneChange?.(data);
    }
  }

  destroy() {
    this.pause();
    this.onSceneChange = undefined;
    this.onComplete = undefined;
  }
}
