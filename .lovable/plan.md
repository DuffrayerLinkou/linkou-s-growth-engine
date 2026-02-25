

# Splash Screen PWA + Redirecionar para Login

## O que muda

### 1. Página inicial do PWA = Login
Alterar o `start_url` no `manifest.webmanifest` de `"/"` para `"/auth"`. Assim, ao abrir o app instalado, o usuário cai direto na tela de login.

### 2. Splash Screen animada na abertura do app
Criar um componente `SplashScreen` que exibe a logo da Linkou com animação (fade in + scale + pulse) por ~2 segundos antes de mostrar o conteúdo. Essa splash aparece apenas quando o app é aberto em modo standalone (PWA instalado), simulando a experiência de um app nativo.

## Arquivos Alterados

| Arquivo | Alteração |
|---|---|
| `public/manifest.webmanifest` | Mudar `start_url` de `"/"` para `"/auth"` |
| `src/components/SplashScreen.tsx` | **Novo** — Componente com logo animada (fade in, scale up, pulse sutil) com fundo escuro (#0A0A0F) e a logo `logo-linkou-roxo.png` centralizada |
| `src/App.tsx` | Envolver as rotas com o `SplashScreen` que aparece apenas em modo standalone (PWA) por ~2s na primeira abertura |

## Detalhes Técnicos

### SplashScreen
- Detecta se está em modo standalone (`display-mode: standalone` ou `navigator.standalone`)
- Se sim, mostra a logo com animação por 2 segundos usando framer-motion:
  - Logo entra com `opacity: 0 → 1`, `scale: 0.8 → 1`
  - Pulse sutil na logo
  - Fade out da splash inteira antes de mostrar o app
- Se não está em standalone (navegador normal), não mostra splash — vai direto para o conteúdo
- Usa `useState` com timer para controlar a transição

### Manifest
```json
"start_url": "/auth"
```

### Fluxo
```text
Usuário abre PWA
  → Splash (2s, logo animada)
  → Tela de Login (/auth)
  → Após login, redireciona para /admin ou /cliente conforme role
```

