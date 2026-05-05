# Polagon Frontend

Next.js 14 (App Router) + Tailwind + Framer Motion + `@polkadot/api-contract`.

## Run

```bash
pnpm install
cp .env.example .env.local   # then fill in deployed contract addresses
pnpm dev
```

## Structure

```
src/
├── app/
│   ├── layout.tsx              # shell: Navbar + footer + grid background
│   ├── page.tsx                # landing — hero, three layers, CTA
│   ├── globals.css             # Tailwind layers + component classes
│   ├── markets/
│   │   ├── page.tsx            # markets list
│   │   └── [id]/page.tsx       # market detail (odds, bets, recent activity)
│   ├── create/page.tsx         # create-market wizard (D11 wallet wiring)
│   ├── polls/page.tsx          # placeholder, ships D13
│   └── profile/page.tsx        # Polagon Score viewer
├── components/
│   ├── Navbar.tsx              # logo, nav, "Connect wallet" CTA
│   └── MarketCard.tsx          # used in lists + recent feed
└── lib/
    └── markets.ts              # types + mock data + bigint helpers
```

## What's mocked vs. what's real (today)

- **Mocked:** market list, odds, recent activity, score badge — all from `lib/markets.ts`.
- **Real:** styling system, layout, typography, info architecture, accessibility (focus rings, semantic HTML).

The mocks let the UI ship today and judges see polish without waiting for a deploy. Each route is built against the same TypeScript surface (`Market`, `UserPosition`) that the live `@polkadot/api-contract` calls will satisfy on D9–D11 — swap is mechanical.

## Design system origin

Palette + typography draw from the user's REALIO DEX system in `~/.claude/projects/-Users-mac/memory/`:
purple-blue gradients, Instrument Serif for display, Inter for UI, JetBrains Mono for numbers. We pin
brand around `#7C3AED` (electric purple) with `#3B82F6` (portal blue) as a quiet second voice.

## Roadmap milestones

| Day | Lands |
|---|---|
| D7 | Skeleton (today) |
| D8 | `@polkadot/extension-dapp` wallet connect |
| D9 | TypeScript wrappers around contract methods |
| D10 | Replace mock market reads with live chain reads |
| D11 | Wire bet / create / resolve / claim signed extrinsics |
| D13 | Polls layer |
| D17 | Recent-bets live feed |
| D19 | Animated score-up + hex badge |
