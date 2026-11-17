import { createFileRoute } from "@tanstack/react-router";
import { OfferVariantB } from "@/components/paywall/OfferVariantB";
export const Route = createFileRoute("/offer-preview-tmp")({ component: () => <div className="mx-auto max-w-md p-5"><OfferVariantB experience="redness" onContinue={() => {}} preview={{ score: 42, summary: "Mild visible redness across the cheeks.", point: "Redness is most noticeable on the cheeks." }} /></div> });
