-- ═══════════════════════════════════════════════════════════════════
--  Teco-Teco SQL: banco de dados do ranking (Supabase)
--
--  Como usar: no painel do Supabase, abra "SQL Editor", cole este
--  arquivo inteiro e clique em "Run". Pode rodar de novo sem problema.
--
--  No final do arquivo, troque o e-mail pelo e-mail do professor.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Tabela com cada partida jogada ───
create table if not exists public.pontuacoes (
  id          bigint generated always as identity primary key,
  nome        text        not null check (char_length(nome) between 2 and 20),
  turma       text        not null default '7º ano Vespertino' check (char_length(turma) <= 40),
  pontos      integer     not null check (pontos between 0 and 10000),
  acertos     integer     not null check (acertos between 0 and 15),
  maior_combo integer     not null default 0 check (maior_combo between 0 and 15),
  distancia   integer     not null default 0 check (distancia between 0 and 100000),
  criado_em   timestamptz not null default now()
);
create index if not exists pontuacoes_pontos_idx on public.pontuacoes (pontos desc);
create index if not exists pontuacoes_nome_idx on public.pontuacoes (lower(nome));

-- ─── Lista de e-mails de professores (só eles podem editar) ───
create table if not exists public.professores (
  email text primary key
);

-- ─── Segurança (Row Level Security) ───
-- Alunos: podem VER o ranking e ENVIAR pontuações. Não podem editar nem apagar.
-- Professor: edita e apaga pelas funções abaixo, que conferem o login.
alter table public.pontuacoes enable row level security;
alter table public.professores enable row level security;

drop policy if exists "todos veem o ranking" on public.pontuacoes;
create policy "todos veem o ranking" on public.pontuacoes
  for select to anon, authenticated using (true);

drop policy if exists "todos enviam pontuacao" on public.pontuacoes;
create policy "todos enviam pontuacao" on public.pontuacoes
  for insert to anon, authenticated with check (true);

revoke all on public.pontuacoes from anon, authenticated;
grant select, insert on public.pontuacoes to anon, authenticated;
revoke all on public.professores from anon, authenticated;

-- ─── Proteção contra envios repetidos ───
create or replace function public.antes_de_inserir()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.nome := trim(regexp_replace(new.nome, '\s+', ' ', 'g'));
  new.criado_em := now();
  if char_length(new.nome) < 2 then
    raise exception 'Nome muito curto.';
  end if;
  -- o mesmo nome só pode enviar de novo depois de 30 segundos
  if exists (
    select 1 from pontuacoes
    where lower(nome) = lower(new.nome) and criado_em > now() - interval '30 seconds'
  ) then
    raise exception 'Aguarde um pouco antes de enviar de novo.';
  end if;
  -- no máximo 120 envios por minuto no total
  if (select count(*) from pontuacoes where criado_em > now() - interval '1 minute') >= 120 then
    raise exception 'Muitos envios ao mesmo tempo. Tente de novo em instantes.';
  end if;
  return new;
end $$;

drop trigger if exists antes_de_inserir on public.pontuacoes;
create trigger antes_de_inserir before insert on public.pontuacoes
  for each row execute function public.antes_de_inserir();

-- ─── Ranking: a melhor pontuação de cada aluno ───
drop view if exists public.ranking;
create view public.ranking with (security_invoker = true) as
select distinct on (lower(nome))
  nome, turma, pontos, acertos, maior_combo, criado_em
from public.pontuacoes
order by lower(nome), pontos desc, criado_em asc;

revoke all on public.ranking from anon, authenticated;
grant select on public.ranking to anon, authenticated;

-- ─── Funções do professor ───
create or replace function public.eh_professor()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from professores
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.renomear_jogador(antigo text, novo text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  if not eh_professor() then
    raise exception 'Apenas o professor pode fazer isso.';
  end if;
  novo := trim(regexp_replace(coalesce(novo, ''), '\s+', ' ', 'g'));
  if char_length(novo) not between 2 and 20 then
    raise exception 'O nome deve ter de 2 a 20 letras.';
  end if;
  update pontuacoes set nome = novo where lower(nome) = lower(antigo);
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.apagar_jogador(alvo text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  if not eh_professor() then
    raise exception 'Apenas o professor pode fazer isso.';
  end if;
  delete from pontuacoes where lower(nome) = lower(alvo);
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.zerar_ranking()
returns integer language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  if not eh_professor() then
    raise exception 'Apenas o professor pode fazer isso.';
  end if;
  delete from pontuacoes where true;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.eh_professor() from public, anon;
revoke all on function public.renomear_jogador(text, text) from public, anon;
revoke all on function public.apagar_jogador(text) from public, anon;
revoke all on function public.zerar_ranking() from public, anon;
revoke all on function public.antes_de_inserir() from public, anon, authenticated;
grant execute on function public.eh_professor() to authenticated;
grant execute on function public.renomear_jogador(text, text) to authenticated;
grant execute on function public.apagar_jogador(text) to authenticated;
grant execute on function public.zerar_ranking() to authenticated;

-- ═══════════════════════════════════════════════════════════════════
--  E-MAIL DO PROFESSOR: troque pelo e-mail que você usou ao criar o
--  usuário em Authentication → Users. Pode repetir a linha para
--  cadastrar mais de um professor.
-- ═══════════════════════════════════════════════════════════════════
insert into public.professores (email) values ('SEU-EMAIL@exemplo.com')
on conflict do nothing;
