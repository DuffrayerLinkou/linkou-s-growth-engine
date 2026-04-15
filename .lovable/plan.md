

# Fix: Clicar nos cards de tarefa no Kanban nao abre o dialog

## Problema
O fix anterior separou o `dragHandleProps` do `onClick`, mas o `onClick` no `Card` pode estar sendo suprimido pelo `@hello-pangea/dnd` porque `provided.draggableProps` (espalhado no Card) pode interferir com eventos de pointer em certos cenarios. Alem disso, o `ScrollArea` envolvendo o droppable pode estar capturando eventos.

## Solucao
Mover o click handler para o conteudo interno do card (o div de conteudo), em vez de no Card raiz que recebe `draggableProps`. Isso garante que o click nao e interceptado pela biblioteca DnD.

### Mudancas em `src/components/admin/TasksKanban.tsx`
1. Remover `onClick` do `Card` (que recebe `draggableProps`)
2. Adicionar `onClick={() => onTaskClick(task)}` no div interno de conteudo (linha 136)
3. Isso isola completamente o click do DnD

### Mudancas em `src/components/cliente/TasksKanbanClient.tsx`
1. Mesma abordagem: garantir que o `onClick` esta no conteudo interno, nao no Card que recebe `draggableProps`

## Arquivos alterados
| Arquivo | Mudanca |
|---|---|
| `src/components/admin/TasksKanban.tsx` | Mover onClick do Card para o div de conteudo |
| `src/components/cliente/TasksKanbanClient.tsx` | Mesma correcao para consistencia |

