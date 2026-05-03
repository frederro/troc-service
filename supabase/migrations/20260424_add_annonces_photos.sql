-- 1) Column on annonces
alter table public.annonces
add column if not exists photos text[] not null default '{}';

-- 2) Storage bucket (public)
-- Note: requires sufficient privileges (typically service role / SQL editor in Supabase).
insert into storage.buckets (id, name, public)
values ('annonces-photos', 'annonces-photos', true)
on conflict (id) do update set public = excluded.public;

-- 3) Storage policies (for anon key uploads from the client)
-- Enable RLS on storage.objects is already on in Supabase projects.
-- Public read
drop policy if exists "Public read annonces photos" on storage.objects;
create policy "Public read annonces photos"
on storage.objects
for select
using (bucket_id = 'annonces-photos');

-- Public upload (insert)
drop policy if exists "Public insert annonces photos" on storage.objects;
create policy "Public insert annonces photos"
on storage.objects
for insert
with check (bucket_id = 'annonces-photos');

