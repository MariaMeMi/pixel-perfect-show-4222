# Rose AI clinician portal MVP

## What you will get
Build a separate **Rose AI for Clinicians** experience without rebuilding or changing consumer skin tracking, paid access, existing accounts, or completed onboarding.

**Safety boundary:** launch in clearly labeled **early-access, test-data-only mode**. Healthcare infrastructure, contracts, retention obligations and operational safeguards have not been verified. Real patient information and photos must not be collected in this MVP. Clinician onboarding requires acknowledgment of this restriction; patient creation and uploads repeat it. No compliance claims or verified-credential claims.

## Phase 1 — entry, onboarding and patient records
- New users choose **For my skin** or **I'm a clinician** before their respective onboarding. Use “How would you like to use Rose AI?” to preserve the existing app name. Returning consumer users keep their existing path and progress.
- Add a discreet **For Clinicians** link on the public welcome screen. Reuse existing account sign-in and signup; clinician entry returns to clinician onboarding/dashboard, never the consumer questionnaire by mistake.
- Short clinician onboarding: full name, professional role, optional clinic name, country, professional email, privacy/consent and test-data acknowledgments. Store verification status as **unverified**.
- Separate desktop/tablet-friendly navigation: Dashboard, Patients, Progress, Settings, with mobile support.
- Dashboard shows only real stored test records: counts, recent check-ins/photos, explicitly entered upcoming follow-ups, patient search, add patient, recent activity and a genuine empty state.
- Patient records: internal ID/display name, concern, consultation/follow-up dates, symptoms, skincare routine, treatments and notes. Tabs: Overview, Photos, Progress, Treatments, Notes. Edit and archive records.

## Phase 2 — complete the smallest usable workflow
- Private photo upload and chronological timeline with capture date, facial view, label, note and uploader. Authorized, short-lived viewing links only; no public photo URLs.
- Photo detail and metadata editing. For this test-only release, allow confirmed deletion of test photos; do not present this as a real-patient retention policy.
- Compare two photos from the **same patient and matching facial view**, side by side, with optional slider, dates and saved observations. Show a lighting/angle/expression/camera-quality limitation notice; no automated improvement claims.
- Subjective symptom check-ins appropriate to each concern; trends only when enough actual check-ins exist. Document treatments/procedures, dates, follow-ups and free-text notes; no prescribing or AI medical scores.
- Settings includes account sign-out and account/data deletion requests. Keep requests separate from irreversible deletion pending an applicable retention policy.

## Proposed minimal data model
The inspected live schema contains only consumer leads/events, products, Rosie conversations and paid plans. There are no existing clinician, profile, role, patient or photo tables to reuse safely.

| Record | Purpose |
| --- | --- |
| User roles | Server-controlled clinician membership; never editable profile privileges |
| Clinician profiles | Name, professional role, clinic label, country, professional email, unverified status, acknowledgments |
| Patients | Test-only patient record, owner, dates, concern, routine, archive state |
| Clinician-patient access | Explicit clinician/record relationship, initially owner only |
| Patient consent records | Authorization acknowledgment, scope, timestamp and revocation state; test-only documentation, not claimed legal consent verification |
| Skin photos | Private storage path and validated metadata linked to patient/uploader |
| Symptom check-ins | Dated subjective ratings and reported observations |
| Treatment records | Treatment/procedure documentation and follow-up dates |
| Clinician notes | Dated notes and comparison observations linked to patient |
| Audit events | Sensitive reads/access, uploads and record changes; no images or note contents in logs |
| Deletion requests | Account/data request status and timestamps |

## Security and data-model risks
- A self-selected clinician role proves no credentials and must never grant access to another person's records.
- A clinic name is a label, not shared clinic membership. No cross-account or cross-clinic sharing in this MVP; invitations are deferred.
- Consent documentation does not establish a compliant healthcare deployment. Test-only restrictions remain until an independently reviewed real-data release.
- Signed photo links expire but remain usable by their holder until expiry; keep lifetimes short and never log links.
- Consumer data currently lives on the device. Do not import, link or share it into clinician records; keep consumer reset behavior separate from stored clinician records.
- Account deletion currently removes an account directly. Review that path so it cannot silently bypass a future patient retention/deletion-request workflow.

## Technical approach
- Add only additive schema changes with explicit grants, row-level security and indexes; no destructive changes to existing tables.
- Use the existing authenticated route gate for protected clinician pages, with separate clinician authorization checks on every server operation. Public clinician onboarding/sign-in remains outside protected loaders.
- Enforce clinician membership, record access, authorization and test-only constraints server-side and in database/storage policies, not only by hiding buttons.
- Private storage bucket with scoped upload/read/delete policies. Keep sensitive data out of browser-local consumer storage.
- Reuse existing semantic design tokens and controls; bypass the narrow consumer shell for clinician pages. Add individual page titles and sharing descriptions.

## Verification
- Test account isolation, unverified status, consent requirements, same-patient/matching-view comparison, explicit follow-up counts and test-only restrictions with concrete tests.
- Exercise the authenticated flow with non-identifying test data: onboarding → create record → baseline/follow-up upload → compare → save observations → read them back.
- Check desktop, tablet and mobile layouts, private-image rendering, denied cross-account access, and consumer welcome/onboarding regressions. Run security checks and confirm app health before completion.

## Not included
Real patient collection or regulatory-compliance certification; patient invitations/shared check-ins; reports; clinic administration; EHR integrations; AI summaries; clinician billing.