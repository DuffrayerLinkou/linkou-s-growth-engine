<p align="center">
  <img src="src/assets/logo-linkou-horizontal-roxo.png" alt="Agência Linkou" width="280"/>
</p>

<h1 align="center">Agência Linkou — Plataforma de Gestão</h1>

<p align="center">
  <strong>Ecossistema completo de consultoria, tráfego pago e vendas digitais</strong><br/>
  <a href="https://agencialinkou.com.br">agencialinkou.com.br</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>
  <img src="https://img.shields.io/badge/Lovable_AI-Gemini-FFC107?style=for-the-badge&logo=googlegemini&logoColor=black" alt="Lovable AI Gateway"/>
</p>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Módulos da Plataforma](#-módulos-da-plataforma)
- [Linkouzinho — Assistente IA](#-linkouzinho--assistente-ia)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura Técnica](#-arquitetura-técnica)
- [Roles & Permissões](#-roles--permissões)
- [Desenvolvimento Local](#-desenvolvimento-local)
- [Integração com GitHub](#-integração-com-github)
- [Links](#-links)

---

## 🎯 Visão Geral

A **Agência Linkou** é uma agência de **consultoria, tráfego pago e vendas digitais**. Esta plataforma é o ecossistema operacional completo da agência: governança da equipe interna, atendimento aos clientes, CRM de leads, automação de marketing, captação, propostas comerciais e analytics — tudo em um único produto multi-tenant.

### Diferenciais

- 🤖 **Linkouzinho** — assistente IA com **7 tool calls** internos para automação operacional e estratégica
- 🎨 **Identidade visual estrita** — Poppins/Lora/Cascadia, paleta roxa, dark mode por padrão
- 🔐 **Multi-tenant rigoroso** — equipe interna (`client_id IS NULL`) e clientes com 3 perfis (Manager, Focal Point, Operator)
- 📱 **PWA com push notifications** — instalável e com alertas mesmo com app fechado
- 📊 **Tracking server-side** — Meta CAPI e TikTok Events API via Edge Functions
- ✉️ **E-mails transacionais** — Resend com domínio próprio e templates padronizados

---

## 🧩 Módulos da Plataforma

### Marketing & Captação

| Módulo | Descrição |
|---|---|
| 🌐 **Landing Page Institucional** | Site público em agencialinkou.com.br com hero editorial, marquee infinito, glassmorphism, JSON-LD dinâmico e SEO white-label |
| 🤖 **Linkouzinho Público** | Bot flutuante (botão amarelo) com SSE streaming que qualifica leads e captura via WhatsApp, agendamento ou e-mail |
| 📄 **Páginas de Captura** | Geradas por IA via `/c/:slug` em layout minimalista ou VSL (Video Sales Letter 16:9). Redirecionam para `/c/:slug/obrigado` para tracking preciso de pixels |
| 📨 **Funil de E-mails** | Drip campaigns automatizadas em `/admin/funil-email` com gerador IA, variáveis de personalização, auto-start no Day 0 e auto-stop em conversão |
| 📊 **Tracking & Pixels** | Meta Pixel + CAPI, TikTok Pixel + Events API, Google Analytics 4, GTM, Google Ads, LinkedIn, Hotjar — todos configuráveis em `/admin/landing` |

### CRM & Vendas

| Módulo | Descrição |
|---|---|
| 🎯 **CRM de Leads** | Kanban com bulk actions, follow-ups, atividades, integração Meta Lead Ads via webhook (HMAC), conversões offline para CAPI ao mover de status |
| 📑 **Propostas Comerciais** | Geração automática de propostas em slides 16:9 via IA, editor WYSIWYG e exportação PDF |
| 💬 **WhatsApp Business** | Integração oficial com Meta Cloud API: chat real-time, conversas inbound/outbound, disparos em massa via Edge Function |
| 📅 **Agendamentos** | Suporta tanto clientes (`client_id`) quanto leads (`lead_id`), com confirmação automática por e-mail para participantes internos |

### Operação & Entrega

| Módulo | Descrição |
|---|---|
| 🚀 **Onboarding** | Fluxo completo: briefing, plano estratégico, contrato, planejamento, calculadoras e pagamentos |
| 📋 **Projetos & Campanhas** | Gestão técnica de campanhas Meta/Google/TikTok/LinkedIn com targeting, criativos, budget, KPIs e aprovação por ponto focal |
| ✅ **Tarefas** | Kanban com guias de execução em Markdown (gerados por IA ou templates), anexos de referência e templates por fase de jornada |
| 📈 **Métricas de Tráfego** | Registro mensal manual com dashboards comparativos CPL/CPV/ROAS por canal |
| 🛤️ **Jornadas de Serviço** | 6 modelos distintos (Auditoria, Produção, Gestão, Design, Site, Web App) com fases e tarefas filtradas dinamicamente |

### Painel do Cliente

| Página | Descrição |
|---|---|
| 📊 **Dashboard** | KPIs, tarefas pendentes, campanhas ativas e estado de onboarding |
| 🛤️ **Minha Jornada** | Timeline visual da fase atual no modelo de serviço contratado |
| 📋 **Plano Estratégico** | Visualização do plano com personas, objetivos, KPIs e funil |
| ✅ **Tarefas** | Kanban com aprovação de entregas, comentários e anexos |
| 📢 **Campanhas** | Aprovação por ponto focal, métricas e comentários |
| 📁 **Arquivos** | Documentos do projeto |
| 📅 **Agendamentos** | Reuniões com a equipe |
| 📈 **Métricas de Tráfego** | Performance mensal |
| 📚 **Base de Conhecimento** | Documentação personalizada |
| 👥 **Minha Equipe** | Manager convida e gerencia membros (escopo restrito ao seu `client_id`) |
| 👤 **Minha Conta** | Perfil e preferências |

---

## 🤖 Linkouzinho — Assistente IA

O **Linkouzinho** é o assistente IA da plataforma, alimentado por **Gemini via Lovable AI Gateway**, com dois modos operacionais distintos.

### 🌐 Modo Público (Landing Page)

Botão flutuante amarelo na landing que conversa com visitantes via SSE streaming, qualificando leads e capturando-os por **WhatsApp**, **agendamento de reunião** ou **e-mail**. Persistência local em `localStorage` com TTL de 24h.

### 🛠️ Modo Admin (Interno) — 7 Tool Calls

Quando acionado por membros da equipe interna, o Linkouzinho ganha capacidade de **executar ações reais no banco** via function calling do Gemini. O contexto inclui briefings, planos estratégicos, métricas históricas e campanhas existentes do cliente em foco.

| Tool | Ação | Valor IA |
|---|---|---|
| `create_appointment` | Agenda reuniões automaticamente em `appointments` | 🟡 Operacional |
| `create_task` | Cria tarefas com prioridade, prazo e responsável | 🟡 Operacional |
| `upsert_traffic_metrics` | Preenche métricas mensais (UPSERT por cliente/mês/ano) | 🟡 Operacional |
| `create_project` | Cria novos projetos com escopo e budget | 🟡 Operacional |
| `create_briefing` | Estrutura briefing de cliente (nicho, público, objetivos, concorrentes, budget) | 🟢 Médio |
| `create_campaign` | Estrutura campanhas técnicas com targeting, copy, headline, CTA, budget e bidding strategy baseados em briefing + plano + métricas | 🔥 Alto |
| `create_strategic_plan` | Gera planos completos com **personas detalhadas**, **KPIs SMART**, **estratégia de funil** (topo/meio/fundo), **alocação de budget por canal** e tipos de campanha recomendados | 🔥 Alto |

### 🎓 Análise Estratégica (sem tool call)

Além das ferramentas, o system prompt orienta o Linkouzinho a atuar como **gestor de tráfego sênior**, capaz de:

- Comparar CPL / CPV / ROAS entre meses e calcular variação percentual
- Identificar gargalos no funil (impressões → cliques → leads → vendas)
- Projetar cenários e sugerir otimizações concretas
- Recomendar realocação de budget entre canais com base em performance histórica

### 🛡️ Governança & Custos

- AI sempre **opt-in / intent-based** para controlar custos no Lovable AI Gateway
- Validação JWT direta via Supabase Auth API (`/auth/v1/user`) em todas as Edge Functions
- Service role usado apenas no servidor; jamais exposto ao cliente
- Identidade do remetente IA preservada (Linkou) — sem revelar provedor

---

## 🛠️ Stack Tecnológica

### Frontend

| Tech | Versão | Uso |
|---|---|---|
| React | 18.3 | Framework UI |
| TypeScript | 5.6 | Tipagem estática |
| Vite | 5.4 | Build tool |
| Tailwind CSS | 3.4 | Design system com tokens semânticos HSL |
| shadcn/ui | — | Componentes acessíveis |
| Framer Motion | 12.x | Animações |
| TanStack Query | 5.x | Data fetching |
| React Router | 6.30 | Roteamento SPA |
| React Hook Form + Zod | 7.x / 3.x | Formulários e validação |
| Recharts | 2.x | Gráficos |

### Backend (Supabase)

| Serviço | Uso |
|---|---|
| **PostgreSQL** | Banco relacional com RLS estrito |
| **Supabase Auth** | JWT + refresh, sessões persistentes |
| **Storage** | Avatares, anexos, arquivos do cliente |
| **Edge Functions (Deno)** | Lógica server-side + integrações externas |
| **Realtime** | Atualizações ao vivo (WhatsApp, notificações) |

### IA & Integrações

| Serviço | Uso |
|---|---|
| **Lovable AI Gateway (Gemini)** | Toda a IA: bot, geração de e-mails, propostas, guias de tarefas, planos, campanhas |
| **Resend** | E-mails transacionais via `contato@agencialinkou.com.br` |
| **Meta Cloud API** | WhatsApp Business |
| **Meta Graph API** | Lead Ads (Instant Forms) via webhook HMAC |
| **Meta CAPI** | Tracking server-side de conversões |
| **TikTok Events API** | Tracking server-side de conversões |
| **Web Push (VAPID)** | Notificações PWA |

---

## 🏗️ Arquitetura Técnica

### Edge Functions Principais

| Função | Responsabilidade |
|---|---|
| `assistant-chat` | Linkouzinho admin com **7 tool calls** + contexto rico |
| `linkouzinho-chat` | Bot público da landing com SSE streaming |
| `manage-users` | Criação/atualização de usuários via Admin API (com fallback de reassign) |
| `notify-email` | Despachante central de e-mails mapeando eventos → templates |
| `send-email` | Envio direto via Resend |
| `send-push` | Web Push VAPID |
| `meta-capi-event` | Tracking server-side Meta |
| `tiktok-capi-event` | Tracking server-side TikTok |
| `meta-lead-webhook` | Recebe Lead Ads do Meta com verificação HMAC |
| `whatsapp-api` | Envio e webhook de mensagens WhatsApp |
| `process-lead-funnels` | Cron de drip campaigns |
| `check-task-deadlines` | Cron de alertas de prazos e reuniões |
| `generate-capture-page` | IA para páginas de captura |
| `generate-funnel-steps` | IA para sequências de e-mail |
| `generate-proposal` | IA para propostas comerciais |
| `generate-task-guide` | IA para guias de execução em Markdown |

### Padrões de Segurança

- **RLS estrito** em todas as tabelas; tabelas sensíveis acessadas via RPCs `SECURITY DEFINER`
- **Roles em tabela separada** (`user_roles` + `client_users`) — nunca no `profiles`
- **Service role** usado exclusivamente em Edge Functions
- **JWT validado** via `/auth/v1/user` em todas as functions autenticadas
- **HMAC** verificado em webhooks externos (Meta)
- **Hashing SHA-256** de PII (e-mail, telefone) antes de envio para CAPIs

### Identidade & UX

- **Tema escuro** por padrão (fallback no `useTheme.tsx`)
- **Modo claro** com fundo branco puro e hierarquia em cinza/roxo
- **Tokens HSL semânticos** em `index.css` e `tailwind.config.ts` — nunca cores hardcoded
- **PWA** completa: manifest, service worker network-first, splash screen, install prompt
- **SEO dinâmico**: JSON-LD, Open Graph, sitemap, robots.txt, white-label rigoroso

---

## 🔐 Roles & Permissões

### Equipe Interna

Identificada por `profiles.client_id IS NULL`. Acesso total ao painel `/admin/*`.

### Clientes (perfis dentro de `client_users.role`)

| Role | Permissões |
|---|---|
| **Manager** | Acesso financeiro, métricas, gestão da própria equipe (convites via `manage-users` escopados ao `client_id`) |
| **Focal Point** | Aprovação de campanhas e entregas (`approved_by_ponto_focal`) |
| **Operator** | Acesso operacional ao painel cliente |

---

## 💻 Desenvolvimento Local

### Pré-requisitos

- Node.js 20.x
- npm 10.x ou bun 1.x

### Setup

```bash
# Clonar
git clone https://github.com/<seu-usuario>/<seu-repo>.git
cd <seu-repo>

# Instalar
npm install

# Variáveis de ambiente
cp .env.example .env
# Edite .env com VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID

# Rodar
npm run dev
```

App disponível em `http://localhost:8080`.

### Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | ESLint |

---

## 🔄 Integração com GitHub

A plataforma usa o **sync bidirecional do Lovable com GitHub**:

1. Em **Connectors → GitHub → Connect project** dentro do editor Lovable
2. Autorize o app GitHub do Lovable
3. Mudanças no Lovable → push automático no GitHub
4. Push no GitHub → sync automático no Lovable

Edge Functions, migrações Supabase (`supabase/migrations/`) e código do app ficam todos versionados no mesmo repositório.

---

## 🔗 Links

- 🌐 **Site oficial**: [agencialinkou.com.br](https://agencialinkou.com.br)
- 📘 **Docs Lovable**: [docs.lovable.dev](https://docs.lovable.dev)
- 🤖 **Lovable AI**: [docs.lovable.dev/features/ai](https://docs.lovable.dev/features/ai)
- 🗄️ **Supabase**: [supabase.com](https://supabase.com)

---

## 📄 Licença

Software proprietário da **Agência Linkou**. Todos os direitos reservados. Uso, cópia, modificação ou distribuição não autorizados são estritamente proibidos.

---

<p align="center">
  Construído com 💜 pela equipe Linkou
</p>
