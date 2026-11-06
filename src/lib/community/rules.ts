// Community forum validation rules — shared by the UI and server functions.

export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
export const REPORT_REASONS = ["spam", "harassment", "medical-advice", "personal-info", "other"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REACTION_KINDS = ["heart", "support", "helpful"] as const;
export type ReactionKind = (typeof REACTION_KINDS)[number];

export const TITLE_MIN = 3;
export const TITLE_MAX = 140;
export const BODY_MAX = 5000;
export const COMMENT_MAX = 2000;
export const BIO_MAX = 300;

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) return "community.usernameInvalid";
  return null;
}

export function validatePost(title: string, body: string): string | null {
  const t = title.trim();
  const b = body.trim();
  if (t.length < TITLE_MIN || t.length > TITLE_MAX) return "community.titleInvalid";
  if (b.length < 1 || b.length > BODY_MAX) return "community.bodyInvalid";
  return null;
}

export function validateComment(body: string): string | null {
  const b = body.trim();
  if (b.length < 1 || b.length > COMMENT_MAX) return "community.commentInvalid";
  return null;
}

export function isReportReason(value: string): value is ReportReason {
  return (REPORT_REASONS as readonly string[]).includes(value);
}

export function isReactionKind(value: string): value is ReactionKind {
  return (REACTION_KINDS as readonly string[]).includes(value);
}

/** Posts and comments are soft-deleted; hidden means a moderator removed it from view. */
export type ContentStatus = "visible" | "hidden" | "deleted";
