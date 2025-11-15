export interface Scene {
  sceneNumber: number;
  duration: string;
  voiceOver: string;
  visualDescription: string;
  notes?: string;
}

/**
 * Parse various duration string formats to seconds
 * Supports: "30 seconds", "1:30", "90s", "1 min 30 sec", "2 minutes"
 */
export const parseDuration = (durationString: string): number => {
  if (!durationString) return 0;

  const str = durationString.toLowerCase().trim();

  // Format: "1:30" or "2:45"
  const colonMatch = str.match(/^(\d+):(\d+)$/);
  if (colonMatch) {
    const minutes = parseInt(colonMatch[1]);
    const seconds = parseInt(colonMatch[2]);
    return minutes * 60 + seconds;
  }

  // Format: "30s" or "45 seconds"
  const secondsMatch = str.match(/(\d+)\s*(?:s|sec|second|seconds)/);
  if (secondsMatch && !str.includes('min')) {
    return parseInt(secondsMatch[1]);
  }

  // Format: "2m" or "2 min" or "2 minutes"
  const minutesMatch = str.match(/(\d+)\s*(?:m|min|minute|minutes)/);
  if (minutesMatch) {
    const minutes = parseInt(minutesMatch[1]);
    // Check for additional seconds: "1 min 30 sec"
    const additionalSeconds = str.match(/(\d+)\s*(?:s|sec|second|seconds)/);
    const seconds = additionalSeconds ? parseInt(additionalSeconds[1]) : 0;
    return minutes * 60 + seconds;
  }

  // Default: try to parse as plain number (assume seconds)
  const numberMatch = str.match(/(\d+)/);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }

  return 0;
};

/**
 * Format seconds to human-readable duration
 * Examples: "2 min 30 sec", "45 sec", "1:30"
 */
export const formatDuration = (totalSeconds: number, format: 'long' | 'short' = 'long'): string => {
  if (totalSeconds === 0) return '0 sec';

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (format === 'short') {
    if (minutes === 0) return `${seconds}s`;
    if (seconds === 0) return `${minutes}m`;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  if (minutes === 0) {
    return `${seconds} sec`;
  }
  if (seconds === 0) {
    return `${minutes} min`;
  }
  return `${minutes} min ${seconds} sec`;
};

/**
 * Calculate total duration from all scenes
 */
export const calculateTotalDuration = (scenes: Scene[]): string => {
  const totalSeconds = scenes.reduce((sum, scene) => {
    return sum + parseDuration(scene.duration);
  }, 0);

  return formatDuration(totalSeconds);
};

/**
 * Get total duration in seconds
 */
export const getTotalSeconds = (scenes: Scene[]): number => {
  return scenes.reduce((sum, scene) => {
    return sum + parseDuration(scene.duration);
  }, 0);
};

/**
 * Calculate percentage of each scene relative to total
 */
export const calculateScenePercentages = (scenes: Scene[]): { sceneNumber: number; percentage: number }[] => {
  const totalSeconds = getTotalSeconds(scenes);
  if (totalSeconds === 0) return [];

  return scenes.map((scene) => ({
    sceneNumber: scene.sceneNumber,
    percentage: Math.round((parseDuration(scene.duration) / totalSeconds) * 100),
  }));
};
