

# Fix: Seletor de clientes vazio no Linkouzinho

## Problema
A query do componente `LinkouzinhoInternal` filtra clientes com `status = 'active'`, mas no banco de dados os clientes ativos possuem `status = 'ativo'`. O dropdown abre vazio porque nenhum cliente corresponde ao filtro.

## Correção
**Arquivo**: `src/components/LinkouzinhoInternal.tsx` (linha 72)

Alterar `.eq("status", "active")` para `.eq("status", "ativo")`.

Correção de uma única linha.

