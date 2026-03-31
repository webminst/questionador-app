import { describe, it, expect } from "vitest";
import { triggerConfetti, triggerConfettiBurst } from "./confetti";

describe("confetti", () => {
  it("should export triggerConfetti function", () => {
    expect(typeof triggerConfetti).toBe("function");
  });

  it("should export triggerConfettiBurst function", () => {
    expect(typeof triggerConfettiBurst).toBe("function");
  });

  it("should not throw when calling triggerConfetti", () => {
    expect(() => {
      triggerConfetti();
    }).not.toThrow();
  });

  it("should not throw when calling triggerConfetti with options", () => {
    expect(() => {
      triggerConfetti({ duration: 2000, count: 50 });
    }).not.toThrow();
  });

  it("should not throw when calling triggerConfettiBurst", () => {
    expect(() => {
      triggerConfettiBurst();
    }).not.toThrow();
  });

  it("should handle edge case with duration 0", () => {
    expect(() => {
      triggerConfetti({ duration: 0, count: 1 });
    }).not.toThrow();
  });

  it("should handle large count", () => {
    expect(() => {
      triggerConfetti({ count: 1000 });
    }).not.toThrow();
  });

  it("should accept custom duration", () => {
    expect(() => {
      triggerConfetti({ duration: 5000 });
    }).not.toThrow();
  });
});

