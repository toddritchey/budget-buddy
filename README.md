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

## 2. Run it locally (optional, just to preview)

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
