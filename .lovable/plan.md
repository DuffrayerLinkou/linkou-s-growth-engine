

# Assistente IA para Criar Paginas de Captura com Prompt

## Objetivo
Adicionar um botao "Criar com IA" na tela de Paginas de Captura (`/admin/capturas`) que permite ao usuario descrever em texto livre o que deseja (ex: "pagina de Black Friday para loja de roupas com foco em desconto de 50%") e a IA gera automaticamente todos os campos do formulario: titulo, slug, headline, sub-headline, beneficios, texto do botao, cores e SEO.

## Como vai funcionar

1. O usuario clica em "Criar com IA" (icone de varinha magica)
2. Um dialog abre com um campo de texto para descrever a pagina desejada
3. A IA processa o prompt e retorna todos os campos preenchidos
4. O formulario de criacao abre ja preenchido com os dados gerados
5. O usuario pode revisar, ajustar e salvar

## Detalhes Tecnicos

### 1. Nova Edge Function: `generate-capture-page`
- Arquivo: `supabase/functions/generate-capture-page/index.ts`
- Usa a mesma arquitetura da funcao `generate-task-guide` existente
- Chama a Lovable AI Gateway (`ai.gateway.lovable.dev`) com tool calling para retornar JSON estruturado
- Modelo: `google/gemini-3-flash-preview`
- Prompt de sistema instruira a IA a gerar: titulo, slug, headline, subheadline, beneficios (3-5), texto do botao, mensagem de obrigado, cores (primaria, fundo, texto) e meta tags SEO
- Autenticacao via header Authorization (mesmo padrao existente)
- Tratamento de erros 429 (rate limit) e 402 (creditos)

### 2. Atualizacao do Frontend: `CapturePages.tsx`
- Novo botao "Criar com IA" ao lado de "Nova Pagina"
- Dialog com textarea para o prompt do usuario
- Estado de loading com spinner durante a geracao
- Ao receber resposta, preenche o formulario existente e abre o dialog de edicao
- O usuario revisa e confirma antes de salvar (nao salva automaticamente)

### 3. Configuracao
- Adicionar `[functions.generate-capture-page]` no `supabase/config.toml` com `verify_jwt = false`
- A funcao valida autenticacao internamente (mesmo padrao das outras funcoes)

### Exemplo do fluxo
```text
Usuario digita: "Pagina para clinica odontologica oferecendo clareamento dental com 30% de desconto"

IA retorna:
- Titulo: "Promo Clareamento Dental"
- Slug: "promo-clareamento-dental"  
- Headline: "Clareamento Dental com 30% de Desconto"
- Subheadline: "Agende sua avaliacao gratuita e conquiste o sorriso dos seus sonhos"
- Beneficios: ["Resultado em apenas 1 sessao", "Profissionais certificados", "Parcelamento em ate 12x"]
- Botao: "Agendar minha avaliacao"
- Cores: primaria #2563EB, fundo #0F172A, texto #FFFFFF
- Meta Title/Description preenchidos
```

### Arquivos que serao criados/editados
- **Criar**: `supabase/functions/generate-capture-page/index.ts`
- **Editar**: `src/pages/admin/CapturePages.tsx` (botao + dialog de prompt)
- **Editar**: `supabase/config.toml` (adicionar funcao)

