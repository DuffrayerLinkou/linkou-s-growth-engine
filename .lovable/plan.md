

# Plano: Templates de Tarefas por Tipo de Serviço

## Contexto Atual

Os templates de tarefas estão organizados exclusivamente pelas 4 fases da jornada de **Auditoria e Consultoria**:
- Diagnóstico
- Estruturação  
- Operação Guiada
- Transferência

Isso funciona bem para o serviço principal, mas não contempla os novos serviços adicionados:
- **Produção de Mídia** (Anúncios e Orgânico)
- **Gestão de Tráfego** (Recorrente e Estratégico)
- **Design** (Identidade Visual, Apps, Sites, Landing Pages)

## Solução Proposta

Expandir o sistema de templates para incluir um campo `service_type` que permite categorizar templates por tipo de serviço, mantendo compatibilidade com o sistema atual.

---

## Arquitetura da Solução

```
task_templates
├── service_type (NOVO) ── "auditoria" | "producao" | "gestao" | "design"
├── journey_phase         ── Fases específicas por serviço
├── title
├── description
├── priority
├── order_index
├── visible_to_client
└── is_active
```

### Fases por Serviço

| Serviço | Fases |
|---------|-------|
| Auditoria | diagnostico, estruturacao, operacao_guiada, transferencia |
| Produção de Mídia | briefing, producao, revisao, entrega |
| Gestão de Tráfego | onboarding, setup, otimizacao, escala |
| Design | descoberta, conceito, desenvolvimento, entrega |

---

## Etapas de Implementação

### Etapa 1: Banco de Dados

Adicionar coluna `service_type` na tabela `task_templates`:
- Tipo: `text`
- Valor padrão: `'auditoria'` (para manter compatibilidade)
- Atualizar templates existentes para ter `service_type = 'auditoria'`

### Etapa 2: Configuração de Serviços e Fases

Criar arquivo de configuração `src/lib/service-phases-config.ts` com:
- Mapeamento de fases por serviço
- Labels e cores para cada fase
- Helpers para obter fases de um serviço

### Etapa 3: Atualizar Página de Templates

Modificar `src/pages/admin/Templates.tsx`:
- Adicionar seletor de serviço no header
- Tabs de fases mudam dinamicamente conforme o serviço selecionado
- Formulário de novo template inclui o `service_type`

### Etapa 4: Inserir Templates Iniciais

Criar templates iniciais para cada serviço:

**Produção de Mídia:**
- Briefing criativo
- Definição de linha visual
- Produção de peças/vídeos
- Revisão com cliente
- Ajustes finais
- Entrega dos assets

**Gestão de Tráfego:**
- Onboarding e acessos
- Auditoria de contas existentes
- Setup de campanhas
- Configuração de tracking
- Otimização semanal
- Relatório mensal

**Design:**
- Briefing e pesquisa
- Moodboard e referências
- Conceito inicial
- Desenvolvimento
- Revisões
- Entrega final

---

## Detalhes Técnicos

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/service-phases-config.ts` | Configuração de fases por tipo de serviço |

### Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/admin/Templates.tsx` | Adicionar seletor de serviço e lógica dinâmica de fases |
| `src/integrations/supabase/types.ts` | Atualizado automaticamente após migration |

### Migration SQL

```sql
-- Adicionar coluna service_type na tabela task_templates
ALTER TABLE public.task_templates 
ADD COLUMN service_type text NOT NULL DEFAULT 'auditoria';

-- Atualizar templates existentes
UPDATE public.task_templates 
SET service_type = 'auditoria' 
WHERE service_type IS NULL OR service_type = '';

-- Comentário na coluna
COMMENT ON COLUMN public.task_templates.service_type IS 
  'Tipo de serviço: auditoria, producao, gestao, design';
```

### Estrutura do service-phases-config.ts

```typescript
export type ServiceType = "auditoria" | "producao" | "gestao" | "design";

export interface ServicePhase {
  value: string;
  label: string;
  color: string;
  order: number;
}

export const servicePhases: Record<ServiceType, ServicePhase[]> = {
  auditoria: [
    { value: "diagnostico", label: "Diagnóstico", color: "bg-purple-500/20 text-purple-600", order: 1 },
    { value: "estruturacao", label: "Estruturação", color: "bg-blue-500/20 text-blue-600", order: 2 },
    { value: "operacao_guiada", label: "Op. Guiada", color: "bg-orange-500/20 text-orange-600", order: 3 },
    { value: "transferencia", label: "Transferência", color: "bg-green-500/20 text-green-600", order: 4 },
  ],
  producao: [
    { value: "briefing", label: "Briefing", color: "bg-pink-500/20 text-pink-600", order: 1 },
    { value: "producao", label: "Produção", color: "bg-amber-500/20 text-amber-600", order: 2 },
    { value: "revisao", label: "Revisão", color: "bg-cyan-500/20 text-cyan-600", order: 3 },
    { value: "entrega", label: "Entrega", color: "bg-green-500/20 text-green-600", order: 4 },
  ],
  gestao: [
    { value: "onboarding", label: "Onboarding", color: "bg-indigo-500/20 text-indigo-600", order: 1 },
    { value: "setup", label: "Setup", color: "bg-blue-500/20 text-blue-600", order: 2 },
    { value: "otimizacao", label: "Otimização", color: "bg-orange-500/20 text-orange-600", order: 3 },
    { value: "escala", label: "Escala", color: "bg-green-500/20 text-green-600", order: 4 },
  ],
  design: [
    { value: "descoberta", label: "Descoberta", color: "bg-violet-500/20 text-violet-600", order: 1 },
    { value: "conceito", label: "Conceito", color: "bg-fuchsia-500/20 text-fuchsia-600", order: 2 },
    { value: "desenvolvimento", label: "Desenvolvimento", color: "bg-sky-500/20 text-sky-600", order: 3 },
    { value: "entrega", label: "Entrega", color: "bg-green-500/20 text-green-600", order: 4 },
  ],
};
```

### Templates Iniciais (Exemplos)

**Produção de Mídia - Fase Briefing:**
1. Reunião de briefing criativo
2. Definir público-alvo e tom de voz
3. Coletar referências visuais
4. Definir formatos e especificações

**Gestão de Tráfego - Fase Onboarding:**
1. Solicitar acessos às contas
2. Conhecer produto/serviço do cliente
3. Definir metas e KPIs
4. Mapear concorrentes

**Design - Fase Descoberta:**
1. Briefing de marca
2. Pesquisa de mercado
3. Análise de concorrentes
4. Definir entregáveis

---

## Resultado Esperado

1. Interface de Templates com seletor de serviço no topo
2. Tabs de fases mudam conforme o serviço selecionado
3. Templates organizados por serviço e fase
4. Templates prontos para cada tipo de serviço
5. Compatibilidade total com o sistema existente

