import { CheckCircle2, Map, Shield, Sparkles, Trophy } from "lucide-react";

const highlights = [
  {
    title: "Geo-verified check-ins",
    description:
      "Authenticate every session with precision haversine checks, 30m radius validation, and anti-spoofing heuristics.",
    icon: Map,
  },
  {
    title: "Remote S.K.A.T.E.",
    description:
      "Challenge friends asynchronously with trick submissions, streak tracking, and dispute-safe review flows.",
    icon: Trophy,
  },
  {
    title: "Security-first",
    description:
      "Session hardening with HttpOnly cookies, rate limits, token verification, and minimized scopes for third-party APIs.",
    icon: Shield,
  },
  {
    title: "AI skate buddy",
    description:
      "Context-aware coaching, trick tips, and safety guidance powered by privacy-minded inference defaults.",
    icon: Sparkles,
  },
];

const deliveryPillars = [
  "Typed contracts shared across web, mobile, and server",
  "Spec-first delivery with versioned playbooks",
  "Zero trust for secrets and credentials",
  "Performance budgets enforced at build time",
];

export function App() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-900 px-6 pb-16 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 pt-16">
        <header className="glass-panel relative overflow-hidden px-8 py-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.18),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(124,58,237,0.18),transparent_32%)]" />
          <div className="relative grid gap-6 md:grid-cols-[2fr,1fr] md:items-center">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
                Locked specs • Core v1
              </p>
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                SkateHubba™ mission control for riders, builders, and ops.
              </h1>
              <p className="text-base text-slate-200/80 md:text-lg">
                A production-ready React surface that pairs with versioned specs to deliver geo-verified sessions, secure
                profiles, and multi-surface parity across web and mobile.
              </p>
              <div className="flex flex-wrap gap-3 text-sm text-slate-200/90">
                {deliveryPillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden />
                    {pillar}
                  </span>
                ))}
              </div>
            </div>
            <div className="glass-panel relative h-full rounded-xl border border-cyan-500/20 bg-slate-900/70 p-6">
              <h2 className="gradient-text mb-2 text-sm font-semibold uppercase tracking-[0.2em]">Spec coverage</h2>
              <ul className="space-y-3 text-sm text-slate-200/90">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-400" aria-hidden />
                  Web profile page, authenticated timeline, and achievements
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-400" aria-hidden />
                  Mobile profile experience with offline-safe hydration and sync queues
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-400" aria-hidden />
                  Server check-in API with geo validation, rate limits, and signed media URLs
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-400" aria-hidden />
                  Shared data contracts for DB, SDK, Firebase init, and geo helpers
                </li>
              </ul>
            </div>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {highlights.map(({ title, description, icon: Icon }) => (
            <article
              key={title}
              className="glass-panel flex h-full flex-col gap-3 border border-slate-800/70 bg-slate-900/70 p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800/70 text-cyan-300">
                  <Icon aria-hidden className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold text-slate-50">{title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-200/80">{description}</p>
            </article>
          ))}
        </section>

        <section className="glass-panel border border-slate-800/70 bg-slate-900/70 p-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Next steps</h2>
            <p className="text-slate-200/85">
              Use the locked specs under <code className="rounded bg-slate-800/60 px-2 py-1 text-xs">/specs/core/v1</code> as the
              single source of truth. Implement features only after confirming scope, enforce lint/build gates, and keep secrets out of
              source control.
            </p>
            <div className="flex flex-wrap gap-2 text-sm text-slate-200/90">
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-200">NPM scripts: lint + build required</span>
              <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-cyan-200">Spec-driven development (SDD)</span>
              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-200">No placeholders or mock data</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
