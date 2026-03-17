

# Templates com Design Linkou + Seletor de Lead/Cliente

## Problema

1. Os emails enviados manualmente vão como texto puro (sem design, sem assinatura Linkou)
2. Não há como selecionar um lead ou cliente — o usuário precisa digitar o email manualmente

## Alterações

### 1. `src/lib/email-templates-config.ts` — Adicionar HTML com design

Cada template passa a ter o `body` em formato HTML usando o mesmo design system dos emails automáticos (header roxo #7C3AED com "Linkou", card branco, assinatura Leo Santana no rodapé). O campo `body` será o conteúdo interno editável, e uma função `wrapWithLinkoLayout(content)` envolverá o conteúdo no layout completo antes do envio. Os placeholders `{{nome}}` e `{{empresa}}` continuam funcionando.

### 2. `src/pages/admin/EmailComposer.tsx` — Redesign completo

- **Seletor de destinatário**: Adicionar um combobox/select que busca leads e clientes do Supabase para selecionar o destinatário (preenche automaticamente email, nome e empresa nos placeholders)
- **Opção manual**: Manter campo de digitação manual para emails não cadastrados
- **Preview HTML**: Adicionar aba de preview que renderiza o email com o layout Linkou completo
- **Envio com layout**: Ao enviar, o corpo é automaticamente envolvido pelo `wrapWithLinkoLayout()` antes de ir para o Resend
- **Substituição de placeholders**: Ao selecionar lead/cliente, substituir automaticamente `{{nome}}` e `{{empresa}}` nos campos

### 3. `src/lib/email-templates-config.ts` — Função `wrapWithLinkoLayout`

Função no frontend que replica o `baseEmailLayout` do backend (header roxo, card branco, assinatura Leo Santana, contato, link do site) para envolver o conteúdo do email antes do envio. Garante que todo email manual tenha o mesmo design profissional dos automáticos.

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/lib/email-templates-config.ts` | Reescrever — adicionar `wrapWithLinkoLayout()` e manter templates com corpo editável |
| `src/pages/admin/EmailComposer.tsx` | Reescrever — seletor de lead/cliente, preview HTML, envio com layout |

## Fluxo do usuário

1. Seleciona um lead ou cliente no combobox (ou digita email manualmente)
2. Escolhe um template na barra lateral (ou escreve do zero)
3. Placeholders são substituídos automaticamente com dados do contato selecionado
4. Pode visualizar o email no preview com design completo
5. Ao enviar, o sistema envolve o conteúdo no layout Linkou com assinatura e envia via Resend

