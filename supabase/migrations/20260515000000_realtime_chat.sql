create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'course',
  course_id text unique,
  title text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists conversation_members_user_id_idx
  on public.conversation_members(user_id);

create index if not exists messages_conversation_created_at_idx
  on public.messages(conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "members can read own conversations" on public.conversations;
create policy "members can read own conversations"
  on public.conversations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = conversations.id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists "members can read own memberships" on public.conversation_members;
create policy "members can read own memberships"
  on public.conversation_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = conversation_members.conversation_id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists "members can read conversation messages" on public.messages;
create policy "members can read conversation messages"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = (select auth.uid())
    )
  );

drop policy if exists "members can insert conversation messages" on public.messages;
create policy "members can insert conversation messages"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1
      from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id
        and cm.user_id = (select auth.uid())
    )
  );

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
