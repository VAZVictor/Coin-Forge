# Coin Forge

> **Click. Compound. Transcend.**
>
> Coin Forge is an account-based incremental clicker in which a single coin grows into a multiversal production empire. Build automated production, master click combos, complete rebirth challenges, and climb through five reset layers to earn permanent power.

Coin Forge is a full-stack Angular application with a responsive frontend, an Express API, and persistent account-bound saves.

## Highlights

| Area | Implemented functionality |
| --- | --- |
| Core loop | Click for coins, build passive production, and scale into very large numbers. |
| Click mastery | A 900 ms combo window builds up to 50 stacks for up to a 2x click multiplier. Timed bonus orbs arm a one-time double-value click. |
| Production | Six purchaseable production upgrades: Auto Clicker, Assistant, Workshop, Factory, Laboratory, and Bank. Costs follow exponential scaling. |
| Buying tools | Single, multi-buy and max-buy options, plus a cheapest-first Auto-Buy mode. |
| Five reset layers | Rebirth, Prestige, Reincarnation, Ascension, and Abdication each exchange short-term progress for stronger long-term multipliers. |
| Tasks | Four repeatable rebirth challanges reward strategic runs in which selected upgrades, or all upgrades, are deliberately skipped. |
| Achievements | 24 milestones across clicks, coins, upgrades, reset layers, and playtime, including visual unlock toasts. |
| Persistence | Account-tied server saves, automatic saving every ten seconds, a final unload-save attempt, and offline earnings capped at 24 hours. |
| Accounts | Sign-up, login, persistent sessions, logout, and a password-reset flow. |
| Presentation | Responsive dark game interface, gradients, high-contrast panels, particles, floating click text, achievement feedback, and reduced-motion support. |

## Progression system

Every reset layer clears selected lower-level progress and awards a lasting multiplier. The thresholds and effects below reflect the current implementation.

| Realm | Unlock threshold | Earned currency | Permanent effect | Reset scope |
| --- | ---: | --- | --- | --- |
| Rebirth | 1M coins | Rebirth Tokens | Each token adds 5% to base click power and production. | Coins and upgrade ownership |
| Prestige | 1T coins | World Shards | Each shard multiplies the Rebirth layer by 1.5x. | Coins, upgrades, and Rebirth Tokens |
| Reincarnation | 1e20 coins | Souls | Each Soul adds 25% to all lower layers. | Coins, upgrades, Tokens, and Shards |
| Ascension | 1e35 coins | Divinity | Each point doubles all lower-layer output. | Coins, upgrades, Tokens, Shards, and Souls |
| Abdication | 1e60 coins | Legacy | Each point grants a 10x global multiplier. | All lower prestige currencies, coins, and upgrades |

## Architecture

```text
clicker/
├── frontend/                 Angular client application
│   └── src/app/
│       ├── core/services/    Signals-based game state, authentication and persistence
│       ├── clicker/          Click surface, combos, particles and bonus-orb feedback
│       ├── upgradeList/      Upgrade, bulk-buy and Auto-Buy interface
│       ├── rebirthPanel/     First prestige layer
│       ├── prestige/         World Shards layer
│       ├── reincarnation/    Souls layer
│       ├── ascension/        Divinity layer
│       ├── abdication/       Legacy layer
│       ├── achievements/     Achievement grid and notification system
│       └── task/             Repeatable rebirth challenges
└── backend/                  Express API, Angular SSR setup and file-backed data store
    └── src/
        ├── server.ts         Auth, save API, CORS and SSR entry point
        └── db.ts             Users, saves and password-reset storage
```

| Layer | Technology |
| --- | --- |
| Client | Angular 21, standalone components, signals, Angular Router and SSR support |
| Server | Express 5, Angular SSR, signed cookie sessions, CORS and JSON API routes |
| Storage | `sql.js` file-backed SQLite database for users, saves, reset tokens and VIP state |
| Authentication | `bcryptjs` password hashing, signed session tokens and guarded gameplay routes |
| UI | SCSS design tokens, Space Grotesk and Inter, Material Icons, responsive layouts and reduced-motion support |

## Local development

### Prerequisites

Install a current Node.js LTS release and npm. The repository contains separate frontend and backend applications, so install their dependencies independently.

```bash
cd clicker/frontend
npm install

cd ../backend
npm install
```

### Start the backend

The backend uses port `4000` when run as the compiled SSR server. A production deployment is designed around an environment-specific `JWT_SECRET`, `FRONTEND_ORIGIN` and secure cookie settings; the local values below represent the development profile. Thrid party Environment Variables Recommended.

```bash
cd clicker/backend
export JWT_SECRET="replace-with-a-long-random-secret"
export FRONTEND_ORIGIN="http://localhost:4200"
export NODE_ENV="development"

npm run build
node dist/backend/server/server.mjs
```

> **Runtime configuration status:** The committed frontend configuration targets the deployed backend URL. A local backend URL is retained as a documented alternative in `frontend/src/app/core/services/backend-config.ts` for local end-to-end development. The API target is isolated from the game's calculation logic.

### Start the frontend

Open a second terminal:

```bash
cd clicker/frontend
npm start
```

Then open `http://localhost:4200`.

## Available commands

Run these commands from either `clicker/frontend` or `clicker/backend`, depending on which app you want to work on.

| Command | Purpose |
| --- | --- |
| `npm start` | Starts the Angular development server. |
| `npm run build` | Creates an optimized production build in `dist/`. |
| `npm run watch` | Builds continuously with the development configuration. |
| `npm test` | Starts the configured Angular/Vitest test command. |
| `npm run serve:ssr:backend` | Runs the built backend SSR entry point through its package script. |

## API overview

Authenticated routes require the session cookie issued after sign-up or login.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Creates an account and opens a session. |
| `POST` | `/api/auth/login` | Authenticates an existing account and opens a session. |
| `POST` | `/api/auth/logout` | Clears the active session cookie. |
| `GET` | `/api/auth/me` | Returns the current session's public user data. |
| `POST` | `/api/auth/forgot-password` | Creates a password-reset token for a matching account. |
| `POST` | `/api/auth/reset-password` | Applies a valid, unused password-reset token. |
| `GET` | `/api/save` | Loads the authenticated player's saved state. |
| `POST` | `/api/save` | Writes the authenticated player's saved state. |

## Production readiness: password-reset delivery

The password-reset domain flow is implemented: the backend creates time-limited reset tokens and logs the generated reset URL server-side. Email delivery itself is not yet part of the project, so reset links currently remain available only to the server operator. Transactional email delivery is the remaining integration point for a self-service public production rollout.

## Styling notes

The visual system lives in `frontend/src/styles.css`. It uses CSS custom properties for the color palette, spacing, radii, shadows and motion timing, then applies a consistent enhancement layer to the existing component structure. This preserves the game's templates and TypeScript game calculations while keeping the UI easy to retheme.

The design deliberately uses cyan, violet, gold, teal and rose accents with strong luminance differences, so component states remain distinguishable without relying on red-green contrast alone.

## License status

Coin Forge is currently a personal, non-commercial project and does not ship with an explicit open-source license. The licensing decision remains open for any future redistribution or public release.
