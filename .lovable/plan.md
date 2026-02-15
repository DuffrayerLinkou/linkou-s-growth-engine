

# Email de Agradecimento ao Lead + Pagina de Obrigado para Capturas

## Problema 1: Nenhum email de agradecimento e enviado ao lead

Quando um lead preenche o formulario na landing page (`ContactForm.tsx`) ou numa pagina de captura (`CapturePage.tsx`), o sistema salva o lead no banco, dispara CAPI (Meta/TikTok), mas nao envia nenhum email de confirmacao ao lead informando que o contato foi recebido.

## Problema 2: Paginas de captura mostram mensagem inline ao inves de pagina dedicada

As paginas de captura (`/c/:slug`) atualmente mostram um `<div>` inline com a mensagem de obrigado (`setSubmitted(true)`). Isso impede a metrificacao da conversao via pixel, pois nao ha mudanca de URL para configurar como evento de destino nos gerenciadores de anuncios.

---

## Solucao

### 1. Novo template de email: agradecimento ao lead

Adicionar em `email-templates.ts` uma funcao `leadThankYouEmail(name)` que gera um email profissional agradecendo pelo contato e informando o prazo de retorno (24h uteis).

### 2. Novo event_type no notify-email: `lead_submitted`

Adicionar no `notify-email/index.ts` o handler para `lead_submitted` que:
- Envia email de agradecimento ao lead (usando o email informado no formulario)
- Nao precisa buscar ponto focal -- o destinatario e o proprio lead

### 3. Disparar notify-email no ContactForm.tsx

Apos o insert do lead na landing page, chamar `notify-email` com `event_type: "lead_submitted"` passando nome e email do lead.

### 4. Disparar notify-email no CapturePage.tsx

Apos o insert do lead nas paginas de captura, chamar `notify-email` com `event_type: "lead_submitted"`.

### 5. Pagina de obrigado dedicada para capturas

Criar uma rota `/c/:slug/obrigado` com uma pagina generica de agradecimento que:
- Busca os dados da pagina de captura pelo slug (cores, logo, mensagem)
- Exibe a mensagem de agradecimento personalizada (`thank_you_message`)
- Mantem o visual (cores, logo) da pagina de captura original
- Permite metrificacao via pixel (URL unica por captura)

No `CapturePage.tsx`, substituir o `setSubmitted(true)` por `navigate(\`/c/${slug}/obrigado\`)`.

Se a pagina tiver `thank_you_redirect_url` configurado, continua redirecionando para a URL externa (comportamento atual mantido).

### 6. Registrar a nova rota no App.tsx

Adicionar `<Route path="/c/:slug/obrigado">` apontando para o novo componente.

---

## Arquivos a criar/alterar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/_shared/email-templates.ts` | Adicionar `leadThankYouEmail()` |
| `supabase/functions/notify-email/index.ts` | Adicionar handler `lead_submitted` |
| `src/components/landing/ContactForm.tsx` | Chamar `notify-email` apos insert do lead |
| `src/pages/CapturePage.tsx` | Chamar `notify-email` + redirecionar para `/c/:slug/obrigado` |
| `src/pages/CaptureThankYou.tsx` | Criar pagina de obrigado para capturas |
| `src/App.tsx` | Adicionar rota `/c/:slug/obrigado` |

---

## Detalhes tecnicos

### Template `leadThankYouEmail(name: string)`

Conteudo:
- Assunto: "Recebemos seu contato! -- Linkou"
- Corpo: agradecimento personalizado, informando que a equipe retornara em ate 24h uteis
- CTA: link para o site/Instagram
- Usa o `baseEmailLayout` padrao com branding Linkou

### Pagina `/c/:slug/obrigado`

- Busca dados da captura via `get_capture_page_by_slug` (reutiliza a mesma RPC)
- Aplica `background_color`, `text_color`, `primary_color` e `logo_url` da pagina original
- Exibe `thank_you_message` como titulo principal
- Estrutura simples: icone de sucesso + mensagem + botao de voltar
- URL rastreavel: permite configurar `/c/meu-slug/obrigado` como destino de conversao no Meta/Google Ads

