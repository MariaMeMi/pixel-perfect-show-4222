import { trackEvent } from "./experiment.functions";

export type Experience = "redness" | "botox_information";
export type ExperimentEvent =
  | "analysis_started"
  | "analysis_completed"
  | "email_gate_viewed"
  | "email_submitted"
  | "results_viewed";

const SESSION_KEY = "rose.exp.session";
const EMAIL_FLAG = "rose.email.provided"; // only a yes-flag, never the address

function sessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Sends only event name + experience + random session id. No photos, results or emails. */
export function track(event: ExperimentEvent, experience: Experience) {
  if (typeof window === "undefined") return;
  void trackEvent({ data: { event, experience, sessionId: sessionId() } }).catch(() => undefined);
}

export function hasProvidedEmail() {
  return typeof window !== "undefined" && localStorage.getItem(EMAIL_FLAG) === "1";
}

export function markEmailProvided() {
  localStorage.setItem(EMAIL_FLAG, "1");
}
