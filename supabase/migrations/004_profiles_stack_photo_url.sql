-- Public URL of stack photo in R2 (binary lives in Cloudflare R2 only).
alter table public.profiles
  add column if not exists stack_photo_url text;

comment on column public.profiles.stack_photo_url is 'HTTPS URL to user stack photo in R2 (e.g. r2.dev); updated by Worker after upload.';
