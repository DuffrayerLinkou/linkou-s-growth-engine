

# Governanca por Perfil de Cliente

## Contexto Atual

O sistema possui dois eixos de permissao no lado do cliente:
- **user_type**: `operator` (padrao) ou `manager` (gestor/dono)
- **ponto_focal**: booleano que indica quem aprova campanhas/briefings

Atualmente, todos os usuarios do cliente veem as mesmas paginas e dados. A proposta e restringir acesso conforme o perfil.

## Matriz de Permissoes

| Funcionalidade | Operator | Ponto Focal | Manager |
|---|---|---|---|
| Dashboard (KPIs basicos) | Sim | Sim | Sim |
| Tarefas (ver/comentar) | Sim | Sim | Sim |
| Campanhas (visualizar) | Sim | Sim | Sim |
| Aprovar campanhas | Nao | Sim | Nao* |
| Arquivos (visualizar/baixar) | Sim | Sim | Sim |
| Arquivos (upload) | Nao | Sim | Sim |
| Metricas de Trafego | Nao | Nao | Sim |
| Minha Jornada | Sim | Sim | Sim |
| Base de Conhecimento | Sim | Sim | Sim |
| Agendamentos | Sim | Sim | Sim |
| Minha Conta | Sim | Sim | Sim |
| Dados financeiros (orcamento campanhas, investimento) | Oculto | Oculto | Visivel |

*Aprovacao fica exclusiva do ponto focal, independente de ser manager ou operator.

## Mudancas Planejadas

### 1. Hook de permissoes centralizado
**Novo arquivo:** `src/hooks/useClientPermissions.ts`

Criar um hook que retorna as permissoes do usuario baseado no `user_type` e `ponto_focal`:

```
useClientPermissions() => {
  canApprove: boolean      // ponto_focal === true
  canUploadFiles: boolean  // ponto_focal || manager
  canViewFinancials: boolean  // manager only
  canEditMetrics: boolean     // ponto_focal (ja existe)
  userType: "operator" | "manager"
  isPontoFocal: boolean
}
```

### 2. Navegacao condicional
**Arquivo:** `src/layouts/ClientLayout.tsx`

- Filtrar `navItems` baseado nas permissoes
- Ocultar "Metricas de Trafego" para operator e ponto_focal (somente manager ve)
- Manter todas as outras paginas visiveis

### 3. Protecao na pagina de Metricas
**Arquivo:** `src/pages/cliente/MetricasTrafego.tsx`

- Verificar se `user_type === 'manager'` no inicio
- Se nao for manager, mostrar tela de "acesso restrito" com orientacao para falar com o gestor

### 4. Ocultar dados financeiros nas Campanhas
**Arquivo:** `src/pages/cliente/Campanhas.tsx`

- Usar `canViewFinancials` do hook
- Ocultar campo de orcamento (`budget`, `daily_budget`) quando nao for manager
- Ocultar secao "Orcamento e Lances" no detalhe expandido

### 5. Ocultar investimento no Dashboard
**Arquivo:** `src/pages/cliente/Dashboard.tsx`

- Nao mostrar valores financeiros nos KPIs para quem nao e manager
- Manter contadores de tarefas e campanhas visiveis para todos

### 6. Indicador visual de perfil
**Arquivo:** `src/layouts/ClientLayout.tsx`

- Ao lado do nome, alem do badge "Ponto Focal" (que ja existe), mostrar badge "Gestor" para managers
- Operator nao recebe badge adicional

## Detalhes Tecnicos

### Hook useClientPermissions

```typescript
// src/hooks/useClientPermissions.ts
export function useClientPermissions() {
  const { profile } = useAuth();
  
  const userType = (profile?.user_type || "operator") as "operator" | "manager";
  const isPontoFocal = profile?.ponto_focal === true;
  
  return {
    userType,
    isPontoFocal,
    canApprove: isPontoFocal,
    canUploadFiles: isPontoFocal || userType === "manager",
    canViewFinancials: userType === "manager",
    canEditMetrics: isPontoFocal,
  };
}
```

### Navegacao filtrada no ClientLayout

O array `navItems` tera um campo opcional `requiredPermission` e sera filtrado antes da renderizacao:

```typescript
const navItems = [
  { href: "/cliente", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/cliente/minha-jornada", icon: Route, label: "Minha Jornada" },
  { href: "/cliente/tarefas", icon: CheckSquare, label: "Tarefas" },
  { href: "/cliente/metricas-trafego", icon: BarChart3, label: "Metricas", permission: "canViewFinancials" },
  { href: "/cliente/campanhas", icon: Megaphone, label: "Campanhas" },
  { href: "/cliente/arquivos", icon: FileDown, label: "Arquivos" },
  { href: "/cliente/base-conhecimento", icon: BookOpen, label: "Base de Conhecimento" },
  { href: "/cliente/agendamentos", icon: Calendar, label: "Agendamentos" },
  { href: "/cliente/minha-conta", icon: User, label: "Minha Conta" },
];
```

### Arquivos alterados
1. `src/hooks/useClientPermissions.ts` (novo)
2. `src/layouts/ClientLayout.tsx` (navegacao condicional + badge manager)
3. `src/pages/cliente/MetricasTrafego.tsx` (bloqueio de acesso para nao-manager)
4. `src/pages/cliente/Campanhas.tsx` (ocultar dados financeiros)
5. `src/pages/cliente/Dashboard.tsx` (ocultar valores financeiros)
6. `src/pages/cliente/Arquivos.tsx` (usar hook centralizado em vez de checagem inline)
