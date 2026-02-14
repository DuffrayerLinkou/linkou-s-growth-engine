

# Autonomia Total para o Cliente: Plano de Empoderamento

## Visao Geral

Atualmente o usuario cliente funciona como um "espectador" - ele ve tarefas, campanhas, agendamentos e arquivos que foram criados pelo admin. A proposta e transformar o cliente (gestor e/ou ponto focal) em um **gestor autonomo** do seu proprio marketing, capaz de criar, gerenciar e executar sem depender do admin.

## Diagnostico: O que o cliente NAO consegue fazer hoje

| Funcionalidade | Situacao Atual | Ideal |
|---|---|---|
| Tarefas | Apenas visualiza e conclui tarefas criadas pelo admin | Criar suas proprias tarefas internas |
| Campanhas | Apenas visualiza e aprova campanhas do admin | Criar briefings/solicitacoes de campanhas |
| Projetos | Nao tem acesso | Ver seus projetos e progresso |
| Agendamentos | Apenas visualiza reunioes agendadas | Solicitar/agendar reunioes |
| Metricas | Apenas visualiza (manager) | Adicionar metas e comentar |
| Minha Conta | Somente leitura | Editar nome, telefone, avatar |
| Base de Conhecimento | Conteudo estatico/fixo | Acessar documentos e guias do proprio projeto |

## Mudancas Propostas (Ordenadas por Impacto)

### Fase 1 - Criacao e Gestao (maior impacto)

#### 1.1 Cliente pode criar tarefas proprias
**Arquivo:** `src/pages/cliente/Tarefas.tsx`

- Adicionar botao "Nova Tarefa" (visivel para ponto_focal e manager)
- Dialog de criacao com campos: titulo, descricao, prioridade, data limite
- Tarefas criadas pelo cliente terao `executor_type = "client"` e `assigned_to = user.id` automaticamente
- `visible_to_client = true` e `journey_phase` baseado na fase atual do cliente
- Permissao: ponto focal e manager podem criar; operator pode ver

#### 1.2 Cliente pode solicitar campanhas (Briefing Request)
**Arquivo:** `src/pages/cliente/Campanhas.tsx`

- Adicionar botao "Solicitar Campanha" (ponto_focal e manager)
- Formulario simplificado de briefing: nome, objetivo, publico-alvo, mensagem principal, materiais de referencia (upload), prazo desejado
- Campanha criada com `status = "draft"` automaticamente
- Admin recebe notificacao e complementa os dados tecnicos (plataforma, orcamento, segmentacao)
- Permissao: ponto focal e manager

#### 1.3 Cliente pode agendar reunioes
**Arquivo:** `src/pages/cliente/Agendamentos.tsx`

- Adicionar botao "Solicitar Reuniao"
- Campos: tipo (alinhamento, revisao, duvida), data/hora sugerida, descricao
- Agendamento criado com `status = "pending"` para admin confirmar
- Permissao: todos os perfis de cliente

### Fase 2 - Edicao e Personalizacao

#### 2.1 Minha Conta editavel
**Arquivo:** `src/pages/cliente/MinhaConta.tsx`

- Transformar campos em formulario editavel
- Permitir alterar: nome completo, telefone, avatar (upload de foto)
- Email continua read-only (vem do auth)
- Botao "Salvar" que atualiza tabela `profiles`

#### 2.2 Gestao de equipe do cliente (Manager only)
**Novo arquivo:** `src/pages/cliente/MinhaEquipe.tsx`

- Manager pode visualizar os usuarios vinculados ao mesmo `client_id`
- Ver quem e ponto focal, quem e operator
- Solicitar adição de novo usuario (gera pedido para admin)
- Nao pode alterar roles diretamente (seguranca)

### Fase 3 - Inteligencia e Autonomia

#### 3.1 Notas e comentarios em metricas
**Arquivo:** `src/pages/cliente/MetricasTrafego.tsx`

- Manager pode adicionar notas/observacoes em cada mes de metrica
- Campo "Meta do mes" para definir objetivos (ex: "Atingir 50 leads")
- Comparativo automatico meta vs realizado

#### 3.2 Documentos do projeto na Base de Conhecimento
**Arquivo:** `src/pages/cliente/BaseConhecimento.tsx`

- Alem dos guias estaticos, incluir uma aba "Meus Documentos"
- Puxa arquivos do tipo `deliverable` da tabela `files`
- Inclui briefings aprovados, relatorios, e materiais entregues
- Organizado por projeto e data

---

## Detalhes Tecnicos

### Permissoes para criacao (useClientPermissions atualizado)

```typescript
// Novas permissoes adicionadas ao hook existente
canCreateTasks: isPontoFocal || userType === "manager",
canRequestCampaigns: isPontoFocal || userType === "manager",
canScheduleAppointments: true, // todos
canEditProfile: true, // todos
canManageTeam: userType === "manager",
canAddMetricNotes: userType === "manager",
```

### Formulario de criacao de tarefa

Campos simplificados (sem complexidade do admin):
- Titulo (obrigatorio)
- Descricao (opcional, textarea)
- Prioridade (select: baixa, media, alta, urgente)
- Data limite (date picker, opcional)

Campos preenchidos automaticamente:
- `client_id`: do clientInfo
- `executor_type`: "client"
- `assigned_to`: user.id
- `visible_to_client`: true
- `journey_phase`: fase atual do cliente
- `status`: "todo"

### Formulario de solicitacao de campanha

Campos simplificados (foco no briefing):
- Nome da campanha (obrigatorio)
- Objetivo (select: gerar leads, vendas, reconhecimento, engajamento)
- Descricao / mensagem principal (textarea)
- Publico-alvo (textarea livre)
- Prazo desejado (date picker)
- Material de referencia (upload opcional)

Campos preenchidos automaticamente:
- `client_id`: do clientInfo
- `status`: "draft"
- `platform`: null (admin define depois)
- `budget`/`daily_budget`: null (admin define)

### Formulario de agendamento

- Titulo (obrigatorio)
- Tipo (select: alinhamento, revisao, duvida, outro)
- Data e hora sugerida (datetime picker)
- Duracao estimada (select: 30min, 1h, 1h30)
- Descricao (textarea)

Campos automaticos:
- `client_id`: do clientInfo
- `created_by`: user.id
- `status`: "pending"

### Edicao de perfil

Campos editaveis:
- `full_name` (input text)
- `phone` (input tel)
- `avatar_url` (upload de imagem)

Update via: `supabase.from("profiles").update({...}).eq("id", user.id)`

### Nova rota e navegacao

```typescript
// App.tsx - nova rota
<Route path="minha-equipe" element={<MinhaEquipe />} />

// ClientLayout.tsx - novo nav item (condicional)
{ href: "/cliente/minha-equipe", icon: Users, label: "Minha Equipe", permission: "canManageTeam" }
```

### Arquivos alterados/criados

**Alterados:**
1. `src/hooks/useClientPermissions.ts` - novas permissoes
2. `src/pages/cliente/Tarefas.tsx` - botao + dialog de criacao
3. `src/pages/cliente/Campanhas.tsx` - botao + dialog de solicitacao
4. `src/pages/cliente/Agendamentos.tsx` - botao + dialog de agendamento
5. `src/pages/cliente/MinhaConta.tsx` - formulario editavel
6. `src/pages/cliente/BaseConhecimento.tsx` - aba "Meus Documentos"
7. `src/layouts/ClientLayout.tsx` - novo item de navegacao
8. `src/App.tsx` - nova rota

**Criados:**
1. `src/pages/cliente/MinhaEquipe.tsx` - gestao de equipe do cliente

---

## Recomendacao de Implementacao

Dado o volume, sugiro implementar em **3 etapas**:

**Etapa 1** (prioridade alta): Criacao de tarefas + Solicitacao de campanhas + Agendamento de reunioes
- Sao as funcoes que mais impactam a autonomia do cliente

**Etapa 2**: Edicao de perfil + Base de Conhecimento com documentos do projeto
- Melhoram a experiencia mas nao sao bloqueantes

**Etapa 3**: Gestao de equipe + Notas em metricas
- Funcoes avancadas para gestores maduros

Qual etapa voce quer comecar?

