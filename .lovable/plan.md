

# Landing Page com VSL (Video Sales Letter) nas Paginas de Captura

## Objetivo
Adicionar suporte a Video Sales Letter (VSL) nas paginas de captura, permitindo que o usuario insira um link do YouTube que sera exibido como elemento central da landing page, acima ou ao lado do formulario de captura.

## O que muda

### 1. Banco de Dados
Adicionar duas novas colunas na tabela `capture_pages`:
- `video_url` (text, nullable) - Link do YouTube (ex: `https://www.youtube.com/watch?v=XXXXX`)
- `layout_type` (text, default `'standard'`) - Tipo de layout: `standard` (atual, sem video) ou `vsl` (com video em destaque)

Migration SQL:
```text
ALTER TABLE capture_pages 
  ADD COLUMN video_url text,
  ADD COLUMN layout_type text DEFAULT 'standard';
```

### 2. Formulario Admin (`CapturePages.tsx`)
- Adicionar toggle "Pagina com VSL (Video)" que alterna o `layout_type` entre `standard` e `vsl`
- Quando VSL estiver ativo, exibir campo "Link do YouTube" com validacao basica de URL do YouTube
- O campo aceita URLs nos formatos:
  - `https://www.youtube.com/watch?v=ID`
  - `https://youtu.be/ID`
- Preview no dialog mostrara um indicador de video quando preenchido
- A IA (`generate-capture-page`) tambem sera atualizada para aceitar o parametro de VSL

### 3. Pagina Publica (`CapturePage.tsx`)
- Quando `layout_type === 'vsl'` e `video_url` estiver preenchido:
  - Layout muda para video centralizado no topo em formato 16:9 responsivo
  - Headline e subheadline ficam acima do video
  - Beneficios e formulario ficam abaixo do video (layout empilhado vertical)
- Quando `layout_type === 'standard'`: layout atual (grid 2 colunas) permanece inalterado
- O video e embeddado como iframe do YouTube (convertendo a URL para formato embed)

### 4. Edge Function (`generate-capture-page`)
- Atualizar o prompt da IA para quando o usuario mencionar "video" ou "VSL", sugerir `layout_type: "vsl"` automaticamente

## Arquivos que serao criados/editados
- **Criar**: Nova migration SQL para adicionar colunas
- **Editar**: `src/pages/admin/CapturePages.tsx` (campos de video + toggle de layout)
- **Editar**: `src/pages/CapturePage.tsx` (layout VSL com embed do YouTube)
- **Editar**: `supabase/functions/generate-capture-page/index.ts` (suporte a VSL no prompt)

## Layout VSL (visualizacao)

```text
+-----------------------------------------------+
|              Logo (se houver)                  |
|                                                |
|         HEADLINE PRINCIPAL                     |
|         Sub-headline                           |
|                                                |
|  +------------------------------------------+  |
|  |                                          |  |
|  |         VIDEO YOUTUBE (16:9)             |  |
|  |           iframe embed                   |  |
|  |                                          |  |
|  +------------------------------------------+  |
|                                                |
|    * Beneficio 1                               |
|    * Beneficio 2                               |
|    * Beneficio 3                               |
|                                                |
|  +------------------------------------------+  |
|  |        FORMULARIO DE CAPTURA             |  |
|  |   Nome / Email / WhatsApp / Botao CTA    |  |
|  +------------------------------------------+  |
+-----------------------------------------------+
```

