-- Create app_role enum
create type public.app_role as enum ('admin', 'account_manager', 'client');

-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'client',
  unique (user_id, role)
);

-- Create leads table
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  segment text,
  investment text,
  objective text,
  status text default 'new',
  source text default 'landing_page',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create has_role security definer function
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- Create handle_new_user trigger function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  
  insert into public.user_roles (user_id, role)
  values (new.id, 'client');
  
  return new;
end;
$$;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_leads_updated_at
  before update on public.leads
  for each row execute function public.update_updated_at_column();

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.leads enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.has_role(auth.uid(), 'admin'));

-- User Roles policies
create policy "Users can view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can manage all roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'));

-- Leads policies
create policy "Anyone can insert leads"
  on public.leads for insert
  with check (true);

create policy "Admins can view all leads"
  on public.leads for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update leads"
  on public.leads for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Account managers can view leads"
  on public.leads for select
  using (public.has_role(auth.uid(), 'account_manager'));

create policy "Account managers can update leads"
  on public.leads for update
  using (public.has_role(auth.uid(), 'account_manager'));