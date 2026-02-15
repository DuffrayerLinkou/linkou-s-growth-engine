

# Minha Equipe: Gestao de Usuarios pelo Cliente Manager

## Problema

Hoje, apenas o admin pode criar usuarios via a edge function `manage-users`. O cliente manager nao consegue adicionar funcionarios (operadores) a sua propria equipe. Para autonomia total, o manager precisa convidar e gerenciar membros do seu time.

## Solucao

Criar uma pagina "Minha Equipe" e estender a edge function `manage-users` com acoes especificas para o manager, limitadas ao escopo do seu `client_id`.

## Matriz de Acoes do Manager

| Acao | Permitido | Restricao |
|---|---|---|
| Ver membros da equipe | Sim | Somente usuarios com mesmo client_id |
| Convidar novo membro | Sim | Sempre como role `client`, sempre vinculado ao seu client_id |
| Definir ponto focal | Sim | Apenas dentro da sua equipe |
| Definir user_type (operator/manager) | Sim | Apenas dentro da sua equipe |
| Remover membro | Nao | Somente admin pode excluir usuarios |
| Alterar roles (admin, account_manager) | Nao | Somente admin |

## Mudancas Planejadas

### 1. Estender Edge Function `manage-users`

**Arquivo:** `supabase/functions/manage-users/index.ts`

Adicionar duas novas acoes alem das existentes (que continuam exclusivas do admin):

- **`list-team`**: Retorna usuarios com o mesmo `client_id` do manager. Nao requer ser admin, mas requer ser `manager` (verificado via `user_type` no profile) e ter um `client_id`.

- **`invite-team-member`**: Cria um novo usuario com role `client`, vinculado ao `client_id` do manager. Campos aceitos: email, password, full_name, user_type (operator ou manager), ponto_focal. O `client_id` e forcado para ser o mesmo do manager (nao aceita input do frontend).

- **`update-team-member`**: Permite ao manager alterar `full_name`, `user_type` e `ponto_focal` de um membro da sua equipe. Valida que o usuario alvo pertence ao mesmo `client_id`.

A logica de autorizacao funciona assim:
1. Acoes existentes (list-users, create-user, update-user, delete-user) continuam exigindo role `admin`
2. Novas acoes (list-team, invite-team-member, update-team-member) exigem `user_type = 'manager'` e `client_id != null`
3. Todas as operacoes de equipe sao restritas ao `client_id` do manager autenticado

### 2. Nova Pagina "Minha Equipe"

**Novo arquivo:** `src/pages/cliente/MinhaEquipe.tsx`

Pagina acessivel apenas para managers (`canManageTeam`) com:

- **Lista de membros**: Tabela com nome, email, tipo (operator/manager), e se e ponto focal
- **Botao "Convidar Membro"**: Dialog com campos:
  - Email (obrigatorio)
  - Senha temporaria (obrigatorio)
  - Nome completo
  - Tipo: Operador ou Gestor (select)
  - Ponto Focal (switch)
- **Edicao inline**: Botao de editar em cada membro para alterar tipo e ponto focal
- **Indicadores visuais**: Badges para "Gestor", "Ponto Focal", "Voce" (usuario logado)

### 3. Navegacao e Rota

**Arquivo:** `src/layouts/ClientLayout.tsx`
- Adicionar item "Minha Equipe" com icone `Users` e `permission: "canManageTeam"`

**Arquivo:** `src/App.tsx`
- Adicionar rota `/cliente/minha-equipe` apontando para `MinhaEquipe`

**Arquivo:** `src/hooks/useClientPermissions.ts`
- Adicionar `"canManageTeam"` ao tipo `PermissionKey` no ClientLayout

## Detalhes Tecnicos

### Autorizacao na Edge Function (novas acoes)

```text
Para list-team, invite-team-member, update-team-member:

1. Obter user via auth token
2. Buscar profile do user (client_id, user_type)
3. Verificar: user_type === 'manager' AND client_id IS NOT NULL
4. Se nao, retornar 403
5. Todas as queries filtradas por client_id do manager
```

### Seguranca

- O manager NAO pode escolher o client_id do novo usuario (e forcado pelo backend)
- O manager NAO pode criar usuarios com role admin ou account_manager (forcado como `client`)
- O manager NAO pode editar usuarios fora do seu client_id (validacao no backend)
- O manager NAO pode excluir usuarios (acao nao disponivel)
- Senhas temporarias sao definidas na criacao; o usuario pode trocar depois

### Arquivos alterados/criados

1. `supabase/functions/manage-users/index.ts` - novas acoes (list-team, invite-team-member, update-team-member)
2. `src/pages/cliente/MinhaEquipe.tsx` - nova pagina
3. `src/layouts/ClientLayout.tsx` - novo nav item com permissao
4. `src/App.tsx` - nova rota
5. `src/hooks/useClientPermissions.ts` - sem mudanca de logica (canManageTeam ja existe), apenas atualizar PermissionKey type no layout

