import { useState } from "react";
import { saveRequest, submitRequest, type RequestInput } from "@/lib/seams/api";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/seams/labels";
import { Button, Field, fieldClass } from "@/components/seams/ui";

const empty = (): RequestInput => ({
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
});

export function RequestForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: RequestInput;
  onSaved: (id: number) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<RequestInput>(initial ?? empty());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);

  function patch(partial: Partial<RequestInput>) {
    setForm((f) => ({ ...f, ...partial }));
  }

  async function persist(mode: "save" | "submit") {
    setBusy(mode);
    setError("");
    const saved = await saveRequest({ data: form }).catch(() => ({
      ok: false as const,
      error: "Could not save.",
    }));
    if (!saved.ok) {
      setBusy(null);
      setError(saved.error);
      return;
    }
    if (mode === "submit") {
      const sent = await submitRequest({ data: saved.id }).catch(() => ({
        ok: false as const,
        error: "Saved as a draft, but submit failed.",
      }));
      if (!sent.ok) {
        setBusy(null);
        setError(sent.error);
        onSaved(saved.id);
        return;
      }
    }
    setBusy(null);
    onSaved(saved.id);
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void persist("submit");
      }}
    >
      <div>
        <p className="text-xs font-medium tracking-[0.16em] text-faint uppercase">
          {form.id ? "Edit request" : "New request"}
        </p>
        <h1 className="mt-2 font-display text-3xl">Permission to participate</h1>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category">
          <select className={fieldClass} value={form.category} onChange={(e) => patch({ category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Where">
          <select
            className={fieldClass}
            value={form.scope}
            onChange={(e) => patch({ scope: e.target.value, permissionNeeded: e.target.value === "external" ? true : form.permissionNeeded })}
          >
            <option value="external">Outside RNSIT</option>
            <option value="internal">Inside RNSIT</option>
          </select>
        </Field>
      </div>
      <Field label="Event title">
        <input className={fieldClass} value={form.title} onChange={(e) => patch({ title: e.target.value })} required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Organiser">
          <input className={fieldClass} value={form.organizer} onChange={(e) => patch({ organizer: e.target.value })} />
        </Field>
        <Field label="Venue">
          <input className={fieldClass} value={form.venue} onChange={(e) => patch({ venue: e.target.value })} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="From">
          <input className={fieldClass} type="date" value={form.startDate} onChange={(e) => patch({ startDate: e.target.value })} />
        </Field>
        <Field label="To">
          <input className={fieldClass} type="date" value={form.endDate} onChange={(e) => patch({ endDate: e.target.value })} />
        </Field>
      </div>
      <Field label="What you are doing there" hint="Paper, hack, match, volunteer shift. A few lines is enough.">
        <textarea
          className={`${fieldClass} min-h-28 py-3`}
          value={form.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        {(["individual", "team"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => patch({ participation: p })}
            className={
              form.participation === p
                ? "min-h-11 rounded-md bg-paper text-sm font-medium text-ink"
                : "min-h-11 rounded-md border border-line text-sm text-fg"
            }
          >
            {p === "individual" ? "Individual" : "Team"}
          </button>
        ))}
      </div>
      {form.participation === "team" ? (
        <div className="grid gap-3 rounded-lg border border-line bg-bg p-3">
          <Field label="Team name">
            <input className={fieldClass} value={form.teamName} onChange={(e) => patch({ teamName: e.target.value })} />
          </Field>
          {form.members.map((m, i) => (
            <div key={i} className="grid grid-cols-[1fr_8.5rem_auto] gap-2">
              <input
                className={fieldClass}
                placeholder="Name"
                value={m.name}
                onChange={(e) => {
                  const members = form.members.slice();
                  const current = members[i] ?? { name: "", usn: "" };
                  members[i] = { ...current, name: e.target.value };
                  patch({ members });
                }}
              />
              <input
                className={fieldClass}
                placeholder="USN"
                value={m.usn}
                onChange={(e) => {
                  const members = form.members.slice();
                  const current = members[i] ?? { name: "", usn: "" };
                  members[i] = { ...current, usn: e.target.value };
                  patch({ members });
                }}
              />
              <button
                type="button"
                className="min-h-11 px-2 text-sm text-muted"
                onClick={() => patch({ members: form.members.filter((_, j) => j !== i) })}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="min-h-11 text-left text-sm font-medium text-fg"
            onClick={() => patch({ members: [...form.members, { name: "", usn: "" }] })}
          >
            Add a teammate
          </button>
        </div>
      ) : null}
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={form.permissionNeeded}
          disabled={form.scope === "external"}
          onChange={(e) => patch({ permissionNeeded: e.target.checked })}
        />
        Prior permission is required
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={form.attendanceRequested}
          onChange={(e) => patch({ attendanceRequested: e.target.checked })}
        />
        Request attendance for classes missed
      </label>
      {form.attendanceRequested ? (
        <Field label="Classes or dates" hint="Subject codes and the days you will be away.">
          <textarea
            className={`${fieldClass} min-h-20 py-3`}
            value={form.classesMissed}
            onChange={(e) => patch({ classesMissed: e.target.value })}
          />
        </Field>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={busy !== null}>
          {busy === "submit" ? "Submitting…" : "Submit to class mentor"}
        </Button>
        <Button type="button" variant="ghost" disabled={busy !== null} onClick={() => void persist("save")}>
          {busy === "save" ? "Saving…" : "Save draft"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
