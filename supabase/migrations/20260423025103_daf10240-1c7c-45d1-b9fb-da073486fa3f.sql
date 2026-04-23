-- Adiciona service_type e phase_dates flexíveis na tabela clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS service_type text NOT NULL DEFAULT 'auditoria',
  ADD COLUMN IF NOT EXISTS phase_dates jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Comentários para documentar o uso
COMMENT ON COLUMN public.clients.service_type IS 'Tipo de serviço do cliente: auditoria | producao | gestao | design | site | webapp. Define o fluxo de fases visíveis em Minha Jornada.';
COMMENT ON COLUMN public.clients.phase_dates IS 'Datas das fases por chave dinâmica. Estrutura: { "<phase_key>": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD", "completed_at": "ISO" } }. Substitui as colunas phase_<nome>_start/end/completed_at (mantidas como fallback).';

-- Backfill: para clientes existentes (auditoria), copiar das colunas antigas para o jsonb
-- só onde phase_dates ainda está vazio, sem sobrescrever nada que já tenha sido salvo
UPDATE public.clients
SET phase_dates = jsonb_strip_nulls(jsonb_build_object(
  'diagnostico', jsonb_build_object(
    'start', phase_diagnostico_start,
    'end', phase_diagnostico_end,
    'completed_at', phase_diagnostico_completed_at
  ),
  'estruturacao', jsonb_build_object(
    'start', phase_estruturacao_start,
    'end', phase_estruturacao_end,
    'completed_at', phase_estruturacao_completed_at
  ),
  'operacao_guiada', jsonb_build_object(
    'start', phase_operacao_guiada_start,
    'end', phase_operacao_guiada_end,
    'completed_at', phase_operacao_guiada_completed_at
  ),
  'transferencia', jsonb_build_object(
    'start', phase_transferencia_start,
    'end', phase_transferencia_end,
    'completed_at', phase_transferencia_completed_at
  )
))
WHERE phase_dates = '{}'::jsonb;