

# Adicionar Templates de Email ao Composer

## Alterações

### 1. `src/lib/email-templates-config.ts` — Criar arquivo de templates

Arquivo com templates editáveis para uso no frontend. Cada template tem: `id`, `name`, `category`, `subject`, `body` (texto com placeholders como `{{nome}}`, `{{empresa}}`). Categorias: Comercial, Follow-up, Onboarding, Cobrança, Geral.

Templates incluídos:
- **Apresentação comercial** — primeiro contato com lead
- **Follow-up pós-reunião** — agradecimento após call
- **Proposta enviada** — aviso de envio de proposta
- **Boas-vindas novo cliente** — onboarding
- **Lembrete de pagamento** — cobrança gentil
- **Reativação de lead** — lead frio
- **Convite para reunião** — agendar call
- **Feedback de campanha** — resultados mensais

### 2. `src/pages/admin/EmailComposer.tsx` — Redesign com painel de templates

Layout em duas colunas (responsivo):
- **Coluna esquerda**: lista de templates com busca por nome/categoria, agrupados por categoria, clicável para carregar no formulário
- **Coluna direita**: formulário de composição (já existente) com os campos preenchidos pelo template selecionado
- Badge indicando template ativo
- Botão "Limpar template" para voltar ao modo livre

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/lib/email-templates-config.ts` | Criar — definições dos templates |
| `src/pages/admin/EmailComposer.tsx` | Reescrever — layout com templates + formulário |

