import { useEffect } from "react";
import { useI18n, type Lang } from "@/lib/i18n";
import ru from "@/locales/ui.ru.json";
import de from "@/locales/ui.de.json";
import salon from "@/locales/salon.json";
import uk from "@/locales/salon.uk.json";
import { Button } from "@/components/ui/button";
import { useLocation } from "@tanstack/react-router";

/**
 * Translates English text written directly in screens (not yet keyed in i18n)
 * using exact-match dictionaries keyed by the English source string.
 * Originals are remembered so switching back to English restores them.
 */
const DICTS: Partial<Record<Lang, Record<string, string>>> = { ru: { ...salon.ru, ...ru }, de: { ...salon.de, ...de }, uk };
const ATTRS = ["placeholder", "aria-label", "title", "alt"] as const;
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE"]);

const textOrig = new WeakMap<Text, string>();
const attrOrig = new WeakMap<Element, Record<string, string>>();

function lookup(dict: Record<string, string> | undefined, src: string) {
  if (!dict) return undefined;
  const trimmed = src.replace(/\s+/g, " ").trim();
  if (!trimmed) return undefined;
  const hit = dict[trimmed] ?? dict[trimmed + " "];
  if (!hit) return undefined;
  const lead = src.match(/^\s*/)?.[0] ?? "";
  const trail = src.match(/\s*$/)?.[0] ?? "";
  return lead + hit.trim() + trail;
}

function skipped(el: Element | null) {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP.has(e.tagName) || e.hasAttribute("data-no-translate") || (e as HTMLElement).isContentEditable) return true;
  }
  return false;
}

function translateText(node: Text, dict?: Record<string, string>) {
  if (skipped(node.parentElement)) return;
  const known = textOrig.get(node);
  const current = node.nodeValue ?? "";
  // If React replaced the text since our last pass, treat it as the new source.
  const matchesKnown = known !== undefined && (current === known || Object.values(DICTS).some(d => current === lookup(d, known)));
  const source = known !== undefined && matchesKnown ? known : current;
  textOrig.set(node, source);
  const next = lookup(dict, source) ?? source;
  if (node.nodeValue !== next) node.nodeValue = next;
}

function translateAttrs(el: Element, dict?: Record<string, string>) {
  if (skipped(el)) return;
  const store = attrOrig.get(el) ?? {};
  for (const a of ATTRS) {
    const cur = el.getAttribute(a);
    if (cur == null) continue;
    const known = store[a];
    const source = known !== undefined && (cur === known || Object.values(DICTS).some(d => cur === lookup(d, known))) ? known : cur;
    store[a] = source;
    const next = lookup(dict, source) ?? source;
    if (cur !== next) el.setAttribute(a, next);
  }
  attrOrig.set(el, store);
}

function walk(root: Node, dict?: Record<string, string>) {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text, dict);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  translateAttrs(root as Element, dict);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) translateText(n as Text, dict);
    else translateAttrs(n as Element, dict);
  }
}

export function AutoTranslate() {
  const { lang } = useI18n();
  useEffect(() => {
    const dict = DICTS[lang];
    document.documentElement.lang = lang;
    walk(document.body, dict);
    const obs = new MutationObserver((muts) => {
      obs.disconnect();
      for (const m of muts) {
        if (m.type === "characterData") translateText(m.target as Text, dict);
        else if (m.type === "attributes") translateAttrs(m.target as Element, dict);
        else m.addedNodes.forEach((n) => walk(n, dict));
      }
      observe();
    });
    const observe = () =>
      obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    observe();
    return () => obs.disconnect();
  }, [lang]);
  return null;
}

const LABELS: Record<Lang, string> = { en: "EN", de: "DE", ru: "RU", uk: "UK" };

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const isSalon = useLocation({ select: location => location.pathname.startsWith('/hair/') });
  const languages: Lang[] = isSalon ? ["en", "de", "ru", "uk"] : ["en", "de", "ru"];
  return (
    <div data-no-translate className={`flex gap-1 rounded-full border border-border bg-card/90 p-1 backdrop-blur ${className}`}>
      {languages.map((l) => (
        <Button
          key={l}
          type="button"
          variant="ghost"
          aria-label={l === "en" ? "English" : l === "de" ? "Deutsch" : l === "uk" ? "Українська" : "Русский"}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`h-auto rounded-full px-2.5 py-1 text-xs font-medium ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
        >
          {LABELS[l]}
        </Button>
      ))}
    </div>
  );
}
