

# Corrigir Seleção de Responsável nas Tarefas

## Problema
A query de membros internos usa um `inner join` com `user_roles` filtrando apenas `admin` e `account_manager`. Se Lucas Leo, Mauro etc. não possuem essas roles, não aparecem. Além disso, quando o executor é "cliente", os membros internos somem completamente do dropdown.

## Solução

### 1. Ampliar query de membros internos
Alterar a query `internalAssignees` para buscar **todos os profiles que NÃO são de clientes** (ou seja, `client_id IS NULL`), em vez de filtrar por role. Isso garante que qualquer membro interno apareça, independente da role.

```sql
-- De:
profiles + inner join user_roles WHERE role IN (admin, account_manager)
-- Para:
profiles WHERE client_id IS NULL
```

### 2. Sempre mostrar membros internos no dropdown
Independente do `executor_type` selecionado (interno ou cliente), o dropdown de "Responsável" sempre mostrará os membros internos. Quando `executor_type = "client"` e um cliente estiver selecionado, os membros do cliente também aparecerão no mesmo dropdown, separados por labels de grupo ("Equipe Interna" / "Equipe do Cliente").

### 3. Atualizar `assigneeNames` map
Incluir também os `clientUsers` no mapa de nomes para que o Kanban exiba corretamente o nome do responsável em todos os cards.

## Arquivo alterado
`src/pages/admin/Tasks.tsx` — query `internalAssignees`, dropdown de responsável, e `assigneeNames` useMemo.

