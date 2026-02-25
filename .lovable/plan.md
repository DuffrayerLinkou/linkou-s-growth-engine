

# Corrigir Icones PWA para usar a Logo Linkou

## Problema

Os icones PWA atuais (`icon-192x192.png` e `icon-512x512.png`) mostram um "L" generico em fundo roxo. O `favicon.png` ja contem a logo correta da Linkou (o simbolo de coracao/link roxo). Quando o usuario instala o PWA, o icone que aparece e o "L" em vez da logo real.

## Solucao

Copiar o `favicon.png` (que ja tem a logo correta) para substituir os dois icones PWA:

- `public/icons/icon-192x192.png` — substituir pelo `favicon.png`
- `public/icons/icon-512x512.png` — substituir pelo `favicon.png`

O `favicon.png` ja esta em alta resolucao (1080x1080) e contem o simbolo correto da Linkou com fundo branco, compativel com maskable.

## Arquivos Alterados

| Arquivo | Acao |
|---|---|
| `public/icons/icon-192x192.png` | Substituir pelo conteudo de `favicon.png` |
| `public/icons/icon-512x512.png` | Substituir pelo conteudo de `favicon.png` |

O `manifest.webmanifest` permanece inalterado pois ja referencia os caminhos corretos.

