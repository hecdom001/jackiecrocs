-- =========================
-- 1. DROP EXISTING TABLES
-- =========================

drop table if exists inventory_items cascade;
drop table if exists models cascade;
drop table if exists colors cascade;
drop table if exists sizes cascade;

-- =========================
-- 2. MODELS TABLE
-- =========================
-- Example: Classic, Platform, etc.

create table models (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- =========================
-- 3. COLORS TABLE
-- =========================
-- name_en is canonical (stored in English)

create table colors (
  id uuid primary key default gen_random_uuid(),
  name_en text not null unique,
  created_at timestamptz not null default now()
);

-- =========================
-- 4. Sizes TABLE
-- =========================
create table sizes (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,      -- e.g. 'M5-W7'
  sort_order int not null,         -- for ordering in dropdown
  created_at timestamptz not null default now()
);

-- =========================
-- 4. INVENTORY ITEMS
-- =========================

create table inventory_items (
  id uuid primary key default gen_random_uuid(),

  model_id uuid
    references models(id)
    on delete set null,

  color_id uuid
    references colors(id)
    on delete set null,

  -- Size format like: M5-W7, M6-W8, C10, etc.
  size text not null,

  price_mxn numeric(10,2) not null,

  -- available = shown on public site
  -- reserved = held but not sold
  -- sold = completed sale
  status text not null
    check (status in ('available', 'reserved', 'sold'))
    default 'available',

  -- Admin-only fields
  customer_name text,
  customer_whatsapp text,
  meetup_location text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- 5. OPTIONAL INDEXES (performance)
-- =========================

create index idx_inventory_status
  on inventory_items(status);

create index idx_inventory_model
  on inventory_items(model_id);

create index idx_inventory_color
  on inventory_items(color_id);

create index idx_sizes_sort_order
  on sizes(sort_order);

-- Optional: index on updated_at if you sort by it a lot
create index idx_inventory_updated_at
  on inventory_items(updated_at);

-- =========================
-- 6. UPDATED_AT TRIGGER
-- =========================

create or replace function set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp_inventory_items on inventory_items;

create trigger set_timestamp_inventory_items
before update on inventory_items
for each row
execute procedure set_timestamp();
