# Concal

Next.js app for **AI-powered calorie tracking** and **social recipe sharing** (Supabase auth + database + storage, Google Gemini for meal photo analysis).

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root (see [Environment variables](#environment-variables)).

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy these keys into `.env.local` for local development. Use the **same names and values** in Vercel (see [Deploying to Vercel](#deploying-to-vercel)).

| Variable | Where to get it | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Public URL of your project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` | Safe to expose in the browser; RLS protects data |
| `GOOGLE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | Server-only; used by `/api/analyze-food` |

Do not commit `.env.local`. It should stay in `.gitignore`.

### Supabase: auth redirect URLs (production)

After you know your Vercel URL (for example `https://your-app.vercel.app`), add it in Supabase:

1. **Authentication → URL configuration**
2. Set **Site URL** to your production origin (e.g. `https://your-app.vercel.app`).
3. Under **Redirect URLs**, add:
   - `http://localhost:3000/**` (local)
   - `https://your-app.vercel.app/**` (production)

Adjust if you use a custom domain.

## Deploying to Vercel

### Link GitHub to Vercel

1. Push this repository to GitHub (if it is not already).
2. Sign in at [vercel.com](https://vercel.com) and click **Add New… → Project**.
3. **Import** your GitHub repository (install the Vercel GitHub app if prompted).
4. Framework preset: **Next.js** (default). Root directory: repository root unless you use a monorepo subfolder.
5. Expand **Environment Variables** and add every variable from the table above (same names as in `.env.local`).
6. Click **Deploy**. Vercel will build on every push to the connected branch.

### Environment variables to copy from `.env.local` to Vercel

In the Vercel project: **Settings → Environment Variables**, create one entry per line from your local file:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_GEMINI_API_KEY`

Paste the same values you use locally. Scope them to **Production**, **Preview**, and **Development** as needed (at minimum Production + Preview for hosted builds).

After the first deploy, complete the [Supabase redirect URLs](#supabase-auth-redirect-urls-production) step for your real Vercel URL.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server (after `build`) |
| `npm run lint` | ESLint |
