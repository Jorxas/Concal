# Concal

Concal is a food tracking and recipe sharing app. I built it to bring the everyday pieces of nutrition tracking together: setting a goal, logging meals, checking calories and macronutrients, and finding recipes worth saving. A photo analysis flow powered by Google Gemini helps turn a meal photo into a starting point for an entry.

## What you can do

- Set daily calorie and macronutrient targets and follow your progress on the dashboard.
- Add meals to daily slots and browse your own or saved recipes.
- Create recipes with images, keep them private or share them publicly, and explore recipes from the community.
- Register, sign in and manage a nutrition profile.
- Use the interface in multiple languages.

The app uses **Next.js, React and TypeScript** for the interface, **Supabase** for authentication, database and image storage, and **Google Gemini** for food photo analysis. AI estimates are a convenience for entering food; they are not a substitute for checking quantities and nutritional values yourself.

## Run locally

You need Node.js, a Supabase project and a Google AI Studio API key.

```bash
git clone https://github.com/Jorxas/Concal.git
cd Concal
npm install
```

Create `.env.local` in the project root:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

Apply the SQL migrations in [`supabase/migrations`](supabase/migrations) to your Supabase project, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Keep `.env.local` out of Git. For a hosted deployment, set the same variables on the host and configure the site's authentication redirect URLs in Supabase.

## Project layout

- [`app/`](app/) — routes, pages, server actions and the food analysis API.
- [`components/`](components/) — dashboard, recipe and interface components.
- [`lib/`](lib/) — Supabase clients, localization and application helpers.
- [`supabase/migrations/`](supabase/migrations/) — database changes.

This is an evolving personal project. The repository is the source of truth for what is currently implemented.
