'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SiteNav } from '@/components/site-nav';
import { Logo } from '@/components/logo';
import { ArrowRight, Sparkles, MessageSquare, ChartLine as LineChart, Mic, ShieldCheck, Brain, Star } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Roleplay',
    desc: 'Practice with AI prospects that feel remarkably human — complete with personality, resistance and real objections.',
  },
  {
    icon: MessageSquare,
    title: 'Real Conversations',
    desc: 'Scenarios built from full context docs. Every prospect has their own pain, priorities and negotiating style.',
  },
  {
    icon: LineChart,
    title: 'Instant Feedback',
    desc: 'After every call, get a structured breakdown: strengths, weaknesses and exactly what to try next time.',
  },
  {
    icon: Mic,
    title: 'Voice-ready',
    desc: 'Type today, speak tomorrow. A voice-first practice loop is coming natively to the app.',
  },
  {
    icon: ShieldCheck,
    title: 'Judgment-free Reps',
    desc: 'Fail safely. Repeat the hard calls as many times as you need — without burning a real pipeline.',
  },
  {
    icon: Sparkles,
    title: 'Built for Teams',
    desc: 'Share scenarios across your team so every rep trains on the same ICP, messaging, and objection library.',
  },
];

const testimonials = [
  {
    quote:
      'Practa gave our SDRs a safe place to bomb their cold calls. By week three they were outperforming our seniors on discovery.',
    name: 'Avery Holt',
    title: 'VP Sales, Northwind',
  },
  {
    quote:
      'The feedback is what makes it. It feels like having a sales coach on-demand — at 2am, right before the big call.',
    name: 'Daniela Cruz',
    title: 'AE, Meridian Labs',
  },
  {
    quote:
      'We ran 400 practice sessions in the first month. Close rates on demo-to-won jumped 19%. That is the entire pitch.',
    name: 'Marcus Patel',
    title: 'Head of Revenue, Orbital',
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteNav />

      <section className="relative pt-20 pb-28">
        <div className="aurora" />
        <div className="absolute inset-0 grid-pattern opacity-60" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3.5 py-1.5 text-xs text-emerald-300 backdrop-blur fade-up">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Now in beta — train with lifelike AI prospects
          </div>

          <h1 className="fade-up mx-auto mt-7 max-w-5xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Practice Sales.
            <br />
            <span className="text-gradient">Close More Deals.</span>
          </h1>

          <p className="fade-up mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            Practa AI turns any sales scenario into a realistic roleplay. Hold the call, handle the objections,
            and get structured coaching the moment you hang up.
          </p>

          <div className="fade-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="btn-glow h-12 rounded-xl px-7 text-base font-semibold">
                Start Practicing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 rounded-xl px-6 text-base text-white/80 hover:bg-white/5 hover:text-white"
              >
                See how it works
              </Button>
            </a>
          </div>

          {/* Hero preview card */}
          <div className="fade-up relative mx-auto mt-20 max-w-5xl">
            <div className="absolute -inset-10 -z-10 rounded-[40px] bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-teal-500/20 blur-3xl" />
            <div className="glass glow-border rounded-3xl p-3">
              <div className="rounded-2xl bg-black/50 p-6 md:p-8">
                <div className="flex items-center justify-between text-xs text-white/50">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  </div>
                  <div>Session · Cold Call · SaaS CTO</div>
                </div>
                <div className="mt-6 space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 ring-2 ring-emerald-400/30" />
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-white/5 bg-white/[0.03] px-4 py-3 text-[15px] text-white/85">
                      You&apos;ve got thirty seconds. What do you actually do, and why should I care right now?
                    </div>
                  </div>
                  <div className="flex items-start justify-end gap-3">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-emerald-400/90 to-emerald-600/90 px-4 py-3 text-[15px] text-emerald-950 shadow-lg shadow-emerald-500/20">
                      Fair. We cut time-to-insight from days to minutes for data teams on Snowflake. If your dashboards lag, that&apos;s usually where we help.
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 ring-2 ring-emerald-400/30" />
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/5 bg-white/[0.03] px-4 py-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-300" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-medium text-emerald-400">Features</div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Everything you need to rep<br /><span className="mt-2 inline-block text-gradient">like a pro</span>
            </h2>
            <p className="mt-4 text-white/60">
              A complete practice loop — scenarios, conversation, coaching — designed to feel less like software
              and more like a trusted sales coach.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group glass glow-border relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl transition-opacity duration-500 group-hover:bg-emerald-500/20" />
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 ring-1 ring-emerald-400/20">
                    <f.icon className="h-5 w-5 text-emerald-300" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="text-sm font-medium text-emerald-400">How it works</div>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                Three steps to a <span className="text-gradient">sharper pitch</span>
              </h2>
              <ol className="mt-10 space-y-8">
                {[
                  {
                    n: '01',
                    t: 'Pick a scenario',
                    d: 'Cold call a skeptical CTO, run discovery with a VP Marketing, or defend your price with procurement.',
                  },
                  {
                    n: '02',
                    t: 'Hold the conversation',
                    d: 'The AI stays in character — resistance, hesitation, real objections. Nothing scripted.',
                  },
                  {
                    n: '03',
                    t: 'Get your coaching',
                    d: 'Structured feedback with strengths, gaps, and concrete suggestions you can try on the next rep.',
                  },
                ].map((s) => (
                  <li key={s.n} className="flex gap-5">
                    <div className="shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/15 to-emerald-600/5 font-mono text-sm text-emerald-300 ring-1 ring-emerald-400/20">
                        {s.n}
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{s.t}</div>
                      <div className="mt-1 text-white/60">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-emerald-500/20 to-teal-500/10 blur-3xl" />
              <div className="glass glow-border rounded-3xl p-6">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wider text-white/50">Session Feedback</div>
                  <div className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20">
                    Score 87
                  </div>
                </div>
                <div className="mt-6 space-y-5">
                  {[
                    { label: 'Strengths', items: ['Opened with strong relevance', 'Great pacing and tone'] },
                    { label: 'Weaknesses', items: ['Rushed past the price objection'] },
                    { label: 'Suggestions', items: ['Anchor on ROI before talking price', 'Ask one more discovery question'] },
                  ].map((b) => (
                    <div key={b.label}>
                      <div className="text-sm font-medium text-white/80">{b.label}</div>
                      <div className="mt-2 space-y-1.5">
                        {b.items.map((i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-white/70"
                          >
                            {i}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="text-sm font-medium text-emerald-400">Loved by teams</div>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Built for reps who <span className="text-gradient">actually pick up the phone</span>
            </h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="glass glow-border rounded-2xl p-6">
                <div className="flex gap-0.5 text-emerald-300">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-white/80">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600" />
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-white/50">{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="glass glow-border relative overflow-hidden rounded-3xl p-12 text-center">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-500/15 via-transparent to-teal-500/10" />
            <div className="absolute left-1/2 top-0 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
            <h3 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Your next rep starts <span className="text-gradient">now</span>.
            </h3>
            <p className="mx-auto mt-4 max-w-xl text-white/60">
              Create an account in seconds. Pick a scenario. Hit call. Get better.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href="/signup">
                <Button size="lg" className="btn-glow h-12 rounded-xl px-8 text-base font-semibold">
                  Start Practicing Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <Logo />
          <div className="text-sm text-white/40">© {new Date().getFullYear()} Practa AI. Train like a pro.</div>
          <div className="flex gap-6 text-sm text-white/50">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="mailto:ntadic1804@icloud.com" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
