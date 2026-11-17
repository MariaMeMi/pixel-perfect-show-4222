const KEY = "rose_device_key";
/** Random per-device key so guests can later delete photos they chose to share. */
export function deviceKey(): string {
  let k = localStorage.getItem(KEY);
  if (!k) { k = crypto.randomUUID(); localStorage.setItem(KEY, k); }
  return k;
}
