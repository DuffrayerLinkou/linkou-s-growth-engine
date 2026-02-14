
# Auditoria e Plano de Melhorias - Ecossistema Linkou

## Resumo da Auditoria

Fiz uma varredura completa na aplicacao cobrindo: arquitetura, seguranca (RLS/banco), edge functions, UX dos 3 perfis de usuario, performance e lacunas funcionais. A aplicacao esta muito bem estruturada - vou organizar as descobertas e sugestoes por prioridade.

---

## 1. CRITICO - Seguranca (Corrigir Primeiro)

### 1.1 Credenciais de Marketing Expostas Publicamente
A tabela `landing_settings` esta acessivel sem autenticacao (policy "Anyone can view landing settings"). Ela contem: Meta Pixel IDs, access tokens, app secrets, webhook tokens, TikTok access tokens, Google Ads IDs e configuracao WhatsApp.

**Correcao:** Remover a policy publica de SELECT e restringir a admin/account_manager. Os scripts de tracking no frontend podem buscar apenas os pixel IDs necessarios via uma edge function dedicada ou injetar os valores no build.

### 1.2 Paginas de Captura Totalmente Expostas
A tabela `capture_pages` esta 100% legivel publicamente, expondo toda a estrategia de marketing (headlines, copy, form fields, beneficios, pixels). Concorrentes podem copiar tudo.

**Correcao:** Criar uma view publica que exponha apenas os campos necessarios para renderizar a pagina (slug, headline, form_fields, cta) e restringir o acesso completo a admins.

### 1.3 Leaked Password Protection Desativada
O Supabase nao esta verificando senhas vazadas em breaches conhecidos.

**Correcao:** Ativar no painel do Supabase em Auth > Settings > Password Security.

---

## 2. IMPORTANTE - Melhorias de Governanca por Perfil

### 2.1 Diferenciar Permissoes: Ponto Focal vs Gestor/Dono

Atualmente o sistema distingue `ponto_focal` (boolean) e `user_type` (operator/manager), mas a **logica de permissoes nao esta aplicada de forma consistente**. O Gestor/Dono deveria ter acesso diferente do Ponto Focal:

| Recurso | Ponto Focal | Gestor/Dono |
|---------|-------------|-------------|
| Aprovar campanhas | Sim | Sim |
| Ver contratos | Sim | Sim |
| Ver pagamentos/financeiro | Nao | Sim |
| Ver briefings estrategicos | Sim | Sim |
| Editar dados da conta | Nao | Sim |
| Gerenciar usuarios do cliente | Nao | Sim |

**Correcao:** Atualizar RLS policies de `payments`, `contracts` e `briefings` para checar `user_type = 'manager'` ou `ponto_focal = true` conforme a tabela acima. Atualizar tambem o frontend para esconder/mostrar menus condicionalmente.

### 2.2 Controle de Leads por Account Manager
Atualmente todos os account_managers veem TODOS os leads. Se a agencia crescer, sera necessario segmentar por responsavel.

**Sugestao futura:** Adicionar coluna `assigned_to` na tabela leads e filtrar por ela.

---

## 3. IMPORTANTE - Melhorias Funcionais

### 3.1 Sessao Expirada Trava na Tela de Loading
Quando o token de autenticacao expira, o usuario fica preso no "Carregando..." infinitamente. Isso ja foi identificado anteriormente.

**Correcao:** No `useAuth`, detectar erro de refresh token e chamar `signOut()` automaticamente, redirecionando para `/auth` com mensagem amigavel.

### 3.2 Dashboard Admin - Otimizacao de Queries
O Dashboard admin faz **15+ queries paralelas** ao Supabase. A pagina de Clientes faz N+1 queries (uma por cliente para contar usuarios e verificar ponto focal).

**Correcao:**
- Criar uma database function `get_dashboard_summary()` que retorna todos os KPIs em uma unica chamada
- Na pagina Clientes, usar uma unica query com `count` e join ao inves de Promise.all com queries individuais

### 3.3 Pagina de Propostas - Integrar com Lead Detail
O botao "Proposta" foi adicionado ao `LeadQuickActions` mas nao ao `LeadDetailDialog`. O fluxo ideal seria o usuario abrir o detalhe do lead e ter acesso direto.

**Correcao:** Adicionar botao "Gerar Proposta" no `LeadDetailDialog.tsx` ao lado de "Converter em Cliente".

### 3.4 Notificacoes em Tempo Real - Melhorias
O sistema de notificacoes ja tem realtime via subscription, mas so notifica em poucos cenarios (comentarios em campanhas e deadlines de tarefas).

**Sugestao:** Expandir para notificar:
- Novo lead capturado (para admins)
- Lead mudou de status
- Campanha aprovada pelo ponto focal
- Arquivo enviado pelo cliente
- Nova proposta gerada

### 3.5 Validacao de Leads - Anti-Spam
A tabela `leads` permite INSERT sem autenticacao (necessario para landing page), mas nao tem protecao contra spam.

**Correcao:** Adicionar rate limiting na edge function ou no frontend (honeypot field + debounce) e verificar duplicatas recentes por email no ContactForm.

---

## 4. MELHORIAS DE UX

### 4.1 Sidebar Admin - Muitos Itens (14 links)
A navegacao tem 14 itens, o que pode ser esmagador. 

**Sugestao:** Agrupar em categorias colapsaveis:
- **Comercial**: Leads, Propostas, Capturas
- **Operacional**: Clientes, Projetos, Campanhas, Tarefas
- **Comunicacao**: WhatsApp, Templates
- **Configuracao**: Landing Page, Onboarding, Usuarios

### 4.2 Area do Cliente - Feedback Visual de Progresso
O dashboard do cliente mostra KPIs basicos mas poderia ter:
- Barra de progresso geral da jornada (4 fases)
- Indicador de "saude" do projeto (baseado em tarefas vencidas)
- Timeline visual mais proeminente

### 4.3 Mobile - Responsividade
Os layouts ja sao responsivos mas paginas como Dashboard admin com muitas cards e tabelas poderiam ter melhores breakpoints para tablets (834px).

---

## 5. INTEGRIDADE DE DADOS

### 5.1 Conversao de Lead para Cliente
Ao converter, o status do cliente e criado como `"active"` mas o enum esperado e `"ativo"`. Isso pode causar inconsistencia.

**Correcao:** Na funcao `convertToClient` em `Leads.tsx` (linha 347), mudar `status: "active"` para `status: "ativo"`.

### 5.2 Edge Functions - verify_jwt Desativado
Todas as 9 edge functions estao com `verify_jwt = false` no `config.toml`. Algumas (como `manage-users`) fazem verificacao manual do token, mas outras como `generate-proposal` e `generate-capture-page` ficam expostas.

**Correcao:** Ativar `verify_jwt = true` para funcoes que so devem ser chamadas por usuarios autenticados (generate-proposal, generate-capture-page, generate-task-guide). Manter `false` apenas para webhooks (meta-lead-webhook, whatsapp-api) e crons (check-task-deadlines).

---

## 6. PERFORMANCE

### 6.1 Lazy Loading - Bem Implementado
Todas as paginas usam `React.lazy()` com Suspense. Otimo.

### 6.2 React Query - Configuracao Solida
`staleTime: 5min`, `gcTime: 30min`, `refetchOnWindowFocus: false`. Adequado para o caso de uso.

### 6.3 N+1 na Listagem de Clientes
Ja mencionado em 3.2 - a funcao `fetchClients` faz queries individuais para cada cliente. Com 50+ clientes, isso sera um gargalo.

---

## Sequencia de Implementacao Recomendada

1. **Seguranca** (itens 1.1, 1.2, 1.3, 5.2) - Corrigir exposicao de dados
2. **Bug critico** (item 3.1) - Sessao expirada
3. **Integridade** (item 5.1) - Status de conversao
4. **Governanca** (item 2.1) - Permissoes por perfil de usuario
5. **Performance** (item 3.2) - Otimizar queries do dashboard
6. **UX** (itens 3.3, 3.4, 4.1, 4.2) - Melhorias de interface
7. **Anti-spam** (item 3.5) - Protecao de leads

---

## Detalhes Tecnicos

### Arquivos que precisam de alteracao (por prioridade):

**Seguranca (SQL migrations):**
- Nova migration para alterar RLS de `landing_settings` e `capture_pages`
- Nova migration para refinar RLS de `payments`, `contracts`, `briefings`

**Bug de sessao:**
- `src/hooks/useAuth.tsx` - Adicionar tratamento de erro no `onAuthStateChange`

**Integridade:**
- `src/pages/admin/Leads.tsx` (linha 347) - Corrigir status "active" para "ativo"

**Governanca:**
- `src/layouts/ClientLayout.tsx` - Condicionar menu por user_type
- `src/pages/cliente/Dashboard.tsx` - Mostrar/esconder secoes por perfil

**Performance:**
- `src/pages/admin/Clients.tsx` - Refatorar fetchClients para query unica
- `src/pages/admin/Dashboard.tsx` - Consolidar queries em menos chamadas

**UX:**
- `src/layouts/AdminLayout.tsx` - Agrupar navegacao em categorias
- `src/components/admin/leads/LeadDetailDialog.tsx` - Adicionar botao Proposta
- `supabase/config.toml` - Ativar verify_jwt nas funcoes adequadas
