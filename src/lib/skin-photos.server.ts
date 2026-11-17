// Consented skin-check photos. Only the server touches the table and private bucket.
export const SKIN_PHOTO_BUCKET = "skin-check-photos";
// Accounts allowed to review consented photos (verified server-side by user id).
export const PHOTO_ADMIN_IDS = new Set(["81795335-cfd9-4645-aed1-bf88d5e22742"]);
export const MAX_PHOTOS_PER_DEVICE_PER_DAY = 10;

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const deviceHash = (key: string) => sha256(`rose-ai-device:${key}`);

export function validDeviceKey(k: unknown): k is string {
  return typeof k === "string" && /^[a-zA-Z0-9-]{20,64}$/.test(k);
}
