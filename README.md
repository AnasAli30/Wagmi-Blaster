## <i class="fa-solid fa-rocket"></i> WAGMI Blaster – Farcaster Mini App

Interactive arcade mini-app for Farcaster with Phaser.js gameplay, onchain rewards, NFT minting, secure API middleware, and leaderboards. The UI/assets reference both "WAGMI Blaster" across the codebase.

---

## <i class="fa-solid fa-layer-group"></i> Tech Stack
- Next.js 14 (App Router), React 18, TypeScript, TailwindCSS
- Phaser 3 for game rendering
- Farcaster Mini App SDKs: `@farcaster/miniapp-*`, `@farcaster/frame-*`
- Wagmi + Viem + Ethers v6 for wallet/chain
- MongoDB (+ optional Upstash Redis)
- React Query for client caching
- Font Awesome React for icons

---

## <i class="fa-solid fa-bolt"></i> Quickstart
1) Install
```bash
pnpm install
```

2) Configure environment
Create `.env.local` using `ENV_SETUP.md` (and `FAUCET_SETUP.md` if using faucet).

3) Run
```bash
pnpm dev
```

4) Optional: expose to Warpcast Embed
```bash
cloudflared tunnel --url http://localhost:3000
```
Set `NEXT_PUBLIC_URL` to the tunnel URL.

---

## <i class="fa-solid fa-key"></i> Environment
See `ENV_SETUP.md` for full list. Important:
- `API_SECRET_KEY`, `NEXT_PUBLIC_API_SECRET_KEY`
- `SERVER_PRIVATE_KEY`
- `MONGODB_URI`, `RPC_URL`
- `DAILY_MINT_LIMIT`
- Optional Redis: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

Faucet/setup specifics in `FAUCET_SETUP.md`.

---

## <i class="fa-solid fa-shield-halved"></i> Security Middleware
All POST `/api/*` routes are protected by a replay-resistant fused key scheme (`middleware.ts`).

Client flow (ethers v6):
```ts
import { keccak256, toUtf8Bytes } from 'ethers'
const randomString = crypto.getRandomValues(new Uint32Array(4)).join('-')
const fusedKey = keccak256(toUtf8Bytes(process.env.NEXT_PUBLIC_API_SECRET_KEY! + randomString)).slice(2)
await fetch('/api/submit-score', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-random-string': randomString,
    'x-fused-key': fusedKey,
  },
  body: JSON.stringify({ /* payload */ }),
})
```

---

## <i class="fa-solid fa-gamepad"></i> Game Overview
**WAGMI Blaster** is a fast-paced arcade shooter where players fire memecoins at lightning speed! Built as a Farcaster Mini App, it combines addictive gameplay with blockchain rewards.

### 🎮 How to Play
- **Objective**: Fire memecoins as fast as possible to hit targets
- **Controls**: Tap/click to shoot, aim for high scores
- **Scoring**: Points based on accuracy, speed, and combo multipliers
- **Levels**: Progressive difficulty with new challenges
- **Power-ups**: Special abilities to boost performance

### 🏆 Game Features
- **Phaser.js Engine**: Smooth 60fps gameplay with particle effects
- **Sound Design**: Immersive audio with jump, eat, and game over sounds
- **Visual Effects**: Combo animations, screen shake, and smooth transitions
- **Progressive Difficulty**: Each level increases challenge and rewards
- **Real-time Scoring**: Live score updates with combo multipliers

### 🎯 Game Mechanics
- **Shooting**: Tap to fire memecoins at moving targets
- **Combo System**: Chain hits for multiplier bonuses
- **Power-ups**: Collect special items for enhanced abilities
- **Time Pressure**: Limited time per level for maximum intensity
- **Skill-based**: Higher scores require better aim and timing

### 🏅 Rewards & Progression
- **Daily Challenges**: Complete daily objectives for bonus rewards
- **Leaderboards**: Compete with other players globally
- **NFT Rewards**: Mint unique NFTs based on performance
- **Token Rewards**: Earn PEPE coins for achievements
- **Seasonal Rankings**: Track progress across seasons

## <i class="fa-solid fa-star"></i> Features
- Phaser gameplay, sounds, animations
- Farcaster Mini App (frame metadata, launch, actions)
- Wallet actions via Wagmi/Viem
- NFT minting and token rewards
- Season and ATH leaderboards
- Daily mint limits and faucet
- Theming and safe-area UI

---

## <i class="fa-solid fa-diagram-project"></i> Structure
- `app/` – App Router pages and API routes
  - `app/page.tsx` – frame metadata and app entry
  - `app/api/*/route.ts` – backend endpoints
- `components/` – UI, providers, game (`components/Home/*`, `components/pages/app.tsx`)
- `docs/lib/*` – server utilities (db, auth, rewards, constants)
- `contract/` – Solidity contracts and scripts
- `hooks/` – custom hooks
- `public/` – assets/images

---

## <i class="fa-solid fa-plug"></i> API Endpoints (overview)
All POST routes require headers: `x-random-string`, `x-fused-key`.

- POST `/api/start-game` – initialize session
- POST `/api/submit-score` – body `{ fid, pfpUrl, username?, score, level, duration?, userAddress?, faucetClaimed? }`
- GET  `/api/leaderboard`
- GET  `/api/game-leaderboard`
- GET  `/api/ath-leaderboard`
- GET  `/api/user-stats`
- GET  `/api/total-players`
- POST `/api/mint-nft`
- POST `/api/burn-nft`
- POST `/api/get-nft-trait`
- GET  `/api/nft-minted`
- POST `/api/send-notification`
- POST `/api/share-reward`
- POST `/api/mini-app-reward`
- POST `/api/claim-gift-box`
- POST `/api/faucet`
- GET  `/api/faucet-stats`
- POST `/api/reset-daily-mints`
- GET  `/api/time`
- POST `/api/webhook`

See implementations under `app/api/*/route.ts` and helpers in `docs/lib/*`.

---

## <i class="fa-solid fa-database"></i> Data & Scoring
Dual scoring:

### Current Season Score (`currentSeasonScore`)
- Updated every game
- Used for season rankings and rewards

### All-Time High (`score`)
- Best-ever score, updated only when beaten
- Displayed alongside season score

### How it works
1. Submitting a score updates `currentSeasonScore`
2. If greater than `score` (ATH), both update
3. Leaderboards display both; rankings use season score

MongoDB collections and helpers live under `docs/lib/database.ts`, `docs/lib/leaderboard.ts`.

---

## <i class="fa-solid fa-list-check"></i> Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

---

## <i class="fa-solid fa-screwdriver-wrench"></i> Build/Run
```bash
pnpm build
pnpm start
pnpm lint
```

Tailwind config: `tailwind.config.ts`. TypeScript config: `tsconfig.json`. Formatter/Linter: `@biomejs/biome`.

---

## <i class="fa-solid fa-cloud-arrow-up"></i> Deploy
Deploy to a serverless platform (e.g., Vercel). Set all environment variables and `NEXT_PUBLIC_URL` to the production domain for frame metadata.

---

## <i class="fa-solid fa-scale-balanced"></i> License
MIT


