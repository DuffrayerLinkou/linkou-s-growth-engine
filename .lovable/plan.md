
# Varredura e Limpeza de Código Órfão

## Resultado da auditoria completa

Foram identificados **5 itens** para limpeza, distribuídos em 4 categorias. Nenhuma remoção afeta funcionalidade ativa.

---

## Item 1 — Arquivo órfão: `MobileWhatsAppCTA.tsx`

**Arquivo:** `src/components/landing/MobileWhatsAppCTA.tsx`

O componente foi substituído pelo `LinkouzinhoWidget` durante a implementação do bot. Nenhum arquivo do projeto importa ou referencia `MobileWhatsAppCTA` — confirmado por busca completa no diretório `src/`. O arquivo existe no disco mas está completamente desconectado da aplicação.

**Ação:** Deletar o arquivo.

---

## Item 2 — Arquivo órfão: `Deliverables.tsx`

**Arquivo:** `src/components/landing/Deliverables.tsx`

O componente existe mas nenhum arquivo do projeto o importa — confirmado por busca em `import.*Deliverables` sem resultados. Não está em uso na landing page (`Index.tsx`) nem em qualquer outro ponto de entrada.

**Ação:** Deletar o arquivo.

---

## Item 3 — Campo fantasma no tipo `Message`

**Arquivo:** `src/components/landing/LinkouzinhoWidget.tsx`, linha 51

```typescript
type Message = {
  role: "user" | "assistant";
  content: string;
  captureMode?: boolean; // ← nunca usado
};
```

O campo `captureMode` foi definido no tipo `Message` mas nunca é atribuído nem lido em nenhuma mensagem. O controle de captura é feito via estado separado (`useState<boolean>` chamado `captureMode`). O campo no tipo é um resíduo de uma versão anterior da lógica.

**Ação:** Remover a propriedade `captureMode?: boolean` do tipo `Message`.

---

## Item 4 — `console.log` de debug em produção

**Arquivo:** `src/components/landing/ContactForm.tsx`, linhas 120 e 141

```typescript
console.log('Meta CAPI event sent successfully');   // linha 120
console.log('TikTok Events API event sent successfully'); // linha 141
```

Logs de debug que ficaram no código de produção após integração com CAPI. Os `console.warn` logo abaixo (em caso de erro) podem ser mantidos — são úteis para diagnóstico silencioso. Apenas os `.log` de sucesso serão removidos.

**Ação:** Remover as 2 linhas de `console.log`.

---

## Item 5 — Animações sem uso no `tailwind.config.ts`

**Arquivo:** `tailwind.config.ts`

Busca por uso das classes de animação em todo o `src/` revelou:

| Keyframe / Animação | Classe Tailwind | Em uso? |
|---|---|---|
| `accordion-down` / `accordion-up` | — | ✅ Sim (via Radix/shadcn) |
| `fade-in` | `animate-fade-in` | ✅ Sim (2 arquivos) |
| `fade-in-up` | `animate-fade-in-up` | ❌ Nenhum uso |
| `slide-in-left` | `animate-slide-in-left` | ❌ Nenhum uso |
| `slide-in-right` | `animate-slide-in-right` | ❌ Nenhum uso |
| `scale-in` | `animate-scale-in` | ❌ Nenhum uso |
| `float` | `animate-float` | ❌ Nenhum uso |
| `pulse` | `animate-pulse` | ✅ Sim (múltiplos arquivos) |
| `shimmer` | `animate-shimmer` | ❌ Nenhum uso |
| `pulse-slow` | `animate-pulse-slow` | ✅ Sim (Linkouzinho) |

**Animações a remover:** `fade-in-up`, `slide-in-left`, `slide-in-right`, `scale-in`, `float`, `shimmer` — tanto os keyframes quanto as entradas no bloco `animation`.

**Ação:** Remover 6 keyframes + 6 entradas de `animation` sem uso.

---

## Resumo das ações

| # | Arquivo | Ação | Impacto |
|---|---|---|---|
| 1 | `MobileWhatsAppCTA.tsx` | Deletar | Zero — não importado |
| 2 | `Deliverables.tsx` | Deletar | Zero — não importado |
| 3 | `LinkouzinhoWidget.tsx` | Remover campo `captureMode?` do tipo `Message` | Zero — campo nunca utilizado |
| 4 | `ContactForm.tsx` | Remover 2x `console.log` | Zero — apenas limpeza de debug |
| 5 | `tailwind.config.ts` | Remover 6 keyframes + 6 animations sem uso | Zero — Tailwind só gera CSS para classes usadas |

**Nenhuma funcionalidade é afetada.**
