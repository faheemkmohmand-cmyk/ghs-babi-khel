# 🏫 Government High School Babi Khel — Website

A modern school management website built with Next.js 14, Supabase, and Tailwind CSS.

## 🚀 Deploy to Vercel (Step by Step)

### Step 1: Set Up Supabase
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **SQL Editor** and run the contents of `SUPABASE-SETUP.sql`
4. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2: Push to GitHub
1. Create a new GitHub repository
2. Push this entire folder (the root, not a subfolder) to GitHub

### Step 3: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"** → import your GitHub repo
3. In **"Environment Variables"**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
   - `NEXT_PUBLIC_SITE_URL` = your Vercel deployment URL (e.g. `https://ghs-babi-khel.vercel.app`)
4. Click **Deploy**

### Step 4: Create Admin Account
1. After deploy, go to your site and click **Sign Up**
2. Create your account
3. In Supabase dashboard → **Table Editor → profiles**
4. Find your user and change `role` from `student` to `admin`
5. Now you can login and access `/admin`

## 📁 Project Structure

```
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Home/landing page
│   ├── login/            # Login page
│   ├── signup/           # Registration page
│   ├── dashboard/        # Student dashboard
│   ├── admin/            # Admin panel
│   ├── notices/          # Public notices
│   ├── teachers/         # Teachers list
│   ├── results/          # Public results
│   └── timetable/        # Class timetable
├── lib/
│   └── supabase/
│       ├── client.ts     # Browser Supabase client
│       └── server.ts     # Server Supabase client
├── middleware.ts          # Auth middleware
└── SUPABASE-SETUP.sql    # Database schema
```

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Copy env file and fill in your Supabase keys
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
