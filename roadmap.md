# Roadmap
- [x] Fix customer/clinician dashboard routing with is_clinician() permission checks and explicit skin-workspace Home navigation; browser-tested customer Home/login and direct clinician URL denial, clinician dashboard and skin return; customer Data API reads return no private records, all clinician tables have RLS enabled, and 22 clinician/navigation tests pass.
- [x] Review existing Russian dictionaries against English and improve UI, articles, clinician and salon wording; keys, other languages and application code preserved. EN/DE/RU signup switching, Russian onboarding/article and mobile public pages verified. English-only email templates and dynamically generated AI output left unchanged under localization-only scope; signed-in clinician screens not browser-verified.
- [x] Extend hair advisor with separate reference catalog and salon inventory, required retail details, suitability ranking and four-step/five-product limits; 24 rule tests, authenticated inventory save/readback, collection/verification/isolation denial and real Ukrainian guest routine verified. QA stock removed; skin welcome unchanged.
- [ ] Complete manufacturer verification of remaining hair references and populate Mika inventory: needs reliable product identifiers/official evidence and salon-provided real prices, sizes, purchase links, approved images and availability; only Vitamino Color Shampoo is verified so far.
- [x] Add Ukrainian to Mika’s salon language choices, questionnaire, privacy text and generated routines; verified selection persistence, all eight questions, real Ukrainian results, contact skipping and consultation deletion; 10 salon tests pass.
- [x] Mika salon MVP: separate guest hair flow, editable branding, optional contact sharing, consent evidence, lead search/filters/status/CSV/deletion, AI routines, booking links and analytics; customer/admin flows, language switching, account isolation and 27 rule tests verified.
- [ ] Mika customer launch: needs salon-verified catalog, privacy contact/retention review and a real requested-report inbox test; optional account-saved hair routines are not included in this MVP.
- [x] Extend clinician workspace: My Patients, My Cases, private Photo Library and documents, linked histories, archive/restore; authenticated uploads, downloads, retained files, comparisons, mobile views and account isolation verified. Real patient use remains blocked pending healthcare safeguards.
- [x] Clinician MVP: separate entry and onboarding, dashboard, patient profiles, private photos, comparison, subjective progress and documentation; authenticated test flow and account isolation verified. Real patient use remains blocked pending healthcare safeguards.
- [x] Botox AI feature (separate section, Home card)
- [x] Add Botox AI choice to the "Check my skin" (Analyze) screen alongside Redness AI
- [x] Add "Rose AI" around the Check my skin area on Home (as card label)

- [x] Email results to user after email gate + first photo (needs sender domain)
- [x] My Skin Journey share card + referrals
- [x] Show redness and visible-lines face maps in first onboarding results
- [x] Add Rosie as an original rose-blossom cartoon onboarding guide and account-synced support companion
- [x] Make photo frames tappable camera shutters and remove separate capture buttons
- [x] AI Clinical Clues for clinician cases: AI Clues tab, 5-section analysis, ratings, save-to-notes, follow-up questions; verified end-to-end with a test account
- [ ] AI Voice Notes for clinicians: record → transcribe → structured SOAP/general note → approve & save; deferred to the separate clinician request, outside the current salon scope.

- [x] Community forum MVP: six categories, posts, comments, reactions, pseudonymous profiles, reporting, blocking, moderation dashboard, private photo storage with signed URLs, EN/DE/RU UI; public browsing, signed-in posting/commenting/reactions, rate limiting, own-content report hiding, anonymous posting block and Russian mobile UI browser-verified; 4 rule tests pass. Moderation dashboard verified by code only (test account is not a moderator).
- [ ] Make community forum photos private: the forum photo storage rule currently lets anyone download any forum photo; bind reads to the uploader (or serve only short-lived signed URLs) and re-verify that photos still display for readers. Chosen to publish first with this open; bucket currently holds no files.
