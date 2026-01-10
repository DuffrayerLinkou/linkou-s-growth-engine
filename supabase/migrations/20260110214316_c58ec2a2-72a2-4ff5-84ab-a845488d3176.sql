-- Adicionar colunas SQL e Custo por SQL à tabela traffic_metrics
ALTER TABLE public.traffic_metrics 
ADD COLUMN quantidade_sql INTEGER,
ADD COLUMN custo_por_sql NUMERIC(10,2);

-- Adicionar comentários descritivos
COMMENT ON COLUMN public.traffic_metrics.quantidade_sql IS 'Sales Qualified Leads - Leads qualificados para vendas';
COMMENT ON COLUMN public.traffic_metrics.custo_por_sql IS 'Custo por SQL - Calculado automaticamente (investimento/sql)';