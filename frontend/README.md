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

## Design system

Palette + typography:
- **Brand:** electric purple `#7C3AED` with portal blue `#3B82F6` as a quiet second voice.
- **Type:** Google Sans for both display and UI, Inter as a system fallback, JetBrains Mono for numbers and addresses.
- **Surfaces:** layered dark — `#0A0A0F` background → `#13131C` subtle → `#1A1A26` card → `#22222F` elevated.

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
