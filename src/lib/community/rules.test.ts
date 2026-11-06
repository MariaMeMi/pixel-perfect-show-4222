import { describe, it, expect } from "vitest";
import {
  validateUsername,
  validatePost,
  validateComment,
  isReportReason,
  isReactionKind,
  TITLE_MAX,
  BODY_MAX,
  COMMENT_MAX,
} from "./rules";

describe("community rules", () => {
  it("accepts simple pseudonyms and rejects emails, spaces and names that are too short", () => {
    expect(validateUsername("rose_fan")).toBeNull();
    expect(validateUsername("ab")).not.toBeNull();
    expect(validateUsername("has space")).not.toBeNull();
    expect(validateUsername("jane@example.com")).not.toBeNull();
    expect(validateUsername("UPPER")).not.toBeNull();
  });
  it("enforces post title and body limits", () => {
    expect(validatePost("Hi", "body")).not.toBeNull();
    expect(validatePost("A".repeat(TITLE_MAX + 1), "body")).not.toBeNull();
    expect(validatePost("Good title", "")).not.toBeNull();
    expect(validatePost("Good title", "x".repeat(BODY_MAX + 1))).not.toBeNull();
    expect(validatePost("Good title", "Hello community")).toBeNull();
  });
  it("enforces comment limits", () => {
    expect(validateComment("")).not.toBeNull();
    expect(validateComment("x".repeat(COMMENT_MAX + 1))).not.toBeNull();
    expect(validateComment("Thanks for sharing")).toBeNull();
  });
  it("only allows known report reasons and reaction kinds", () => {
    expect(isReportReason("medical-advice")).toBe(true);
    expect(isReportReason("rude")).toBe(false);
    expect(isReactionKind("support")).toBe(true);
    expect(isReactionKind("dislike")).toBe(false);
  });
});
