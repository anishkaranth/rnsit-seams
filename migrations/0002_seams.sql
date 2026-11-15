-- SEAMS: participation, permission, attendance, and achievements.

create table if not exists profiles (
  user_id text primary key,
  full_name text not null,
  email text not null default '',
  role text not null check (role in ('student', 'mentor', 'coordinator', 'hod')),
  usn text not null default '',
  semester int,
  section text not null default '',
  phone text not null default '',
  designation text not null default '',
  employee_id text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists requests (
  id serial primary key,
  owner_user_id text not null,
  owner_name text not null,
  owner_usn text not null default '',
  semester int,
  section text not null default '',
  is_sample boolean not null default false,
  participation text not null check (participation in ('individual', 'team')),
  team_name text not null default '',
  category text not null,
  scope text not null,
  title text not null,
  organizer text not null default '',
  venue text not null default '',
  start_date date not null,
  end_date date not null,
  description text not null default '',
  permission_needed boolean not null default true,
  attendance_requested boolean not null default false,
  classes_missed text not null default '',
  status text not null,
  attendance_status text not null default 'not_requested',
  achievement_status text not null default 'none',
  achievement_title text not null default '',
  achievement_level text not null default '',
  prize text not null default '',
  rank_label text not null default '',
  mentor_note text not null default '',
  coordinator_note text not null default '',
  hod_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requests_owner_idx on requests (owner_user_id);
create index if not exists requests_status_idx on requests (status);
create index if not exists requests_section_idx on requests (section);

create table if not exists team_members (
  id serial primary key,
  request_id int not null references requests (id) on delete cascade,
  name text not null,
  usn text not null default '',
  role_in_team text not null default 'Member'
);

create index if not exists team_members_request_idx on team_members (request_id);

create table if not exists documents (
  id serial primary key,
  request_id int not null references requests (id) on delete cascade,
  uploaded_by text not null,
  doc_type text not null,
  file_name text not null,
  mime text not null,
  data_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists documents_request_idx on documents (request_id);

create table if not exists reviews (
  id serial primary key,
  request_id int not null references requests (id) on delete cascade,
  actor_user_id text not null,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists reviews_request_idx on reviews (request_id);

insert into requests (
  owner_user_id, owner_name, owner_usn, semester, section, is_sample,
  participation, team_name, category, scope, title, organizer, venue,
  start_date, end_date, description,
  permission_needed, attendance_requested, classes_missed,
  status, attendance_status, achievement_status,
  achievement_title, achievement_level, prize, rank_label,
  mentor_note, coordinator_note, hod_note
)
select
  'sample:ananya', 'Ananya Rao', '1RN23CS015', 7, 'A', true,
  'team', 'TechForge', 'technical', 'external',
  'Smart India Hackathon 2026', 'MoE Innovation Cell', 'NITK Surathkal',
  date '2026-11-06', date '2026-11-08',
  '36-hour software edition. Problem statement on campus energy analytics.',
  true, true, 'CS801 and CS802 on 6 and 7 November',
  'approved', 'granted', 'verified',
  'Winner, Software edition', 'national', 'Winner trophy and certificates', '1st',
  'Recommended. Attendance may be granted for the hackathon dates.',
  'Winner certificate and team photograph checked against the SIH portal.',
  'Approved. Enter the achievement on the November poster.'
where not exists (
  select 1 from requests where is_sample = true and title = 'Smart India Hackathon 2026'
);

insert into requests (
  owner_user_id, owner_name, owner_usn, semester, section, is_sample,
  participation, team_name, category, scope, title, organizer, venue,
  start_date, end_date, description,
  permission_needed, attendance_requested, classes_missed,
  status, attendance_status, achievement_status,
  achievement_title, achievement_level, prize, rank_label,
  mentor_note, coordinator_note, hod_note
)
select
  'sample:pranav', 'Pranav Joshi', '1RN23CS077', 7, 'A', true,
  'individual', '', 'academic', 'internal',
  'Department Project Expo', 'Dept. of CSE, RNSIT', 'CSE Seminar Hall',
  date '2026-11-05', date '2026-11-05',
  'Final-year project review open to the department. Poster and demo on grid-load forecasting.',
  true, false, '',
  'approved', 'not_requested', 'verified',
  'Best project', 'college', 'Department medal', '1st',
  'Internal event. No classes missed.',
  'Result sheet from the expo committee is in order.',
  'Recorded.'
where not exists (
  select 1 from requests where is_sample = true and title = 'Department Project Expo'
);

insert into requests (
  owner_user_id, owner_name, owner_usn, semester, section, is_sample,
  participation, team_name, category, scope, title, organizer, venue,
  start_date, end_date, description,
  permission_needed, attendance_requested, classes_missed,
  status, attendance_status, achievement_status,
  achievement_title, achievement_level, prize, rank_label,
  mentor_note, coordinator_note, hod_note
)
select
  'sample:karthik', 'Karthik Shetty', '1RN24CS042', 5, 'B', true,
  'individual', '', 'academic', 'external',
  'IEEE ICACCT 2026', 'IEEE Bangalore Section', 'RV College of Engineering',
  date '2026-11-19', date '2026-11-20',
  'Presenting a short paper on invoice-exception mining in order-to-cash processes.',
  true, true, '20 November, full day. 19 November afternoon only.',
  'pending_hod', 'recommended', 'none',
  '', '', '', '',
  'Paper acceptance mail seen. Recommend permission and attendance.',
  'Registration fee is borne by the student. Cleared for HoD.',
  ''
where not exists (
  select 1 from requests where is_sample = true and title = 'IEEE ICACCT 2026'
);

insert into requests (
  owner_user_id, owner_name, owner_usn, semester, section, is_sample,
  participation, team_name, category, scope, title, organizer, venue,
  start_date, end_date, description,
  permission_needed, attendance_requested, classes_missed,
  status, attendance_status, achievement_status,
  achievement_title, achievement_level, prize, rank_label,
  mentor_note, coordinator_note, hod_note
)
select
  'sample:meera', 'Meera Iyer', '1RN24CS061', 5, 'A', true,
  'team', 'RNSIT CSE XI', 'extracurricular', 'external',
  'VTU Central Zone Cricket', 'VTU Belagavi', 'University grounds, Bengaluru',
  date '2026-11-17', date '2026-11-18',
  'Selected for the college cricket squad. Fixtures on both days.',
  true, true, 'All classes on 17 and 18 November',
  'pending_mentor', 'pending', 'none',
  '', '', '', '',
  '', '', ''
where not exists (
  select 1 from requests where is_sample = true and title = 'VTU Central Zone Cricket'
);

insert into requests (
  owner_user_id, owner_name, owner_usn, semester, section, is_sample,
  participation, team_name, category, scope, title, organizer, venue,
  start_date, end_date, description,
  permission_needed, attendance_requested, classes_missed,
  status, attendance_status, achievement_status,
  achievement_title, achievement_level, prize, rank_label,
  mentor_note, coordinator_note, hod_note
)
select
  'sample:rohan', 'Rohan Patil', '1RN23CS088', 7, 'C', true,
  'individual', '', 'co_curricular', 'internal',
  'NSS Blood Donation Drive', 'NSS Unit, RNSIT', 'Admin block',
  date '2026-10-28', date '2026-10-28',
  'Volunteer for donor registration during the campus drive.',
  true, false, '',
  'approved', 'not_requested', 'verified',
  'Certificate of appreciation', 'college', 'NSS appreciation certificate', 'Recognition',
  'On-campus. No attendance consideration needed.',
  'NSS letter verified.',
  'Approved.'
where not exists (
  select 1 from requests where is_sample = true and title = 'NSS Blood Donation Drive'
);

insert into requests (
  owner_user_id, owner_name, owner_usn, semester, section, is_sample,
  participation, team_name, category, scope, title, organizer, venue,
  start_date, end_date, description,
  permission_needed, attendance_requested, classes_missed,
  status, attendance_status, achievement_status,
  achievement_title, achievement_level, prize, rank_label,
  mentor_note, coordinator_note, hod_note
)
select
  'sample:arjun', 'Arjun Deshpande', '1RN24CS027', 5, 'D', true,
  'team', 'PixelLane', 'technical', 'external',
  'Google Solution Challenge regional', 'Google Developer Student Clubs', 'Christ University',
  date '2026-12-01', date '2026-12-02',
  'Regional showcase for a civic-tech prototype. Team of four from 5 D.',
  true, true, '1 and 2 December',
  'changes_requested', 'pending', 'none',
  '', '', '', '',
  'The faculty invitation is not on file. Upload it and resubmit.',
  '', ''
where not exists (
  select 1 from requests where is_sample = true and title = 'Google Solution Challenge regional'
);

insert into requests (
  owner_user_id, owner_name, owner_usn, semester, section, is_sample,
  participation, team_name, category, scope, title, organizer, venue,
  start_date, end_date, description,
  permission_needed, attendance_requested, classes_missed,
  status, attendance_status, achievement_status,
  achievement_title, achievement_level, prize, rank_label,
  mentor_note, coordinator_note, hod_note
)
select
  'sample:sneha', 'Sneha Kulkarni', '1RN25CS019', 3, 'B', true,
  'individual', '', 'technical', 'external',
  'National Coding Olympiad', 'CodeCell India', 'Online, proctored',
  date '2026-11-02', date '2026-11-02',
  'National round. Sat for the full proctored paper from the department lab.',
  true, true, '2 November, periods 1 to 4',
  'approved', 'granted', 'submitted',
  'Second runner-up', 'national', 'Medal and certificate', '3rd',
  'Recommended.',
  'Cleared.',
  'Approved before the event. Achievement is now reported.'
where not exists (
  select 1 from requests where is_sample = true and title = 'National Coding Olympiad'
);

insert into requests (
  owner_user_id, owner_name, owner_usn, semester, section, is_sample,
  participation, team_name, category, scope, title, organizer, venue,
  start_date, end_date, description,
  permission_needed, attendance_requested, classes_missed,
  status, attendance_status, achievement_status,
  achievement_title, achievement_level, prize, rank_label,
  mentor_note, coordinator_note, hod_note
)
select
  'sample:divya', 'Divya Nair', '1RN23CS033', 7, 'A', true,
  'team', 'Northwind', 'technical', 'external',
  'Hackverse 2026', 'PES University', 'PES Electronic City campus',
  date '2026-11-11', date '2026-11-12',
  'Overnight product hack. Team qualified through the online qualifier.',
  true, true, '11 and 12 November',
  'pending_coordinator', 'recommended', 'none',
  '', '', '', '',
  'Qualifier mail is genuine. Recommend permission and attendance.',
  '', ''
where not exists (
  select 1 from requests where is_sample = true and title = 'Hackverse 2026'
);

insert into requests (
  owner_user_id, owner_name, owner_usn, semester, section, is_sample,
  participation, team_name, category, scope, title, organizer, venue,
  start_date, end_date, description,
  permission_needed, attendance_requested, classes_missed,
  status, attendance_status, achievement_status,
  achievement_title, achievement_level, prize, rank_label,
  mentor_note, coordinator_note, hod_note
)
select
  'sample:karthik', 'Karthik Shetty', '1RN24CS042', 5, 'B', true,
  'individual', '', 'technical', 'external',
  'HackMania overnight', 'City Tech Collective', 'Indiranagar',
  date '2026-11-14', date '2026-11-15',
  'Unsponsored overnight contest during CIE week.',
  true, true, '14 and 15 November',
  'rejected', 'denied', 'none',
  '', '', '', '',
  'Overlaps with CIE. Reapply next semester with a lighter schedule.',
  '', ''
where not exists (
  select 1 from requests where is_sample = true and title = 'HackMania overnight'
);

insert into team_members (request_id, name, usn, role_in_team)
select r.id, 'Ananya Rao', '1RN23CS015', 'Lead'
from requests r
where r.is_sample = true and r.title = 'Smart India Hackathon 2026'
  and not exists (select 1 from team_members t where t.request_id = r.id and t.usn = '1RN23CS015');

insert into team_members (request_id, name, usn, role_in_team)
select r.id, 'Vivek Sharma', '1RN23CS102', 'Member'
from requests r
where r.is_sample = true and r.title = 'Smart India Hackathon 2026'
  and not exists (select 1 from team_members t where t.request_id = r.id and t.usn = '1RN23CS102');

insert into team_members (request_id, name, usn, role_in_team)
select r.id, 'Divya Nair', '1RN23CS033', 'Member'
from requests r
where r.is_sample = true and r.title = 'Smart India Hackathon 2026'
  and not exists (select 1 from team_members t where t.request_id = r.id and t.usn = '1RN23CS033');

insert into team_members (request_id, name, usn, role_in_team)
select r.id, 'Meera Iyer', '1RN24CS061', 'Player'
from requests r
where r.is_sample = true and r.title = 'VTU Central Zone Cricket'
  and not exists (select 1 from team_members t where t.request_id = r.id and t.usn = '1RN24CS061');

insert into team_members (request_id, name, usn, role_in_team)
select r.id, 'Arjun Deshpande', '1RN24CS027', 'Lead'
from requests r
where r.is_sample = true and r.title = 'Google Solution Challenge regional'
  and not exists (select 1 from team_members t where t.request_id = r.id and t.usn = '1RN24CS027');

insert into team_members (request_id, name, usn, role_in_team)
select r.id, 'Divya Nair', '1RN23CS033', 'Lead'
from requests r
where r.is_sample = true and r.title = 'Hackverse 2026'
  and not exists (select 1 from team_members t where t.request_id = r.id and t.usn = '1RN23CS033');

insert into team_members (request_id, name, usn, role_in_team)
select r.id, 'Ananya Rao', '1RN23CS015', 'Member'
from requests r
where r.is_sample = true and r.title = 'Hackverse 2026'
  and not exists (select 1 from team_members t where t.request_id = r.id and t.usn = '1RN23CS015');

insert into reviews (request_id, actor_user_id, actor_name, actor_role, action, note)
select r.id, 'sample:mentor-a', 'Prof. Latha Menon', 'mentor', 'recommend',
  'Recommended. Attendance may be granted for the hackathon dates.'
from requests r
where r.is_sample = true and r.title = 'Smart India Hackathon 2026'
  and not exists (select 1 from reviews v where v.request_id = r.id and v.action = 'recommend');

insert into reviews (request_id, actor_user_id, actor_name, actor_role, action, note)
select r.id, 'sample:coord', 'Prof. Ramesh Bhat', 'coordinator', 'clear',
  'Winner certificate and team photograph checked against the SIH portal.'
from requests r
where r.is_sample = true and r.title = 'Smart India Hackathon 2026'
  and not exists (select 1 from reviews v where v.request_id = r.id and v.action = 'clear');

insert into reviews (request_id, actor_user_id, actor_name, actor_role, action, note)
select r.id, 'sample:hod', 'Dr. Kavitha Prasad', 'hod', 'approve',
  'Approved. Enter the achievement on the November poster.'
from requests r
where r.is_sample = true and r.title = 'Smart India Hackathon 2026'
  and not exists (select 1 from reviews v where v.request_id = r.id and v.action = 'approve');

insert into reviews (request_id, actor_user_id, actor_name, actor_role, action, note)
select r.id, 'sample:mentor-b', 'Prof. Suresh Kulkarni', 'mentor', 'recommend',
  'Paper acceptance mail seen. Recommend permission and attendance.'
from requests r
where r.is_sample = true and r.title = 'IEEE ICACCT 2026'
  and not exists (select 1 from reviews v where v.request_id = r.id and v.action = 'recommend');

insert into reviews (request_id, actor_user_id, actor_name, actor_role, action, note)
select r.id, 'sample:coord', 'Prof. Ramesh Bhat', 'coordinator', 'clear',
  'Registration fee is borne by the student. Cleared for HoD.'
from requests r
where r.is_sample = true and r.title = 'IEEE ICACCT 2026'
  and not exists (select 1 from reviews v where v.request_id = r.id and v.action = 'clear');

insert into reviews (request_id, actor_user_id, actor_name, actor_role, action, note)
select r.id, 'sample:mentor-d', 'Prof. Geetha Rao', 'mentor', 'changes',
  'The faculty invitation is not on file. Upload it and resubmit.'
from requests r
where r.is_sample = true and r.title = 'Google Solution Challenge regional'
  and not exists (select 1 from reviews v where v.request_id = r.id and v.action = 'changes');

insert into reviews (request_id, actor_user_id, actor_name, actor_role, action, note)
select r.id, 'sample:mentor-a', 'Prof. Latha Menon', 'mentor', 'recommend',
  'Qualifier mail is genuine. Recommend permission and attendance.'
from requests r
where r.is_sample = true and r.title = 'Hackverse 2026'
  and not exists (select 1 from reviews v where v.request_id = r.id and v.action = 'recommend');

insert into reviews (request_id, actor_user_id, actor_name, actor_role, action, note)
select r.id, 'sample:mentor-b', 'Prof. Suresh Kulkarni', 'mentor', 'reject',
  'Overlaps with CIE. Reapply next semester with a lighter schedule.'
from requests r
where r.is_sample = true and r.title = 'HackMania overnight'
  and not exists (select 1 from reviews v where v.request_id = r.id and v.action = 'reject');
