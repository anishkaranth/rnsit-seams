import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, ClipboardList, LayoutDashboard, Plus, UserRound, Users } from "lucide-react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getDesk,
  getRequest,
  listPeople,
  listRequests,
  setPersonRole,
  type Activity,
  type Doc,
  type EventRequest,
  type Member,
  type Profile,
  type Review,
  type Stats,
} from "@/lib/seams/api";
import {
  ACTION_LABEL,
  CATEGORY_LABEL,
  ROLE_LABEL,
  formatDay,
  monthLabel,
  type Role,
} from "@/lib/seams/labels";
import { Onboarding } from "@/components/seams/onboarding";
import { PosterView } from "@/components/seams/poster-view";
import { RequestDetail } from "@/components/seams/request-detail";
import { RequestForm } from "@/components/seams/request-form";
import { AchievementPill, AttendancePill, Button, Empty, Panel, StatusPill, fieldClass } from "@/components/seams/ui";
import type { RequestInput } from "@/lib/seams/api";

const VIEWS = ["overview", "queue", "new", "detail", "posters", "people", "profile"] as const;
type View = (typeof VIEWS)[number];

export const Route = createFileRoute("/desk")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: VIEWS.includes(search.view as View) ? (search.view as View) : "overview",
    id: typeof search.id === "string" ? search.id : "",
  }),
  component: DeskRoute,
});

function DeskRoute() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <DeskSkeleton />;
  if (!user) return <RedirectToSignIn />;
  return <DeskShell />;
}

function DeskSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <p className="font-display text-xl">SEAMS</p>
      <p className="mt-2 text-sm text-muted">Opening the department desk…</p>
      <div className="mt-6 h-40 animate-pulse rounded-xl bg-surface" />
    </main>
  );
}

function DeskShell() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/desk" });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authName, setAuthName] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Activity[]>([]);
  const [month, setMonth] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  function go(view: View, id = "") {
    void navigate({ search: { view, id } });
  }

  function refreshDesk() {
    return getDesk()
      .then((res) => {
        setAuthName(res.authName);
        setProfile(res.profile);
        setStats(res.stats);
        setRecent(res.recent);
        setMonth(res.month);
        setError("");
      })
      .catch(() => setError("The desk could not be loaded. Sign in again if this keeps happening."));
  }

  useEffect(() => {
    let live = true;
    getDesk()
      .then((res) => {
        if (!live) return;
        setAuthName(res.authName);
        setProfile(res.profile);
        setStats(res.stats);
        setRecent(res.recent);
        setMonth(res.month);
      })
      .catch(() => {
        if (live) setError("The desk could not be loaded.");
      })
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);

  const student = profile?.role === "student";
  const nav: { view: View; label: string; icon: typeof LayoutDashboard; show: boolean }[] = [
    { view: "overview", label: "Overview", icon: LayoutDashboard, show: true },
    { view: "queue", label: student ? "My requests" : "Queue", icon: ClipboardList, show: true },
    { view: "new", label: "File", icon: Plus, show: Boolean(student) },
    { view: "posters", label: "Posters", icon: Award, show: true },
    { view: "people", label: "People", icon: Users, show: profile?.role === "hod" || profile?.role === "coordinator" },
    { view: "profile", label: "Profile", icon: UserRound, show: true },
  ];

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-20 border-b border-line bg-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button type="button" onClick={() => go("overview")} className="flex items-center gap-3 text-left">
            <span className="grid h-9 w-9 place-items-center border border-line font-display text-lg">S</span>
            <span>
              <span className="block font-display text-xl leading-none">SEAMS</span>
              <span className="mt-1 hidden text-xs text-faint sm:block">RNSIT · Computer Science and Engineering</span>
            </span>
          </button>
          <div className="flex items-center gap-3">
            {profile ? (
              <span className="hidden text-xs text-muted sm:inline">{ROLE_LABEL[profile.role]}</span>
            ) : null}
            <UserButton />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl lg:grid-cols-[13.5rem_1fr]">
        <nav className="hidden border-r border-line px-3 py-6 lg:block">
          <ul className="grid gap-1">
            {nav
              .filter((item) => item.show)
              .map((item) => (
                <li key={item.view}>
                  <button
                    type="button"
                    onClick={() => go(item.view)}
                    className={
                      search.view === item.view
                        ? "flex min-h-11 w-full items-center gap-2 rounded-md bg-surface-2 px-3 text-sm font-medium"
                        : "flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-sm text-muted"
                    }
                  >
                    <item.icon className="size-4" strokeWidth={1.75} />
                    {item.label}
                  </button>
                </li>
              ))}
          </ul>
        </nav>
        <main className="px-4 py-6 pb-28 lg:pb-10">
          {!ready ? <DeskSkeleton /> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {ready && !profile ? <Onboarding authName={authName} onDone={() => void refreshDesk()} /> : null}
          {ready && profile && search.view === "overview" ? (
            <Overview
              profile={profile}
              stats={stats}
              recent={recent}
              month={month}
              onOpen={(id) => go("detail", String(id))}
              onQueue={() => go("queue")}
              onPoster={() => go("posters")}
            />
          ) : null}
          {ready && profile && search.view === "queue" ? (
            <Queue profile={profile} onOpen={(id) => go("detail", String(id))} onNew={() => go("new")} />
          ) : null}
          {ready && profile && search.view === "new" ? (
            profile.role === "student" ? (
              <Editor
                key={search.id || "new"}
                id={search.id}
                onDone={(id) => go("detail", String(id))}
                onCancel={() => go(search.id ? "detail" : "queue", search.id)}
              />
            ) : (
              <Empty title="Students file requests" body="Switch to a student profile, or open the queue to clear what is already in." />
            )
          ) : null}
          {ready && profile && search.view === "detail" ? (
            <DetailGate
              key={search.id}
              id={search.id}
              profile={profile}
              onBack={() => go("queue")}
              onEdit={() => go("new", search.id)}
            />
          ) : null}
          {ready && profile && search.view === "posters" ? <PosterView initialMonth={month} /> : null}
          {ready && profile && search.view === "people" ? <People profile={profile} /> : null}
          {ready && profile && search.view === "profile" ? (
            <div className="grid gap-4">
              <Panel>
                <p className="text-xs text-faint">Signed in as</p>
                <p className="mt-1 font-display text-2xl">{profile.fullName}</p>
                <p className="mt-1 text-sm text-muted">
                  {ROLE_LABEL[profile.role]}
                  {profile.usn ? ` · ${profile.usn}` : ""}
                  {profile.section ? ` · Section ${profile.section}` : ""}
                  {profile.email ? ` · ${profile.email}` : ""}
                </p>
              </Panel>
              <Onboarding authName={authName} current={profile} onDone={() => void refreshDesk()} />
            </div>
          ) : null}
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto flex max-w-lg">
          {nav
            .filter((item) => item.show && item.view !== "profile")
            .slice(0, 5)
            .map((item) => (
              <li key={item.view} className="flex-1">
                <button
                  type="button"
                  onClick={() => go(item.view)}
                  className={
                    search.view === item.view
                      ? "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs text-fg"
                      : "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 text-xs text-faint"
                  }
                >
                  <item.icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </button>
              </li>
            ))}
        </ul>
      </nav>
    </div>
  );
}

function greetingName(fullName: string): string {
  const titles = new Set(["dr", "dr.", "prof", "prof.", "mr", "mr.", "mrs", "mrs.", "ms", "ms.", "shri", "smt", "smt."]);
  const parts = fullName.split(" ").filter((part) => part && !titles.has(part.toLowerCase()));
  return parts[0] ?? fullName;
}

function Overview({
  profile,
  stats,
  recent,
  month,
  onOpen,
  onQueue,
  onPoster,
}: {
  profile: Profile;
  stats: Stats | null;
  recent: Activity[];
  month: string;
  onOpen: (id: number) => void;
  onQueue: () => void;
  onPoster: () => void;
}) {
  const cards = [
    { k: "Waiting on you", n: stats?.awaiting ?? 0 },
    { k: "In the pipeline", n: stats?.pipeline ?? 0 },
    { k: "Approved", n: stats?.approved ?? 0 },
    { k: `Verified in ${monthLabel(month).split(" ")[0] ?? "this month"}`, n: stats?.verifiedMonth ?? 0 },
  ];
  const chart = (stats?.byCategory ?? []).map((row) => ({
    name: CATEGORY_LABEL[row.category as keyof typeof CATEGORY_LABEL] ?? row.category,
    count: row.count,
  }));
  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-faint uppercase">
          {ROLE_LABEL[profile.role]}
          {profile.section ? ` · Section ${profile.section}` : ""}
        </p>
        <h1 className="mt-2 font-display text-3xl">Good day, {greetingName(profile.fullName)}.</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Permission, attendance, and the achievement that follows — one record from the student to the Head of
          Department.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <button key={card.k} type="button" onClick={onQueue} className="rounded-xl border border-line bg-surface p-4 text-left">
            <p className="font-display text-3xl tabular-nums">{card.n}</p>
            <p className="mt-1 text-xs text-muted">{card.k}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl">By category</h2>
            <button type="button" onClick={onPoster} className="min-h-11 text-sm text-muted">
              Open poster
            </button>
          </div>
          {chart.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No filed events in view yet.</p>
          ) : (
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <XAxis dataKey="name" tick={{ fill: "var(--color-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "var(--color-faint)", fontSize: 12 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip
                    cursor={{ fill: "var(--color-surface-2)" }}
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-line)",
                      borderRadius: 12,
                      color: "var(--color-fg)",
                    }}
                  />
                  <Bar dataKey="count" fill="var(--color-paper)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel>
          <h2 className="font-display text-xl">Recent remarks</h2>
          {recent.length === 0 ? <p className="mt-3 text-sm text-muted">The record is quiet.</p> : null}
          <ul className="mt-3 divide-y divide-line">
            {recent.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => onOpen(item.requestId)} className="w-full py-3 text-left">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {ACTION_LABEL[item.action] ?? item.action} · {item.actorName}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      {profile.role !== "student" ? (
        <p className="text-sm leading-6 text-muted">
          The illustrative cohort is already on the queue so a new faculty desk is not empty. Remove any of those
          records once real requests replace them. A mentor sees only their section. Section A is with the samples
          for hackathons and cricket.
        </p>
      ) : (
        <p className="text-sm leading-6 text-muted">
          File the request before you travel. After approval, upload the certificate and report the result. Your
          class mentor, the faculty coordinator, and the HoD each see it in turn.
        </p>
      )}
    </div>
  );
}

function Queue({
  profile,
  onOpen,
  onNew,
}: {
  profile: Profile;
  onOpen: (id: number) => void;
  onNew: () => void;
}) {
  const [rows, setRows] = useState<EventRequest[] | null>(null);
  const [filter, setFilter] = useState("awaiting");
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    listRequests()
      .then((res) => {
        if (!live) return;
        if (!res.ok) setError(res.error);
        else setRows(res.requests);
      })
      .catch(() => {
        if (live) setError("Could not load requests.");
      });
    return () => {
      live = false;
    };
  }, []);

  const awaiting =
    profile.role === "student"
      ? (row: EventRequest) => row.status === "changes_requested" || row.status === "draft" || row.achievementStatus === "returned"
      : profile.role === "mentor"
        ? (row: EventRequest) => row.status === "pending_mentor"
        : profile.role === "coordinator"
          ? (row: EventRequest) => row.status === "pending_coordinator" || row.achievementStatus === "submitted"
          : (row: EventRequest) => row.status === "pending_hod" || row.achievementStatus === "submitted";

  const shown = (rows ?? []).filter((row) => {
    if (filter === "awaiting") return awaiting(row);
    if (filter === "approved") return row.status === "approved";
    if (filter === "achievements") return row.achievementStatus !== "none";
    return true;
  });

  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-faint uppercase">Requests</p>
          <h1 className="mt-2 font-display text-3xl">{profile.role === "student" ? "Your participation" : "Review queue"}</h1>
        </div>
        {profile.role === "student" ? (
          <Button onClick={onNew}>New</Button>
        ) : null}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {[
          ["awaiting", "Needs a look"],
          ["all", "All"],
          ["approved", "Approved"],
          ["achievements", "Achievements"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={
              filter === id
                ? "min-h-11 shrink-0 rounded-full bg-paper px-4 text-sm font-medium text-ink"
                : "min-h-11 shrink-0 rounded-full border border-line px-4 text-sm text-fg"
            }
          >
            {label}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {rows === null ? <p className="text-sm text-muted">Loading the register…</p> : null}
      {rows && shown.length === 0 ? (
        <Empty title="Nothing in this tray" body="Try another filter, or file a request if you are on a student desk." />
      ) : null}
      <ul className="grid gap-3">
        {shown.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onOpen(row.id)}
              className="w-full rounded-xl border border-line bg-surface p-4 text-left"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-faint tabular-nums">{row.ref}</p>
                <p className="text-xs text-muted">
                  {formatDay(row.startDate)}
                  {row.endDate !== row.startDate ? ` – ${formatDay(row.endDate)}` : ""}
                </p>
              </div>
              <p className="mt-2 font-display text-2xl">{row.title}</p>
              <p className="mt-1 text-sm text-muted">
                {row.ownerName} · Sem {row.semester ?? "—"} {row.section} · {CATEGORY_LABEL[row.category]}
                {row.sample ? " · Cohort" : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusPill status={row.status} />
                <AttendancePill status={row.attendanceStatus} />
                <AchievementPill status={row.achievementStatus} />
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Editor({ id, onDone, onCancel }: { id: string; onDone: (id: number) => void; onCancel: () => void }) {
  const [initial, setInitial] = useState<RequestInput | null>(id ? null : undefinedForm());
  const [error, setError] = useState("");
  useEffect(() => {
    if (!id) return;
    let live = true;
    getRequest({ data: Number(id) })
      .then((res) => {
        if (!live) return;
        if (!res.ok) {
          setError(res.error);
          return;
        }
        const r = res.request;
        setInitial({
          id: r.id,
          participation: r.participation,
          teamName: r.teamName,
          members: res.members.map((m) => ({ name: m.name, usn: m.usn })),
          category: r.category,
          scope: r.scope,
          title: r.title,
          organizer: r.organizer,
          venue: r.venue,
          startDate: r.startDate,
          endDate: r.endDate,
          description: r.description,
          permissionNeeded: r.permissionNeeded,
          attendanceRequested: r.attendanceRequested,
          classesMissed: r.classesMissed,
        });
      })
      .catch(() => {
        if (live) setError("Could not open that draft.");
      });
    return () => {
      live = false;
    };
  }, [id]);
  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!initial) return <p className="text-sm text-muted">Opening the draft…</p>;
  return <RequestForm initial={initial} onSaved={onDone} onCancel={onCancel} />;
}

function undefinedForm(): RequestInput {
  return {
    participation: "individual",
    teamName: "",
    members: [
      { name: "", usn: "" },
      { name: "", usn: "" },
    ],
    category: "technical",
    scope: "external",
    title: "",
    organizer: "",
    venue: "",
    startDate: "",
    endDate: "",
    description: "",
    permissionNeeded: true,
    attendanceRequested: false,
    classesMissed: "",
  };
}

function DetailGate({
  id,
  profile,
  onBack,
  onEdit,
}: {
  id: string;
  profile: Profile;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [pack, setPack] = useState<{
    request: EventRequest;
    members: Member[];
    documents: Doc[];
    reviews: Review[];
  } | null>(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    setPack(null);
    getRequest({ data: Number(id) })
      .then((res) => {
        if (!live) return;
        if (!res.ok) setError(res.error);
        else setPack({ request: res.request, members: res.members, documents: res.documents, reviews: res.reviews });
      })
      .catch(() => {
        if (live) setError("Could not open the record.");
      });
    return () => {
      live = false;
    };
  }, [id, tick]);

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!pack) return <p className="text-sm text-muted">Opening the record…</p>;
  return (
    <RequestDetail
      profile={profile}
      request={pack.request}
      members={pack.members}
      documents={pack.documents}
      reviews={pack.reviews}
      onChanged={() => setTick((n) => n + 1)}
      onEdit={onEdit}
      onBack={onBack}
    />
  );
}

function People({ profile }: { profile: Profile }) {
  const [people, setPeople] = useState<Profile[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  function load() {
    return listPeople()
      .then((res) => {
        if (!res.ok) setError(res.error);
        else setPeople(res.people);
      })
      .catch(() => setError("Could not load the directory."));
  }

  useEffect(() => {
    void load();
  }, []);

  if (profile.role !== "hod" && profile.role !== "coordinator") {
    return <Empty title="Restricted" body="The directory is kept by the coordinator and the HoD." />;
  }

  return (
    <div className="grid gap-4">
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-faint uppercase">Directory</p>
        <h1 className="mt-2 font-display text-3xl">People on the desk</h1>
        <p className="mt-2 text-sm text-muted">
          {profile.role === "hod"
            ? "Assign a signed-in colleague to a chair. The last HoD cannot be removed."
            : "The HoD assigns chairs. You can see who is already on the desk."}
        </p>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <ul className="grid gap-3">
        {(people ?? []).map((person) => (
          <PersonRow
            key={person.userId}
            person={person}
            canEdit={profile.role === "hod"}
            busy={busy === person.userId}
            onSave={async (next) => {
              setBusy(person.userId);
              const res = await setPersonRole({ data: next }).catch(() => ({
                ok: false as const,
                error: "Could not update the role.",
              }));
              setBusy("");
              if (!res.ok) setError(res.error);
              else {
                setError("");
                await load();
              }
            }}
          />
        ))}
      </ul>
    </div>
  );
}

function PersonRow({
  person,
  canEdit,
  busy,
  onSave,
}: {
  person: Profile;
  canEdit: boolean;
  busy: boolean;
  onSave: (next: { userId: string; role: Role; section: string; semester: number | null; designation: string }) => void;
}) {
  const [role, setRole] = useState<Role>(person.role);
  const [section, setSection] = useState(person.section || "A");
  const [semester, setSemester] = useState(String(person.semester ?? 5));
  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <p className="font-medium">{person.fullName}</p>
      <p className="text-sm text-muted">
        {person.email || "No email"} · {ROLE_LABEL[person.role]}
        {person.usn ? ` · ${person.usn}` : ""}
      </p>
      {canEdit ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_5rem_5rem_auto] sm:items-center">
          <select className={fieldClass} value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(Object.keys(ROLE_LABEL) as Role[]).map((item) => (
              <option key={item} value={item}>
                {ROLE_LABEL[item]}
              </option>
            ))}
          </select>
          <select className={fieldClass} value={section} onChange={(e) => setSection(e.target.value)}>
            {["A", "B", "C", "D", "E", "F", "G", "H"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className={fieldClass} value={semester} onChange={(e) => setSemester(e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <Button
            disabled={busy}
            onClick={() =>
              onSave({
                userId: person.userId,
                role,
                section,
                semester: Number(semester),
                designation: person.designation,
              })
            }
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      ) : null}
    </li>
  );
}
