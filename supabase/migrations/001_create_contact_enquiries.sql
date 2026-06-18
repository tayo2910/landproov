-- Run this in your Supabase SQL editor (Project Dashboard > SQL Editor)
-- Creates the table used by the contact form.

create table if not exists public.contact_enquiries (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  name            text not null,
  email           text not null,
  phone           text not null default '',
  location        text not null,
  property_location text not null,
  service         text not null,
  message         text not null
);

-- Allow inserts from the anon/publishable key (Row Level Security)
alter table public.contact_enquiries enable row level security;

create policy "Anyone can insert enquiries"
  on public.contact_enquiries
  for insert
  to anon
  with check (true);

-- Only authenticated users can view enquiries
create policy "Authenticated users can view enquiries"
  on public.contact_enquiries
  for select
  to authenticated
  using (true);
