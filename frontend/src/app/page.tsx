"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { MarketsTicker } from "@/components/MarketsTicker";
import { isChainWired } from "@/lib/env";

export default function Home() {
  return (
    <div className="container-page">
      <Hero />
      <MarketsTicker />
      <ThreeLayers />
      <HowItWorks />
      <NumbersStrip />
      <Cta />
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function Hero() {
  return (
    <section className="relative pt-20 sm:pt-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-[480px] bg-hex-pattern opacity-60" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2 text-xs"
      >
        <span className="pill">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          {isChainWired ? "Live on Portaldot" : "Testnet preview · Portaldot native"}
        </span>
      </motion.div>

      <motion.h1
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.55, delay: 0.05 }}
        className="mt-6 max-w-3xl font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl"
      >
        Predict. Stake.{" "}
        <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
          Earn reputation
        </span>{" "}
        that follows you.
      </motion.h1>

      <motion.p
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.55, delay: 0.12 }}
        className="mt-6 max-w-2xl text-lg text-text-muted"
      >
        Polagon turns collective belief into a tradable, on-chain asset — native
        to Portaldot. Spin up a market in seconds, stake POT on outcomes you
        trust, and earn a soulbound{" "}
        <span className="text-text">Polagon Score</span> that proves you saw the
        future first.
      </motion.p>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.55, delay: 0.18 }}
        className="mt-8 flex flex-wrap items-center gap-3"
      >
        <Link href="/markets" className="btn-primary">
          Explore markets
        </Link>
        <Link href="/create" className="btn-ghost">
          Create your first market →
        </Link>
      </motion.div>

      {/* Live protocol stats strip */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.55, delay: 0.28 }}
        className="mt-10 flex flex-wrap gap-x-8 gap-y-2"
      >
        {[
          { value: 10, suffix: "", label: "markets live" },
          { value: 11470, suffix: "", label: "POT in pools" },
          { value: 52, suffix: "", label: "active predictors" },
          { value: 3, suffix: "", label: "open polls" },
        ].map((s) => (
          <div key={s.label} className="flex items-baseline gap-1.5">
            <span className="font-display text-xl tabular-nums text-text">
              <CountUp to={s.value} />
              {s.suffix}
            </span>
            <span className="text-xs text-text-dim">{s.label}</span>
          </div>
        ))}
      </motion.div>

      <div className="mt-8 flex flex-wrap gap-4 text-xs text-text-dim">
        <span>· Open source under MIT</span>
        <span>· Gas paid in POT</span>
        <span>· Built natively on Ink! 5.x</span>
      </div>
    </section>
  );
}

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(mv, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
    });
    return ctrl.stop;
  }, [inView, mv, to]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

function ThreeLayers() {
  const layers = [
    {
      title: "Markets",
      tag: "Parimutuel",
      desc: "Stake POT on YES / NO. No order book, no oracle for time. Pools are split, payouts are proportional. Simple, demoable, fair.",
      bullet: "→ create · bet · resolve · claim",
      href: "/markets",
    },
    {
      title: "Polls",
      tag: "Coordination",
      desc: "Lightweight community polls weighted by reputation, not wallet age. Sybil-resistant. Cheap to deploy. Native to Portaldot DAOs.",
      bullet: "→ propose · vote · settle",
      href: "/polls",
    },
    {
      title: "Polagon Score",
      tag: "Soulbound",
      desc: "An on-chain ledger of every prediction outcome. Non-transferable. Composable. The only crypto reputation that grows with calibration.",
      bullet: "→ accuracy · streak · payouts",
      href: "/profile",
    },
  ];

  return (
    <section className="mt-28 sm:mt-36">
      <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
        Three composable layers, one protocol.
      </h2>
      <p className="mt-3 max-w-2xl text-text-muted">
        Each layer is useful on its own. Together they form a self-reinforcing
        loop: accurate predictors win bigger payouts, payouts grow Score, Score
        weighs more in polls, polls drive market discovery.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {layers.map((l, i) => (
          <motion.article
            key={l.title}
            className="card group relative overflow-hidden p-6 transition hover:border-brand/50"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.4, delay: 0.05 * i }}
            whileHover={{ y: -3 }}
          >
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand/10 opacity-0 blur-3xl transition group-hover:opacity-100" />
            <div className="relative flex items-center justify-between">
              <h3 className="font-display text-2xl">{l.title}</h3>
              <span className="pill">{l.tag}</span>
            </div>
            <p className="relative mt-3 text-sm text-text-muted">{l.desc}</p>
            <p className="relative mt-6 font-mono text-xs text-text-dim">
              {l.bullet}
            </p>
            <Link
              href={l.href}
              className="relative mt-4 inline-flex text-xs text-brand-300 opacity-0 transition group-hover:opacity-100"
            >
              Open {l.title.toLowerCase()} →
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Create or find a market",
      desc: "Anyone posts a binary YES/NO question with a deadline and a resolver. One POT creation fee prevents spam.",
    },
    {
      n: "02",
      title: "Stake POT on your prediction",
      desc: "Choose YES or NO and lock any amount of POT. Funds are escrowed in the contract — no counterparty needed.",
    },
    {
      n: "03",
      title: "Resolver calls the outcome",
      desc: "After the deadline the designated resolver calls resolve(). The losing pool is split proportionally to all winners.",
    },
    {
      n: "04",
      title: "Claim · Score updates",
      desc: "Winners call claim() to receive their payout. Every prediction — win or loss — permanently updates your Polagon Score.",
    },
  ];

  return (
    <section className="mt-28 sm:mt-36">
      <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
        From question to payout in four steps.
      </h2>
      <p className="mt-3 max-w-2xl text-text-muted">
        No KYC, no middleman, no trust required — just Ink! contracts running
        natively on Portaldot.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.n}
            className="card relative overflow-hidden p-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5%" }}
            transition={{ duration: 0.4, delay: 0.07 * i }}
          >
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand/10 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="font-mono text-3xl font-bold text-brand/20">
              {step.n}
            </div>
            <h3 className="mt-4 font-display text-lg leading-snug">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {step.desc}
            </p>
          </motion.div>
        ))}
      </div>

      {/* connector line (desktop) */}
      <div className="mt-4 hidden items-center justify-center gap-0 lg:flex">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
        <span className="mx-4 text-xs text-text-dim">
          Powered by Ink! 5 · Portaldot native
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
      </div>
    </section>
  );
}

function NumbersStrip() {
  const stats = [
    { kpi: "$9B+", label: "2024–2025 Polymarket volume" },
    {
      kpi: "0",
      label: "prediction primitives on Portaldot — until now",
    },
    { kpi: "100%", label: "POT-native: every gas tx, every stake" },
    { kpi: "MIT", label: "open source, contracts and frontend" },
  ];

  return (
    <section className="mt-28 sm:mt-36">
      <div className="card grid grid-cols-2 divide-x divide-border sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="px-6 py-8"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.05 * i }}
          >
            <div className="font-display text-3xl tabular-nums tracking-tight text-text">
              {s.kpi}
            </div>
            <div className="mt-2 text-xs text-text-muted">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="mt-28 pb-20 sm:mt-36">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="card relative overflow-hidden p-10 sm:p-14"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand/15 via-transparent to-accent/10" />
        <h2 className="font-display text-3xl tracking-tight sm:text-5xl">
          The future is a market. <br />
          On Portaldot, it's Polagon.
        </h2>
        <p className="mt-4 max-w-xl text-text-muted">
          Open source. Native to Portaldot. Built so other dApps can compose on
          top of the Polagon Score.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/markets" className="btn-primary">
            Explore markets
          </Link>
          <Link href="/leaderboard" className="btn-ghost">
            View leaderboard →
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
