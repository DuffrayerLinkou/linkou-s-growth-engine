
# Integrar Envio de Email na Criacao de Usuarios

## O que sera feito

Quando um novo usuario for criado (via painel admin ou convite de equipe), o sistema enviara automaticamente um email de boas-vindas com as credenciais de acesso.

## Mudancas

### 1. Edge Function `manage-users/index.ts`

Adicionar chamada ao `send-email` apos a criacao do usuario em dois fluxos:

#### Fluxo `create-user` (admin cria usuario)
Apos criar o usuario com sucesso, enviar email de boas-vindas contendo:
- Nome do usuario
- Email de login
- Senha temporaria (a que o admin definiu)
- Link para acessar a plataforma (`https://www.agencialinkou.com.br/auth`)
- Orientacao para trocar a senha

#### Fluxo `invite-team-member` (gestor convida membro)
Mesmo comportamento: enviar email com credenciais apos criar o membro da equipe.

### 2. Template do email

Email HTML com visual profissional usando as cores da Linkou (roxo `#7C3AED`), contendo:
- Logo ou nome "Linkou" no topo
- Saudacao personalizada com o nome
- Credenciais (email e senha)
- Botao "Acessar Plataforma" apontando para `/auth`
- Aviso para trocar a senha no primeiro acesso
- Rodape com dados da Linkou

### 3. Implementacao tecnica

A chamada ao email sera feita internamente na edge function usando `fetch` para o proprio endpoint `send-email`, passando o `SUPABASE_SERVICE_ROLE_KEY` como autorizacao. Isso evita dependencia externa e reutiliza a funcao ja criada.

```text
Fluxo:
1. Admin clica "Criar Usuario"
2. manage-users cria o usuario no Supabase Auth
3. manage-users chama send-email internamente com as credenciais
4. Usuario recebe email de boas-vindas
5. Resposta de sucesso retorna ao frontend (mesmo que o email falhe)
```

O envio do email sera feito em modo "fire and forget" - se falhar, nao bloqueia a criacao do usuario. Um log de erro sera registrado no console.

### Arquivos alterados

1. `supabase/functions/manage-users/index.ts` - Adicionar logica de envio de email nos fluxos `create-user` e `invite-team-member`
