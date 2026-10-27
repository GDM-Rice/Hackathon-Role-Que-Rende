-- Terraformar · contas e backup do progresso.
-- Rodar uma vez no Supabase: Dashboard > SQL Editor > colar e executar.
--
-- O cadastro, login e recuperação de senha são do Supabase Auth (auth.users).
-- O apelido fica em auth.users.raw_user_meta_data ->> 'apelido'.
-- Aqui ficam só: a tabela de backup e a função para apagar a própria conta.

-- Backup do estado do app: uma linha por conta.
create table if not exists public.progresso (
  usuario_id    uuid primary key references auth.users (id) on delete cascade,
  estado        jsonb not null,
  atualizado_em timestamptz not null default now()
);

comment on table public.progresso is
  'Backup do estado do Terraformar. O celular da tripulação é removido antes de enviar.';

-- RLS: cada conta só enxerga e mexe na própria linha.
alter table public.progresso enable row level security;

drop policy if exists "progresso: ler o próprio" on public.progresso;
create policy "progresso: ler o próprio" on public.progresso
  for select to authenticated
  using ((select auth.uid()) = usuario_id);

drop policy if exists "progresso: criar o próprio" on public.progresso;
create policy "progresso: criar o próprio" on public.progresso
  for insert to authenticated
  with check ((select auth.uid()) = usuario_id);

drop policy if exists "progresso: atualizar o próprio" on public.progresso;
create policy "progresso: atualizar o próprio" on public.progresso
  for update to authenticated
  using ((select auth.uid()) = usuario_id)
  with check ((select auth.uid()) = usuario_id);

drop policy if exists "progresso: apagar o próprio" on public.progresso;
create policy "progresso: apagar o próprio" on public.progresso
  for delete to authenticated
  using ((select auth.uid()) = usuario_id);

-- "Apagar minha conta": a chave pública não pode apagar usuários do Auth,
-- então esta função roda com permissão do dono do banco, mas só apaga
-- QUEM CHAMOU (auth.uid()). O "on delete cascade" leva o backup junto.
create or replace function public.apagar_minha_conta()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

revoke all on function public.apagar_minha_conta() from public, anon;
grant execute on function public.apagar_minha_conta() to authenticated;
