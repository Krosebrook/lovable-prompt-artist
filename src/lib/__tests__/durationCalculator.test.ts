import { describe, it, expect } from "vitest";
import {
  parseDuration,
  formatDuration,
  calculateTotalDuration,
  getTotalSeconds,
  calculateScenePercentages,
  type Scene,
} from "../durationCalculator";

describe("parseDuration", () => {
  describe("colon format (MM:SS)", () => {
    it("parses 1:30 as 90 seconds", () => {
      expect(parseDuration("1:30")).toBe(90);
    });

    it("parses 2:45 as 165 seconds", () => {
      expect(parseDuration("2:45")).toBe(165);
    });

    it("parses 0:30 as 30 seconds", () => {
      expect(parseDuration("0:30")).toBe(30);
    });
  });

  describe("seconds format", () => {
    it("parses '30s' as 30 seconds", () => {
      expect(parseDuration("30s")).toBe(30);
    });

    it("parses '45 seconds' as 45 seconds", () => {
      expect(parseDuration("45 seconds")).toBe(45);
    });

    it("parses '10 sec' as 10 seconds", () => {
      expect(parseDuration("10 sec")).toBe(10);
    });

    it("parses '15 second' as 15 seconds", () => {
      expect(parseDuration("15 second")).toBe(15);
    });
  });

  describe("minutes format", () => {
    it("parses '2m' as 120 seconds", () => {
      expect(parseDuration("2m")).toBe(120);
    });

    it("parses '2 min' as 120 seconds", () => {
      expect(parseDuration("2 min")).toBe(120);
    });

    it("parses '3 minutes' as 180 seconds", () => {
      expect(parseDuration("3 minutes")).toBe(180);
    });
  });

  describe("combined format", () => {
    it("parses '1 min 30 sec' as 90 seconds", () => {
      expect(parseDuration("1 min 30 sec")).toBe(90);
    });

    it("parses '2 minutes 15 seconds' as 135 seconds", () => {
      expect(parseDuration("2 minutes 15 seconds")).toBe(135);
    });
  });

  describe("plain number format", () => {
    it("parses '30' as 30 seconds", () => {
      expect(parseDuration("30")).toBe(30);
    });
  });

  describe("edge cases", () => {
    it("returns 0 for empty string", () => {
      expect(parseDuration("")).toBe(0);
    });

    it("returns 0 for undefined", () => {
      // @ts-expect-error testing undefined input
      expect(parseDuration(undefined)).toBe(0);
    });

    it("handles whitespace", () => {
      expect(parseDuration("  30 seconds  ")).toBe(30);
    });

    it("handles uppercase", () => {
      expect(parseDuration("30 SECONDS")).toBe(30);
    });
  });
});

describe("formatDuration", () => {
  describe("long format", () => {
    it("formats 0 seconds as '0 sec'", () => {
      expect(formatDuration(0)).toBe("0 sec");
    });

    it("formats 30 seconds as '30 sec'", () => {
      expect(formatDuration(30)).toBe("30 sec");
    });

    it("formats 60 seconds as '1 min'", () => {
      expect(formatDuration(60)).toBe("1 min");
    });

    it("formats 90 seconds as '1 min 30 sec'", () => {
      expect(formatDuration(90)).toBe("1 min 30 sec");
    });

    it("formats 120 seconds as '2 min'", () => {
      expect(formatDuration(120)).toBe("2 min");
    });
  });

  describe("short format", () => {
    it("formats 30 seconds as '30s'", () => {
      expect(formatDuration(30, "short")).toBe("30s");
    });

    it("formats 60 seconds as '1m'", () => {
      expect(formatDuration(60, "short")).toBe("1m");
    });

    it("formats 90 seconds as '1:30'", () => {
      expect(formatDuration(90, "short")).toBe("1:30");
    });

    it("formats 65 seconds as '1:05'", () => {
      expect(formatDuration(65, "short")).toBe("1:05");
    });
  });
});

describe("calculateTotalDuration", () => {
  it("calculates total duration from multiple scenes", () => {
    const scenes: Scene[] = [
      { sceneNumber: 1, duration: "30 seconds", voiceOver: "", visualDescription: "" },
      { sceneNumber: 2, duration: "1:00", voiceOver: "", visualDescription: "" },
      { sceneNumber: 3, duration: "45s", voiceOver: "", visualDescription: "" },
    ];

    expect(calculateTotalDuration(scenes)).toBe("2 min 15 sec");
  });

  it("handles empty scenes array", () => {
    expect(calculateTotalDuration([])).toBe("0 sec");
  });
});

describe("getTotalSeconds", () => {
  it("returns total seconds from scenes", () => {
    const scenes: Scene[] = [
      { sceneNumber: 1, duration: "30 seconds", voiceOver: "", visualDescription: "" },
      { sceneNumber: 2, duration: "30 seconds", voiceOver: "", visualDescription: "" },
    ];

    expect(getTotalSeconds(scenes)).toBe(60);
  });
});

describe("calculateScenePercentages", () => {
  it("calculates correct percentages for scenes", () => {
    const scenes: Scene[] = [
      { sceneNumber: 1, duration: "30 seconds", voiceOver: "", visualDescription: "" },
      { sceneNumber: 2, duration: "30 seconds", voiceOver: "", visualDescription: "" },
    ];

    const result = calculateScenePercentages(scenes);

    expect(result).toEqual([
      { sceneNumber: 1, percentage: 50 },
      { sceneNumber: 2, percentage: 50 },
    ]);
  });

  it("returns empty array for no scenes", () => {
    expect(calculateScenePercentages([])).toEqual([]);
  });

  it("returns empty array when total duration is 0", () => {
    const scenes: Scene[] = [
      { sceneNumber: 1, duration: "", voiceOver: "", visualDescription: "" },
    ];

    expect(calculateScenePercentages(scenes)).toEqual([]);
  });
});
