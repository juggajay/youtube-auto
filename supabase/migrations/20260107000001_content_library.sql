-- Content type enum for content library
create type content_type as enum ('hook', 'title', 'description', 'intro', 'cta', 'outline', 'script');

create table content_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type content_type not null,
  content text not null,
  tags text[] default '{}',
  topic text,
  archetype text,
  metadata jsonb default '{}',
  used_count int default 0,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_content_library_user_id on content_library(user_id);
create index idx_content_library_user_type on content_library(user_id, type);
create index idx_content_library_tags on content_library using gin(tags);
create index idx_content_library_search on content_library using gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(content, '') || ' ' || coalesce(topic, '')));

-- RLS policies
alter table content_library enable row level security;
create policy "Users can view own content" on content_library for select using (auth.uid() = user_id);
create policy "Users can insert own content" on content_library for insert with check (auth.uid() = user_id);
create policy "Users can update own content" on content_library for update using (auth.uid() = user_id);
create policy "Users can delete own content" on content_library for delete using (auth.uid() = user_id);

-- Updated at trigger
create trigger update_content_library_updated_at before update on content_library
  for each row execute function update_updated_at_column();
