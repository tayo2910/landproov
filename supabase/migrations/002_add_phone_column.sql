-- Run this in your Supabase SQL editor to add the phone column
alter table public.contact_enquiries
  add column if not exists phone text not null default '';
