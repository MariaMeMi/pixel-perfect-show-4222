import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import portrait from "@/assets/mary-portrait.jpg.asset.json";

const serif = "font-['Cormorant_Garamond',serif]";
const TITLE = "Our Story — Mary, founder of Rosea.AI";
const DESC = "Why Mary, who has lived with rosacea since her teens, founded Rosea.AI to make sensitive-skin care less overwhelming.";

export const Route = createFileRoute("/our-story")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OurStory,
});

function OurStory() {
  return (
    <div className="min-h-screen bg-site-ivory text-site-slate">
      <header className="border-b border-site-slate/10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link to="/site" className={`${serif} text-2xl font-semibold`}>Rosea<span className="text-site-rose">.AI</span></Link>
          <Link to="/site" className="inline-flex items-center gap-1.5 text-sm font-medium"><ArrowLeft className="h-4 w-4" />Back</Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-site-rose">Our story</p>
        <h1 className={`${serif} mt-4 text-5xl font-semibold leading-tight text-site-slate`}>Born From Experience. Built With Purpose.</h1>
        <figure className="relative mx-auto mt-10 aspect-[4/5] max-w-md overflow-hidden rounded-[2rem] bg-site-blush">
          <img src={portrait.url} alt="Mary, founder of Rosea.AI" className="absolute inset-0 h-full w-full object-cover object-top" />
        </figure>
        <div className="mt-10 space-y-5 text-lg leading-relaxed">
          <p>I've lived with rosacea since my teenage years. I know how frustrating unpredictable redness, sensitive skin, and endless product experimentation can be — and how deeply it can affect your confidence.</p>
          <p>After years of learning to manage my skin, I wanted to create something that made this journey feel less overwhelming.</p>
          <p>That's why I started Rosea.AI.</p>
        </div>
        <span className="mt-10 block h-px w-16 bg-site-rose" />
        <p className={`${serif} mt-5 text-2xl font-semibold`}>Mary</p>
        <p className="text-sm text-site-slate/70">Founder &amp; CEO, Rosea.AI</p>
        <a href="https://xrosacea.com" className="mt-10 inline-flex items-center gap-2 rounded-full bg-site-cta px-6 py-3 text-sm font-semibold text-site-ivory">Try Rosea.AI for Free <ArrowRight className="h-4 w-4" /></a>
        <p className="mt-8 text-sm text-site-slate/60">Rosea.AI is not a medical diagnostic tool and does not replace professional dermatology care.</p>
      </main>
    </div>
  );
}
