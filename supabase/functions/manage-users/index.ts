import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify that the request is authenticated and user is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Create client with user's token to verify they're admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user is admin
    const { data: roles } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isAdmin = roles?.some((r) => r.role === 'admin')
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { action, ...payload } = await req.json()

    switch (action) {
      case 'list-users': {
        const { data: { users }, error } = await adminClient.auth.admin.listUsers()
        if (error) throw error

        // Get profiles and roles for all users
        const userIds = users.map((u) => u.id)
        const { data: profiles } = await adminClient
          .from('profiles')
          .select('*')
          .in('id', userIds)

        const { data: userRoles } = await adminClient
          .from('user_roles')
          .select('*')
          .in('user_id', userIds)

        const enrichedUsers = users.map((u) => ({
          ...u,
          profile: profiles?.find((p) => p.id === u.id),
          roles: userRoles?.filter((r) => r.user_id === u.id).map((r) => r.role) || [],
        }))

        return new Response(JSON.stringify({ users: enrichedUsers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'create-user': {
        const { email, password, full_name, role, client_id } = payload

        // Create user
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name },
        })
        if (createError) throw createError

        // Update profile with client_id if provided
        if (client_id) {
          await adminClient
            .from('profiles')
            .update({ client_id })
            .eq('id', newUser.user.id)
        }

        // Add role if different from default 'client'
        if (role && role !== 'client') {
          // Remove default client role
          await adminClient
            .from('user_roles')
            .delete()
            .eq('user_id', newUser.user.id)
            .eq('role', 'client')

          // Add new role
          await adminClient
            .from('user_roles')
            .insert({ user_id: newUser.user.id, role })
        }

        return new Response(JSON.stringify({ user: newUser.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'update-user': {
        const { user_id, email, full_name, role, client_id, ponto_focal, password, confirm_email } = payload

        // Update auth user
        const authUpdate: Record<string, unknown> = {}
        if (email) authUpdate.email = email
        if (password) authUpdate.password = password
        if (confirm_email === true) authUpdate.email_confirm = true

        if (Object.keys(authUpdate).length > 0) {
          const { error: authError } = await adminClient.auth.admin.updateUserById(user_id, authUpdate)
          if (authError) throw authError
        }

        // Update profile
        const profileUpdate: Record<string, unknown> = {}
        if (full_name !== undefined) profileUpdate.full_name = full_name
        if (client_id !== undefined) profileUpdate.client_id = client_id
        if (ponto_focal !== undefined) profileUpdate.ponto_focal = ponto_focal

        if (Object.keys(profileUpdate).length > 0) {
          await adminClient.from('profiles').update(profileUpdate).eq('id', user_id)
        }

        // Update role if provided
        if (role) {
          // Remove all existing roles
          await adminClient.from('user_roles').delete().eq('user_id', user_id)

          // Add new role
          await adminClient.from('user_roles').insert({ user_id, role })
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'get-user': {
        const { user_id } = payload

        const { data: { user: authUser }, error } = await adminClient.auth.admin.getUserById(user_id)
        if (error) throw error

        return new Response(JSON.stringify({ user: authUser }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'delete-user': {
        const { user_id } = payload

        const { error } = await adminClient.auth.admin.deleteUser(user_id)
        if (error) throw error

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
