-- Add taille on annonces (optional clothing size)
alter table public.annonces
add column if not exists taille text;

