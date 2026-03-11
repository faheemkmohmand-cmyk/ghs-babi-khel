-- =============================================
-- GHS BABI KHEL — COMPLETE DATABASE SETUP
-- Paste this ENTIRE file into Supabase SQL Editor
-- and click RUN. Do it only ONCE.
-- =============================================

create extension if not exists "uuid-ossp";

-- PROFILES (auto-created on signup)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text not null default '',
  role text not null default 'student' check (role in ('admin','student','parent','teacher')),
  avatar_url text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SCHOOL SETTINGS
create table if not exists public.school_settings (
  id uuid default uuid_generate_v4() primary key,
  school_name text default 'Government High School Babi Khel',
  short_name text default 'GHS Babi Khel',
  principal_name text default '',
  established_year text default '1989',
  phone text default '',
  email text default '',
  address text default 'Babi Khel, Khyber Pakhtunkhwa, Pakistan',
  logo_url text,
  total_students integer default 450,
  total_teachers integer default 18,
  mission text default 'To provide quality education with Islamic values, developing responsible citizens.',
  vision text default 'A school where every student reaches their full potential.',
  updated_at timestamptz default now()
);
insert into public.school_settings (id) values (uuid_generate_v4());

-- STUDENTS
create table if not exists public.students (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  student_id text unique not null,
  full_name text not null,
  father_name text default '',
  class text not null,
  section text not null default 'A',
  roll_no text not null,
  date_of_birth date,
  gender text default 'Male' check (gender in ('Male','Female')),
  phone text, address text, admitted_year text,
  status text default 'active' check (status in ('active','inactive','transferred')),
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TEACHERS
create table if not exists public.teachers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  subject text not null,
  department text default 'General',
  role text, qualification text,
  experience_years integer default 0,
  phone text, email text, joined_year text,
  status text default 'active' check (status in ('active','on-leave','retired')),
  photo_url text, bio text,
  created_at timestamptz default now()
);

-- TIMETABLE
create table if not exists public.timetable (
  id uuid default uuid_generate_v4() primary key,
  class text not null, section text not null,
  day text not null, period integer not null,
  subject text not null,
  teacher_id uuid references public.teachers(id) on delete set null,
  start_time text not null, end_time text not null,
  created_at timestamptz default now(),
  unique(class, section, day, period)
);

-- ATTENDANCE
create table if not exists public.attendance (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  date date not null,
  status text not null default 'present' check (status in ('present','absent','late','leave')),
  class text not null, section text not null,
  marked_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(student_id, date)
);

-- EXAMS
create table if not exists public.exams (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null check (type in ('monthly','halfyearly','board','annual')),
  classes text[] not null,
  start_date date not null, end_date date not null,
  status text default 'upcoming' check (status in ('upcoming','ongoing','completed')),
  venue text default 'Examination Hall',
  time_slot text default '8:00 AM - 11:00 AM',
  schedule jsonb default '[]',
  created_at timestamptz default now()
);

-- RESULTS
create table if not exists public.results (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.students(id) on delete cascade,
  student_name text not null,
  class text not null, section text not null, roll_no text,
  exam_name text not null, year text not null,
  subjects jsonb not null default '[]',
  total_marks integer not null, obtained_marks integer not null,
  percentage numeric(5,2) not null,
  grade text not null, result text not null check (result in ('Pass','Fail')),
  position integer,
  created_at timestamptz default now()
);

-- NOTICES
create table if not exists public.notices (
  id uuid default uuid_generate_v4() primary key,
  title text not null, content text not null,
  type text not null check (type in ('exam','holiday','event','general')),
  date date not null,
  posted_by text default 'School Admin',
  important boolean default false,
  image_url text,
  audience text default 'all' check (audience in ('all','students','parents','teachers')),
  published boolean default true,
  created_at timestamptz default now()
);

-- NEWS
create table if not exists public.news (
  id uuid default uuid_generate_v4() primary key,
  title text not null, content text not null,
  category text not null, image_url text,
  date date not null,
  author text default 'School Administration',
  featured boolean default false,
  published boolean default true,
  created_at timestamptz default now()
);

-- BOOKS
create table if not exists public.books (
  id uuid default uuid_generate_v4() primary key,
  title text not null, author text not null,
  subject text not null, class text not null,
  type text default 'textbook' check (type in ('textbook','reference','guide')),
  isbn text, total_copies integer default 1,
  available_copies integer default 1,
  cover_url text, description text, added_year text,
  created_at timestamptz default now()
);

-- BOOK ISSUES
create table if not exists public.book_issues (
  id uuid default uuid_generate_v4() primary key,
  book_id uuid references public.books(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  issued_date date not null, due_date date not null,
  returned_date date,
  status text default 'issued' check (status in ('issued','returned','overdue')),
  created_at timestamptz default now()
);

-- ACHIEVEMENTS
create table if not exists public.achievements (
  id uuid default uuid_generate_v4() primary key,
  title text not null, description text not null,
  category text not null check (category in ('academic','sports','science','extracurricular','environment')),
  year text not null, recipient text not null, awarded_by text not null,
  icon text default '🏆', image_url text,
  featured boolean default false,
  created_at timestamptz default now()
);

-- GALLERY
create table if not exists public.gallery_albums (
  id uuid default uuid_generate_v4() primary key,
  title text not null, description text,
  cover_url text, date date not null,
  category text default 'general',
  published boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.gallery_photos (
  id uuid default uuid_generate_v4() primary key,
  album_id uuid references public.gallery_albums(id) on delete cascade not null,
  url text not null, caption text,
  photo_order integer default 0,
  created_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ──
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.timetable enable row level security;
alter table public.attendance enable row level security;
alter table public.exams enable row level security;
alter table public.results enable row level security;
alter table public.notices enable row level security;
alter table public.news enable row level security;
alter table public.books enable row level security;
alter table public.book_issues enable row level security;
alter table public.achievements enable row level security;
alter table public.gallery_albums enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.school_settings enable row level security;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- Profiles
create policy "profiles_select" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update" on public.profiles for update using (auth.uid() = id or public.is_admin());

-- Public readable tables
create policy "students_read"  on public.students  for select using (true);
create policy "teachers_read"  on public.teachers  for select using (true);
create policy "timetable_read" on public.timetable for select using (true);
create policy "exams_read"     on public.exams     for select using (true);
create policy "results_read"   on public.results   for select using (true);
create policy "books_read"     on public.books     for select using (true);
create policy "achievements_read" on public.achievements for select using (true);
create policy "gallery_albums_read" on public.gallery_albums for select using (published=true or public.is_admin());
create policy "gallery_photos_read" on public.gallery_photos for select using (true);
create policy "settings_read"  on public.school_settings for select using (true);
create policy "notices_read"   on public.notices for select using (published=true or public.is_admin());
create policy "news_read"      on public.news    for select using (published=true or public.is_admin());

-- Auth-required tables
create policy "attendance_read" on public.attendance for select using (auth.uid() is not null);
create policy "book_issues_read" on public.book_issues for select using (auth.uid() is not null);

-- Admin-only write
create policy "students_admin"  on public.students  for all using (public.is_admin());
create policy "teachers_admin"  on public.teachers  for all using (public.is_admin());
create policy "timetable_admin" on public.timetable for all using (public.is_admin());
create policy "attendance_admin" on public.attendance for all using (public.is_admin());
create policy "exams_admin"     on public.exams     for all using (public.is_admin());
create policy "results_admin"   on public.results   for all using (public.is_admin());
create policy "notices_admin"   on public.notices   for all using (public.is_admin());
create policy "news_admin"      on public.news      for all using (public.is_admin());
create policy "books_admin"     on public.books     for all using (public.is_admin());
create policy "book_issues_admin" on public.book_issues for all using (public.is_admin());
create policy "achievements_admin" on public.achievements for all using (public.is_admin());
create policy "gallery_admin"   on public.gallery_albums for all using (public.is_admin());
create policy "gallery_photos_admin" on public.gallery_photos for all using (public.is_admin());
create policy "settings_admin"  on public.school_settings for all using (public.is_admin());

-- ── STORAGE ──
insert into storage.buckets (id, name, public) values ('avatars',   'avatars',   true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('gallery',   'gallery',   true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('documents', 'documents', true) on conflict do nothing;

create policy "storage_public_read"  on storage.objects for select using (true);
create policy "storage_auth_upload"  on storage.objects for insert with check (auth.uid() is not null);
create policy "storage_admin_delete" on storage.objects for delete using (public.is_admin());

-- ── INDEXES ──
create index if not exists idx_students_class   on public.students(class, section);
create index if not exists idx_attendance_date  on public.attendance(date, class);
create index if not exists idx_attendance_stud  on public.attendance(student_id);
create index if not exists idx_results_student  on public.results(student_id);
create index if not exists idx_notices_date     on public.notices(date desc);
create index if not exists idx_news_date        on public.news(date desc);

-- ── DONE! All tables, security and storage are ready. ──
