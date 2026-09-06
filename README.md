# Nova Assist AI

A full-stack AI chat assistant: React + TypeScript + Vite + Tailwind frontend, Express + MongoDB backend, real streaming AI replies (Gemini or OpenAI), Firebase authentication, and Stripe subscriptions.

## Architecture

- **Frontend** (`client/`): React/Vite SPA. Talks only to the Express backend for AI chat, chat storage, profile/plan, and payments.
- **Backend** (`server/`): Express + MongoDB. Single source of truth for user profile, plan, daily usage, chat history, and billing.
- **Firebase**: used for **authentication only** (Google sign-in). The backend verifies the Firebase ID token on every authenticated request via the Admin SDK; it does not read/write Firebase Realtime Database.
- **AI provider**: the backend calls Gemini (free tier) or OpenAI directly with the server-side API key and streams the reply back over Server-Sent Events (`POST /api/chat`). The key never reaches the browser.
- **Stripe**: test-mode checkout + webhook. The webhook is the only writer of a user's paid plan state (the client never sets its own plan).

There is no local "fake AI" fallback — if no provider key is configured, or a request fails, the app shows a real error with a retry action instead of a canned response.

## Local setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env   # fill in the values below
npm run dev             # http://localhost:5000
```

Required in `server/.env`:

| Variable | Notes |
|---|---|
| `MONGO_URI` | MongoDB Atlas (or local) connection string. If left empty, the server auto-starts an **ephemeral in-memory MongoDB** for convenience — data is lost on restart. Required in production. |
| `AI_PROVIDER` | `gemini` (has a free tier) or `openai`. |
| `GEMINI_API_KEY` | From https://aistudio.google.com/apikey |
| `OPENAI_API_KEY` | From https://platform.openai.com/api-keys (only needed if `AI_PROVIDER=openai`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Console → Project Settings → Service accounts → Generate new private key. Paste the whole JSON as one line. Without this, all authenticated routes (`/api/chats`, `/api/users`, `/api/payments/*`) return `500` rather than silently trusting the client. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Test-mode keys from the Stripe dashboard, only needed to exercise real checkout. |
| `CLIENT_URL` | Used for CORS and Stripe redirect URLs. |

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env   # set VITE_API_URL to your backend, e.g. http://localhost:5000
npm run dev              # http://localhost:8080
```

### 3. Try it

Open http://localhost:8080, sign in with Google (or continue as a local guest), and send a message. With `GEMINI_API_KEY` set, replies stream from Gemini in real time; without it, you'll see a clear "no AI provider configured" error rather than a fake response.

## Deployment

### Frontend → Vercel

The client is a standalone Vite project in `client/`.

1. Import the GitHub repo into Vercel with **Root Directory = `client`** (already configured by `client/vercel.json`).
2. Set the environment variable `VITE_API_URL` to your deployed Render backend URL, e.g. `https://nova-assist-ai-server.onrender.com`.
3. Deploy. Vercel auto-builds with `npm run build` and serves `dist/` as a SPA (all routes rewrite to `index.html`).

### Backend → Render

A ready-to-use Blueprint lives at the repo root: [`render.yaml`](./render.yaml). In the Render dashboard, choose **New → Blueprint**, point it at this repo, and Render will provision a Web Service with:

- Root directory: `server`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check: `GET /api/health`

You'll be prompted to fill in the secret environment variables during Blueprint setup (never committed to the repo): `CLIENT_URL` (your Vercel URL), `MONGO_URI`, `GEMINI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

After both are live, make sure:
- Render's `CLIENT_URL` matches the exact Vercel production URL (for CORS).
- Vercel's `VITE_API_URL` matches the exact Render URL, then redeploy the frontend.
- The Stripe webhook endpoint is set to `<render-url>/api/payments/webhook` in the Stripe dashboard.

## Testing

```bash
cd client && npm run lint && npm test   # ESLint + Vitest
cd server && npm run build              # tsc type-check/build
```

## Known limitations / external configuration required

- **MongoDB**: without a real `MONGO_URI`, the backend refuses to start in production (`NODE_ENV=production`) rather than silently running on ephemeral data.
- **Firebase Admin**: without `FIREBASE_SERVICE_ACCOUNT_JSON`, every route that needs to know "who is this user" fails closed with a `500` and a clear message — it never falls back to trusting a client-supplied user ID.
- **AI provider**: without `GEMINI_API_KEY` (or `OPENAI_API_KEY` if `AI_PROVIDER=openai`), `/api/chat` returns `503 NO_PROVIDER` instead of a canned reply.
- **Stripe**: checkout and the free-coupon path work without Stripe configured (coupon path), but real subscriptions require test-mode keys and a webhook pointed at the deployed backend.
