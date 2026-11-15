import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  ACHIEVEMENTS,
  ATTENDANCE,
  CATEGORIES,
  DOC_TYPES,
  LEVELS,
  ROLES,
  SCOPES,
  STATUSES,
  istMonth,
  refCode,
  type AchievementStatus,
  type AttendanceStatus,
  type Category,
  type DocType,
  type Participation,
  type Role,
  type Scope,
  type Status,
} from "@/lib/seams/labels";

export type Profile = {
  userId: string;
  fullName: string;
  email: string;
  role: Role;
  usn: string;
  semester: number | null;
  section: string;
  phone: string;
  designation: string;
  employeeId: string;
};

export type EventRequest = {
  id: number;
  ref: string;
  ownerUserId: string;
  ownerName: string;
  ownerUsn: string;
  semester: number | null;
  section: string;
  sample: boolean;
  participation: Participation;
  teamName: string;
  category: Category;
  scope: Scope;
  title: string;
  organizer: string;
  venue: string;
  startDate: string;
  endDate: string;
  description: string;
  permissionNeeded: boolean;
  attendanceRequested: boolean;
  classesMissed: string;
  status: Status;
  attendanceStatus: AttendanceStatus;
  achievementStatus: AchievementStatus;
  achievementTitle: string;
  achievementLevel: string;
  prize: string;
  rankLabel: string;
  mentorNote: string;
  coordinatorNote: string;
  hodNote: string;
  documentCount: number;
  memberCount: number;
  updatedAt: string;
  createdAt: string;
};

export type Member = { id: number; name: string; usn: string; roleInTeam: string };
export type Doc = {
  id: number;
  docType: string;
  fileName: string;
  mime: string;
  dataUrl: string;
  createdAt: string;
};
export type Review = {
  id: number;
  actorName: string;
  actorRole: string;
  action: string;
  note: string;
  createdAt: string;
};

export type Stats = {
  awaiting: number;
  pipeline: number;
  approved: number;
  verifiedMonth: number;
  attendanceOpen: number;
  byCategory: { category: string; count: number }[];
};

export type Activity = {
  id: number;
  requestId: number;
  title: string;
  action: string;
  actorName: string;
  createdAt: string;
};

type Row = Record<string, unknown>;

const CODES: Record<Exclude<Role, "student">, string> = {
  mentor: "RNS-MENTOR",
  coordinator: "RNS-COORD",
  hod: "RNS-HOD",
};

const MAX_DOC = 900_000;

function fail(error: string) {
  return { ok: false as const, error };
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (v == null) return "";
  return String(v);
}

function day(v: unknown): string {
  const s = str(v);
  return s.slice(0, 10);
}

function bool(v: unknown): boolean {
  return v === true || v === "t" || v === "true" || v === 1;
}

function isRole(v: string): v is Role {
  return (ROLES as readonly string[]).includes(v);
}
function isStatus(v: string): v is Status {
  return (STATUSES as readonly string[]).includes(v);
}
function isCategory(v: string): v is Category {
  return (CATEGORIES as readonly string[]).includes(v);
}
function isScope(v: string): v is Scope {
  return (SCOPES as readonly string[]).includes(v);
}
function isAttendance(v: string): v is AttendanceStatus {
  return (ATTENDANCE as readonly string[]).includes(v);
}
function isAchievement(v: string): v is AchievementStatus {
  return (ACHIEVEMENTS as readonly string[]).includes(v);
}

function mapProfile(r: Row): Profile {
  const role = str(r.role);
  return {
    userId: str(r.user_id),
    fullName: str(r.full_name),
    email: str(r.email),
    role: isRole(role) ? role : "student",
    usn: str(r.usn),
    semester: r.semester == null ? null : num(r.semester),
    section: str(r.section),
    phone: str(r.phone),
    designation: str(r.designation),
    employeeId: str(r.employee_id),
  };
}

function mapRequest(r: Row): EventRequest {
  const status = str(r.status);
  const category = str(r.category);
  const scope = str(r.scope);
  const attendance = str(r.attendance_status);
  const achievement = str(r.achievement_status);
  const participation = str(r.participation) === "team" ? "team" : "individual";
  const startDate = day(r.start_date);
  const id = num(r.id);
  return {
    id,
    ref: refCode(id, startDate),
    ownerUserId: str(r.owner_user_id),
    ownerName: str(r.owner_name),
    ownerUsn: str(r.owner_usn),
    semester: r.semester == null ? null : num(r.semester),
    section: str(r.section),
    sample: bool(r.is_sample),
    participation,
    teamName: str(r.team_name),
    category: isCategory(category) ? category : "technical",
    scope: isScope(scope) ? scope : "external",
    title: str(r.title),
    organizer: str(r.organizer),
    venue: str(r.venue),
    startDate,
    endDate: day(r.end_date),
    description: str(r.description),
    permissionNeeded: bool(r.permission_needed),
    attendanceRequested: bool(r.attendance_requested),
    classesMissed: str(r.classes_missed),
    status: isStatus(status) ? status : "draft",
    attendanceStatus: isAttendance(attendance) ? attendance : "not_requested",
    achievementStatus: isAchievement(achievement) ? achievement : "none",
    achievementTitle: str(r.achievement_title),
    achievementLevel: str(r.achievement_level),
    prize: str(r.prize),
    rankLabel: str(r.rank_label),
    mentorNote: str(r.mentor_note),
    coordinatorNote: str(r.coordinator_note),
    hodNote: str(r.hod_note),
    documentCount: num(r.document_count),
    memberCount: num(r.member_count),
    updatedAt: str(r.updated_at),
    createdAt: str(r.created_at),
  };
}

async function loadProfile(sql: Sql, userId: string): Promise<Profile | null> {
  const rows = await sql<Row>`select * from profiles where user_id = ${userId}`;
  return rows[0] ? mapProfile(rows[0]) : null;
}

function seesAll(role: Role): boolean {
  return role === "coordinator" || role === "hod";
}

function canRead(profile: Profile, row: EventRequest): boolean {
  if (row.ownerUserId === profile.userId) return true;
  if (profile.role === "student") return false;
  if (row.status === "draft") return false;
  if (profile.role === "mentor") return row.section.toUpperCase() === profile.section.toUpperCase();
  return seesAll(profile.role);
}

async function loadRequest(sql: Sql, id: number): Promise<EventRequest | null> {
  const rows = await sql<Row>`
    select r.*,
      (select count(*)::int from documents d where d.request_id = r.id) as document_count,
      (select count(*)::int from team_members t where t.request_id = r.id) as member_count
    from requests r
    where r.id = ${id}
  `;
  return rows[0] ? mapRequest(rows[0]) : null;
}

export const getDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const users = await sql<Row>`select name, email from "user" where id = ${context.userId}`;
    const profile = await loadProfile(sql, context.userId);
    const month = istMonth();
    let stats: Stats | null = null;
    let recent: Activity[] = [];
    if (profile) {
      const section = profile.section.toUpperCase();
      const mine = profile.role === "student";
      const mentor = profile.role === "mentor";
      const awaitingStatus =
        profile.role === "student"
          ? "changes_requested"
          : profile.role === "mentor"
            ? "pending_mentor"
            : profile.role === "coordinator"
              ? "pending_coordinator"
              : "pending_hod";
      const countAchievements = profile.role === "coordinator" || profile.role === "hod";
      const base = await sql<Row>`
        select
          coalesce(sum(case
            when ${countAchievements} and (status = ${awaitingStatus} or achievement_status = 'submitted') then 1
            when not ${countAchievements} and status = ${awaitingStatus} then 1
            else 0
          end), 0)::int as awaiting,
          coalesce(sum(case when status like 'pending%' then 1 else 0 end), 0)::int as pipeline,
          coalesce(sum(case when status = 'approved' then 1 else 0 end), 0)::int as approved,
          coalesce(sum(case when achievement_status = 'verified' and to_char(end_date, 'YYYY-MM') = ${month} then 1 else 0 end), 0)::int as verified_month,
          coalesce(sum(case when attendance_status in ('pending', 'recommended') then 1 else 0 end), 0)::int as attendance_open
        from requests
        where (
          (${mine} and owner_user_id = ${context.userId})
          or (not ${mine} and status <> 'draft' and (not ${mentor} or upper(section) = ${section}))
        )
      `;
      const cats = await sql<Row>`
        select category, count(*)::int as count
        from requests
        where (
          (${mine} and owner_user_id = ${context.userId} and status <> 'draft')
          or (not ${mine} and status <> 'draft' and (not ${mentor} or upper(section) = ${section}))
        )
        group by category
        order by category
      `;
      const b = base[0] ?? {};
      stats = {
        awaiting: num(b.awaiting),
        pipeline: num(b.pipeline),
        approved: num(b.approved),
        verifiedMonth: num(b.verified_month),
        attendanceOpen: num(b.attendance_open),
        byCategory: cats.map((c) => ({ category: str(c.category), count: num(c.count) })),
      };
      const acts = await sql<Row>`
        select v.id, v.request_id, v.action, v.actor_name, v.created_at, r.title, r.section, r.owner_user_id, r.status
        from reviews v
        join requests r on r.id = v.request_id
        where (
          (${mine} and r.owner_user_id = ${context.userId})
          or (not ${mine} and r.status <> 'draft' and (not ${mentor} or upper(r.section) = ${section}))
        )
        order by v.created_at desc
        limit 6
      `;
      recent = acts.map((a) => ({
        id: num(a.id),
        requestId: num(a.request_id),
        title: str(a.title),
        action: str(a.action),
        actorName: str(a.actor_name),
        createdAt: str(a.created_at),
      }));
    }
    return {
      ok: true as const,
      authName: str(users[0]?.name),
      authEmail: str(users[0]?.email),
      profile,
      stats,
      recent,
      month,
    };
  });

type ProfileInput = {
  fullName: string;
  role: string;
  accessCode: string;
  usn: string;
  semester: number | null;
  section: string;
  phone: string;
  designation: string;
  employeeId: string;
};

export const saveProfile = createServerFn({ method: "POST" })
  .validator((input: ProfileInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const fullName = data.fullName.trim().replace(/\s+/g, " ");
    if (fullName.length < 3 || fullName.length > 80) return fail("Enter the name as it should appear on the record.");
    if (!isRole(data.role)) return fail("Choose a role.");
    const role = data.role;
    const section = data.section.trim().toUpperCase().slice(0, 2);
    const usn = data.usn.trim().toUpperCase();
    const semester = data.semester == null || Number.isNaN(Number(data.semester)) ? null : Number(data.semester);
    const phone = data.phone.trim().slice(0, 20);
    const designation = data.designation.trim().slice(0, 80);
    const employeeId = data.employeeId.trim().slice(0, 30);
    if (semester != null && (semester < 1 || semester > 8)) return fail("Semester must be between 1 and 8.");
    if (role === "student") {
      if (!/^1RN[0-9A-Z]{6,12}$/.test(usn)) return fail("Enter a USN such as 1RN23CS015.");
      if (!semester) return fail("Choose a semester.");
      if (!/^[A-H]$/.test(section)) return fail("Choose a section from A to H.");
    }
    if (role === "mentor") {
      if (!/^[A-H]$/.test(section)) return fail("A class mentor must own one section, A to H.");
      if (!semester) return fail("Which semester does this section belong to?");
      if (designation.length < 2) return fail("Enter a designation.");
    }
    if (role !== "student") {
      const expected = CODES[role];
      if (data.accessCode.trim().toUpperCase() !== expected) {
        return fail("That department code does not match the role.");
      }
    }
    const existing = await loadProfile(sql, context.userId);
    if (existing?.role === "hod" && role !== "hod") {
      const n = await sql<Row>`select count(*)::int as n from profiles where role = 'hod'`;
      if (num(n[0]?.n) <= 1) return fail("Appoint another HoD before leaving the chair.");
    }
    const users = await sql<Row>`select email from "user" where id = ${context.userId}`;
    const email = str(users[0]?.email);
    if (existing) {
      await sql`
        update profiles set
          full_name = ${fullName},
          email = ${email},
          role = ${role},
          usn = ${role === "student" ? usn : ""},
          semester = ${semester},
          section = ${role === "coordinator" || role === "hod" ? "" : section},
          phone = ${phone},
          designation = ${role === "student" ? "" : designation},
          employee_id = ${role === "student" ? "" : employeeId}
        where user_id = ${context.userId}
      `;
    } else {
      await sql`
        insert into profiles (
          user_id, full_name, email, role, usn, semester, section, phone, designation, employee_id
        ) values (
          ${context.userId}, ${fullName}, ${email}, ${role},
          ${role === "student" ? usn : ""},
          ${semester},
          ${role === "coordinator" || role === "hod" ? "" : section},
          ${phone},
          ${role === "student" ? "" : designation},
          ${role === "student" ? "" : employeeId}
        )
      `;
    }
    const profile = await loadProfile(sql, context.userId);
    return { ok: true as const, profile };
  });

export const listRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) return fail("Finish the department profile first.");
    const mine = profile.role === "student";
    const mentor = profile.role === "mentor";
    const section = profile.section.toUpperCase();
    const rows = await sql<Row>`
      select r.*,
        (select count(*)::int from documents d where d.request_id = r.id) as document_count,
        (select count(*)::int from team_members t where t.request_id = r.id) as member_count
      from requests r
      where (
        r.owner_user_id = ${context.userId}
        or (
          not ${mine}
          and r.status <> 'draft'
          and (not ${mentor} or upper(r.section) = ${section})
        )
      )
      order by r.updated_at desc
      limit 200
    `;
    return { ok: true as const, requests: rows.map(mapRequest) };
  });

export const getRequest = createServerFn({ method: "GET" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) return fail("Finish the department profile first.");
    if (!Number.isFinite(id)) return fail("Missing request.");
    const request = await loadRequest(sql, id);
    if (!request || !canRead(profile, request)) return fail("That record is not on your desk.");
    const members = await sql<Row>`
      select id, name, usn, role_in_team from team_members where request_id = ${id} order by id
    `;
    const docs = await sql<Row>`
      select id, doc_type, file_name, mime, data_url, created_at
      from documents where request_id = ${id} order by id
    `;
    const reviews = await sql<Row>`
      select id, actor_name, actor_role, action, note, created_at
      from reviews where request_id = ${id} order by created_at asc, id asc
    `;
    return {
      ok: true as const,
      request,
      members: members.map((m) => ({
        id: num(m.id),
        name: str(m.name),
        usn: str(m.usn),
        roleInTeam: str(m.role_in_team),
      })),
      documents: docs.map((d) => ({
        id: num(d.id),
        docType: str(d.doc_type),
        fileName: str(d.file_name),
        mime: str(d.mime),
        dataUrl: str(d.data_url),
        createdAt: str(d.created_at),
      })),
      reviews: reviews.map((v) => ({
        id: num(v.id),
        actorName: str(v.actor_name),
        actorRole: str(v.actor_role),
        action: str(v.action),
        note: str(v.note),
        createdAt: str(v.created_at),
      })),
    };
  });

export type RequestInput = {
  id?: number;
  participation: Participation;
  teamName: string;
  members: { name: string; usn: string }[];
  category: string;
  scope: string;
  title: string;
  organizer: string;
  venue: string;
  startDate: string;
  endDate: string;
  description: string;
  permissionNeeded: boolean;
  attendanceRequested: boolean;
  classesMissed: string;
};

function cleanInput(data: RequestInput): { ok: true; value: RequestInput } | { ok: false; error: string } {
  const title = data.title.trim().replace(/\s+/g, " ");
  if (title.length < 3 || title.length > 140) return fail("Give the event a clear title.");
  if (!isCategory(data.category)) return fail("Choose a category.");
  if (!isScope(data.scope)) return fail("Say whether the event is inside RNSIT or outside.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(data.endDate)) {
    return fail("Enter the participation dates.");
  }
  if (data.endDate < data.startDate) return fail("The end date cannot be before the start date.");
  const organizer = data.organizer.trim().slice(0, 140);
  if (organizer.length < 2) return fail("Who is organising the event?");
  const venue = data.venue.trim().slice(0, 140);
  if (venue.length < 2) return fail("Where is it held?");
  const description = data.description.trim().slice(0, 2000);
  const members = (data.members ?? [])
    .map((m) => ({ name: m.name.trim().slice(0, 80), usn: m.usn.trim().toUpperCase().slice(0, 20) }))
    .filter((m) => m.name.length > 0)
    .slice(0, 12);
  if (data.participation === "team" && members.length < 2) {
    return fail("A team request needs at least two names.");
  }
  const attendanceRequested = Boolean(data.attendanceRequested);
  const classesMissed = data.classesMissed.trim().slice(0, 400);
  if (attendanceRequested && classesMissed.length < 3) {
    return fail("List the classes or dates for which attendance is sought.");
  }
  const scope = data.scope as Scope;
  return {
    ok: true,
    value: {
      id: data.id,
      participation: data.participation === "team" ? "team" : "individual",
      teamName: data.participation === "team" ? data.teamName.trim().slice(0, 80) : "",
      members: data.participation === "team" ? members : [],
      category: data.category,
      scope,
      title,
      organizer,
      venue,
      startDate: data.startDate,
      endDate: data.endDate,
      description,
      permissionNeeded: scope === "external" ? true : Boolean(data.permissionNeeded),
      attendanceRequested,
      classesMissed: attendanceRequested ? classesMissed : "",
    },
  };
}

async function writeMembers(sql: Sql, requestId: number, members: { name: string; usn: string }[]) {
  await sql`delete from team_members where request_id = ${requestId}`;
  for (let i = 0; i < members.length; i += 1) {
    const m = members[i];
    if (!m) continue;
    await sql`
      insert into team_members (request_id, name, usn, role_in_team)
      values (${requestId}, ${m.name}, ${m.usn}, ${i === 0 ? "Lead" : "Member"})
    `;
  }
}

export const saveRequest = createServerFn({ method: "POST" })
  .validator((input: RequestInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) return fail("Finish the department profile first.");
    if (profile.role !== "student") return fail("Participation requests are filed from a student desk.");
    const cleaned = cleanInput(data);
    if (!cleaned.ok) return cleaned;
    const v = cleaned.value;
    let id = v.id ?? 0;
    if (id) {
      const existing = await loadRequest(sql, id);
      if (!existing || existing.ownerUserId !== context.userId) return fail("That record is not yours.");
      if (existing.status !== "draft" && existing.status !== "changes_requested") {
        return fail("This request is already with the faculty. It can be edited only if they send it back.");
      }
      await sql`
        update requests set
          owner_name = ${profile.fullName},
          owner_usn = ${profile.usn},
          semester = ${profile.semester},
          section = ${profile.section},
          participation = ${v.participation},
          team_name = ${v.teamName},
          category = ${v.category},
          scope = ${v.scope},
          title = ${v.title},
          organizer = ${v.organizer},
          venue = ${v.venue},
          start_date = ${v.startDate},
          end_date = ${v.endDate},
          description = ${v.description},
          permission_needed = ${v.permissionNeeded},
          attendance_requested = ${v.attendanceRequested},
          classes_missed = ${v.classesMissed},
          attendance_status = ${v.attendanceRequested ? "pending" : "not_requested"},
          updated_at = now()
        where id = ${id} and owner_user_id = ${context.userId}
      `;
    } else {
      const inserted = await sql<Row>`
        insert into requests (
          owner_user_id, owner_name, owner_usn, semester, section, is_sample,
          participation, team_name, category, scope, title, organizer, venue,
          start_date, end_date, description, permission_needed, attendance_requested,
          classes_missed, status, attendance_status, achievement_status
        ) values (
          ${context.userId}, ${profile.fullName}, ${profile.usn}, ${profile.semester}, ${profile.section}, false,
          ${v.participation}, ${v.teamName}, ${v.category}, ${v.scope}, ${v.title}, ${v.organizer}, ${v.venue},
          ${v.startDate}, ${v.endDate}, ${v.description}, ${v.permissionNeeded}, ${v.attendanceRequested},
          ${v.classesMissed}, 'draft', ${v.attendanceRequested ? "pending" : "not_requested"}, 'none'
        )
        returning id
      `;
      id = num(inserted[0]?.id);
    }
    await writeMembers(sql, id, v.members);
    return { ok: true as const, id };
  });

export const submitRequest = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile || profile.role !== "student") return fail("Only a student can submit.");
    const existing = await loadRequest(sql, id);
    if (!existing || existing.ownerUserId !== context.userId) return fail("That record is not yours.");
    if (existing.status !== "draft" && existing.status !== "changes_requested") {
      return fail("This request has already been submitted.");
    }
    const action = existing.status === "draft" ? "submit" : "resubmit";
    await sql`
      update requests set status = 'pending_mentor', updated_at = now()
      where id = ${id} and owner_user_id = ${context.userId}
    `;
    await sql`
      insert into reviews (request_id, actor_user_id, actor_name, actor_role, action, note)
      values (${id}, ${context.userId}, ${profile.fullName}, 'student', ${action}, '')
    `;
    return { ok: true as const, id };
  });

type ReviewInput = { id: number; action: string; note: string };

const NOTE_ACTIONS = new Set(["reject", "changes", "return_achievement", "deny_attendance"]);

export const reviewRequest = createServerFn({ method: "POST" })
  .validator((input: ReviewInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) return fail("Finish the department profile first.");
    if (profile.role === "student") return fail("Students cannot clear a request.");
    const request = await loadRequest(sql, data.id);
    if (!request || !canRead(profile, request)) return fail("That record is not on your desk.");
    const note = data.note.trim().slice(0, 500);
    if (NOTE_ACTIONS.has(data.action) && note.length < 4) {
      return fail("Write a short note so the student knows what to do.");
    }
    const role = profile.role;
    const pending = request.status.startsWith("pending_");
    let status: Status | null = null;
    let attendance: AttendanceStatus | null = null;
    let achievement: AchievementStatus | null = null;

    if (data.action === "recommend") {
      if (role !== "mentor" && role !== "hod") return fail("Only the class mentor or HoD can recommend.");
      if (request.status !== "pending_mentor") return fail("This is not waiting on the class mentor.");
      status = "pending_coordinator";
      if (request.attendanceStatus === "pending") attendance = "recommended";
    } else if (data.action === "clear") {
      if (role !== "coordinator" && role !== "hod") return fail("Only the coordinator or HoD can clear it.");
      if (request.status !== "pending_coordinator") return fail("This is not with the coordinator.");
      status = "pending_hod";
    } else if (data.action === "approve") {
      if (role !== "hod") return fail("Final approval sits with the HoD.");
      if (!pending) return fail("Nothing is waiting for approval.");
      status = "approved";
      if (request.attendanceRequested && request.attendanceStatus !== "denied") attendance = "granted";
    } else if (data.action === "reject" || data.action === "changes") {
      if (role === "mentor" && request.status !== "pending_mentor") {
        return fail("Mentors act while the request is with the class teacher.");
      }
      if (role === "coordinator" && request.status !== "pending_coordinator") {
        return fail("The coordinator acts while the request is on that desk.");
      }
      if (role === "hod" && !pending) return fail("This request is not in review.");
      status = data.action === "reject" ? "rejected" : "changes_requested";
    } else if (data.action === "deny_attendance") {
      if (!request.attendanceRequested) return fail("Attendance was not requested.");
      if (role === "mentor" && request.status !== "pending_mentor") {
        return fail("Mentors act while the request is with the class teacher.");
      }
      if (!pending && request.status !== "approved") return fail("Attendance can no longer be changed.");
      attendance = "denied";
    } else if (data.action === "verify_achievement" || data.action === "return_achievement") {
      if (role !== "coordinator" && role !== "hod") return fail("Achievements are verified by the coordinator or HoD.");
      if (request.achievementStatus !== "submitted") return fail("No achievement is waiting to be checked.");
      achievement = data.action === "verify_achievement" ? "verified" : "returned";
    } else {
      return fail("Unknown action.");
    }

    const mentorNote = role === "mentor" ? note || request.mentorNote : request.mentorNote;
    const coordinatorNote = role === "coordinator" ? note || request.coordinatorNote : request.coordinatorNote;
    const hodNote = role === "hod" ? note || request.hodNote : request.hodNote;
    await sql`
      update requests set
        status = ${status ?? request.status},
        attendance_status = ${attendance ?? request.attendanceStatus},
        achievement_status = ${achievement ?? request.achievementStatus},
        mentor_note = ${mentorNote},
        coordinator_note = ${coordinatorNote},
        hod_note = ${hodNote},
        updated_at = now()
      where id = ${request.id}
    `;
    await sql`
      insert into reviews (request_id, actor_user_id, actor_name, actor_role, action, note)
      values (${request.id}, ${context.userId}, ${profile.fullName}, ${role}, ${data.action}, ${note})
    `;
    return { ok: true as const };
  });

type DocInput = { requestId: number; docType: string; fileName: string; mime: string; dataUrl: string };

export const addDocument = createServerFn({ method: "POST" })
  .validator((input: DocInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) return fail("Finish the department profile first.");
    const request = await loadRequest(sql, data.requestId);
    if (!request || request.ownerUserId !== context.userId) return fail("Only the student who filed this can upload.");
    if (request.status === "rejected") return fail("This request was rejected.");
    if (!(DOC_TYPES as readonly string[]).includes(data.docType)) return fail("Choose what this file is.");
    const mime = data.mime;
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(mime)) {
      return fail("Upload a JPG, PNG, WEBP, or PDF.");
    }
    if (!data.dataUrl.startsWith("data:") || data.dataUrl.length > MAX_DOC) {
      return fail("That file is too large. Keep it under about 650 KB.");
    }
    const count = await sql<Row>`select count(*)::int as n from documents where request_id = ${request.id}`;
    if (num(count[0]?.n) >= 8) return fail("Eight files is the limit for one request.");
    const fileName = data.fileName.replace(/[^\w.\- ()]+/g, "").slice(0, 120) || "evidence";
    await sql`
      insert into documents (request_id, uploaded_by, doc_type, file_name, mime, data_url)
      values (${request.id}, ${context.userId}, ${data.docType}, ${fileName}, ${mime}, ${data.dataUrl})
    `;
    await sql`update requests set updated_at = now() where id = ${request.id}`;
    return { ok: true as const };
  });

export const removeDocument = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) return fail("Finish the department profile first.");
    const rows = await sql<Row>`
      select d.id, r.owner_user_id, r.achievement_status
      from documents d join requests r on r.id = d.request_id
      where d.id = ${id}
    `;
    const row = rows[0];
    if (!row || str(row.owner_user_id) !== context.userId) return fail("That file is not yours.");
    if (str(row.achievement_status) === "verified") return fail("Verified evidence stays on the record.");
    await sql`delete from documents where id = ${id}`;
    return { ok: true as const };
  });

type AchievementInput = {
  id: number;
  title: string;
  level: string;
  prize: string;
  rankLabel: string;
};

export const reportAchievement = createServerFn({ method: "POST" })
  .validator((input: AchievementInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile || profile.role !== "student") return fail("Only the student can report the result.");
    const request = await loadRequest(sql, data.id);
    if (!request || request.ownerUserId !== context.userId) return fail("That record is not yours.");
    if (request.status !== "approved") return fail("Report the result after the request is approved.");
    if (request.achievementStatus === "verified") return fail("This achievement is already verified.");
    const title = data.title.trim().slice(0, 140);
    if (title.length < 3) return fail("Name the prize, rank, or recognition.");
    if (!(LEVELS as readonly string[]).includes(data.level)) return fail("Choose the level.");
    const prize = data.prize.trim().slice(0, 140);
    const rankLabel = data.rankLabel.trim().slice(0, 40);
    await sql`
      update requests set
        achievement_status = 'submitted',
        achievement_title = ${title},
        achievement_level = ${data.level},
        prize = ${prize},
        rank_label = ${rankLabel},
        updated_at = now()
      where id = ${request.id}
    `;
    await sql`
      insert into reviews (request_id, actor_user_id, actor_name, actor_role, action, note)
      values (${request.id}, ${context.userId}, ${profile.fullName}, 'student', 'submit', ${title})
    `;
    return { ok: true as const };
  });

export const removeRequest = createServerFn({ method: "POST" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) return fail("Finish the department profile first.");
    const request = await loadRequest(sql, id);
    if (!request) return fail("Already gone.");
    const ownerDraft = request.ownerUserId === context.userId && request.status === "draft";
    if (profile.role !== "hod" && !ownerDraft) return fail("Only a draft you own, or the HoD, can remove this.");
    await sql`delete from requests where id = ${id}`;
    return { ok: true as const };
  });

export const listPeople = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile || (profile.role !== "hod" && profile.role !== "coordinator")) {
      return fail("The directory is for the coordinator and the HoD.");
    }
    const rows = await sql<Row>`select * from profiles order by role, full_name`;
    return { ok: true as const, people: rows.map(mapProfile), me: profile };
  });

type RoleInput = {
  userId: string;
  role: string;
  section: string;
  semester: number | null;
  designation: string;
};

export const setPersonRole = createServerFn({ method: "POST" })
  .validator((input: RoleInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile || profile.role !== "hod") return fail("Only the HoD assigns roles.");
    if (!isRole(data.role)) return fail("Choose a role.");
    const target = await loadProfile(sql, data.userId);
    if (!target) return fail("That person has no profile yet.");
    if (target.role === "hod" && data.role !== "hod") {
      const n = await sql<Row>`select count(*)::int as n from profiles where role = 'hod'`;
      if (num(n[0]?.n) <= 1) return fail("The department needs one HoD.");
    }
    const section = data.section.trim().toUpperCase().slice(0, 2);
    const semester = data.semester == null ? null : Number(data.semester);
    if (data.role === "mentor" && !/^[A-H]$/.test(section)) return fail("Give the mentor a section.");
    if ((data.role === "mentor" || data.role === "student") && (semester == null || semester < 1 || semester > 8)) {
      return fail("Semester is required.");
    }
    await sql`
      update profiles set
        role = ${data.role},
        section = ${data.role === "coordinator" || data.role === "hod" ? "" : section},
        semester = ${data.role === "coordinator" || data.role === "hod" ? null : semester},
        designation = ${data.role === "student" ? "" : data.designation.trim().slice(0, 80) || target.designation}
      where user_id = ${data.userId}
    `;
    return { ok: true as const };
  });

export type PosterItem = EventRequest & { members: Member[] };

export const getPoster = createServerFn({ method: "GET" })
  .validator((month: string) => month)
  .middleware([authMiddleware])
  .handler(async ({ context, data: month }) => {
    const sql = await getSql();
    const profile = await loadProfile(sql, context.userId);
    if (!profile) return fail("Finish the department profile first.");
    const key = /^\d{4}-\d{2}$/.test(month) ? month : istMonth();
    const months = await sql<Row>`
      select distinct to_char(end_date, 'YYYY-MM') as month
      from requests
      where achievement_status = 'verified'
      order by month desc
    `;
    const rows = await sql<Row>`
      select r.*,
        0::int as document_count,
        (select count(*)::int from team_members t where t.request_id = r.id) as member_count
      from requests r
      where r.achievement_status = 'verified'
        and to_char(r.end_date, 'YYYY-MM') = ${key}
      order by r.end_date desc, r.id desc
    `;
    const ids = rows.map((r) => num(r.id));
    let memberRows: Row[] = [];
    if (ids.length) {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
      memberRows = await sql.query<Row>(
        `select id, request_id, name, usn, role_in_team from team_members where request_id in (${placeholders}) order by id`,
        ids,
      );
    }
    const items: PosterItem[] = rows.map((r) => {
      const request = mapRequest(r);
      const members = memberRows
        .filter((m) => num(m.request_id) === request.id)
        .map((m) => ({
          id: num(m.id),
          name: str(m.name),
          usn: str(m.usn),
          roleInTeam: str(m.role_in_team),
        }));
      return { ...request, members };
    });
    const keys = months.map((m) => str(m.month)).filter(Boolean);
    if (!keys.includes(key)) keys.unshift(key);
    return { ok: true as const, month: key, months: keys, items };
  });
