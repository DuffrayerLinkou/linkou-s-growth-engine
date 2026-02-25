

# Atualizar Ícones PWA com a Logo Linkou

## Problema

Os ícones PWA atuais não mostram a logo correta da Linkou. O usuário enviou a imagem correta da logo (o símbolo de coração/link roxo em fundo branco).

## Solução

Copiar a imagem enviada (`user-uploads://Prancheta_1-2.png`) para substituir os ícones PWA e o favicon:

| Arquivo | Ação |
|---|---|
| `public/favicon.png` | Substituir pela logo enviada |
| `public/icons/icon-192x192.png` | Substituir pela logo enviada |
| `public/icons/icon-512x512.png` | Substituir pela logo enviada |

Nenhuma alteração de código é necessária -- o `index.html` e o `manifest.webmanifest` já referenciam esses caminhos.

