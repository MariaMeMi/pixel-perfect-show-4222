# Verified hair cosmetics for Mika

## What will change
- Keep the existing Rose AI skin onboarding, analyses and tracking unchanged.
- Add a **Product Reference Catalog** for the five requested brands, using the names and intended uses supplied in the brief.
- Clearly distinguish individual products from collections. Collections stay informational and cannot be added as purchasable products.
- Keep Mika’s **Salon Inventory** separate. Administrators can select a verified individual product, then provide its real retail price, size, availability, purchase link and approved product image.
- Only show products that are verified, enabled for Mika, available, complete and suitable for the customer’s answers.
- Rank by suitability, hair concerns, chemical-treatment compatibility and preferences—not price or revenue. Continue using the existing questionnaire; do not claim the optional photo was analyzed.
- Limit personalized routines to four relevant steps: shampoo, conditioner, optional mask and optional leave-in/heat protectant. Do not force unnecessary steps or show more than five products.
- Show each recommendation’s brand, name, image, price, size, category and why it matches the answers.
- Preserve English, German, Russian and Ukrainian across the salon experience.

## Verification and missing information
- Manufacturer evidence is required before marking an individual reference fully verified. Supplied names and collections can be stored for review without inventing identifiers, descriptions or images.
- Mika’s inventory is currently empty. Reference entries alone will not imply stock or create shopping recommendations; real inventory details must come from the salon.
- Both uploaded briefs end at “Why it”; interpret this as the requested product suitability explanation and do not assume additional requirements.
- Test product eligibility, collection exclusion, ranking independence from price and routine/product limits; exercise the guest flow and authorized inventory management, including access isolation.

## Technical approach
- Use an additive reference catalog and extend existing salon product records with reference links and inventory details; retain existing data and account-scoped access controls.
- Keep reference validation and recommendation rules on the server. Salon administrators cannot turn an unverified collection into a verified product.
- Reuse existing salon screens, private guest consultation access and consent handling; no skin-data access or changes to photo permissions.