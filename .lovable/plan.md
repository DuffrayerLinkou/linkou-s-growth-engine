

# Plano: Corrigir Loop de Redirecionamento no Login de Cliente

## Diagnóstico

O usuário `degustai2022@gmail.com` está preso em um **loop de redirecionamento** ao fazer login porque:

| Atributo | Valor |
|----------|-------|
| Role | `client` |
| client_id | `null` (não vinculado) |

### Fluxo Atual (Bugado)

```text
Login → Auth.tsx redireciona para /cliente
         ↓
ProtectedRoute detecta que não tem client_id
         ↓
Redireciona para /auth com mensagem de erro
         ↓
Auth.tsx detecta usuário logado → redireciona para /cliente (loop!)
```

### Problemas Identificados

1. **Auth.tsx não verifica `hasClientAccess`** antes de redirecionar usuários com role `client`
2. **Auth.tsx não exibe a mensagem de erro** passada via `location.state`
3. O usuário fica preso eternamente no loop

---

## Solução Proposta

### 1. Corrigir a lógica de redirecionamento em Auth.tsx

Modificar o `useEffect` para verificar se o cliente tem `client_id` antes de redirecionar:

```typescript
const { user, roles, profile, isLoading, rolesLoaded } = useAuth();

useEffect(() => {
  if (!isLoading && user && rolesLoaded) {
    if (roles.includes("admin") || roles.includes("account_manager")) {
      navigate("/admin", { replace: true });
    } else if (profile?.client_id) {
      // Só redireciona para /cliente se tiver client_id
      navigate("/cliente", { replace: true });
    }
    // Se for client sem client_id, permanece na página de auth
  }
}, [user, roles, profile, isLoading, rolesLoaded, navigate]);
```

### 2. Exibir mensagem de erro para clientes sem vínculo

Adicionar tratamento do `location.state.error`:

```typescript
const location = useLocation();
const errorMessage = location.state?.error;

// No JSX, mostrar alerta se houver erro
{errorMessage && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{errorMessage}</AlertDescription>
  </Alert>
)}
```

### 3. Mostrar estado de "conta não vinculada"

Se o usuário estiver logado mas sem `client_id`, mostrar uma mensagem explicativa em vez do formulário de login:

```typescript
// Se usuário logado mas sem client_id
if (user && !profile?.client_id && roles.includes("client")) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conta não vinculada</CardTitle>
        <CardDescription>
          Sua conta ainda não está vinculada a um cliente. 
          Entre em contato com o suporte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={signOut}>Sair</Button>
        <Button asChild>
          <a href="https://wa.me/5541988988054">Contatar Suporte</a>
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Auth.tsx` | Adicionar verificação de `client_id` antes de redirecionar; Exibir mensagem de erro; Mostrar tela de "conta não vinculada" |

---

## Solução de Dados (Opcional)

Se o usuário `degustai2022@gmail.com` deveria estar vinculado a um cliente existente, podemos atualizar o banco de dados para associá-lo:

```sql
UPDATE profiles 
SET client_id = 'id_do_cliente_correto'
WHERE email = 'degustai2022@gmail.com';
```

Clientes disponíveis para vincular:
- FullCar Concessionaria
- MEGA FONE
- Elite Veiculos / Tainara
- AK VEICULOS
- LINKOU Consultoria de tráfego
- Forza Construtora

---

## Resultado Esperado

1. Usuários com role `client` mas sem `client_id` não ficam em loop
2. Mensagem clara explicando que a conta não está vinculada
3. Opções para contatar suporte ou fazer logout
4. Sistema robusto para lidar com contas mal configuradas

