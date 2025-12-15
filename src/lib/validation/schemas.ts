import { z } from "zod";

// Scene schema for video scripts
export const SceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  duration: z.string().min(1, "Duration is required"),
  voiceOver: z.string().min(1, "Voice over content is required"),
  visualDescription: z.string().min(1, "Visual description is required"),
  notes: z.string().optional(),
});

export type Scene = z.infer<typeof SceneSchema>;

// Video script schema
export const VideoScriptSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  scenes: z.array(SceneSchema).min(1, "At least one scene is required"),
});

export type VideoScript = z.infer<typeof VideoScriptSchema>;

// Project schema
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  topic: z.string().min(1).max(1000),
  script: VideoScriptSchema,
  storyboard_images: z.array(z.object({
    sceneNumber: z.number(),
    imageUrl: z.string().url(),
  })).optional(),
  total_duration: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

// Input validation for script generation
export const GenerateScriptInputSchema = z.object({
  topic: z.string()
    .min(3, "Topic must be at least 3 characters")
    .max(1000, "Topic must be less than 1000 characters")
    .refine(
      (val) => !/<[^>]*script/i.test(val),
      "Invalid characters detected"
    ),
});

export type GenerateScriptInput = z.infer<typeof GenerateScriptInputSchema>;

// Input validation for storyboard generation
export const GenerateStoryboardInputSchema = z.object({
  scene: SceneSchema,
});

export type GenerateStoryboardInput = z.infer<typeof GenerateStoryboardInputSchema>;

// Share link input validation
export const GenerateShareLinkInputSchema = z.object({
  project_id: z.string().uuid("Invalid project ID"),
  expires_in_days: z.number().int().min(1).max(365).nullable(),
});

export type GenerateShareLinkInput = z.infer<typeof GenerateShareLinkInputSchema>;

// User authentication schema
export const AuthCredentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type AuthCredentials = z.infer<typeof AuthCredentialsSchema>;

// Export options validation
export const ExportOptionsSchema = z.object({
  projectId: z.string().uuid(),
  resolution: z.enum(["720p", "1080p", "4k"]),
  fps: z.enum(["24", "30", "60"]).transform(Number) as unknown as z.ZodNumber,
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]),
});

export type ExportOptions = z.infer<typeof ExportOptionsSchema>;

// Analytics event schema
export const AnalyticsEventSchema = z.object({
  eventType: z.enum([
    "script_generated",
    "storyboard_generated",
    "project_saved",
    "project_shared",
    "project_exported",
    "project_deleted",
    "template_used",
  ]),
  projectId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

// Validation helper function
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
  };
}
