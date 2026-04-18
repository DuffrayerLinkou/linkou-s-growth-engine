

## Atualizar README.md com Documentação Completa da Plataforma

### Objetivo
Atualizar o `README.md` do projeto (que sincroniza automaticamente com o GitHub) para refletir todas as funcionalidades atuais da plataforma Linkou, incluindo as recém-adicionadas capacidades de tool calling do Linkouzinho.

### Estrutura proposta do novo README

1. **Header & Identidade**
   - Nome: Agência Linkou — Plataforma de Gestão
   - Domínio: agencialinkou.com.br
   - Stack: React 18, Vite, TypeScript, Tailwind, Supabase, Lovable AI Gateway (Gemini)

2. **Visão Geral**
   - Plataforma completa de gestão para agência de consultoria, tráfego e vendas
   - Multi-tenant: equipe interna + clientes (Manager, Focal Point, Operator)

3. **Módulos Principais**
   - **Landing Page** institucional com Linkouzinho (bot público)
   - **CRM de Leads** — kanban, bulk actions, conversões CAPI offline, funil de e-mails
   - **Páginas de Captura** geradas por IA (minimalista ou VSL)
   - **Propostas Comerciais** automatizadas em slides 16:9 com export PDF
   - **WhatsApp** — Cloud API Meta com chat real-time e disparos em massa
   - **Funil de E-mails** — drip campaigns com gerador IA
   - **Onboarding de Clientes** — briefing, plano estratégico, contrato, planejamento
   - **Projetos & Campanhas** — gestão técnica de tráfego (Meta/Google/TikTok/LinkedIn)
   - **Métricas de Tráfego** — registro mensal e dashboards
   - **Tarefas** — kanban com guias de execução em Markdown gerados por IA
   - **Agendamentos** — clientes e leads, com confirmação por e-mail
   - **Painel do Cliente** — dashboard, jornada, plano, métricas, equipe, tarefas

4. **Linkouzinho — Assistente IA** (seção destacada com novidades)
   - **Modo público** (landing): qualificação de leads, captura via WhatsApp/reunião/e-mail
   - **Modo admin** (interno) com **7 tool calls** ativos:
     | Tool | Ação |
     |---|---|
     | `create_appointment` | Agenda reuniões automaticamente |
     | `create_task` | Cria tarefas com prioridade e prazo |
     | `upsert_traffic_metrics` | Preenche métricas mensais (UPSERT por cliente/mês/ano) |
     | `create_campaign` | Estrutura campanhas técnicas (targeting, copy, budget) |
     | `create_project` | Cria projetos novos |
     | `create_strategic_plan` | Gera planos com personas, KPIs SMART, funil, alocação |
     | `create_briefing` | Estrutura briefings de cliente |
   - Contexto rico: briefings, planos, métricas históricas, campanhas existentes
   - Análise estratégica: comparações CPL/CPV, gargalos de funil, projeções

5. **Arquitetura Técnica**
   - Edge Functions Supabase (lista das principais)
   - RLS estrito + service role apenas em edge functions
   - Resend para e-mails transacionais (contato@agencialinkou.com.br)
   - Meta CAPI / TikTok Events API server-side
   - PWA com push notifications (VAPID)
   - SEO dinâmico + JSON-LD

6. **Roles & Permissões**
   - Equipe interna: `client_id IS NULL`
   - Manager / Focal Point / Operator (cliente)

7. **Desenvolvimento Local**
   - Comandos `npm install`, `npm run dev`
   - Como sincronizar com GitHub (via Lovable Connectors)

8. **Links**
   - Preview, Published, Custom Domain
   - Docs Lovable

### Arquivo alterado
| Arquivo | Mudança |
|---|---|
| `README.md` | Reescrita completa refletindo o estado atual da plataforma |

### Observação
O README sincroniza automaticamente para o GitHub via integração bidirecional do Lovable, então atualizar o arquivo já cumpre o pedido.

