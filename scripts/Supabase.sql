create table inventory_items (
  id uuid primary key default gen_random_uuid(),

  model_id uuid not null,
  color_id uuid not null,

  size text not null,
  gender text not null check (gender in ('men', 'women', 'unisex')),

  price_mxn numeric(10,2) not null,

  status text not null default 'available'
    check (status in ('available', 'reserved', 'paid', 'delivered', 'cancelled')),

  customer_name text,
  customer_whatsapp text,
  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_model
    foreign key (model_id) references models(id) on delete restrict,

  constraint fk_color
    foreign key (color_id) references colors(id) on delete restrict
);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger t_inventory_updated_at
before update on inventory_items
for each row
execute procedure update_updated_at_column();



