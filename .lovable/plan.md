

# Otimizacao de SEO e Remocao de Referencias Lovable

## Problemas Identificados

### 1. Referencias ao Lovable em todo o codigo
Existem 4 arquivos com URLs e imagens apontando para o dominio Lovable:

- **`index.html`**: og:url, og:image, twitter:image e canonical usam `linkou-ecosystem-builder.lovable.app` e `lovable.dev/opengraph-image`
- **`public/sitemap.xml`**: Todas as 5 URLs usam o dominio Lovable
- **`public/robots.txt`**: Sitemap aponta para dominio Lovable
- **`src/pages/Index.tsx`**: JSON-LD Schema com URL Lovable

### 2. SPA e SEO - Problema Critico
O site e uma SPA (Single Page Application). Isso significa que o `index.html` enviado ao Google contem apenas `<div id="root"></div>`. Os meta tags injetados via JavaScript pelo `TrackingScripts.tsx` **nao sao lidos pelos crawlers** na maioria dos casos.

**Consequencia:** O Google vai indexar apenas o que esta no `index.html` estatico - que hoje ainda tem os dados corretos (titulo, descricao), mas as alteracoes feitas via painel admin (SEO Tab) nao sao refletidas para os buscadores.

### 3. Badge "Edit in Lovable"
Pode ser removido sem codigo: nas configuracoes do projeto Lovable, ative "Hide 'Lovable' Badge".

---

## Solucao Proposta

### Etapa 1 - Substituir todas as referencias Lovable

Trocar todas as URLs pelo seu dominio real. Se voce ja conectou um dominio customizado (ex: `linkou.com.br`), usaremos ele. Caso contrario, mantemos o dominio Lovable mas atualizamos as imagens OG.

**Arquivos a alterar:**

#### `index.html`
- `og:url` → seu dominio
- `og:image` → URL da sua propria imagem OG (1200x630px)
- `twitter:image` → mesma imagem OG
- `canonical` → seu dominio

#### `public/sitemap.xml`
- Trocar todas as 5 URLs para o dominio correto

#### `public/robots.txt`
- Atualizar URL do sitemap

#### `src/pages/Index.tsx`
- Atualizar `url` no JSON-LD Schema

### Etapa 2 - Melhorar SEO para SPA

Como os meta tags dinamicos do TrackingScripts nao sao lidos pelos crawlers, precisamos garantir que o `index.html` estatico tenha os dados corretos.

**Abordagem:** Manter os meta tags estaticos no `index.html` como fonte primaria de SEO (ja estao la) e usar o TrackingScripts apenas como complemento para quando o usuario altera via painel.

O que ja funciona bem:
- Title, description, og:title, og:description no index.html (estatico, visivel para crawlers)
- robots.txt e sitemap.xml (estaticos, visiveis para crawlers)
- JSON-LD Schema (injetado via JS, Google consegue ler na maioria dos casos)

**Melhoria adicional:** Adicionar meta tag `google-site-verification` diretamente no `index.html` para que o Google Search Console funcione sem depender do TrackingScripts.

### Etapa 3 - Criar imagem OG propria

Atualmente a imagem OG aponta para `lovable.dev/opengraph-image`. Voce precisa:
1. Criar uma imagem 1200x630px com a marca Linkou
2. Fazer upload para o Storage do Supabase ou usar uma URL publica
3. Atualizar no index.html e na SeoTab do admin

---

## Detalhes Tecnicos

### Arquivos alterados

1. **`index.html`** - Atualizar og:url, og:image, twitter:image, canonical
2. **`public/sitemap.xml`** - Atualizar todas as URLs
3. **`public/robots.txt`** - Atualizar URL do sitemap
4. **`src/pages/Index.tsx`** - Atualizar URL no JSON-LD

### Sobre dominio customizado

Se voce ainda nao conectou um dominio customizado, pode fazer isso em Project Settings, Domains no Lovable. Um plano pago e necessario. Enquanto isso, as URLs continuarao com `linkou-ecosystem-builder.lovable.app` mas sem as imagens/referencias visuais do Lovable.

### Sobre o badge

Para remover o selo "Edit in Lovable" que aparece no canto do site:
1. Abra as configuracoes do projeto no Lovable
2. Ative a opcao "Hide 'Lovable' Badge"
3. Nao requer alteracao de codigo

### Checklist SEO pos-implementacao

- Verificar Google Search Console (adicionar propriedade com seu dominio)
- Submeter sitemap.xml manualmente no Search Console
- Testar compartilhamento no Facebook Debugger (developers.facebook.com/tools/debug)
- Testar Twitter Card Validator
- Criar e fazer upload da imagem OG personalizada

