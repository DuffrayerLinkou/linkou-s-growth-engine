

# Fix: Tarefas não abrem ao clicar no desktop

## Problema
No `TasksKanban.tsx`, o `Card` recebe simultaneamente `{...provided.dragHandleProps}` e `onClick`. No desktop, o `@hello-pangea/dnd` captura o `mousedown` para iniciar drag e pode suprimir o `click` event, impedindo a abertura do dialog de edição.

## Solução
Separar o drag handle do click area:
- Mover `dragHandleProps` para um pequeno elemento de "alça" (grip icon) dentro do card
- Manter o `onClick` no Card body, sem conflito com o drag

### Mudanças em `src/components/admin/TasksKanban.tsx`

1. Importar `GripVertical` do lucide-react
2. No `Card`: remover `{...provided.dragHandleProps}` e manter apenas `{...provided.draggableProps}` + `ref`
3. Adicionar um `div` com `{...provided.dragHandleProps}` contendo o ícone `GripVertical` como alça de arraste
4. O `onClick` permanece no Card normalmente, sem interferência do drag

### Arquivo alterado
| Arquivo | Mudança |
|---|---|
| `src/components/admin/TasksKanban.tsx` | Separar drag handle do click handler |

