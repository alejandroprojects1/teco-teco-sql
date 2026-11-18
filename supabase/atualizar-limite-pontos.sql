-- ═══════════════════════════════════════════════════════════════════
--  TecoTeco-SQL: aumenta o limite de pontos do ranking para 10 milhões
--  (necessário por causa da moeda dourada 2x).
--
--  Como usar: no Supabase, abra "SQL Editor", cole este arquivo e
--  clique em "Run". As pontuações que já estão no ranking não mudam.
-- ═══════════════════════════════════════════════════════════════════
alter table public.pontuacoes drop constraint if exists pontuacoes_pontos_check;
alter table public.pontuacoes add constraint pontuacoes_pontos_check
  check (pontos between 0 and 10000000);
