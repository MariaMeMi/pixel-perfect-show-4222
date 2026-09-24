import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Rose AI" },
      { name: "description", content: "How Rose AI handles your photos, email address and skin data." },
      { property: "og:title", content: "Privacy Policy — Rose AI" },
      { property: "og:description", content: "How Rose AI handles your photos, email address and skin data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS: [string, string][] = [
  [
    "Photos",
    "Your photos are sent securely to our AI provider only to create your reading and are not stored on our servers. If you choose, a copy is kept on this device only (you can turn this off or delete photos anytime in Profile). Botox AI photos are never kept after the reading, except diary photos you add yourself, which stay on this device.",
  ],
  [
    "Results and check-ins",
    "Your readings, check-ins and history are stored only on this device. We do not upload them to our servers.",
  ],
  [
    "Email address",
    "If you enter your email, we store it together with which feature you used (redness or facial lines) to give you access to your results and send product updates. It is never shown publicly or sold. To have it deleted, contact us.",
  ],
  [
    "Usage statistics",
    "We count anonymous steps (for example, 'analysis started' or 'email submitted') with a random session code to improve the product. These never include your photos, results, health information or email.",
  ],
  [
    "Not medical advice",
    "Rose AI is an educational wellness tool. It does not diagnose conditions and doesn't replace a qualified medical professional.",
  ],
];

function PrivacyPage() {
  return (
    <div className="animate-rise space-y-6">
      <header>
        <p className="eyebrow">Rose AI</p>
        <h1 className="mt-2 text-[2rem] leading-tight text-foreground">Privacy Policy</h1>
      </header>
      {SECTIONS.map(([title, body]) => (
        <section key={title} className="surface space-y-2 p-5">
          <h2 className="text-lg text-foreground">{title}</h2>
          <p className="text-sm leading-relaxed text-secondary-foreground">{body}</p>
        </section>
      ))}
      <Link to="/" className="inline-block text-sm text-primary underline underline-offset-4">
        ← Home
      </Link>
    </div>
  );
}
