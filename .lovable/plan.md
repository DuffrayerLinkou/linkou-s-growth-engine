

# Envio Manual de Email via Resend no Admin

## O que será criado

Uma página dedicada de **Envio de Email** no painel admin onde o usuário pode compor e enviar emails manualmente usando o Resend, além de um **dialog de email rápido** reutilizável para enviar emails diretamente de contextos como leads e clientes.

## Alterações

### 1. `src/pages/admin/EmailComposer.tsx` — Nova página

Página com formulário completo para envio manual de emails:
- **Para**: campo de email (aceita múltiplos separados por vírgula)
- **Assunto**: campo de texto livre
- **Corpo**: textarea com suporte a HTML básico ou texto simples
- **Responder para**: campo opcional (reply_to)
- Botão de enviar que chama `supabase.functions.invoke("send-email")`
- Feedback visual de sucesso/erro via toast
- Opção de usar templates existentes (selecionar template base para preencher automaticamente)

### 2. `src/components/admin/EmailComposeDialog.tsx` — Dialog reutilizável

Dialog de composição de email que pode ser aberto de qualquer contexto (leads, clientes):
- Recebe `to` e `subject` como props opcionais (pré-preenchidos)
- Mesmo formulário da página, mas em formato dialog
- Loga atividade quando enviado a partir de um lead

### 3. `src/components/admin/leads/LeadQuickActions.tsx` — Integrar dialog

Substituir o `handleEmail` (que apenas abre `mailto:`) por abrir o `EmailComposeDialog` com o email do lead pré-preenchido, enviando via Resend diretamente pelo app.

### 4. `src/layouts/AdminLayout.tsx` — Adicionar rota no menu

Adicionar item "Enviar Email" no grupo "Comunicação" do sidebar.

### 5. `src/App.tsx` — Adicionar rota

Registrar `/admin/email` como rota lazy-loaded.

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/admin/EmailComposer.tsx` | Criar — página de composição de email |
| `src/components/admin/EmailComposeDialog.tsx` | Criar — dialog reutilizável |
| `src/components/admin/leads/LeadQuickActions.tsx` | Editar — usar dialog em vez de mailto |
| `src/layouts/AdminLayout.tsx` | Editar — adicionar item no menu |
| `src/App.tsx` | Editar — adicionar rota /admin/email |

## Detalhes Técnicos

### Envio
```typescript
const { error } = await supabase.functions.invoke("send-email", {
  body: { to, subject, html, reply_to }
});
```

### Template rápido
O corpo do email usa o `baseEmailLayout` via uma função utilitária no frontend que replica o layout base, ou simplesmente envia HTML livre que o Resend renderiza.

### Formulário
- Validação: email obrigatório, assunto obrigatório, corpo obrigatório
- Loading state no botão durante envio
- Toast de sucesso com contagem de destinatários

