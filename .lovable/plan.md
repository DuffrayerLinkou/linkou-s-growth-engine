

# Corrigir Instalação PWA no iPhone

## Problema Identificado

No iPhone, o Safari **não suporta** o evento `beforeinstallprompt` (isso é exclusivo do Chrome/Android). A única forma de "instalar" um PWA no iOS é manualmente pelo Safari: **Compartilhar → Adicionar à Tela de Início**.

O botão "Instalar App" e o banner de instalação existem no `Header.tsx` (landing page), mas o usuário está na rota `/auth` onde esses componentes **não aparecem**. Além disso, se o banner já foi dispensado, o botão fica oculto.

Há também um problema técnico no `manifest.webmanifest`: os ícones usam `"purpose": "any maskable"` em uma única entrada. A spec recomenda separar em duas entradas distintas para evitar problemas de compatibilidade.

## Solução

### 1. Separar ícones no manifest (corrigir compatibilidade iOS)
Dividir cada ícone em duas entradas: uma com `"purpose": "any"` e outra com `"purpose": "maskable"`.

### 2. Adicionar botão "Instalar App" na página de Login
Colocar um botão discreto na página `/auth` para que usuários iOS possam ver as instruções de instalação mesmo sem passar pela landing page.

## Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `public/manifest.webmanifest` | Separar ícones em entradas `any` e `maskable` distintas |
| `src/pages/Auth.tsx` | Adicionar botão "Instalar App" com dialog de instruções iOS, visível apenas em dispositivos compatíveis |

## Detalhes Técnicos

### manifest.webmanifest
```json
"icons": [
  { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
  { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

### Auth.tsx
- Importar `usePWAInstall` e adicionar um botão "Instalar App" no header da página de login
- Incluir o dialog com instruções de instalação para iOS (Share → Adicionar à Tela de Início)
- O botão só aparece quando `canInstall || showIOSPrompt` for verdadeiro

