import { trackEvent, type EVENTS } from "./experiment.functions";

export type Experience = "redness" | "botox_information" | "skin_journey" | "onboarding" | "routine";
export type ExperimentEvent = (typeof EVENTS)[number];

const SESSION_KEY = "rose.exp.session";
const EMAIL_FLAG = "rose.email.provided"; // only a yes-flag, never the address
const MY_REF = "rose.ref.mine";
const REFERRED_BY = "rose.ref.by";
const REF_FIRST = "rose.ref.firstCheckin";

function sessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Sends only event name + experience + random session id (+ random referral code). */
export function track(event: ExperimentEvent, experience: Experience, referralCode?: string) {
  if (typeof window === "undefined") return;
  void trackEvent({ data: { event, experience, sessionId: sessionId(), referralCode } }).catch(
    () => undefined,
  );
}

export function hasProvidedEmail() {
  return typeof window !== "undefined" && localStorage.getItem(EMAIL_FLAG) === "1";
}

export function markEmailProvided() {
  localStorage.setItem(EMAIL_FLAG, "1");
}

/* ---------- referrals (random codes, never user ids) ---------- */

export function myReferralCode() {
  let code = localStorage.getItem(MY_REF);
  if (!code) {
    const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    code = Array.from(bytes, (b) => abc[b % abc.length]).join("");
    localStorage.setItem(MY_REF, code);
    track("referral_link_created", "skin_journey", code);
  }
  return code;
}

export function referralUrl() {
  return `${window.location.origin}/join?ref=${myReferralCode()}`;
}

export function referredBy(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(REFERRED_BY) ?? undefined;
}

export function setReferredBy(code: string) {
  if (!/^[A-Za-z0-9]{6,16}$/.test(code)) return false;
  if (code === localStorage.getItem(MY_REF)) return false;
  localStorage.setItem(REFERRED_BY, code);
  return true;
}

/** Call after a check-in is saved; fires once per referred device. */
export function noteReferredCheckin() {
  const ref = referredBy();
  if (!ref || localStorage.getItem(REF_FIRST)) return;
  localStorage.setItem(REF_FIRST, "1");
  track("referral_first_checkin", "skin_journey", ref);
  track("referred_user_completed_first_checkin", "skin_journey", ref);
}
