-- LEXGUARD Supabase schema
-- Run this file in the Supabase SQL editor.
-- Every application table ends with _lexguard as requested.

create extension if not exists pgcrypto;

create table if not exists public.analyses_lexguard (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  file_name text,
  contract_type text not null,
  executive_decision text not null check (
    executive_decision in ('safe-to-review', 'negotiate-first', 'do-not-sign-yet')
  ),
  risk_score integer not null check (risk_score >= 0 and risk_score <= 100),
  summary text not null,
  source text not null check (source in ('deterministic', 'llm-enhanced')),
  word_count integer not null default 0 check (word_count >= 0),
  clause_count integer not null default 0 check (clause_count >= 0),
  truncated boolean not null default false,
  text_fingerprint text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.findings_lexguard (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses_lexguard(id) on delete cascade,
  finding_key text not null,
  title text not null,
  category text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low', 'info')),
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  evidence text not null,
  explanation text not null,
  impact text not null,
  recommendation text not null,
  counterparty_argument text not null,
  user_argument text not null,
  negotiation_ask text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.risk_axes_lexguard (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses_lexguard(id) on delete cascade,
  name text not null,
  score integer not null check (score >= 0 and score <= 100),
  rationale text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.scenarios_lexguard (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses_lexguard(id) on delete cascade,
  name text not null,
  likelihood text not null check (likelihood in ('low', 'medium', 'high')),
  consequence text not null,
  trigger text not null,
  mitigation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.missing_terms_lexguard (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses_lexguard(id) on delete cascade,
  term text not null,
  risk text not null,
  suggested_question text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.playbook_items_lexguard (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses_lexguard(id) on delete cascade,
  position integer not null check (position >= 0),
  item text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.trust_ledger_items_lexguard (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses_lexguard(id) on delete cascade,
  position integer not null check (position >= 0),
  item text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.edge_warnings_lexguard (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses_lexguard(id) on delete cascade,
  position integer not null check (position >= 0),
  warning text not null,
  created_at timestamptz not null default now()
);

create index if not exists analyses_lexguard_created_at_idx
  on public.analyses_lexguard (created_at desc);

create index if not exists analyses_lexguard_risk_score_idx
  on public.analyses_lexguard (risk_score desc);

create index if not exists findings_lexguard_analysis_id_idx
  on public.findings_lexguard (analysis_id);

create index if not exists risk_axes_lexguard_analysis_id_idx
  on public.risk_axes_lexguard (analysis_id);

create index if not exists scenarios_lexguard_analysis_id_idx
  on public.scenarios_lexguard (analysis_id);

create index if not exists missing_terms_lexguard_analysis_id_idx
  on public.missing_terms_lexguard (analysis_id);

create index if not exists playbook_items_lexguard_analysis_id_idx
  on public.playbook_items_lexguard (analysis_id);

create index if not exists trust_ledger_items_lexguard_analysis_id_idx
  on public.trust_ledger_items_lexguard (analysis_id);

create index if not exists edge_warnings_lexguard_analysis_id_idx
  on public.edge_warnings_lexguard (analysis_id);

alter table public.analyses_lexguard enable row level security;
alter table public.findings_lexguard enable row level security;
alter table public.risk_axes_lexguard enable row level security;
alter table public.scenarios_lexguard enable row level security;
alter table public.missing_terms_lexguard enable row level security;
alter table public.playbook_items_lexguard enable row level security;
alter table public.trust_ledger_items_lexguard enable row level security;
alter table public.edge_warnings_lexguard enable row level security;

create policy "anon can insert analyses_lexguard"
  on public.analyses_lexguard
  for insert
  to anon
  with check (true);

create policy "anon can read analyses_lexguard"
  on public.analyses_lexguard
  for select
  to anon
  using (true);

create policy "anon can insert findings_lexguard"
  on public.findings_lexguard
  for insert
  to anon
  with check (true);

create policy "anon can read findings_lexguard"
  on public.findings_lexguard
  for select
  to anon
  using (true);

create policy "anon can insert risk_axes_lexguard"
  on public.risk_axes_lexguard
  for insert
  to anon
  with check (true);

create policy "anon can read risk_axes_lexguard"
  on public.risk_axes_lexguard
  for select
  to anon
  using (true);

create policy "anon can insert scenarios_lexguard"
  on public.scenarios_lexguard
  for insert
  to anon
  with check (true);

create policy "anon can read scenarios_lexguard"
  on public.scenarios_lexguard
  for select
  to anon
  using (true);

create policy "anon can insert missing_terms_lexguard"
  on public.missing_terms_lexguard
  for insert
  to anon
  with check (true);

create policy "anon can read missing_terms_lexguard"
  on public.missing_terms_lexguard
  for select
  to anon
  using (true);

create policy "anon can insert playbook_items_lexguard"
  on public.playbook_items_lexguard
  for insert
  to anon
  with check (true);

create policy "anon can read playbook_items_lexguard"
  on public.playbook_items_lexguard
  for select
  to anon
  using (true);

create policy "anon can insert trust_ledger_items_lexguard"
  on public.trust_ledger_items_lexguard
  for insert
  to anon
  with check (true);

create policy "anon can read trust_ledger_items_lexguard"
  on public.trust_ledger_items_lexguard
  for select
  to anon
  using (true);

create policy "anon can insert edge_warnings_lexguard"
  on public.edge_warnings_lexguard
  for insert
  to anon
  with check (true);

create policy "anon can read edge_warnings_lexguard"
  on public.edge_warnings_lexguard
  for select
  to anon
  using (true);
