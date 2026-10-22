import postgres from "postgres";
import { mkdirSync } from "fs";

type Row = Record<string, any>;
const g = globalThis as any;

// All tables. Safe to run on every start ("if not exists").
const SCHEMA = `
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  password_hash text not null,
  plan text not null default 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);
create table if not exists profiles (
  user_id uuid primary key references users(id) on delete cascade,
  goal text not null,
  days_per_week int not null,
  age int not null,
  gym text not null,
  nervous text not null,
  summary text not null default '',
  welcome text not null default '',
  available_ids jsonb not null default '[]',
  flagged text,
  updated_at timestamptz not null default now()
);
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  days jsonb not null,
  fallback boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists user_weights (
  user_id uuid not null references users(id) on delete cascade,
  exercise_id text not null,
  kg double precision not null,
  last_increase_at timestamptz,
  primary key (user_id, exercise_id)
);
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  kind text not null default 'regular',
  day_index int not null default 0,
  items jsonb not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create table if not exists set_logs (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  exercise_id text not null,
  set_number int not null,
  kg double precision not null,
  reps int not null,
  completed boolean not null,
  logged_at timestamptz not null default now()
);
create index if not exists set_logs_user_time on set_logs (user_id, logged_at);
create table if not exists comebacks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  message text not null,
  email_text text not null,
  items jsonb not null,
  days_missed int not null,
  ai boolean not null default false,
  emailed boolean not null default false,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);
create table if not exists coach_messages (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  role text not null,
  kind text not null default 'chat',
  content text not null,
  created_at timestamptz not null default now()
);
create table if not exists reports (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  exercise_id text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists ai_usage (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);
`;

async function init() {
  if (process.env.DATABASE_URL) {
    // Live: a real Postgres (e.g. Neon from the Vercel Marketplace).
    const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, idle_timeout: 20 });
    await sql.unsafe(SCHEMA);
    return { run: async (text: string, params: any[] = []) => (await sql.unsafe(text, params)) as unknown as Row[] };
  }
  if (process.env.NODE_ENV === "production") throw new Error("DATABASE_URL is not set");
  // Local development: an embedded Postgres saved in ./data, so there's nothing to install.
  const { PGlite } = await import("@electric-sql/pglite");
  mkdirSync("./data", { recursive: true });
  const db = new PGlite("./data/pglite");
  await db.exec(SCHEMA);
  return { run: async (text: string, params: any[] = []) => (await db.query(text, params)).rows as Row[] };
}

export async function q<T = Row>(text: string, params: any[] = []): Promise<T[]> {
  g.__spotterDb ??= init().catch((e) => { g.__spotterDb = null; throw e; });
  const d = await g.__spotterDb;
  return d.run(text, params);
}
