import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { unlockAnalysis } from "@/lib/pro/analysis.functions";
import { loadEntries, updateEntry } from "@/lib/storage";
import type { Analysis } from "@/lib/types";

/** Once paid access is confirmed, fetches the withheld full analysis from the server. */
export function useUnlockAnalysis(analysis: Analysis | undefined, isPaid: boolean, onUnlocked: (full: Analysis) => void) {
  const unlock = useServerFn(unlockAnalysis);
  const tried = useRef<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const needs = !!(isPaid && analysis?.locked && analysis.resultId);
  useEffect(() => {
    if (!needs || !analysis?.resultId || tried.current === analysis.resultId) return;
    const id = analysis.resultId;
    tried.current = id;
    setUnlocking(true);
    void unlock({ data: { resultId: id } })
      .then((r) => {
        if ("result" in r) {
          const full = { ...r.result, locked: false };
          // Replace any saved history entry that holds the preview of this reading.
          for (const e of loadEntries()) if (e.analysis.resultId === id) updateEntry(e.id, { analysis: full });
          onUnlocked(full);
        }
      })
      .catch(() => undefined)
      .finally(() => setUnlocking(false));
  }, [needs, analysis?.resultId]); // eslint-disable-line react-hooks/exhaustive-deps
  return { unlocking: needs && unlocking };
}
