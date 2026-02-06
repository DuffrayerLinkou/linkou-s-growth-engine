

# Plano: Guias de Execucao e Templates Anexaveis nas Tarefas

## Problema Atual

Hoje os templates de tarefas tem apenas titulo e descricao curta. Quando a tarefa e criada para o cliente ou equipe, nao ha orientacao de **como executar** aquela tarefa, nem documentos/planilhas prontos para uso.

---

## Solucao Proposta: 3 Camadas

### Camada 1 - Instrucoes de Execucao (Markdown)

Adicionar um campo `execution_guide` (texto longo, Markdown) no `task_templates` e no `tasks`. Esse campo contem o passo a passo detalhado de como executar a tarefa.

**Exemplo para "Reuniao de briefing do projeto":**
```
## Passo a Passo
1. Agendar reuniao com o cliente (30-60min)
2. Preparar roteiro de perguntas (ver template anexo)
3. Durante a reuniao, preencher o formulario de briefing
4. Documentar decisoes e proximos passos
5. Enviar resumo ao cliente em ate 24h

## Pontos Importantes
- Sempre gravar a reuniao (com autorizacao)
- Confirmar objetivos SMART
- Definir prazos claros
```

Quando o admin cria tarefas a partir de templates, o `execution_guide` e copiado automaticamente para a tarefa.

### Camada 2 - Arquivos Template Anexaveis

Permitir anexar arquivos (planilhas, PDFs, docs) diretamente aos **templates de tarefas**. Quando a tarefa e criada a partir do template, os arquivos sao referenciados automaticamente.

Isso usa a infraestrutura existente de `files` + Storage, adicionando suporte a `template_id` na tabela `files`.

### Camada 3 - Geracao por IA (Opcional)

Adicionar um botao "Gerar com IA" no campo de instrucoes que usa o Lovable AI para gerar um guia de execucao baseado no titulo e contexto da tarefa. O admin pode editar o resultado antes de salvar.

---

## Alteracoes no Banco de Dados

### Migration SQL

```sql
-- Adicionar campo de guia de execucao aos templates
ALTER TABLE public.task_templates 
ADD COLUMN execution_guide TEXT;

-- Adicionar campo de guia de execucao as tarefas
ALTER TABLE public.tasks 
ADD COLUMN execution_guide TEXT;

-- Permitir anexar arquivos a templates (alem de tarefas)
ALTER TABLE public.files 
ADD COLUMN template_id UUID REFERENCES public.task_templates(id) ON DELETE SET NULL;
```

---

## Arquivos a Modificar

### 1. `src/pages/admin/Templates.tsx`

- Adicionar campo `execution_guide` (Textarea com Markdown) no dialog de criar/editar template
- Adicionar secao de upload de arquivos template (reutilizando FileUploader)
- Adicionar botao "Gerar com IA" ao lado do campo de instrucoes
- Preview do guia em Markdown

### 2. `src/pages/admin/ClientDetail.tsx`

- Ao criar tarefas a partir de templates, copiar o `execution_guide` para a tarefa criada

### 3. `src/pages/admin/Tasks.tsx`

- Exibir o `execution_guide` no dialog de editar tarefa (aba ou secao expansivel)
- Permitir editar as instrucoes por tarefa

### 4. `src/components/cliente/TasksKanbanClient.tsx`

- Exibir o guia de execucao na visualizacao da tarefa pelo cliente (read-only)
- Mostrar arquivos template anexados

### 5. `src/integrations/supabase/types.ts`

- Atualizar tipos para incluir `execution_guide` em `tasks` e `task_templates`
- Atualizar tipo de `files` para incluir `template_id`

### 6. Nova Edge Function: `supabase/functions/generate-task-guide/index.ts`

- Recebe titulo, descricao e contexto do servico
- Usa Lovable AI para gerar instrucoes de execucao
- Retorna texto em Markdown

---

## Fluxo do Admin

```text
Admin abre Templates
       |
       v
Seleciona servico e fase
       |
       v
Edita/Cria template
       |
       v
+------------------------------------------+
|  Titulo: Reuniao de briefing             |
|  Descricao: Alinhar expectativas...      |
|                                          |
|  Instrucoes de Execucao:                 |
|  [Gerar com IA]                          |
|  +--------------------------------------+|
|  | ## Passo a Passo                     ||
|  | 1. Agendar reuniao...                ||
|  | 2. Preparar roteiro...               ||
|  +--------------------------------------+|
|                                          |
|  Arquivos Template:                      |
|  [Roteiro-Briefing.xlsx]  [Upload +]     |
|  [Checklist-Projeto.pdf]                 |
|                                          |
|  [Cancelar]  [Salvar]                    |
+------------------------------------------+
```

## Fluxo do Cliente

```text
Cliente abre tarefa
       |
       v
+------------------------------------------+
|  Reuniao de briefing do projeto          |
|  Status: A Fazer  |  Prazo: 10/02       |
|                                          |
|  Como executar esta tarefa:              |
|  +--------------------------------------+|
|  | 1. Agendar reuniao (30-60min)        ||
|  | 2. Preparar roteiro de perguntas     ||
|  | 3. Preencher formulario de briefing  ||
|  +--------------------------------------+|
|                                          |
|  Documentos de apoio:                    |
|  [Baixar] Roteiro-Briefing.xlsx          |
|  [Baixar] Checklist-Projeto.pdf          |
|                                          |
|  Arquivos enviados: [Anexar arquivo]     |
+------------------------------------------+
```

---

## Edge Function: Geracao por IA

A funcao recebe o contexto do template e retorna instrucoes formatadas:

```typescript
// Input
{
  title: "Reuniao de briefing do projeto",
  description: "Alinhar expectativas...",
  service_type: "site",
  journey_phase: "briefing"
}

// Output: Markdown com passo a passo detalhado
```

Prompt do sistema orientara a IA a gerar instrucoes praticas, objetivas e com formato consistente (passos numerados, pontos importantes, checklist).

---

## Detalhes Tecnicos

### Interface TaskTemplate atualizada

```typescript
interface TaskTemplate {
  id: string;
  service_type: string;
  journey_phase: string;
  title: string;
  description: string | null;
  execution_guide: string | null;  // NOVO
  priority: string;
  order_index: number;
  visible_to_client: boolean;
  is_active: boolean;
}
```

### Copia do guia ao aplicar templates (ClientDetail.tsx)

```typescript
// Ao criar tarefa a partir do template
const taskData = {
  title: template.title,
  description: template.description,
  execution_guide: template.execution_guide, // Copiar guia
  journey_phase: selectedPhase,
  // ...outros campos
};
```

### Componente de visualizacao do guia

Reutilizar Markdown rendering simples (o campo ja suporta formatacao basica com quebras de linha e listas) ou adicionar `react-markdown` se necessario para renderizacao mais rica.

---

## Resultado Esperado

1. Templates de tarefas incluem instrucoes detalhadas de execucao
2. Arquivos modelo (planilhas, PDFs) podem ser anexados aos templates
3. IA pode gerar instrucoes automaticamente como ponto de partida
4. Ao aplicar templates, tudo e copiado para as tarefas do cliente
5. Cliente ve o passo a passo e pode baixar os documentos de apoio
6. Admin pode personalizar as instrucoes por tarefa apos criacao

