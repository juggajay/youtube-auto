-- Element type enum
create type element_type as enum ('logo', 'overlay', 'background', 'character', 'prop', 'other');

create table elements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type element_type not null default 'other',
  tags text[] default '{}',
  storage_path text not null,
  thumbnail_path text,
  metadata jsonb default '{}',
  file_size_bytes bigint not null default 0,
  mime_type text not null,
  width int,
  height int,
  used_count int default 0,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_elements_user_id on elements(user_id);
create index idx_elements_user_type on elements(user_id, type);
create index idx_elements_tags on elements using gin(tags);

-- RLS policies
alter table elements enable row level security;
create policy "Users can view own elements" on elements for select using (auth.uid() = user_id);
create policy "Users can insert own elements" on elements for insert with check (auth.uid() = user_id);
create policy "Users can update own elements" on elements for update using (auth.uid() = user_id);
create policy "Users can delete own elements" on elements for delete using (auth.uid() = user_id);

-- Updated at trigger
create trigger update_elements_updated_at before update on elements
  for each row execute function update_updated_at_column();
