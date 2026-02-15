import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { error: 'No authorization header', status: 401 }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) return { error: 'Unauthorized', status: 401 }

  return { user, userClient }
}

async function requireAdmin(userClient: ReturnType<typeof createClient>, userId: string) {
  const { data: roles } = await userClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  return roles?.some((r: { role: string }) => r.role === 'admin') ?? false
}

async function requireManager(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data: profile } = await adminClient
    .from('profiles')
    .select('client_id, user_type')
    .eq('id', userId)
    .single()

  if (!profile || profile.user_type !== 'manager' || !profile.client_id) return null
  return profile.client_id as string
}

function getAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ── Welcome email ──

function buildWelcomeEmailHtml(name: string, email: string, password: string): string {
  const displayName = name || 'Usuário'
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <tr><td style="background:#7C3AED;padding:32px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:1px;">Linkou</h1>
  </td></tr>
  <tr><td style="padding:36px 32px 24px;">
    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:20px;">Olá, ${displayName}! 👋</h2>
    <p style="margin:0 0 20px;color:#4a4a68;font-size:15px;line-height:1.6;">Sua conta na plataforma da <strong>Linkou</strong> foi criada com sucesso. Abaixo estão suas credenciais de acesso:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ff;border-radius:8px;border:1px solid #e9dffc;margin-bottom:24px;">
      <tr><td style="padding:20px;">
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">E-mail de acesso</p>
        <p style="margin:0 0 16px;color:#1a1a2e;font-size:15px;font-weight:600;">${email}</p>
        <p style="margin:0 0 8px;color:#6b6b8d;font-size:13px;">Senha temporária</p>
        <p style="margin:0;color:#1a1a2e;font-size:15px;font-weight:600;">${password}</p>
      </td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <a href="https://www.agencialinkou.com.br/auth" style="display:inline-block;background:#7C3AED;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;">Acessar Plataforma</a>
      </td></tr>
    </table>
    <p style="margin:24px 0 0;padding:16px;background:#fff8e1;border-radius:8px;color:#7a6520;font-size:13px;line-height:1.5;">⚠️ Recomendamos que você troque sua senha no primeiro acesso para garantir a segurança da sua conta.</p>
  </td></tr>
  <tr><td style="padding:24px 32px;border-top:1px solid #eee;text-align:center;">
    <p style="margin:0;color:#9e9eb8;font-size:12px;">Linkou — Marketing de Performance</p>
    <p style="margin:4px 0 0;color:#9e9eb8;font-size:12px;">agencialinkou.com.br</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

async function sendWelcomeEmail(email: string, name: string, password: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        to: email,
        subject: 'Bem-vindo(a) à plataforma Linkou! 🚀',
        html: buildWelcomeEmailHtml(name, email, password),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Welcome email failed:', err)
    } else {
      console.log('Welcome email sent to', email)
    }
  } catch (e) {
    console.error('Welcome email error:', e)
  }
}

// ── Admin-only actions ──

async function handleAdminActions(action: string, payload: Record<string, unknown>, adminClient: ReturnType<typeof createClient>) {
  switch (action) {
    case 'list-users': {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers()
      if (error) throw error

      const userIds = users.map((u) => u.id)
      const { data: profiles } = await adminClient.from('profiles').select('*').in('id', userIds)
      const { data: userRoles } = await adminClient.from('user_roles').select('*').in('user_id', userIds)

      const enrichedUsers = users.map((u) => ({
        ...u,
        profile: profiles?.find((p) => p.id === u.id),
        roles: userRoles?.filter((r) => r.user_id === u.id).map((r) => r.role) || [],
      }))

      return jsonResponse({ users: enrichedUsers })
    }

    case 'create-user': {
      const { email, password, full_name, role, client_id } = payload as Record<string, string>

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name },
      })
      if (createError) throw createError

      if (client_id) {
        await adminClient.from('profiles').update({ client_id }).eq('id', newUser.user.id)
      }

      if (role && role !== 'client') {
        await adminClient.from('user_roles').delete().eq('user_id', newUser.user.id).eq('role', 'client')
        await adminClient.from('user_roles').insert({ user_id: newUser.user.id, role })
      }

      // Fire-and-forget welcome email
      sendWelcomeEmail(email, full_name || '', password)

      return jsonResponse({ user: newUser.user })
    }

    case 'update-user': {
      const { user_id, email, full_name, role, client_id, ponto_focal, password, confirm_email } = payload as Record<string, unknown>

      const authUpdate: Record<string, unknown> = {}
      if (email) authUpdate.email = email
      if (password) authUpdate.password = password
      if (confirm_email === true) authUpdate.email_confirm = true

      if (Object.keys(authUpdate).length > 0) {
        const { error: authError } = await adminClient.auth.admin.updateUserById(user_id as string, authUpdate)
        if (authError) throw authError
      }

      const profileUpdate: Record<string, unknown> = {}
      if (full_name !== undefined) profileUpdate.full_name = full_name
      if (client_id !== undefined) profileUpdate.client_id = client_id
      if (ponto_focal !== undefined) profileUpdate.ponto_focal = ponto_focal

      if (Object.keys(profileUpdate).length > 0) {
        await adminClient.from('profiles').update(profileUpdate).eq('id', user_id)
      }

      if (role) {
        await adminClient.from('user_roles').delete().eq('user_id', user_id as string)
        await adminClient.from('user_roles').insert({ user_id, role })
      }

      return jsonResponse({ success: true })
    }

    case 'get-user': {
      const { user_id } = payload as { user_id: string }
      const { data: { user: authUser }, error } = await adminClient.auth.admin.getUserById(user_id)
      if (error) throw error
      return jsonResponse({ user: authUser })
    }

    case 'delete-user': {
      const { user_id } = payload as { user_id: string }
      const { error } = await adminClient.auth.admin.deleteUser(user_id)
      if (error) throw error
      return jsonResponse({ success: true })
    }

    default:
      return null
  }
}

// ── Manager team actions ──

async function handleTeamActions(action: string, payload: Record<string, unknown>, adminClient: ReturnType<typeof createClient>, managerClientId: string) {
  switch (action) {
    case 'list-team': {
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, full_name, email, user_type, ponto_focal, avatar_url')
        .eq('client_id', managerClientId)

      return jsonResponse({ members: profiles || [] })
    }

    case 'invite-team-member': {
      const { email, password, full_name, user_type, ponto_focal } = payload as Record<string, unknown>

      if (!email || !password) {
        return jsonResponse({ error: 'Email and password are required' }, 400)
      }

      const safeUserType = user_type === 'manager' ? 'manager' : 'operator'

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email as string,
        password: password as string,
        email_confirm: true,
        user_metadata: { full_name: full_name || '' },
      })
      if (createError) throw createError

      await adminClient.from('profiles').update({
        client_id: managerClientId,
        user_type: safeUserType,
        ponto_focal: ponto_focal === true,
      }).eq('id', newUser.user.id)

      // Fire-and-forget welcome email
      sendWelcomeEmail(email as string, (full_name as string) || '', password as string)

      return jsonResponse({ user: newUser.user })
    }

    case 'update-team-member': {
      const { user_id, full_name, user_type, ponto_focal } = payload as Record<string, unknown>

      if (!user_id) return jsonResponse({ error: 'user_id is required' }, 400)

      const { data: target } = await adminClient
        .from('profiles')
        .select('client_id')
        .eq('id', user_id)
        .single()

      if (!target || target.client_id !== managerClientId) {
        return jsonResponse({ error: 'User not in your team' }, 403)
      }

      const update: Record<string, unknown> = {}
      if (full_name !== undefined) update.full_name = full_name
      if (user_type !== undefined) {
        update.user_type = user_type === 'manager' ? 'manager' : 'operator'
      }
      if (ponto_focal !== undefined) update.ponto_focal = ponto_focal

      if (Object.keys(update).length > 0) {
        await adminClient.from('profiles').update(update).eq('id', user_id)
      }

      return jsonResponse({ success: true })
    }

    default:
      return null
  }
}

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const auth = await getAuthenticatedUser(req)
    if ('error' in auth) return jsonResponse({ error: auth.error }, auth.status)

    const { user, userClient } = auth
    const adminClient = getAdminClient()
    const { action, ...payload } = await req.json()

    const adminActions = ['list-users', 'create-user', 'update-user', 'get-user', 'delete-user']
    const teamActions = ['list-team', 'invite-team-member', 'update-team-member']

    if (adminActions.includes(action)) {
      const isAdmin = await requireAdmin(userClient, user.id)
      if (!isAdmin) return jsonResponse({ error: 'Forbidden: Admin access required' }, 403)
      const result = await handleAdminActions(action, payload, adminClient)
      return result || jsonResponse({ error: 'Invalid action' }, 400)
    }

    if (teamActions.includes(action)) {
      const managerClientId = await requireManager(adminClient, user.id)
      if (!managerClientId) return jsonResponse({ error: 'Forbidden: Manager access required' }, 403)
      const result = await handleTeamActions(action, payload, adminClient, managerClientId)
      return result || jsonResponse({ error: 'Invalid action' }, 400)
    }

    return jsonResponse({ error: 'Invalid action' }, 400)
  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 500)
  }
})
