
# Funil de Email para Leads Adicionados Manualmente + Assinatura Padrão nos Emails

## O que será implementado

Dois itens distintos:

1. **Funil "Cold Lead"** — sequência de emails para leads adicionados manualmente pelo admin, que não conhecem a Linkou, com abordagem de apresentação gradual.

2. **Assinatura padrão em todos os emails** — rodapé padronizado com contato@agencialinkou.com.br e telefone do site, aplicado a todos os templates existentes via alteração no `baseEmailLayout`.

---

## Item 1: Funil para leads manuais (Cold Lead)

### Lógica do fluxo

O admin adiciona o lead manualmente em `/admin/leads`. No momento da inscrição manual no funil (via dialog "Inscrever Lead"), o admin pode escolher o funil "Cold Outbound" — um novo funil pre-populado no banco, específico para quem não conhece a Linkou.

### Sequência de emails do funil "Cold Outbound"

```text
Dia 1 (imediato) → "Alguém me indicou você 👋" — apresentação pessoal, sem vender nada
Dia 3            → "O que fazemos que ninguém mais faz" — diferencial da Linkou com prova social
Dia 7            → "Um resultado que pode ser seu" — case de cliente real (anon)
Dia 14           → "Podemos conversar 15 minutos?" — convite direto para call (CTA WhatsApp)
Dia 21           → "Última mensagem — prometo 😄" — urgência leve, link direto
```

Variáveis disponíveis: `{{nome}}`, `{{segmento}}`, `{{objetivo}}`

### Como funciona tecnicamente

- Os templates dos 5 steps são inseridos diretamente na tabela `email_funnel_steps` via migration de seed (dados, não schema — usando o insert tool do Supabase).
- Um novo funil chamado **"Cold Outbound — Apresentação"** é criado em `email_funnels`.
- O admin, ao inscrever o lead, seleciona qual funil usar no dialog existente.
- A Edge Function `process-lead-funnels` já processa automaticamente — nenhuma alteração necessária nela.

### Também: Adicionar lead manual com inscrição direta

Na página `/admin/leads`, será adicionado um botão **"+ Novo Lead"** que abre um dialog para cadastrar um lead manualmente (nome, email, telefone, segmento, objetivo) e oferece a opção de já inscrevê-lo em um funil ao salvar.

---

## Item 2: Assinatura padrão em todos os emails

### Alteração no `baseEmailLayout`

O rodapé atual é:
```
Linkou — Marketing de Performance
agencialinkou.com.br
```

Será expandido para incluir:
- Email: contato@agencialinkou.com.br
- Telefone: número usado no site (a ser extraído de `landing_settings.whatsapp_number` ou fixo)
- Links de redes sociais opcionais

O telefone será lido dinamicamente da tabela `landing_settings` pelo campo `whatsapp_number`, mas como os templates são gerados em Edge Functions (sem acesso direto ao banco), vamos buscar o número na Edge Function `send-email` e passar como header/contexto — **ou, mais simples**, vamos definir o número como constante no arquivo `email-templates.ts` já que é um dado público do site.

### Resultado visual do novo rodapé

```
Linkou — Marketing de Performance
────────────────────────────────
✉ contato@agencialinkou.com.br
📞 (XX) XXXXX-XXXX
agencialinkou.com.br
```

---

## Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/_shared/email-templates.ts` | Atualizar `baseEmailLayout` com assinatura completa |
| `src/pages/admin/Leads.tsx` | Adicionar botão e dialog "Novo Lead" com opção de funil |
| **Seed de dados** | Inserir funil "Cold Outbound" + 5 steps via insert tool |

### Não será necessário alterar:
- A Edge Function `process-lead-funnels` (já processa qualquer funil)
- A Edge Function `notify-email` (enrollment manual não usa o fluxo automático)
- A página `EmailFunnel.tsx` (o dialog de inscrição já existe)
- Nenhuma migration de schema (tabelas já existem)

---

## Detalhes técnicos importantes

### Telefone no rodapé
Será adicionado como constante no arquivo de templates. O número será inserido como `(11) 9XXXX-XXXX` — precisamos que o usuário confirme o telefone, mas como não foi especificado, usaremos o campo `whatsapp_number` da `landing_settings` consultado diretamente no banco pela Edge Function `send-email`. Para simplificar sem latência extra, será definido como constante editável no arquivo de templates.

### Novo lead manual na tela de leads
O dialog de criação terá os campos:
- Nome (obrigatório)
- Email (obrigatório)  
- Telefone
- Segmento (select)
- Objetivo (textarea)
- Origem: fixo como `"manual"` 
- Checkbox: "Inscrever em funil de email" com select do funil

Ao salvar, a lógica é:
1. Insert em `leads`
2. Se funil selecionado → insert em `lead_funnel_enrollments`

### Sem email automático no cadastro manual
Diferente do fluxo da landing page (que dispara `lead_submitted` + `lead_funnel_enroll`), o lead manual recebe apenas os emails do funil conforme programado. O primeiro email (Dia 1 = imediato) chegará no próximo ciclo do cron diário (12:00).

Se quiser envio imediato no mesmo instante da inscrição, podemos chamar `process-lead-funnels` via invoke — mas isso pode ser feito numa iteração futura para não complicar este PR.
