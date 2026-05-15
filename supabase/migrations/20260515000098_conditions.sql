-- ─────────────────────────────────────────────────────────────
-- 20260515000098_conditions
-- Condition reference table: the second door into the catalog.
-- Admin-managed (service role writes); all authenticated users read.
-- ─────────────────────────────────────────────────────────────

-- Enable trigram extension for fuzzy / partial-match search
create extension if not exists pg_trgm;

create table public.conditions (
  id            uuid        primary key default gen_random_uuid(),
  slug          text        not null unique,
  name          text        not null,
  aliases       jsonb       not null default '[]'::jsonb,
  description   text        not null default '',
  category      text        not null
    check (category in (
      'Metabolic',
      'Hormonal',
      'Cognitive',
      'Musculoskeletal',
      'Cardiovascular',
      'Immune',
      'Sexual Health',
      'Longevity',
      'Skin & Hair',
      'Psychiatric'
    )),
  sex_flag      text        not null default 'both'
    check (sex_flag in ('male', 'female', 'both')),
  icd10_code    text        null,
  sort_order    integer     not null default 0,
  search_vector tsvector    generated always as (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(aliases::text, '')
    )
  ) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.conditions is
  'Condition reference data: searchable medical/health conditions linked to catalog compounds via compound_conditions. Admin-managed; users read-only.';
comment on column public.conditions.slug is
  'URL-safe unique key (e.g. pmos, metabolic-syndrome). Used in deep-links and API routes.';
comment on column public.conditions.aliases is
  'Former names, abbreviations, or lay terms (JSON array of strings). Included in full-text search_vector.';
comment on column public.conditions.sex_flag is
  'Biological sex relevance: male | female | both. Drives UI filter badge.';
comment on column public.conditions.icd10_code is
  'Optional ICD-10-CM code for clinical credibility (e.g. E28.2 for PMOS).';
comment on column public.conditions.search_vector is
  'Generated tsvector from name + description + aliases::text for full-text search via GIN index.';

-- GIN index for full-text search
create index idx_conditions_search_vector
  on public.conditions using gin (search_vector);

-- Trigram index for fast ILIKE / fuzzy prefix matching on name
create index idx_conditions_name_trgm
  on public.conditions using gin (name gin_trgm_ops);

-- Category and sex_flag filter indexes
create index idx_conditions_category  on public.conditions (category);
create index idx_conditions_sex_flag  on public.conditions (sex_flag);
create index idx_conditions_sort      on public.conditions (sort_order, name);

-- updated_at trigger (mirrors pattern used elsewhere in the project)
create or replace function public.set_conditions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_conditions_updated_at
  before update on public.conditions
  for each row execute procedure public.set_conditions_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
alter table public.conditions enable row level security;

-- Any authenticated user can read (public reference data)
create policy "conditions_select_authenticated"
  on public.conditions
  for select
  to authenticated
  using (true);

-- Writes are service-role only (no user-facing insert/update/delete policies)
