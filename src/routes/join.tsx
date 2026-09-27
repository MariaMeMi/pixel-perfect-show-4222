import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { setReferredBy, track } from "@/lib/experiment";

export const Route = createFileRoute("/join")({
  validateSearch: (s) => z.object({ ref: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Join Rose AI — track your skin, not guess" },
      { name: "description", content: "A friend invited you to Rose AI, a calm, private skin companion for rosacea." },
      { property: "og:title", content: "Join Rose AI — track your skin, not guess" },
      { property: "og:description", content: "A calm, private way to follow facial redness day by day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { ref } = Route.useSearch();
  const navigate = useNavigate();
  useEffect(() => {
    if (ref && setReferredBy(ref)) {
      track("referral_visit", "skin_journey", ref);
      track("referral_link_clicked", "skin_journey", ref);
    }
    navigate({ to: "/", replace: true });
  }, [ref, navigate]);
  return null;
}
