import { describe, it, expect } from "vitest";
import {
  SceneSchema,
  VideoScriptSchema,
  GenerateScriptInputSchema,
  GenerateShareLinkInputSchema,
  AuthCredentialsSchema,
  validateInput,
} from "../validation/schemas";

describe("SceneSchema", () => {
  it("validates a valid scene", () => {
    const scene = {
      sceneNumber: 1,
      duration: "30 seconds",
      voiceOver: "Welcome to our video",
      visualDescription: "Wide shot of landscape",
    };

    const result = SceneSchema.safeParse(scene);
    expect(result.success).toBe(true);
  });

  it("accepts optional notes", () => {
    const scene = {
      sceneNumber: 1,
      duration: "30 seconds",
      voiceOver: "Welcome",
      visualDescription: "Wide shot",
      notes: "Use warm lighting",
    };

    const result = SceneSchema.safeParse(scene);
    expect(result.success).toBe(true);
  });

  it("rejects invalid scene number", () => {
    const scene = {
      sceneNumber: -1,
      duration: "30 seconds",
      voiceOver: "Welcome",
      visualDescription: "Wide shot",
    };

    const result = SceneSchema.safeParse(scene);
    expect(result.success).toBe(false);
  });

  it("rejects empty duration", () => {
    const scene = {
      sceneNumber: 1,
      duration: "",
      voiceOver: "Welcome",
      visualDescription: "Wide shot",
    };

    const result = SceneSchema.safeParse(scene);
    expect(result.success).toBe(false);
  });
});

describe("VideoScriptSchema", () => {
  it("validates a valid script", () => {
    const script = {
      title: "My Video",
      scenes: [
        {
          sceneNumber: 1,
          duration: "30 seconds",
          voiceOver: "Welcome",
          visualDescription: "Wide shot",
        },
      ],
    };

    const result = VideoScriptSchema.safeParse(script);
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const script = {
      title: "",
      scenes: [
        {
          sceneNumber: 1,
          duration: "30 seconds",
          voiceOver: "Welcome",
          visualDescription: "Wide shot",
        },
      ],
    };

    const result = VideoScriptSchema.safeParse(script);
    expect(result.success).toBe(false);
  });

  it("rejects script with no scenes", () => {
    const script = {
      title: "My Video",
      scenes: [],
    };

    const result = VideoScriptSchema.safeParse(script);
    expect(result.success).toBe(false);
  });

  it("rejects title that is too long", () => {
    const script = {
      title: "A".repeat(201),
      scenes: [
        {
          sceneNumber: 1,
          duration: "30 seconds",
          voiceOver: "Welcome",
          visualDescription: "Wide shot",
        },
      ],
    };

    const result = VideoScriptSchema.safeParse(script);
    expect(result.success).toBe(false);
  });
});

describe("GenerateScriptInputSchema", () => {
  it("validates a valid topic", () => {
    const input = { topic: "How to make coffee" };
    const result = GenerateScriptInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects topic that is too short", () => {
    const input = { topic: "ab" };
    const result = GenerateScriptInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects topic that is too long", () => {
    const input = { topic: "a".repeat(1001) };
    const result = GenerateScriptInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects topic with script tags (XSS prevention)", () => {
    const input = { topic: "Test <script>alert('xss')</script>" };
    const result = GenerateScriptInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("GenerateShareLinkInputSchema", () => {
  it("validates valid input with expiry", () => {
    const input = {
      project_id: "550e8400-e29b-41d4-a716-446655440000",
      expires_in_days: 7,
    };
    const result = GenerateShareLinkInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("validates input with null expiry", () => {
    const input = {
      project_id: "550e8400-e29b-41d4-a716-446655440000",
      expires_in_days: null,
    };
    const result = GenerateShareLinkInputSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const input = {
      project_id: "not-a-uuid",
      expires_in_days: 7,
    };
    const result = GenerateShareLinkInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects expiry less than 1", () => {
    const input = {
      project_id: "550e8400-e29b-41d4-a716-446655440000",
      expires_in_days: 0,
    };
    const result = GenerateShareLinkInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects expiry greater than 365", () => {
    const input = {
      project_id: "550e8400-e29b-41d4-a716-446655440000",
      expires_in_days: 366,
    };
    const result = GenerateShareLinkInputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("AuthCredentialsSchema", () => {
  it("validates valid credentials", () => {
    const credentials = {
      email: "test@example.com",
      password: "Password123",
    };
    const result = AuthCredentialsSchema.safeParse(credentials);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const credentials = {
      email: "not-an-email",
      password: "Password123",
    };
    const result = AuthCredentialsSchema.safeParse(credentials);
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const credentials = {
      email: "test@example.com",
      password: "password123",
    };
    const result = AuthCredentialsSchema.safeParse(credentials);
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    const credentials = {
      email: "test@example.com",
      password: "PASSWORD123",
    };
    const result = AuthCredentialsSchema.safeParse(credentials);
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const credentials = {
      email: "test@example.com",
      password: "PasswordABC",
    };
    const result = AuthCredentialsSchema.safeParse(credentials);
    expect(result.success).toBe(false);
  });

  it("rejects password that is too short", () => {
    const credentials = {
      email: "test@example.com",
      password: "Pass1",
    };
    const result = AuthCredentialsSchema.safeParse(credentials);
    expect(result.success).toBe(false);
  });
});

describe("validateInput", () => {
  it("returns success with data for valid input", () => {
    const result = validateInput(GenerateScriptInputSchema, { topic: "Test topic" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.topic).toBe("Test topic");
    }
  });

  it("returns failure with errors for invalid input", () => {
    const result = validateInput(GenerateScriptInputSchema, { topic: "ab" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
