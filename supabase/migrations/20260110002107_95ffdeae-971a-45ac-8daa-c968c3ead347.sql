-- Create clients table
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text,
  segment text,
  website text,
  logo_url text,
  notes text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create client_users junction table (links users to clients for multi-tenant access)
create table public.client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'viewer', -- viewer, editor, owner
  created_at timestamptz default now(),
  unique (client_id, user_id)
);

-- Create projects table
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  description text,
  status text default 'planning', -- planning, active, paused, completed
  start_date date,
  end_date date,
  budget numeric(12,2),
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create experiments table
create table public.experiments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  hypothesis text,
  description text,
  status text default 'draft', -- draft, running, completed, failed
  start_date date,
  end_date date,
  results text,
  metrics jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create learnings table
create table public.learnings (
  id uuid primary key default gen_random_uuid(),
  experiment_id uuid references public.experiments(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade not null,
  title text not null,
  description text,
  impact text, -- high, medium, low
  category text, -- audience, creative, channel, offer, etc.
  tags text[],
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create tasks table
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade not null,
  title text not null,
  description text,
  status text default 'todo', -- todo, in_progress, review, done
  priority text default 'medium', -- low, medium, high, urgent
  due_date date,
  assigned_to uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create files table (metadata only, actual files in Supabase Storage)
create table public.files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  mime_type text,
  description text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Create audit_logs table
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  action text not null, -- create, update, delete, login, etc.
  entity_type text not null, -- project, task, file, etc.
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Add updated_at triggers for new tables
create trigger update_clients_updated_at
  before update on public.clients
  for each row execute function public.update_updated_at_column();

create trigger update_projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at_column();

create trigger update_experiments_updated_at
  before update on public.experiments
  for each row execute function public.update_updated_at_column();

create trigger update_learnings_updated_at
  before update on public.learnings
  for each row execute function public.update_updated_at_column();

create trigger update_tasks_updated_at
  before update on public.tasks
  for each row execute function public.update_updated_at_column();

-- Create helper function to check if user has access to a client
create or replace function public.user_has_client_access(_user_id uuid, _client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.client_users
    where user_id = _user_id and client_id = _client_id
  )
  or public.has_role(_user_id, 'admin')
  or public.has_role(_user_id, 'account_manager')
$$;

-- Enable RLS on all tables
alter table public.clients enable row level security;
alter table public.client_users enable row level security;
alter table public.projects enable row level security;
alter table public.experiments enable row level security;
alter table public.learnings enable row level security;
alter table public.tasks enable row level security;
alter table public.files enable row level security;
alter table public.audit_logs enable row level security;

-- CLIENTS policies
create policy "Admins can manage all clients"
  on public.clients for all
  using (public.has_role(auth.uid(), 'admin'));

create policy "Account managers can manage all clients"
  on public.clients for all
  using (public.has_role(auth.uid(), 'account_manager'));

create policy "Users can view their linked clients"
  on public.clients for select
  using (public.user_has_client_access(auth.uid(), id));

-- CLIENT_USERS policies
create policy "Admins can manage all client_users"
  on public.client_users for all
  using (public.has_role(auth.uid(), 'admin'));

create policy "Account managers can manage all client_users"
  on public.client_users for all
  using (public.has_role(auth.uid(), 'account_manager'));

create policy "Users can view their own client links"
  on public.client_users for select
  using (user_id = auth.uid());

-- PROJECTS policies
create policy "Admins can manage all projects"
  on public.projects for all
  using (public.has_role(auth.uid(), 'admin'));

create policy "Account managers can manage all projects"
  on public.projects for all
  using (public.has_role(auth.uid(), 'account_manager'));

create policy "Users can view their client projects"
  on public.projects for select
  using (public.user_has_client_access(auth.uid(), client_id));

-- EXPERIMENTS policies
create policy "Admins can manage all experiments"
  on public.experiments for all
  using (public.has_role(auth.uid(), 'admin'));

create policy "Account managers can manage all experiments"
  on public.experiments for all
  using (public.has_role(auth.uid(), 'account_manager'));

create policy "Users can view their client experiments"
  on public.experiments for select
  using (public.user_has_client_access(auth.uid(), client_id));

-- LEARNINGS policies
create policy "Admins can manage all learnings"
  on public.learnings for all
  using (public.has_role(auth.uid(), 'admin'));

create policy "Account managers can manage all learnings"
  on public.learnings for all
  using (public.has_role(auth.uid(), 'account_manager'));

create policy "Users can view their client learnings"
  on public.learnings for select
  using (public.user_has_client_access(auth.uid(), client_id));

-- TASKS policies
create policy "Admins can manage all tasks"
  on public.tasks for all
  using (public.has_role(auth.uid(), 'admin'));

create policy "Account managers can manage all tasks"
  on public.tasks for all
  using (public.has_role(auth.uid(), 'account_manager'));

create policy "Users can view their client tasks"
  on public.tasks for select
  using (public.user_has_client_access(auth.uid(), client_id));

-- FILES policies
create policy "Admins can manage all files"
  on public.files for all
  using (public.has_role(auth.uid(), 'admin'));

create policy "Account managers can manage all files"
  on public.files for all
  using (public.has_role(auth.uid(), 'account_manager'));

create policy "Users can view their client files"
  on public.files for select
  using (public.user_has_client_access(auth.uid(), client_id));

-- AUDIT_LOGS policies (read-only for admins, insert for authenticated)
create policy "Admins can view all audit logs"
  on public.audit_logs for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Account managers can view client audit logs"
  on public.audit_logs for select
  using (
    public.has_role(auth.uid(), 'account_manager')
    or (client_id is not null and public.user_has_client_access(auth.uid(), client_id))
  );

create policy "Authenticated users can insert audit logs"
  on public.audit_logs for insert
  with check (auth.uid() is not null);

-- Create indexes for better performance
create index idx_client_users_user_id on public.client_users(user_id);
create index idx_client_users_client_id on public.client_users(client_id);
create index idx_projects_client_id on public.projects(client_id);
create index idx_experiments_client_id on public.experiments(client_id);
create index idx_experiments_project_id on public.experiments(project_id);
create index idx_learnings_client_id on public.learnings(client_id);
create index idx_tasks_client_id on public.tasks(client_id);
create index idx_tasks_project_id on public.tasks(project_id);
create index idx_tasks_assigned_to on public.tasks(assigned_to);
create index idx_files_client_id on public.files(client_id);
create index idx_audit_logs_client_id on public.audit_logs(client_id);
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);