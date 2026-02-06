

# Plano: SEO Completo com Sitemap, Canonical, JSON-LD e Meta Tags Dinamicas

## Situacao Atual

A landing page tem meta tags estaticas no `index.html`, mas faltam elementos criticos para indexacao pelos buscadores. A aba SEO no admin salva dados no banco, porem eles nao sao aplicados na pagina real.

## O que sera feito

### 1. Criar `public/sitemap.xml`

Arquivo estatico com todas as rotas publicas do site:

```text
/                 (landing page - prioridade 1.0)
/auth             (login - prioridade 0.3)
/privacidade      (prioridade 0.2)
/termos           (prioridade 0.2)
/obrigado         (prioridade 0.1)
```

O sitemap usara a URL publicada `https://linkou-ecosystem-builder.lovable.app` como base.

### 2. Atualizar `public/robots.txt`

Adicionar referencia ao sitemap:

```text
Sitemap: https://linkou-ecosystem-builder.lovable.app/sitemap.xml
```

### 3. Adicionar Canonical Tag e OG URL no `index.html`

```text
<link rel="canonical" href="https://linkou-ecosystem-builder.lovable.app/" />
<meta property="og:url" content="https://linkou-ecosystem-builder.lovable.app/" />
```

Atualizar tambem a imagem OG para apontar para uma URL propria (quando configurada).

### 4. Injetar JSON-LD (Schema.org) na Landing Page

Adicionar dados estruturados no componente `Index.tsx` com schema `ProfessionalService`:

```text
{
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Agencia Linkou",
  "description": "Auditoria e Consultoria de Trafego Pago...",
  "url": "https://linkou-ecosystem-builder.lovable.app",
  "serviceType": ["Auditoria de Trafego", "Gestao de Trafego", ...],
  "areaServed": { "@type": "Country", "name": "BR" },
  "priceRange": "$$"
}
```

Sera injetado via `<script type="application/ld+json">` usando um `useEffect` no componente da landing page.

### 5. Aplicar Meta Tags Dinamicas do Banco na Pagina

Atualizar o componente `TrackingScripts.tsx` para, alem dos pixels, tambem injetar dinamicamente:

- `document.title` com o titulo do banco
- Meta description
- OG image, OG title, OG description
- Canonical URL (se configurada)

Isso garante que o que o admin configura na aba SEO realmente apareca na pagina.

---

## Detalhes Tecnicos

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `public/sitemap.xml` | Sitemap XML com rotas publicas |

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `public/robots.txt` | Adicionar linha `Sitemap:` |
| `index.html` | Adicionar `<link rel="canonical">`, `<meta og:url>` |
| `src/pages/Index.tsx` | Injetar JSON-LD (Schema.org) via useEffect |
| `src/components/TrackingScripts.tsx` | Aplicar title, description e OG tags do banco dinamicamente |

### Limitacao importante (SPA)

Como o projeto e uma Single Page Application (SPA), crawlers que nao executam JavaScript verao apenas as meta tags estaticas do `index.html`. As tags dinamicas injetadas via React ajudam com crawlers modernos (Google, Bing) que renderizam JS. Para crawlers mais antigos, as meta tags estaticas do `index.html` servem como fallback.

O sitemap.xml e o JSON-LD sao lidos diretamente pelos crawlers sem depender de JavaScript.

