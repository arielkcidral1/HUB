-- Remove as duplicatas geradas por execucoes repetidas do seed
-- 2026-09-01_vagas_fredy_pneus.sql (rodado 3x). Mantem apenas a leva
-- mais recente (created_at = 2026-09-02 00:29:16.531447+00).
delete from public.hub_vagas
where created_by = 'Briefing Recrutamento'
  and created_at <> '2026-09-02 00:29:16.531447+00';

-- Remove as vagas antigas cadastradas por "Sistema" em 26/08/2026,
-- substituidas pela lista atual do briefing de recrutamento.
delete from public.hub_vagas
where created_by = 'Sistema'
  and created_at = '2026-08-26 19:46:55.192105+00';
