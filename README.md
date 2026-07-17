# Budget Buddy

A budgeting app with sign-in — expenses, category budgets, savings "dreams", and a
bank-sync placeholder screen. Each person who signs up gets their own private space;
nobody sees anyone else's data.

## 1. Set up your free Supabase project (this powers sign-in + storage)

1. Go to https://supabase.com, sign up free, and create a new project.
2. Once it's ready, go to **Settings → API** in the left sidebar. Copy the **Project URL**
   and the **anon public** key.
3. In this project folder, copy `.env.example` to a new file named `.env`, and paste
   in those two values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. In Supabase, go to the **SQL Editor** and run this once, to create the table that
   stores each person's data privately:

   ```sql
   create table budget_data (
     user_id uuid references auth.users (id) primary key,
     data jsonb not null default '{}'::jsonb,
     updated_at timestamptz default now()
   );

   alter table budget_data enable row level security;

   create policy "Users can read their own data"
     on budget_data for select
     using (auth.uid() = user_id);

   create policy "Users can insert their own data"
     on budget_data for insert
     with check (auth.uid() = user_id);

   create policy "Users can update their own data"
     on budget_data for update
     using (auth.uid() = user_id);
   ```

   The `row level security` policies are what actually keep everyone's data separate —
   without them, any signed-in user could read anyone else's rows.

5. By default Supabase requires people to confirm their email before they can sign in.
   You can turn this off for faster testing under **Authentication → Providers → Email
   → "Confirm email"** — turn it back on before real people start using it.

## 3. Connect real bank accounts (Plaid)

This lets people link an actual bank account and pull in real transactions. It needs
a free Plaid account and one more private Supabase table.

### a) Create a free Plaid account

1. Go to https://dashboard.plaid.com/signup and sign up.
2. Once in the dashboard, go to **Team Settings → Keys**. You'll see a **client_id**
   and a **Sandbox secret** immediately — these work right away with fake test banks,
   no approval needed.
3. To connect *real* bank accounts for free, click **"Test with Real Data"** or go to
   **https://dashboard.plaid.com/trial-plan** and apply for a free **Trial plan**
   (available for US/Canada teams). This is usually approved automatically within
   minutes to a day, and lets you connect up to 10 real bank accounts (Chase, Bank of
   America, Wells Fargo, and most others) at no cost.
4. Once approved, you'll also have a **Production secret** — that's the one to use
   for real banks. Sandbox keys only work with Plaid's fake test banks.

### b) Add the second private Supabase table

In Supabase's **SQL Editor**, run:

```sql
create table plaid_items (
  user_id uuid references auth.users (id),
  item_id text not null,
  access_token text not null,
  institution_name text,
  updated_at timestamptz default now(),
  primary key (user_id, item_id)
);

alter table plaid_items enable row level security;
-- Deliberately no policies here — this means NO ONE using the public anon key
-- (i.e. the browser) can read or write this table at all. Only the serverless
-- functions in /api, using the secret service_role key, can touch it. That's
-- what keeps everyone's bank access tokens private and off the client entirely.
```

### c) Add the extra environment variables

Add these to your local `.env` (see `.env.example` for the full list) **and** to
your Vercel project's Environment Variables settings:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key   (Settings -> API in Supabase — the SECRET one, not anon)
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret                            (use the Sandbox or Production secret depending on PLAID_ENV)
PLAID_ENV=sandbox                                         (change to "production" once you have real-bank access)
```

**Important:** `SUPABASE_SERVICE_ROLE_KEY` and `PLAID_SECRET` must be added as
**server-side** environment variables only (that's the default for anything without
a `VITE_` prefix) — never expose these in code that runs in the browser.

### d) Try it

Once deployed with those variables set, go to the **Bank** tab, click **Add Bank
Account**, and go through Plaid's connection flow. In `sandbox` mode, use Plaid's
test credentials (username `user_good`, password `pass_good`) to simulate a real
bank login. Once switched to `production`, real bank logins work the same way for
actual users.

## 4. Run it locally (optional, just to preview)

```
npm install
npm run dev
```

## Deploy for free — Vercel (recommended, easiest)

1. Go to https://vercel.com and sign up (free) with GitHub, GitLab, or email.
2. Put this project in a GitHub repo:
   - Create a new repo on https://github.com/new
   - In this folder, run:
     ```
     git init
     git add .
     git commit -m "Budget Buddy"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/budget-buddy.git
     git push -u origin main
     ```
3. In Vercel, click "Add New Project", select your `budget-buddy` repo, and click Deploy.
   Vercel auto-detects Vite — no config needed.
4. You'll get a free URL like `budget-buddy-yourname.vercel.app` immediately.

## Connect your custom domain

1. Buy a domain (Namecheap or Porkbun, ~$10-15/year) — e.g. `budgetbuddyapp.com`.
2. In your Vercel project, go to Settings → Domains → Add, and type your domain.
3. Vercel gives you 1-2 DNS records to add (usually an A record or CNAME).
4. Go to your domain registrar's DNS settings, add those records exactly as shown.
5. Wait 10-60 minutes for DNS to propagate — then your domain points straight at your app.

## Alternative: Netlify

Same idea — connect your GitHub repo at https://app.netlify.com, it auto-builds with
`npm run build` and publishes the `dist` folder, then Domain settings → Add custom domain.

## Notes on this version

- Data is saved in the browser's local storage — it stays on whichever device/browser
  you use it in, and won't yet sync between your phone and a family member's phone.
  A shared household version would need a small backend + database (e.g. Supabase),
  which I can help you add later if you want everyone seeing the same data.
