-- ============================================================
-- Oji Brain — Database Schema + RLS (Row Level Security)
-- شغّل الملف ده في Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Extension للـ UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. profiles — معلومات المستخدمين (extension لجدول auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  brand_voice text,        -- نبرة البراند المفضلة (محفوظة على مستوى اليوزر)
  brand_name text,         -- اسم البراند الافتراضي
  brand_colors jsonb default '[]'::jsonb,  -- ألوان البراند ["#7c3aed", "#ec4899", ...]
  brand_logo_url text,     -- لينك اللوجو
  onboarded_at timestamptz, -- لما خلص الـ onboarding
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- لو الجدول موجود قبل كده، ضيف الـ columns الجديدة
alter table public.profiles add column if not exists brand_name text;
alter table public.profiles add column if not exists brand_colors jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists brand_logo_url text;
alter table public.profiles add column if not exists onboarded_at timestamptz;

alter table public.profiles enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Trigger يخلق profile تلقائياً لما يوزر يسجل
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. projects — المشاريع
-- ============================================================
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  brief text,                  -- بريف المشروع
  business_type text default 'general',  -- نوع البزنس (من templates.ts)
  cover_color text default 'violet',
  share_token text unique,     -- لو متشارك، التوكين بتاع الرابط
  is_shared boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_share_token_idx on public.projects(share_token) where share_token is not null;

alter table public.projects enable row level security;

drop policy if exists "users see own projects" on public.projects;
create policy "users see own projects" on public.projects
  for select using (auth.uid() = user_id);

drop policy if exists "shared projects readable" on public.projects;
create policy "shared projects readable" on public.projects
  for select using (is_shared = true and share_token is not null);

drop policy if exists "users create own projects" on public.projects;
create policy "users create own projects" on public.projects
  for insert with check (auth.uid() = user_id);

drop policy if exists "users update own projects" on public.projects;
create policy "users update own projects" on public.projects
  for update using (auth.uid() = user_id);

drop policy if exists "users delete own projects" on public.projects;
create policy "users delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 3. conversations — كل وضع AI له محادثة منفصلة جوه المشروع
-- ============================================================
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'chat',  -- 'chat' | 'strategy' | 'design' | 'video'
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists conversations_project_id_idx on public.conversations(project_id);
create index if not exists conversations_user_id_idx on public.conversations(user_id);

alter table public.conversations enable row level security;

drop policy if exists "users see own conversations" on public.conversations;
create policy "users see own conversations" on public.conversations
  for select using (auth.uid() = user_id);

drop policy if exists "shared project conversations readable" on public.conversations;
create policy "shared project conversations readable" on public.conversations
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = conversations.project_id
        and p.is_shared = true
    )
  );

drop policy if exists "users create own conversations" on public.conversations;
create policy "users create own conversations" on public.conversations
  for insert with check (auth.uid() = user_id);

drop policy if exists "users update own conversations" on public.conversations;
create policy "users update own conversations" on public.conversations
  for update using (auth.uid() = user_id);

drop policy if exists "users delete own conversations" on public.conversations;
create policy "users delete own conversations" on public.conversations
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 4. messages — رسائل المحادثة
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  attachments jsonb default '[]'::jsonb,  -- صور أو ملفات مرفقة
  created_at timestamptz default now()
);

create index if not exists messages_conversation_id_idx on public.messages(conversation_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

alter table public.messages enable row level security;

drop policy if exists "users see own messages" on public.messages;
create policy "users see own messages" on public.messages
  for select using (auth.uid() = user_id);

drop policy if exists "shared project messages readable" on public.messages;
create policy "shared project messages readable" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      join public.projects p on p.id = c.project_id
      where c.id = messages.conversation_id and p.is_shared = true
    )
  );

drop policy if exists "users create own messages" on public.messages;
create policy "users create own messages" on public.messages
  for insert with check (auth.uid() = user_id);

drop policy if exists "users delete own messages" on public.messages;
create policy "users delete own messages" on public.messages
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 5. deliverables — مخرجات محفوظة (استراتيجية / برومبت / سكريبت)
-- ============================================================
create table if not exists public.deliverables (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,         -- 'strategy' | 'design_prompt' | 'video_prompt' | 'script' | 'note'
  title text not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists deliverables_project_id_idx on public.deliverables(project_id);
create index if not exists deliverables_user_id_idx on public.deliverables(user_id);

alter table public.deliverables enable row level security;

drop policy if exists "users see own deliverables" on public.deliverables;
create policy "users see own deliverables" on public.deliverables
  for select using (auth.uid() = user_id);

drop policy if exists "shared project deliverables readable" on public.deliverables;
create policy "shared project deliverables readable" on public.deliverables
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = deliverables.project_id and p.is_shared = true
    )
  );

drop policy if exists "users create own deliverables" on public.deliverables;
create policy "users create own deliverables" on public.deliverables
  for insert with check (auth.uid() = user_id);

drop policy if exists "users update own deliverables" on public.deliverables;
create policy "users update own deliverables" on public.deliverables
  for update using (auth.uid() = user_id);

drop policy if exists "users delete own deliverables" on public.deliverables;
create policy "users delete own deliverables" on public.deliverables
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 6. Storage bucket للصور (product photos, refs)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;

drop policy if exists "users upload own files" on storage.objects;
create policy "users upload own files" on storage.objects
  for insert with check (
    bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users read own files" on storage.objects;
create policy "users read own files" on storage.objects
  for select using (
    bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "users delete own files" on storage.objects;
create policy "users delete own files" on storage.objects
  for delete using (
    bucket_id = 'uploads' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- تم ✅
-- ============================================================
