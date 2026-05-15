-- ─────────────────────────────────────────────────────────────
-- 20260515000099_compound_conditions
-- Junction table: compound (catalog id) ↔ condition (uuid).
-- Compound ids are text keys from the JS catalog (no DB table),
-- so no FK on compound_id — enforced at the application layer.
-- Admin-managed; authenticated users read-only.
-- ─────────────────────────────────────────────────────────────

create table public.compound_conditions (
  id                uuid    primary key default gen_random_uuid(),
  compound_id       text    not null,
  condition_id      uuid    not null references public.conditions (id) on delete cascade,
  mechanism         text    null,
  evidence_strength text    not null default 'preclinical'
    check (evidence_strength in ('anecdotal', 'preclinical', 'clinical', 'rct')),
  is_primary        boolean not null default false,
  notes             text    null,
  created_at        timestamptz not null default now(),

  -- one row per compound-condition pair
  unique (compound_id, condition_id)
);

comment on table public.compound_conditions is
  'Many-to-many: catalog compound ids (text, from JS PEPTIDES array) to conditions (uuid). Source of truth for condition card compound lists and compound detail condition tags.';
comment on column public.compound_conditions.compound_id is
  'Matches the id field on a PEPTIDES entry (e.g. bpc-157, semaglutide). No FK — enforced at app layer since catalog lives in JS.';
comment on column public.compound_conditions.condition_id is
  'FK to public.conditions.id. Cascades delete so removing a condition cleans up its mappings.';
comment on column public.compound_conditions.mechanism is
  'Why this compound helps this condition (e.g. insulin sensitization, androgen modulation, neurogenesis). Rendered as mechanism tags on condition cards.';
comment on column public.compound_conditions.evidence_strength is
  'Weakest-to-strongest: anecdotal | preclinical | clinical | rct. Drives evidence badge color on UI.';
comment on column public.compound_conditions.is_primary is
  'True when this condition is a primary/headline use case for the compound (e.g. semaglutide → obesity). False for secondary or adjunct associations.';

-- Look up all conditions for a given compound (compound detail page)
create index idx_cc_compound_id  on public.compound_conditions (compound_id);

-- Look up all compounds for a given condition (condition card)
create index idx_cc_condition_id on public.compound_conditions (condition_id);

-- Filter by evidence strength across the junction
create index idx_cc_evidence     on public.compound_conditions (evidence_strength);

-- Primary mappings fast path
create index idx_cc_primary      on public.compound_conditions (condition_id) where is_primary = true;

-- ── RLS ──────────────────────────────────────────────────────
alter table public.compound_conditions enable row level security;

create policy "compound_conditions_select_authenticated"
  on public.compound_conditions
  for select
  to authenticated
  using (true);

-- ── RPC: get all compounds for a condition slug ───────────────
-- Used by condition detail page Worker endpoint.
-- GET /conditions/:slug  →  calls this RPC
create or replace function public.get_compounds_for_condition(p_slug text)
returns table (
  compound_id       text,
  mechanism         text,
  evidence_strength text,
  is_primary        boolean,
  notes             text
)
language sql stable security definer
as $$
  select
    cc.compound_id,
    cc.mechanism,
    cc.evidence_strength,
    cc.is_primary,
    cc.notes
  from public.compound_conditions cc
  join public.conditions c on c.id = cc.condition_id
  where c.slug = p_slug
  order by cc.is_primary desc, cc.evidence_strength desc, cc.compound_id;
$$;

-- ── RPC: get all conditions for a compound id ─────────────────
-- Used by compound detail page to render condition tags.
-- GET /compounds/:id  →  calls this RPC alongside compound data
create or replace function public.get_conditions_for_compound(p_compound_id text)
returns table (
  condition_id      uuid,
  slug              text,
  name              text,
  category          text,
  mechanism         text,
  evidence_strength text,
  is_primary        boolean
)
language sql stable security definer
as $$
  select
    c.id,
    c.slug,
    c.name,
    c.category,
    cc.mechanism,
    cc.evidence_strength,
    cc.is_primary
  from public.compound_conditions cc
  join public.conditions c on c.id = cc.condition_id
  where cc.compound_id = p_compound_id
  order by cc.is_primary desc, c.category, c.name;
$$;

-- ── RPC: full-text + trigram condition search ─────────────────
-- Powers the search bar on the Conditions tab.
-- Empty p_query returns all conditions ordered by sort_order.
-- Supports category and sex_flag filters independently.
create or replace function public.search_conditions(
  p_query    text    default null,
  p_category text    default null,
  p_sex_flag text    default null,
  p_limit    int     default 20,
  p_offset   int     default 0
)
returns table (
  id             uuid,
  slug           text,
  name           text,
  aliases        jsonb,
  description    text,
  category       text,
  sex_flag       text,
  icd10_code     text,
  compound_count bigint,
  rank           real
)
language sql stable security definer
as $$
  select
    c.id,
    c.slug,
    c.name,
    c.aliases,
    c.description,
    c.category,
    c.sex_flag,
    c.icd10_code,
    count(cc.compound_id) as compound_count,
    case
      when p_query is null or p_query = ''
        then 0.0
      else ts_rank(c.search_vector, websearch_to_tsquery('english', p_query))
    end as rank
  from public.conditions c
  left join public.compound_conditions cc on cc.condition_id = c.id
  where
    (p_category is null or c.category = p_category)
    and (p_sex_flag is null or c.sex_flag in (p_sex_flag, 'both'))
    and (
      p_query is null
      or p_query = ''
      or c.search_vector @@ websearch_to_tsquery('english', p_query)
      or c.name ilike '%' || p_query || '%'
    )
  group by c.id
  order by
    case when p_query is null or p_query = '' then c.sort_order end asc nulls last,
    rank desc,
    c.name asc
  limit p_limit
  offset p_offset;
$$;
