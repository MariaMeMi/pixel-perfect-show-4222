<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The Botox photo endpoint accepts either one relaxed baseline image or four distinct expression images; this keeps onboarding fast without pretending one image shows expressions.
- Reuse the shared facial-lines map for both onboarding and Botox AI; one-photo onboarding results may only mark lines visible at rest because expression is unobserved.
- Treat onboarding as a focused first-run experience: hide the main app navigation until onboarding is completed, because new users should not enter the app shell first.
- Paid access lives in user_plans (per user+environment), written only server-side after Stripe verification (plus.server.ts grantPlus via verify fn, restore fn, or webhook); clients only read their own row — never trust browser payment status.
- Clinician routes live beneath the authenticated clinician layout and bypass the consumer shell; every data operation is separately protected by account-scoped RLS so route visibility never grants data access.
- Clinician enrollment and patient creation use validated database functions that atomically establish unverified membership and owner-only authorization; sensitive records never enter consumer local storage.
- Clinician photos use the private clinician-test-photos bucket with short-lived signed URLs, and clinician account removal goes through deletion requests to avoid bypassing retention review.
- Clinical cases are patient children; database triggers enforce same-patient case and treatment links across documents, photos and documentation to prevent cross-record association.
- Archive mutations update only archival state, retaining files and history; authenticated owner reads include archived records so restoration remains possible.
- Related documents use a separate private clinician-test-documents bucket with short-lived signed downloads; file association and library filters never replace account-scoped authorization.
