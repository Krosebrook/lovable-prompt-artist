/**
 * Input validation utilities for Edge Functions
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validate generate script input
 */
export function validateGenerateScriptInput(body: unknown): ValidationResult<{ topic: string }> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }

  const { topic } = body as Record<string, unknown>;

  if (!topic || typeof topic !== 'string') {
    return { success: false, error: 'Topic is required and must be a string' };
  }

  const trimmedTopic = topic.trim();

  if (trimmedTopic.length < 3) {
    return { success: false, error: 'Topic must be at least 3 characters' };
  }

  if (trimmedTopic.length > 1000) {
    return { success: false, error: 'Topic must be less than 1000 characters' };
  }

  // Basic XSS prevention
  if (/<[^>]*script/i.test(trimmedTopic)) {
    return { success: false, error: 'Invalid characters in topic' };
  }

  return { success: true, data: { topic: trimmedTopic } };
}

/**
 * Validate scene input for storyboard generation
 */
export function validateSceneInput(body: unknown): ValidationResult<{ scene: Scene }> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }

  const { scene } = body as Record<string, unknown>;

  if (!scene || typeof scene !== 'object') {
    return { success: false, error: 'Scene object is required' };
  }

  const sceneObj = scene as Record<string, unknown>;

  if (typeof sceneObj.sceneNumber !== 'number' || sceneObj.sceneNumber < 1) {
    return { success: false, error: 'Valid scene number is required' };
  }

  if (typeof sceneObj.visualDescription !== 'string' || !sceneObj.visualDescription.trim()) {
    return { success: false, error: 'Visual description is required' };
  }

  if (sceneObj.visualDescription.length > 2000) {
    return { success: false, error: 'Visual description too long' };
  }

  return {
    success: true,
    data: {
      scene: {
        sceneNumber: sceneObj.sceneNumber,
        duration: String(sceneObj.duration || ''),
        voiceOver: String(sceneObj.voiceOver || ''),
        visualDescription: String(sceneObj.visualDescription),
        notes: sceneObj.notes ? String(sceneObj.notes) : undefined,
      },
    },
  };
}

/**
 * Validate share link input
 */
export function validateShareLinkInput(body: unknown): ValidationResult<{
  project_id: string;
  expires_in_days: number | null;
}> {
  if (!body || typeof body !== 'object') {
    return { success: false, error: 'Invalid request body' };
  }

  const { project_id, expires_in_days } = body as Record<string, unknown>;

  if (!project_id || typeof project_id !== 'string') {
    return { success: false, error: 'Project ID is required' };
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(project_id)) {
    return { success: false, error: 'Invalid project ID format' };
  }

  let parsedExpiry: number | null = null;
  if (expires_in_days !== null && expires_in_days !== undefined) {
    if (typeof expires_in_days !== 'number' || !Number.isInteger(expires_in_days)) {
      return { success: false, error: 'Expiry days must be an integer' };
    }
    if (expires_in_days < 1 || expires_in_days > 365) {
      return { success: false, error: 'Expiry days must be between 1 and 365' };
    }
    parsedExpiry = expires_in_days;
  }

  return {
    success: true,
    data: { project_id, expires_in_days: parsedExpiry },
  };
}

// Types
interface Scene {
  sceneNumber: number;
  duration: string;
  voiceOver: string;
  visualDescription: string;
  notes?: string;
}
