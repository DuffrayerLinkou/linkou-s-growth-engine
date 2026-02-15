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

      // Restrict user_type to operator or manager only
      const safeUserType = user_type === 'manager' ? 'manager' : 'operator'

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email as string,
        password: password as string,
        email_confirm: true,
        user_metadata: { full_name: full_name || '' },
      })
      if (createError) throw createError

      // Update profile with client_id, user_type, ponto_focal — forced to manager's client
      await adminClient.from('profiles').update({
        client_id: managerClientId,
        user_type: safeUserType,
        ponto_focal: ponto_focal === true,
      }).eq('id', newUser.user.id)

      // Role is always 'client' — the default from handle_new_user trigger
      return jsonResponse({ user: newUser.user })
    }

    case 'update-team-member': {
      const { user_id, full_name, user_type, ponto_focal } = payload as Record<string, unknown>

      if (!user_id) return jsonResponse({ error: 'user_id is required' }, 400)

      // Verify target belongs to same client
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
