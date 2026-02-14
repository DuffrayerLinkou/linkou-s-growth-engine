

# Modulo de Propostas Comerciais Automaticas para Leads

## Objetivo
Criar um sistema completo de propostas comerciais que pode ser acionado diretamente a partir de um lead no CRM. O usuario seleciona um lead, escolhe um template de proposta (ou gera via IA), visualiza a apresentacao no formato de slides, edita se necessario, e exporta como PDF para enviar ao prospect.

## Como vai funcionar

### Fluxo do usuario
1. Na tela de Leads, ao abrir o detalhe de um lead, um novo botao "Gerar Proposta" aparece
2. Um dialog abre com opcoes: escolher template pronto ou gerar com IA
3. Se escolher IA, descreve brevemente o contexto e a IA gera todo o conteudo
4. Os slides sao exibidos em preview (formato 16:9 escalado)
5. O usuario pode editar textos diretamente nos slides
6. Ao finalizar, exporta como PDF (usando jsPDF ja instalado) ou salva como rascunho

### Templates prontos disponiveis
- **Proposta de Gestao de Trafego** - para leads interessados em Meta/Google Ads
- **Proposta de Auditoria** - diagnostico de contas de anuncios
- **Proposta de Producao de Midia** - criativos e conteudo
- **Proposta de Site/Landing Page** - desenvolvimento web
- **Proposta de Design** - identidade visual
- **Proposta de Aplicacao Web** - desenvolvimento com IA

Cada template tera slides padrao: Capa, Sobre a Linkou, Diagnostico do Cliente, Solucao Proposta, Escopo e Entregaveis, Investimento, Proximos Passos.

## Detalhes Tecnicos

### 1. Banco de Dados - Nova tabela `proposals`

```text
CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_segment text,
  service_type text NOT NULL,
  title text NOT NULL,
  slides jsonb NOT NULL DEFAULT '[]',
  status text DEFAULT 'draft',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage proposals" ON proposals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','account_manager'))
  );
```

Cada slide e um objeto JSON com a estrutura:
```text
{
  "type": "cover" | "about" | "diagnostic" | "solution" | "scope" | "investment" | "next_steps" | "custom",
  "title": "Titulo do slide",
  "content": ["Linha 1", "Linha 2"],
  "highlights": ["Destaque 1", "Destaque 2"],
  "image_url": "opcional"
}
```

### 2. Nova Edge Function: `generate-proposal`

- Arquivo: `supabase/functions/generate-proposal/index.ts`
- Recebe: `lead_name`, `lead_segment`, `lead_objective`, `service_type`, `custom_context`
- Usa a Lovable AI Gateway (Gemini 3 Flash) com tool calling
- Retorna array de 6-8 slides estruturados em JSON
- O prompt de sistema inclui conhecimento sobre os servicos da Linkou (extraido do `services-config.ts`) para gerar conteudo preciso
- Tratamento de erros 429/402

### 3. Componentes Frontend

**Novos arquivos:**
- `src/components/admin/proposals/ProposalGenerator.tsx` - Dialog principal com escolha de template ou IA
- `src/components/admin/proposals/ProposalSlidePreview.tsx` - Visualizacao dos slides em formato 16:9 escalado
- `src/components/admin/proposals/ProposalSlideEditor.tsx` - Edicao inline dos textos de cada slide
- `src/components/admin/proposals/ProposalTemplates.ts` - Templates prontos com slides pre-definidos para cada servico
- `src/components/admin/proposals/ProposalPDFExport.ts` - Funcao de exportar slides como PDF formatado (usando jsPDF)

**Arquivos editados:**
- `src/pages/admin/Leads.tsx` - Botao "Gerar Proposta" no detalhe do lead
- `src/components/admin/leads/LeadDetailDialog.tsx` - Integrar botao de proposta
- `src/components/admin/leads/LeadQuickActions.tsx` - Acao rapida de proposta
- `src/layouts/AdminLayout.tsx` - Adicionar link "Propostas" na navegacao
- `src/App.tsx` - Nova rota `/admin/propostas`
- `src/integrations/supabase/types.ts` - Tipos da nova tabela
- `supabase/config.toml` - Registrar nova edge function

**Nova pagina:**
- `src/pages/admin/Proposals.tsx` - Listagem de todas as propostas com filtros por status (rascunho, enviada, aceita, recusada)

### 4. Visualizacao dos Slides

Cada slide renderiza em um container 16:9 com resolucao fixa de 1920x1080 escalado via CSS transform para caber no viewport. Os slides seguem o design system da Linkou com cores roxo (#7C3AED), preto e branco.

Layout de cada tipo de slide:
- **Capa**: Logo Linkou + nome do cliente + titulo da proposta + data
- **Sobre**: Texto sobre a empresa com icones dos servicos
- **Diagnostico**: Bullets com os problemas/oportunidades identificados
- **Solucao**: Descricao do que sera feito, com destaques
- **Escopo**: Lista de entregaveis com checkmarks
- **Investimento**: Valores e condicoes (editavel pelo usuario)
- **Proximos Passos**: Timeline com etapas e prazos

### 5. Exportacao PDF

Reutiliza e expande o `pdf-generator.ts` existente para gerar um PDF formatado como apresentacao:
- Uma pagina por slide em formato paisagem (A4 landscape)
- Cores e tipografia consistentes com a marca
- Capa com logo
- Rodape com data e numero da pagina

## Sequencia de implementacao

1. Migration SQL (tabela `proposals` + RLS)
2. Templates prontos (`ProposalTemplates.ts`)
3. Edge function `generate-proposal`
4. Componentes de preview e editor de slides
5. Exportacao PDF
6. Integracao com tela de Leads (botao + dialog)
7. Pagina de listagem de propostas (`/admin/propostas`)
8. Rota e navegacao

## Arquivos que serao criados/editados

**Criar:**
- Migration SQL
- `supabase/functions/generate-proposal/index.ts`
- `src/pages/admin/Proposals.tsx`
- `src/components/admin/proposals/ProposalGenerator.tsx`
- `src/components/admin/proposals/ProposalSlidePreview.tsx`
- `src/components/admin/proposals/ProposalSlideEditor.tsx`
- `src/components/admin/proposals/ProposalTemplates.ts`
- `src/components/admin/proposals/ProposalPDFExport.ts`

**Editar:**
- `src/components/admin/leads/LeadDetailDialog.tsx`
- `src/components/admin/leads/LeadQuickActions.tsx`
- `src/layouts/AdminLayout.tsx`
- `src/App.tsx`
- `src/integrations/supabase/types.ts`
- `supabase/config.toml`

