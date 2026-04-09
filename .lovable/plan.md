

# Melhorar Enquadramento dos Cards na Landing Page (Mobile)

## Problema
Na versao mobile (390px), os cards das secoes Services, Results e ForWhom tem problemas de enquadramento: padding apertado, grid de features em 2 colunas fica cramped, e o layout icon+titulo lado a lado nao respira bem em telas pequenas.

## Solucao

### 1. Services Cards (`src/components/landing/Services.tsx`)
- **Mobile**: Mudar layout do icon+titulo de `flex-row` para **stack vertical** (icon em cima, titulo embaixo) em telas < md
- **Features grid**: Mudar de `grid-cols-2` para `grid-cols-1` no mobile para evitar texto quebrado e apertado
- **Padding**: Aumentar padding interno no mobile de `p-6` para `p-5` com espacamento mais consistente
- **Gap do grid**: Reduzir gap entre cards no mobile de `gap-6` para `gap-4`

### 2. Results Cards (`src/components/landing/Results.tsx`)
- **Mobile grid**: Mudar de `grid md:grid-cols-2 lg:grid-cols-4` para `grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4` — 2 colunas no mobile em vez de 1
- **Padding mobile**: Reduzir padding de `p-6` para `p-4` no mobile para os cards caberem melhor em 2 colunas
- **Tipografia**: Reduzir metrica de `text-3xl` para `text-2xl` no mobile

### 3. ForWhom Cards (`src/components/landing/ForWhom.tsx`)
- **Mobile**: Cards ja estao em 1 coluna, apenas ajustar padding de `p-6` para `p-5`
- **Titulo**: Reduzir de `text-xl` para `text-lg` no mobile para melhor fit

### 4. Container padding geral
- Garantir `px-4` consistente no container em todas as secoes (ja esta, apenas confirmar)

## Arquivos alterados
| Arquivo | Mudanca |
|---|---|
| `src/components/landing/Services.tsx` | Stack vertical icon/titulo mobile, features 1 col mobile |
| `src/components/landing/Results.tsx` | Grid 2 cols mobile, padding/tipografia menor |
| `src/components/landing/ForWhom.tsx` | Ajuste fino de padding e tipografia |

