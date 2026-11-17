import { useEffect, useState } from 'react';
import { z } from 'zod';
import { loadEntries } from '@/lib/storage';
import { ONBOARDING_KEY } from '@/lib/onboarding/flow';
import { buildPlan, budgetTier, emptyAnswers } from '@/lib/routine/engine';
import { FAVORITES_KEY, PREFERENCES_KEY, noPreferences, type Preferences } from './catalog';

export function useProductPreferences() {
  const [preferences, setPreferences] = useState<Preferences>(noPreferences);
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    try {
      const tags = new Set<string>();
      const onboarding = z.object({ goals: z.array(z.string()), symptoms: z.array(z.string()).default([]) }).safeParse(JSON.parse(localStorage.getItem(ONBOARDING_KEY) ?? '{}'));
      if (onboarding.success) {
        for (const tag of ['redness', 'dryness', 'lines']) if (onboarding.data.goals.includes(tag)) tags.add(tag);
        if (onboarding.data.symptoms.some(s => /burning|stinging|itching/i.test(s))) tags.add('sensitive');
      }
      const storedProfile = z.object({ skinType: z.string().optional(), sensitivity: z.string().optional() }).safeParse(JSON.parse(localStorage.getItem('rosea.profile.v1') ?? '{}'));
      if (storedProfile.success) {
        if (storedProfile.data.skinType === 'dry') tags.add('dryness');
        if (storedProfile.data.sensitivity === 'high' || storedProfile.data.skinType === 'sensitive') tags.add('sensitive');
      }
      const latest = loadEntries().at(-1);
      if (latest?.feeling === 'dry') tags.add('dryness');
      if (latest?.feeling && ['sensitive', 'burning', 'itchy'].includes(latest.feeling)) tags.add('sensitive');
      // Read explicit, saved routine preferences; don't invent medical concerns from a redness score.
      const answerSchema = z.object(Object.fromEntries(Object.entries(emptyAnswers).map(([key, value]) => [key, Array.isArray(value) ? z.array(z.string()) : z.string()])));
      const raw = JSON.parse(localStorage.getItem('rose.routine.v1') ?? localStorage.getItem(PREFERENCES_KEY) ?? '{}');
      const answers = answerSchema.safeParse(raw.answers);
      let budget = 0, rescue = false, urgent = false;
      if (answers.success) {
        const a = { ...emptyAnswers, ...answers.data };
        const plan = buildPlan(a);
        plan.tags.forEach(tag => tags.add(tag));
        budget = budgetTier(a.budget); rescue = plan.rescue; urgent = Boolean(plan.urgent);
      }
      setPreferences({ tags: [...tags], budget, rescue, urgent, sensitive: tags.has('sensitive') });
      const saved = z.array(z.string()).safeParse(JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]'));
      if (saved.success) setFavorites(saved.data);
    } catch { /* Malformed device data must not prevent catalog browsing. */ }
  }, []);
  function toggleFavorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); setFavorites(next); }
    catch { return false; }
    return true;
  }
  return { preferences, favorites, toggleFavorite };
}