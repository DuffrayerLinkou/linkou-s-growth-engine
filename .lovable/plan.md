
# Plano: Painel WhatsApp com Meta Cloud API Oficial

## Visao Geral

Criar uma secao dedicada "WhatsApp" no painel administrativo com:
- **Caixa de entrada** - Visualizar e responder conversas com leads em tempo real
- **Disparo individual e em massa** - Enviar mensagens usando templates aprovados pelo Meta
- **Webhook de recebimento** - Receber mensagens dos leads automaticamente
- **Integracao com CRM** - Toda interacao registrada no historico de atividades do lead
- **Gerenciamento de templates** - Sincronizar templates aprovados pelo Meta

---

## Pre-requisitos (configuracao no Meta)

Antes de implementar, voce precisara:

1. Acessar **developers.facebook.com** e criar um App do tipo "Business"
2. Adicionar o produto **WhatsApp** ao app
3. Em **WhatsApp > API Setup**, anotar:
   - **Phone Number ID** (ID do numero de telefone)
   - **WhatsApp Business Account ID** (WABA ID)
   - **Permanent Access Token** (gerar um token de sistema em Business Settings > System Users)
4. Configurar o **Webhook** apontando para a Edge Function que vamos criar
5. O **Verify Token** sera gerado por nos para validar o webhook

---

## Arquitetura

```text
+-------------------+       +------------------------+       +------------------+
|   Admin Panel     | ----> | Edge Function           | ----> | Meta Cloud API   |
|   (React)         |       | "whatsapp-api"          |       | graph.facebook   |
|                   |       |  - Enviar mensagens     |       |                  |
|   Caixa de Entrada|       |  - Buscar templates     |       |                  |
|   Disparo em Massa|       |  - Processar webhooks   |       |                  |
+-------------------+       +------------------------+       +------------------+
                                      |
                                      v
                            +------------------+
                            |   Supabase DB    |
                            |  - whatsapp_messages |
                            |  - lead_activities   |
                            +------------------+

Meta envia mensagem do lead via Webhook --> Edge Function salva no banco --> 
Admin ve em tempo real via Supabase Realtime
```

---

## Secrets Necessarios

Serao armazenados como secrets do Supabase (seguros, nunca expostos no codigo):

| Secret | Descricao | Onde obter |
|--------|-----------|------------|
| `WHATSAPP_ACCESS_TOKEN` | Token permanente de acesso | Meta Business Suite > System Users |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do numero de telefone | Meta Developers > WhatsApp > API Setup |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | ID da conta business | Meta Developers > WhatsApp > API Setup |
| `WHATSAPP_VERIFY_TOKEN` | Token para validar webhook (nos geramos) | Sera gerado automaticamente |

---

## Novas Tabelas no Banco de Dados

### 1. `whatsapp_messages` - Historico de mensagens

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| lead_id | UUID | FK para leads (nullable, para mensagens de numeros nao cadastrados) |
| wa_message_id | TEXT | ID da mensagem no WhatsApp (para deduplicacao) |
| phone | TEXT | Numero do contato |
| direction | TEXT | "inbound" ou "outbound" |
| type | TEXT | "text", "template", "image", "document", "audio" |
| content | TEXT | Conteudo da mensagem (texto) |
| template_name | TEXT | Nome do template usado (se aplicavel) |
| status | TEXT | "sent", "delivered", "read", "failed" |
| metadata | JSONB | Dados extras (media URL, erros, etc) |
| created_at | TIMESTAMPTZ | Data/hora |
| created_by | UUID | FK para auth.users (quem enviou, se outbound) |

### 2. `whatsapp_config` - Configuracoes do WhatsApp (toggle e status)

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | PK |
| is_enabled | BOOLEAN | WhatsApp ativo |
| webhook_configured | BOOLEAN | Webhook configurado no Meta |
| last_synced_at | TIMESTAMPTZ | Ultima sincronizacao de templates |

---

## Edge Function: `whatsapp-api`

Uma unica Edge Function com multiplas rotas via query param `action`:

### Acoes suportadas:

**1. `send-text`** - Enviar mensagem de texto livre
```text
POST /whatsapp-api?action=send-text
Body: { phone: "5541999999999", message: "Ola!", lead_id: "uuid" }
```

**2. `send-template`** - Enviar template aprovado pelo Meta
```text
POST /whatsapp-api?action=send-template
Body: { phone: "5541999999999", template_name: "hello_world", language: "pt_BR", 
        components: [...], lead_id: "uuid" }
```

**3. `sync-templates`** - Buscar templates aprovados na conta Meta
```text
POST /whatsapp-api?action=sync-templates
```
Busca os templates aprovados via API do Meta e atualiza a tabela `whatsapp_templates` com nome, status, categoria e conteudo.

**4. `webhook`** (GET e POST) - Receber mensagens e status updates
```text
GET /whatsapp-api?action=webhook&hub.mode=subscribe&hub.verify_token=xxx&hub.challenge=123
POST /whatsapp-api?action=webhook (mensagens recebidas do Meta)
```

**5. `send-bulk`** - Disparo em massa para multiplos leads
```text
POST /whatsapp-api?action=send-bulk
Body: { lead_ids: ["uuid1", "uuid2"], template_name: "follow_up", language: "pt_BR" }
```
Envia template para multiplos leads com rate limiting (respeitando limites da API Meta).

### Logica do Webhook (recebimento):

1. Recebe JSON do Meta com mensagem do lead
2. Identifica o numero de telefone
3. Busca o lead correspondente na tabela `leads` pelo telefone
4. Salva a mensagem na tabela `whatsapp_messages`
5. Registra atividade em `lead_activities`
6. O frontend recebe em tempo real via Supabase Realtime

### Logica de envio:

1. Recebe requisicao do frontend (autenticada)
2. Busca secrets do Meta (token, phone_number_id)
3. Chama a Meta Graph API v18.0
4. Salva a mensagem enviada em `whatsapp_messages`
5. Registra atividade em `lead_activities`
6. Retorna status ao frontend

---

## Nova Pagina: `/admin/whatsapp`

### Layout principal com 3 abas:

### Aba 1: Conversas (Caixa de Entrada)

```text
+----------------------------------+----------------------------+
|  Conversas                       |  Conversa com Joao Silva   |
|  [Buscar contato...]             |                            |
|                                  |  [Mensagem do lead]        |
|  > Joao Silva   14:30           |    Oi, tenho interesse...  |
|    "Tenho interesse..."          |                            |
|                                  |  [Sua resposta]    15:00   |
|  > Maria Santos  Ontem           |    Ola Joao! Podemos...    |
|    "Quando posso..."             |                            |
|                                  |  [Mensagem do lead]        |
|  > Pedro Lima    02/02           |    Perfeito, vamos...      |
|    "Obrigado pela..."            |                            |
|                                  |  +------------------------+|
|                                  |  | Digite sua mensagem... ||
|                                  |  | [Templates] [Enviar]   ||
|                                  |  +------------------------+|
+----------------------------------+----------------------------+
```

- Lista de conversas a esquerda, ordenadas por ultima mensagem
- Chat a direita com historico completo
- Indicador de mensagens nao lidas
- Botao para usar templates ou mensagem livre
- Link rapido para abrir o perfil do lead no CRM
- **Realtime**: novas mensagens aparecem instantaneamente via Supabase Realtime

### Aba 2: Disparo em Massa

```text
+--------------------------------------------------+
|  Disparo em Massa                                |
|                                                  |
|  Template: [Selecionar template aprovado v]      |
|  Preview: "Ola {{1}}, tudo bem?..."              |
|                                                  |
|  Selecionar Leads:                               |
|  [x] Filtrar por status: [Qualificado v]         |
|  [x] Filtrar por segmento: [Todos v]             |
|                                                  |
|  23 leads selecionados                           |
|  [x] Joao Silva - (41) 99999-9999               |
|  [x] Maria Santos - (41) 98888-8888             |
|  [ ] Pedro Lima - sem telefone                   |
|                                                  |
|  [Enviar para 23 leads]                          |
|                                                  |
|  Ultimo disparo: 05/02 - "Follow Up" - 45 leads |
|  Status: 42 entregues, 3 falhas                  |
+--------------------------------------------------+
```

- Selecionar template aprovado pelo Meta
- Filtrar leads por status/segmento
- Selecao individual ou em massa
- Historico de disparos anteriores
- Status de entrega por mensagem

### Aba 3: Configuracoes

```text
+--------------------------------------------------+
|  Configuracoes WhatsApp                          |
|                                                  |
|  Status: [Conectado] / [Desconectado]            |
|  Numero: +55 41 98898-8054                       |
|                                                  |
|  Webhook URL: https://xxx.supabase.co/functions/ |
|  v1/whatsapp-api?action=webhook                  |
|  [Copiar URL]                                    |
|                                                  |
|  Verify Token: wh_xxxxxxxxxxxxx                  |
|  [Copiar Token]                                  |
|                                                  |
|  Templates Aprovados: 4                          |
|  [Sincronizar Templates]                         |
|                                                  |
|  [Testar Conexao]                                |
+--------------------------------------------------+
```

- Mostra URL do webhook para copiar e colar no Meta Developers
- Mostra verify token para configurar
- Botao para sincronizar templates aprovados
- Botao para testar a conexao (envia mensagem de teste)
- Status da conexao em tempo real

---

## Integracao com CRM existente

### Indicador no LeadDetailDialog

Na aba de atividades do lead, mensagens WhatsApp aparecerao com icone verde e preview do conteudo. Botao "Ver conversa completa" abre a conversa na secao WhatsApp.

### No LeadQuickActions

O botao "WhatsApp" existente sera atualizado:
- Se a API estiver configurada: envia direto pela API (sem abrir wa.me)
- Se nao estiver configurada: mantem o comportamento atual (wa.me)

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/whatsapp-api/index.ts` | Edge Function principal (envio, webhook, sync) |
| `src/pages/admin/WhatsApp.tsx` | Pagina principal com 3 abas |
| `src/components/admin/whatsapp/ConversationList.tsx` | Lista de conversas |
| `src/components/admin/whatsapp/ChatWindow.tsx` | Janela de chat |
| `src/components/admin/whatsapp/BulkSender.tsx` | Painel de disparo em massa |
| `src/components/admin/whatsapp/WhatsAppConfig.tsx` | Aba de configuracoes |
| `src/components/admin/whatsapp/TemplateSelector.tsx` | Seletor de templates Meta |
| Migration SQL | Tabelas whatsapp_messages e whatsapp_config |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Adicionar rota `/admin/whatsapp` |
| `src/layouts/AdminLayout.tsx` | Adicionar item "WhatsApp" no menu lateral |
| `src/components/admin/leads/LeadQuickActions.tsx` | Usar API quando disponivel |
| `supabase/config.toml` | Adicionar funcao `whatsapp-api` com verify_jwt = false (webhook precisa ser publico) |
| `src/integrations/supabase/types.ts` | Tipos das novas tabelas |

---

## Fluxo de Configuracao Inicial (para voce)

1. Criar app em developers.facebook.com
2. Adicionar produto WhatsApp
3. Em API Setup, copiar Phone Number ID e WABA ID
4. Em Business Settings > System Users, criar token permanente
5. Nos vamos salvar esses dados como secrets seguros no Supabase
6. Apos deploy, copiar a URL do webhook e o verify token mostrados na aba Configuracoes
7. Colar no Meta Developers > WhatsApp > Configuration > Webhook
8. Selecionar os campos: messages, message_deliveries, message_reads
9. Pronto - mensagens comecam a fluir

---

## Seguranca

- **Webhook**: Validacao de assinatura (X-Hub-Signature-256) em toda requisicao do Meta
- **Envio**: Autenticacao obrigatoria via JWT do Supabase (somente admin/account_manager)
- **Secrets**: Token do Meta armazenado como secret, nunca no codigo
- **RLS**: Tabela whatsapp_messages acessivel apenas por admin e account_manager
- **Rate Limiting**: Disparo em massa com delay entre mensagens para respeitar limites da API

---

## Sequencia de Implementacao

1. Solicitar e salvar os 4 secrets necessarios
2. Migration SQL (tabelas whatsapp_messages e whatsapp_config)
3. Edge Function whatsapp-api (todas as acoes)
4. Pagina e componentes do frontend
5. Integracao com menu lateral e rotas
6. Atualizar LeadQuickActions para usar API quando disponivel
7. Testes de envio e recebimento
