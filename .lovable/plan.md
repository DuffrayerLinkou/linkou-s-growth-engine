
# Bot Linkouzinho — Assistente IA com Captura na Landing Page

## Visão geral

Substituir o botão flutuante do WhatsApp por um widget de chat flutuante com o mascote **Linkouzinho**. O bot combina duas funções em uma só experiência:

1. **Assistente informativo**: responde perguntas sobre os serviços da Linkou (FAQ, diferenciais, Ponto Focal, valores)
2. **Captura de lead**: ao final da conversa, coleta nome, email e WhatsApp do visitante, salva no CRM e oferece redirecionamento para WhatsApp com contexto

---

## Experiência do usuário

```text
[Visitante vê o avatar Linkouzinho pulsando no canto]
        ↓
[Clica → Widget abre com mensagem de boas-vindas]
    "Oi! Sou o Linkouzinho 🤖 Posso te ajudar com dúvidas
     sobre a Linkou ou apresentar nossos serviços. Por onde
     quer começar?"
        ↓
[Usuário digita livremente OU escolhe sugestões rápidas]
    "O que vocês fazem?" / "Quanto custa?" / "Quero falar com alguém"
        ↓
[Bot responde via IA com base no conhecimento da Linkou]
        ↓
[Após 2-3 trocas, bot faz a captura suavemente]
    "Que tal a gente continuar essa conversa com nosso time?
     Me diz só seu nome, email e WhatsApp 😊"
        ↓
[Lead salvo na tabela `leads` com source: "bot_linkouzinho"]
        ↓
[Botão → "Continuar no WhatsApp" (com contexto da conversa)]
```

---

## Arquitetura técnica

### 1. Nova Edge Function: `linkouzinho-chat`

Segue o padrão de streaming do Lovable AI Gateway:

- Recebe histórico de mensagens + contexto atual
- Injeção de system prompt com todo conhecimento da Linkou (serviços, FAQ, diferenciais)
- Retorna resposta em streaming (SSE) para renderização token-a-token
- Detecta quando o usuário quer falar com alguém → retorna flag `{ captureMode: true }`
- **Não requer autenticação** (público, landing page)

**System prompt incluirá:**
- Identidade: "Você é o Linkouzinho, assistente virtual da Agência Linkou"
- Conhecimento completo: todos os serviços, segmentos, diferenciais, Ponto Focal
- Regra: nunca mencionar "tráfego pago" → "consultoria, tráfego e vendas"
- Persona: simpático, consultivo, direto, brasileiro
- Gatilho de captura: após responder 2-3 perguntas, ou se usuário pedir contato

### 2. Novo componente: `LinkouzinhoWidget.tsx`

Widget flutuante completo com:

**Avatar/botão de abertura:**
- Imagem do Linkouzinho (mascote fornecido) no canto inferior direito
- Animação de pulso/bounce suave para chamar atenção
- Badge com "1" quando há mensagem não lida
- Substitui completamente o `MobileWhatsAppCTA`

**Janela de chat:**
- Header roxo com avatar Linkouzinho + nome "Linkouzinho · Agência Linkou"
- Área de mensagens com scroll automático
- Chips de sugestão rápida no início: "Serviços", "Valores", "Falar com alguém"
- Input de texto + botão enviar
- Indicador de digitação (3 pontos animados) durante resposta da IA
- Renderização markdown nas respostas

**Modo captura (após conversa):**
- Formulário inline simplificado: Nome, Email, WhatsApp
- Botão "Enviar e continuar no WhatsApp"
- Ao submeter: INSERT em `leads` + redireciona para WhatsApp com resumo da conversa

### 3. Registro em `config.toml`

```toml
[functions.linkouzinho-chat]
verify_jwt = false
```

---

## Fluxo detalhado de captura

```text
[Bot detecta interesse ou usuário pede contato]
        ↓
[Widget exibe formulário inline]
    Nome / Email / WhatsApp
        ↓
[Submit → supabase.from("leads").insert({
    name, email, phone,
    source: "bot_linkouzinho",
    status: "new",
    objective: resumo_da_conversa
})]
        ↓
[Invoca meta-capi-event + tiktok-capi-event]
        ↓
[Exibe botão "Continuar no WhatsApp" com mensagem pré-preenchida:
 "Olá! Conversei com o Linkouzinho e tenho interesse em [assunto]"]
```

---

## Arquivos criados / modificados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/assets/linkouzinho.png` | Criar (copy) | Mascote copiado do upload do usuário |
| `src/components/landing/LinkouzinhoWidget.tsx` | Criar | Componente completo do widget de chat |
| `supabase/functions/linkouzinho-chat/index.ts` | Criar | Edge function com IA + streaming |
| `supabase/config.toml` | Editar | Registrar nova função |
| `src/pages/Index.tsx` | Editar | Trocar `MobileWhatsAppCTA` por `LinkouzinhoWidget` |

O arquivo `MobileWhatsAppCTA.tsx` é mantido mas não importado — pode ser removido depois se confirmado que o bot atende todos os casos.

---

## Detalhes de design do widget

- **Botão flutuante**: avatar circular do Linkouzinho (64x64px desktop, 56x56px mobile), sombra roxa, animação de pulso
- **Janela de chat**: 380x520px no desktop, fullscreen no mobile (z-50, fixed)
- **Cores**: segue o design system roxo (#7C3AED) já existente no projeto
- **Mobile**: na abertura, o widget ocupa toda a tela inferior (como bottom sheet)
- **Sugestões rápidas**: chips roxos clicáveis que enviam a pergunta automaticamente

---

## Pontos de cuidado

- O bot responde apenas sobre a Linkou e seus serviços. Se perguntado sobre algo fora do escopo, redireciona para o formulário de contato
- A captura de lead é **opcional** — usuário pode fechar o widget sem fornecer dados
- O source `"bot_linkouzinho"` aparecerá na tela de Leads como filtro de origem
- Rate limit (429) e créditos (402) são capturados e exibidos com mensagem amigável no chat
- O streaming SSE garante experiência fluída mesmo em conexões lentas
