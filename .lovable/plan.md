

# Linkouzinho Interno: Mesmo personagem, diferentes poderes

## Conceito
O Linkouzinho da landing page será reaproveitado como assistente interno nos painéis Admin e Cliente. Mesma identidade visual (avatar amarelo, nome "Linkouzinho"), mas com **aparência da janela diferenciada** por role e **inteligência contextual** com acesso a dados reais.

## Diferenças por role

```text
                    Landing Page          Cliente              Admin
─────────────────────────────────────────────────────────────────────
Inteligência        Comercial (vendas)    Consultor acessível  Analista técnico
Dados acessados     Nenhum (genérico)     Seus dados apenas    Todos os clientes
Header da janela    bg-primary (roxo)     bg-primary (roxo)    bg-zinc-900 (escuro)
Subtítulo           "Agência Linkou"      "Seu Consultor"      "Modo Analista"
Sugestões rápidas   Sobre serviços        Sobre métricas       Análise e comparação
Capture Mode        Sim (lead forms)      Não                  Não
Seletor de cliente  Não                   Não (auto)           Sim (dropdown)
```

## Implementação

### 1. Nova Edge Function `assistant-chat`
**Arquivo**: `supabase/functions/assistant-chat/index.ts`

- Valida JWT via `/auth/v1/user`
- Recebe `{ messages, client_id, mode: "admin" | "client" }`
- Com service role, busca dados do `client_id`:
  - `campaigns` (últimas 10 com métricas e resultados)
  - `traffic_metrics` (últimos 6 meses)
  - `strategic_plans` (plano ativo)
  - `clients` (nome, segmento, fase)
- Monta **system prompt dinâmico** diferente por mode:
  - **Client**: tom acessível, foco em explicar resultados e próximos passos
  - **Admin**: tom técnico/analítico, foco em insights comparativos e recomendações de otimização
- Stream via Lovable AI Gateway (gemini-3-flash-preview)

### 2. Componente reutilizável `LinkouzinhoInternal`
**Arquivo**: `src/components/LinkouzinhoInternal.tsx`

- Reusa a mesma estrutura visual do `LinkouzinhoWidget` (avatar, SSE streaming, markdown, typing indicator)
- Props: `mode: "admin" | "client"`
- **Diferenças visuais**:
  - Admin: header `bg-zinc-900`, subtítulo "Modo Analista", dropdown de cliente no header
  - Cliente: header `bg-primary` (roxo), subtítulo "Seu Consultor", `client_id` automático do perfil
- **Sem capture mode** (sem formulários de lead, sem WhatsApp redirect)
- Sugestões rápidas contextuais:
  - Cliente: "Como estão minhas métricas?", "Resumo das campanhas", "Qual o próximo passo?"
  - Admin: "Análise do último mês", "Comparar CPL dos clientes", "Recomendações de otimização"
- Histórico em `sessionStorage` (limpa ao fechar sessão, sem localStorage para não conflitar com o bot da landing)

### 3. Integração nos Layouts
- `AdminLayout.tsx`: renderiza `<LinkouzinhoInternal mode="admin" />`
- `ClientLayout.tsx`: renderiza `<LinkouzinhoInternal mode="client" />`
- Posição: mesmo canto inferior direito (substitui o Linkouzinho da landing que já não aparece nesses layouts)

### 4. Config TOML
- Adicionar `[functions.assistant-chat]` em `supabase/config.toml`

## Arquivos

| Arquivo | Mudança |
|---|---|
| `supabase/functions/assistant-chat/index.ts` | **Novo** — Edge function com JWT + dados + AI streaming |
| `src/components/LinkouzinhoInternal.tsx` | **Novo** — Widget chat reutilizável admin/cliente |
| `src/layouts/AdminLayout.tsx` | Adicionar `<LinkouzinhoInternal mode="admin" />` |
| `src/layouts/ClientLayout.tsx` | Adicionar `<LinkouzinhoInternal mode="client" />` |
| `supabase/config.toml` | Registrar nova function |

## Sem mudanças de banco
Todas as tabelas já existem com RLS adequado. A function usa service role para ler dados.

