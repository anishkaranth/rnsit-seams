import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  if (user) return <Navigate to="/desk" search={{ view: "overview", id: "" }} />;
  return <Landing showSignIn={!isPending} />;
}

function Landing({ showSignIn }: { showSignIn: boolean }) {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border border-line font-display text-lg">S</span>
          <span>
            <span className="block font-display text-xl leading-none">SEAMS</span>
            <span className="mt-1 block text-xs text-faint">RNSIT · CSE</span>
          </span>
        </div>
        {showSignIn ? (
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center rounded-md bg-paper px-4 text-sm font-medium text-ink"
          >
            Sign in
          </Link>
        ) : (
          <span className="inline-flex h-11 w-24 rounded-md bg-surface-2" />
        )}
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pt-8 pb-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-faint uppercase">
            RNS Institute of Technology, Bengaluru
          </p>
          <h1 className="mt-4 max-w-xl font-display text-5xl leading-[1.05] text-fg sm:text-6xl">
            Permission, attendance, and the prize that follows.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted">
            The department desk for academic, technical, co-curricular, and extracurricular events. A student files
            once. The class mentor, the faculty coordinator, and the HoD each leave a mark. Verified results become
            the monthly poster.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {showSignIn ? (
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-paper px-5 text-sm font-medium text-ink"
              >
                Enter the desk
              </Link>
            ) : (
              <span className="inline-flex h-11 w-36 rounded-md bg-surface-2" />
            )}
            <a href="#path" className="inline-flex min-h-11 items-center justify-center rounded-md border border-line px-5 text-sm">
              How a request moves
            </a>
          </div>
        </div>
        <aside className="rounded-xl border border-line bg-surface p-5">
          <p className="text-xs tracking-[0.14em] text-faint uppercase tabular-nums">CSE-2026-0014</p>
          <h2 className="mt-3 font-display text-3xl">Smart India Hackathon</h2>
          <p className="mt-2 text-sm text-muted">Ananya Rao · 7 A · Team TechForge</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-faint">Permission</dt>
              <dd className="mt-1">Approved</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Attendance</dt>
              <dd className="mt-1">Granted</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Result</dt>
              <dd className="mt-1">Winner, national</dd>
            </div>
            <div>
              <dt className="text-xs text-faint">Poster</dt>
              <dd className="mt-1">November 2026</dd>
            </div>
          </dl>
          <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-faint">
            Illustrative slip. Live records open after you sign in.
          </p>
        </aside>
      </section>
      <section id="path" className="border-t border-line">
        <ol className="mx-auto grid max-w-6xl gap-px bg-line sm:grid-cols-4">
          {[
            ["01", "File", "Event, dates, team, and whether classes will be missed."],
            ["02", "Clear", "Class mentor, coordinator, then the Head of Department."],
            ["03", "Prove", "Upload the invitation, certificate, or photograph."],
            ["04", "Post", "Verified prizes are set on the month’s achievement poster."],
          ].map(([n, title, body]) => (
            <li key={n} className="bg-bg px-5 py-8">
              <p className="text-xs tabular-nums text-faint">{n}</p>
              <h3 className="mt-3 font-display text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>
      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-faint sm:flex-row sm:justify-between">
        <p>Department of Computer Science and Engineering</p>
        <p>Channasandra, Bengaluru</p>
      </footer>
    </main>
  );
}
