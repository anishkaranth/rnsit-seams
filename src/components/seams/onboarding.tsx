import { useState } from "react";
import { saveProfile, type Profile } from "@/lib/seams/api";
import { ROLES, ROLE_LABEL, type Role } from "@/lib/seams/labels";
import { Button, Field, fieldClass } from "@/components/seams/ui";

const CODES = [
  ["Class mentor", "RNS-MENTOR"],
  ["Faculty coordinator", "RNS-COORD"],
  ["Head of Department", "RNS-HOD"],
] as const;

export function Onboarding({
  authName,
  current,
  onDone,
}: {
  authName: string;
  current?: Profile | null;
  onDone: (profile: Profile) => void;
}) {
  const [role, setRole] = useState<Role>(current?.role ?? "student");
  const [fullName, setFullName] = useState(current?.fullName || authName);
  const [usn, setUsn] = useState(current?.usn ?? "");
  const [semester, setSemester] = useState(String(current?.semester ?? 5));
  const [section, setSection] = useState(current?.section || "A");
  const [phone, setPhone] = useState(current?.phone ?? "");
  const [designation, setDesignation] = useState(current?.designation ?? "");
  const [employeeId, setEmployeeId] = useState(current?.employeeId ?? "");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await saveProfile({
      data: {
        fullName,
        role,
        accessCode,
        usn,
        semester: semester ? Number(semester) : null,
        section,
        phone,
        designation,
        employeeId,
      },
    }).catch(() => ({ ok: false as const, error: "Could not save the profile." }));
    setBusy(false);
    if (!result.ok || !result.profile) {
      setError(result.ok ? "Could not save the profile." : result.error);
      return;
    }
    onDone(result.profile);
  }

  return (
    <form onSubmit={submit} className="mx-auto grid max-w-xl gap-5">
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-faint uppercase">Department profile</p>
        <h1 className="mt-2 font-display text-3xl text-fg">How do you sit on this desk?</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Students file permission and attendance. Faculty clear what belongs to their chair. The code for a
          faculty role is issued by the department.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setRole(item)}
            className={
              role === item
                ? "min-h-11 rounded-md border border-paper bg-paper px-3 text-left text-sm font-medium text-ink"
                : "min-h-11 rounded-md border border-line bg-surface px-3 text-left text-sm text-fg"
            }
          >
            {ROLE_LABEL[item]}
          </button>
        ))}
      </div>
      <Field label="Full name">
        <input className={fieldClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </Field>
      {role === "student" ? (
        <Field label="USN" hint="As printed on the ID card, for example 1RN23CS015.">
          <input className={fieldClass} value={usn} onChange={(e) => setUsn(e.target.value)} autoCapitalize="characters" />
        </Field>
      ) : null}
      {role === "student" || role === "mentor" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label={role === "mentor" ? "Class semester" : "Semester"}>
            <select className={fieldClass} value={semester} onChange={(e) => setSemester(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
          <Field label={role === "mentor" ? "Section you mentor" : "Section"}>
            <select className={fieldClass} value={section} onChange={(e) => setSection(e.target.value)}>
              {["A", "B", "C", "D", "E", "F", "G", "H"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}
      {role !== "student" ? (
        <>
          <Field label="Designation">
            <input
              className={fieldClass}
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Assistant Professor"
            />
          </Field>
          <Field label="Employee ID" hint="Optional.">
            <input className={fieldClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </Field>
          <Field label="Department code">
            <input
              className={fieldClass}
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              autoCapitalize="characters"
            />
          </Field>
          <div className="rounded-lg border border-line bg-bg p-3 text-sm leading-6 text-muted">
            <p className="font-medium text-fg">Codes for this deployment</p>
            <ul className="mt-1 space-y-1">
              {CODES.map(([label, code]) => (
                <li key={code} className="flex justify-between gap-3">
                  <span>{label}</span>
                  <span className="font-medium text-fg tabular-nums">{code}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
      <Field label="Phone" hint="Optional. Used only inside the department.">
        <input className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
      </Field>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : "Open the desk"}
      </Button>
    </form>
  );
}
