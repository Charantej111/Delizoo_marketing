import pg from 'pg';

const connectionString = "://postgres:Charanteja@61A4@db.wclyevaejqlkltivzxuq.supabase.co:5432/postgres";

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log("Connecting to Supabase  database...");
  await client.connect();
  console.log("Connected successfully!");

  const schemaSql = `
    -- Partners Table
    CREATE TABLE IF NOT EXISTS public.partners (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      email TEXT,
      investment NUMERIC DEFAULT 50000,
      color TEXT DEFAULT '#10b981',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Spend Areas Table
    CREATE TABLE IF NOT EXISTS public.spend_areas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Tasks Table
    CREATE TABLE IF NOT EXISTS public.tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      spend_area TEXT,
      priority TEXT DEFAULT 'High',
      assignee TEXT,
      due_date TEXT,
      status TEXT DEFAULT 'To Do',
      progress INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT FALSE,
      checklist JSONB DEFAULT '[]'::jsonb,
      completed_items JSONB DEFAULT '[]'::jsonb,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Expenses Table
    CREATE TABLE IF NOT EXISTS public.expenses (
      id TEXT PRIMARY KEY,
      amount NUMERIC NOT NULL,
      date TEXT NOT NULL,
      time TEXT,
      payer TEXT NOT NULL,
      spend_area TEXT,
      category TEXT,
      vendor TEXT,
      payment_mode TEXT,
      utr_number TEXT,
      how_it_helped TEXT,
      proof_data_url TEXT,
      proof_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Projects Table
    CREATE TABLE IF NOT EXISTS public.projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT,
      budget NUMERIC,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Email Logs Table
    CREATE TABLE IF NOT EXISTS public.email_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT,
      status TEXT DEFAULT 'SENT',
      error TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Disable RLS or enable public read/write policies for easy client sync
    ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.spend_areas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

    -- Drop existing policy if exists and create permissive policy for web app
    DO $$
    BEGIN
      DROP POLICY IF EXISTS "Public access to partners" ON public.partners;
      CREATE POLICY "Public access to partners" ON public.partners FOR ALL USING (true) WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Public access to spend_areas" ON public.spend_areas;
      CREATE POLICY "Public access to spend_areas" ON public.spend_areas FOR ALL USING (true) WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Public access to tasks" ON public.tasks;
      CREATE POLICY "Public access to tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Public access to expenses" ON public.expenses;
      CREATE POLICY "Public access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Public access to projects" ON public.projects;
      CREATE POLICY "Public access to projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "Public access to email_logs" ON public.email_logs;
      CREATE POLICY "Public access to email_logs" ON public.email_logs FOR ALL USING (true) WITH CHECK (true);
    END $$;
  `;

  console.log("Creating database tables & RLS policies...");
  await client.query(schemaSql);
  console.log("Database schema created successfully!");

  // Query existing table counts
  const partnerRes = await client.query("SELECT COUNT(*) FROM public.partners;");
  const taskRes = await client.query("SELECT COUNT(*) FROM public.tasks;");
  const expRes = await client.query("SELECT COUNT(*) FROM public.expenses;");

  console.log(`Current DB Counts -> Partners: ${partnerRes.rows[0].count}, Tasks: ${taskRes.rows[0].count}, Expenses: ${expRes.rows[0].count}`);

  await client.end();
}

main().catch(err => {
  console.error("Database setup failed:", err);
  process.exit(1);
});
