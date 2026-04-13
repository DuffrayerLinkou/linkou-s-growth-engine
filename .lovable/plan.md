

# Corrigir Criacao de Usuario com Email Existente e Garantir Exclusao

## Problema
Ao deletar um **cliente** (empresa), os usuarios associados continuam existindo no auth. Ao tentar criar um novo usuario com o mesmo email para outro cliente, o Supabase retorna erro "User already registered" porque o auth user ja existe.

## Solucao

### 1. Edge Function `manage-users` — acao `create-user`
Adicionar tratamento para quando o email ja existe:
- Capturar o erro de "user already registered"
- Buscar o usuario existente pelo email via `admin.listUsers`
- Atualizar o `client_id` e role do usuario existente em vez de falhar
- Retornar o usuario atualizado com mensagem de sucesso

### 2. Frontend `Users.tsx` — melhorar feedback
- Quando o backend detecta usuario existente e reatribui, mostrar toast informativo ("Usuario existente reatribuido ao cliente X")
- O botao de excluir usuario ja existe e funciona (linhas 538-565), nao precisa de mudanca

### Arquivos alterados
| Arquivo | Mudanca |
|---|---|
| `supabase/functions/manage-users/index.ts` | Tratar email duplicado no `create-user` — reatribuir usuario existente |
| `src/pages/admin/Users.tsx` | Melhorar mensagem de sucesso para diferenciar criacao vs reatribuicao |

