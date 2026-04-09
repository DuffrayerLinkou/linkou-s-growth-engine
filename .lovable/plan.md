

# Melhorar Seção de Stats no Hero (Mobile)

## Problema
No mobile (390px), os 4 stats ficam empilhados sem estrutura visual, com texto centralizado flutuando — parece desorganizado e sem hierarquia.

## Solução
Reorganizar os stats em um **grid 2x2** no mobile com cards semi-transparentes, criando blocos visuais definidos. Em desktop, manter o layout horizontal com separadores.

### Mudanças em `src/components/landing/Hero.tsx`

1. **Mobile (< md)**: Grid 2 colunas com cada stat dentro de um card com fundo `bg-card/30 backdrop-blur-sm` e borda sutil, padding consistente
2. **Desktop (md+)**: Manter layout horizontal em linha com separadores verticais (como está)
3. Adicionar a palavra-chave "EXPLORAR" como label pequeno acima do stat de 60% (como na screenshot) — na verdade isso já existe no scroll indicator, o problema é visual dos stats
4. Melhorar tipografia: valores maiores (`text-3xl`), labels com `text-xs` e `leading-tight`

### Arquivo alterado
- `src/components/landing/Hero.tsx` — refatorar o bloco de stats (linhas 127-148)

