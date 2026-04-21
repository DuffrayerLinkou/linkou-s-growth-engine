

## Liberar Projetos, Criativos e Métricas para o cliente correto

**Problema identificado** no usuário `coreagents2025@gmail.com` (Clube dos Estudante, `user_type=operator`, `ponto_focal=true`):

| Seção | Status atual | Causa |
|---|---|---|
| **Métricas de Tráfego** | Não aparece | Restrita a `canViewFinancials`, que só libera para `user_type=manager`. Ponto Focal operador fica de fora. |
| **Criativos** | Já está no menu sem restrição | Deve aparecer — se o usuário não vê, é cache. Vou validar abrindo manualmente. |
| **Projetos** | Não existe no cliente | Não há rota `/cliente/projetos` nem item de menu. A nova seção rica de Projetos só foi feita no admin. |

### Mudanças

**1. Liberar "Métricas de Tráfego" para Ponto Focal**

Hoje a regra em `useClientPermissions.ts`:
```ts
canViewFinancials: userType === "manager",
```
Vamos ampliar para incluir ponto focal (que tem responsabilidade de aprovar e analisar performance):
```ts
canViewFinancials: userType === "manager" || isPontoFocal,
```
Isso libera o menu "Métricas de Tráfego" automaticamente (já usa essa permission no `ClientLayout`).

**2. Criar seção "Projetos" no cliente**

Nova página `src/pages/cliente/Projetos.tsx` reaproveitando os componentes recém-criados do admin:
- Mesma grade de `ProjectCard` filtrada automaticamente pelo `client_id` do usuário (a tabela `projects` já tem RLS de `user_has_client_access`)
- KPIs no topo (projetos ativos, budget total, entregas em andamento, aprendizados)
- `ProjectDetailDialog` com as 4 abas (Tarefas, Campanhas, Aprendizados, Arquivos) — reutilizado tal qual
- **Sem** botões de criar/editar/deletar projeto (cliente é leitura-only)
- Filtros: busca + status + toggle "Ativos"

Adicionar:
- Rota `/cliente/projetos` em `App.tsx`
- Item de menu "Projetos" em `ClientLayout.tsx` com ícone `FolderKanban` (ou `Briefcase`), posicionado logo após "Campanhas"
- Sem permissão restrita — todos os papéis do cliente veem (Manager, Ponto Focal, Operador)

**3. Garantia de consistência (cache do menu)**

Como `Criativos` já está no menu e o usuário disse que não vê, isso é provavelmente cache do bundle JS antigo. Após o deploy das mudanças acima, o item Criativos voltará naturalmente. Vou verificar manualmente o componente para confirmar que não há `if` escondendo.

### Estrutura técnica

**Arquivos editados**
- `src/hooks/useClientPermissions.ts` — `canViewFinancials` aceita `isPontoFocal`
- `src/App.tsx` — adicionar rota `/cliente/projetos` (lazy)
- `src/layouts/ClientLayout.tsx` — adicionar item "Projetos" no `navItems`

**Arquivo novo**
- `src/pages/cliente/Projetos.tsx` — versão read-only da grade de projetos do admin (reaproveita `ProjectCard` e `ProjectDetailDialog`, oculta botões de criação/edição)

**Sem mudanças de banco**
- RLS da tabela `projects` já permite cliente ler via `user_has_client_access`
- RLS de `tasks`, `campaigns`, `learnings`, `files` já cobertas (são as mesmas usadas em `/cliente/tarefas`, `/cliente/campanhas` etc)

### Fora de escopo
- Permitir que operadores normais (não-ponto-focal) também vejam Métricas — mantemos restrito a Manager + Ponto Focal por agora
- Permitir cliente criar/editar projetos
- Adicionar "Projetos" como permission opcional do `useClientPermissions` — por enquanto fica visível para todos do cliente

