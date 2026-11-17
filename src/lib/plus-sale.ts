import type { Lang } from "@/lib/i18n";

/** Rosea Plus purchases are paused for English users while the Pro price test runs. */
export function plusOnSale(lang: Lang | string): boolean {
  return lang !== "en";
}
