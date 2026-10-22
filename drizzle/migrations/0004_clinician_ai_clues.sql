CREATE TABLE public.clinician_ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.clinician_cases(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.clinician_patients(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL,
  model TEXT NOT NULL,
  sections JSONB NOT NULL,
  sources JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.clinician_ai_analyses TO authenticated;
GRANT ALL ON public.clinician_ai_analyses TO service_role;
ALTER TABLE public.clinician_ai_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinicians read own AI analyses" ON public.clinician_ai_analyses FOR SELECT TO authenticated
  USING (clinician_id = auth.uid() AND public.can_access_clinician_patient(patient_id));
CREATE POLICY "Clinicians insert own AI analyses" ON public.clinician_ai_analyses FOR INSERT TO authenticated
  WITH CHECK (clinician_id = auth.uid() AND public.is_clinician() AND public.can_access_clinician_patient(patient_id));

CREATE TABLE public.clinician_ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES public.clinician_ai_analyses(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL,
  section TEXT NOT NULL,
  item_index INT NOT NULL DEFAULT 0,
  rating TEXT NOT NULL CHECK (rating IN ('Useful', 'Not Relevant', 'Incorrect')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (analysis_id, section, item_index)
);
GRANT SELECT, INSERT, UPDATE ON public.clinician_ai_feedback TO authenticated;
GRANT ALL ON public.clinician_ai_feedback TO service_role;
ALTER TABLE public.clinician_ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinicians read own AI feedback" ON public.clinician_ai_feedback FOR SELECT TO authenticated
  USING (clinician_id = auth.uid() AND EXISTS (SELECT 1 FROM public.clinician_ai_analyses a WHERE a.id = analysis_id AND a.clinician_id = auth.uid()));
CREATE POLICY "Clinicians insert own AI feedback" ON public.clinician_ai_feedback FOR INSERT TO authenticated
  WITH CHECK (clinician_id = auth.uid() AND EXISTS (SELECT 1 FROM public.clinician_ai_analyses a WHERE a.id = analysis_id AND a.clinician_id = auth.uid()));
CREATE POLICY "Clinicians update own AI feedback" ON public.clinician_ai_feedback FOR UPDATE TO authenticated
  USING (clinician_id = auth.uid()) WITH CHECK (clinician_id = auth.uid());

CREATE INDEX clinician_ai_analyses_case_idx ON public.clinician_ai_analyses (case_id, created_at DESC);
CREATE INDEX clinician_ai_feedback_analysis_idx ON public.clinician_ai_feedback (analysis_id);

COMMENT ON TABLE public.clinician_ai_analyses IS 'AI Clinical Clues generations for test cases only. Rows are retained as an audit trail; no update or delete policies.';