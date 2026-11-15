import { useState } from "react";
import {
  addDocument,
  removeDocument,
  removeRequest,
  reportAchievement,
  reviewRequest,
  type Doc,
  type EventRequest,
  type Member,
  type Profile,
  type Review,
} from "@/lib/seams/api";
import {
  ACTION_LABEL,
  ATTENDANCE_LABEL,
  CATEGORY_LABEL,
  DOC_LABEL,
  DOC_TYPES,
  LEVEL_LABEL,
  LEVELS,
  ROLE_LABEL,
  formatDay,
  type DocType,
  type Role,
} from "@/lib/seams/labels";
import { AchievementPill, AttendancePill, Button, Field, Panel, StatusPill, fieldClass } from "@/components/seams/ui";

export function RequestDetail({
  profile,
  request,
  members,
  documents,
  reviews,
  onChanged,
  onEdit,
  onBack,
}: {
  profile: Profile;
  request: EventRequest;
  members: Member[];
  documents: Doc[];
  reviews: Review[];
  onChanged: () => void;
  onEdit: () => void;
  onBack: () => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [docType, setDocType] = useState<DocType>("invitation");
  const [achieve, setAchieve] = useState({
    title: request.achievementTitle,
    level: request.achievementLevel || "college",
    prize: request.prize,
    rankLabel: request.rankLabel,
  });
  const [confirmRemove, setConfirmRemove] = useState(false);

  const faculty = profile.role !== "student";
  const owner = request.ownerUserId === profile.userId;
  const editable = owner && (request.status === "draft" || request.status === "changes_requested");

  async function act(action: string) {
    setBusy(action);
    setError("");
    const result = await reviewRequest({ data: { id: request.id, action, note } }).catch(() => ({
      ok: false as const,
      error: "The action did not go through.",
    }));
    setBusy("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNote("");
    onChanged();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 700_000) {
      setError("Keep the file under about 650 KB.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("read"));
      reader.readAsDataURL(file);
    }).catch(() => "");
    if (!dataUrl) {
      setError("Could not read that file.");
      return;
    }
    setBusy("upload");
    const result = await addDocument({
      data: { requestId: request.id, docType, fileName: file.name, mime: file.type, dataUrl },
    }).catch(() => ({ ok: false as const, error: "Upload failed." }));
    setBusy("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChanged();
  }

  async function report(e: React.FormEvent) {
    e.preventDefault();
    setBusy("achieve");
    const result = await reportAchievement({
      data: { id: request.id, ...achieve },
    }).catch(() => ({ ok: false as const, error: "Could not report the achievement." }));
    setBusy("");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChanged();
  }

  const actions = actionsFor(profile.role, request);

  return (
    <div className="grid gap-4">
      <button type="button" onClick={onBack} className="min-h-11 self-start text-sm text-muted">
        Back to the list
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-faint uppercase tabular-nums">{request.ref}</p>
          <h1 className="mt-1 font-display text-3xl">{request.title}</h1>
          <p className="mt-2 text-sm text-muted">
            {request.ownerName}
            {request.ownerUsn ? ` · ${request.ownerUsn}` : ""} · Sem {request.semester ?? "—"} {request.section}
            {request.sample ? " · Illustrative cohort" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill status={request.status} />
          <AttendancePill status={request.attendanceStatus} />
          <AchievementPill status={request.achievementStatus} />
        </div>
      </div>

      <Panel>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Item k="Category" v={CATEGORY_LABEL[request.category]} />
          <Item k="Scope" v={request.scope === "internal" ? "Inside RNSIT" : "Outside RNSIT"} />
          <Item k="Organiser" v={request.organizer} />
          <Item k="Venue" v={request.venue} />
          <Item k="Dates" v={`${formatDay(request.startDate)} – ${formatDay(request.endDate)}`} />
          <Item k="Participation" v={request.participation === "team" ? request.teamName || "Team" : "Individual"} />
          <Item k="Permission" v={request.permissionNeeded ? "Required" : "Not required"} />
          <Item k="Attendance" v={ATTENDANCE_LABEL[request.attendanceStatus]} />
        </dl>
        {request.description ? <p className="mt-4 text-sm leading-6 whitespace-pre-wrap text-fg">{request.description}</p> : null}
        {request.attendanceRequested ? (
          <p className="mt-3 text-sm leading-6 text-muted">
            <span className="text-fg">Classes missed. </span>
            {request.classesMissed}
          </p>
        ) : null}
      </Panel>

      {members.length > 0 ? (
        <Panel>
          <h2 className="font-display text-xl">Team</h2>
          <ul className="mt-3 divide-y divide-line">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                <span>{m.name}</span>
                <span className="text-muted tabular-nums">
                  {m.usn} · {m.roleInTeam}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <Panel>
        <h2 className="font-display text-xl">Evidence</h2>
        <p className="mt-1 text-sm text-muted">Invitation, registration, certificates, or a photograph. PDF or image, under 650 KB.</p>
        {documents.length === 0 ? <p className="mt-3 text-sm text-faint">Nothing uploaded yet.</p> : null}
        <ul className="mt-3 grid gap-3">
          {documents.map((doc) => (
            <li key={doc.id} className="rounded-lg border border-line bg-bg p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{DOC_LABEL[doc.docType] ?? doc.docType}</p>
                  <p className="text-xs text-muted">{doc.fileName}</p>
                </div>
                {owner && request.achievementStatus !== "verified" ? (
                  <button
                    type="button"
                    className="min-h-11 text-sm text-muted"
                    onClick={() => {
                      void removeDocument({ data: doc.id }).then(() => onChanged());
                    }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {doc.mime.startsWith("image/") ? (
                <img src={doc.dataUrl} alt="" className="mt-3 max-h-56 w-full rounded-md object-contain" />
              ) : (
                <a className="mt-2 inline-flex min-h-11 items-center text-sm underline" href={doc.dataUrl} download={doc.fileName}>
                  Download
                </a>
              )}
            </li>
          ))}
        </ul>
        {owner && request.status !== "rejected" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="File kind">
              <select className={fieldClass} value={docType} onChange={(e) => setDocType(e.target.value as DocType)}>
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DOC_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-line px-4 text-sm font-medium">
              {busy === "upload" ? "Uploading…" : "Upload"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  void onFile(file);
                }}
              />
            </label>
          </div>
        ) : null}
      </Panel>

      {owner && request.status === "approved" && request.achievementStatus !== "verified" ? (
        <Panel>
          <h2 className="font-display text-xl">Report the result</h2>
          <p className="mt-1 text-sm text-muted">Only a verified result is placed on the monthly poster.</p>
          <form onSubmit={report} className="mt-3 grid gap-3">
            <Field label="Prize, rank, or recognition">
              <input className={fieldClass} value={achieve.title} onChange={(e) => setAchieve({ ...achieve, title: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Level">
                <select className={fieldClass} value={achieve.level} onChange={(e) => setAchieve({ ...achieve, level: e.target.value })}>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {LEVEL_LABEL[l]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prize">
                <input className={fieldClass} value={achieve.prize} onChange={(e) => setAchieve({ ...achieve, prize: e.target.value })} />
              </Field>
              <Field label="Rank">
                <input className={fieldClass} value={achieve.rankLabel} onChange={(e) => setAchieve({ ...achieve, rankLabel: e.target.value })} />
              </Field>
            </div>
            <Button type="submit" disabled={busy === "achieve"}>
              {busy === "achieve" ? "Sending…" : "Send for verification"}
            </Button>
          </form>
        </Panel>
      ) : null}

      {request.achievementStatus !== "none" ? (
        <Panel>
          <h2 className="font-display text-xl">Achievement</h2>
          <p className="mt-2 text-sm">
            {request.achievementTitle || "Reported"} · {LEVEL_LABEL[request.achievementLevel] ?? request.achievementLevel}
            {request.rankLabel ? ` · ${request.rankLabel}` : ""}
          </p>
          {request.prize ? <p className="mt-1 text-sm text-muted">{request.prize}</p> : null}
        </Panel>
      ) : null}

      <Panel>
        <h2 className="font-display text-xl">Record</h2>
        {reviews.length === 0 ? <p className="mt-2 text-sm text-faint">No remarks yet.</p> : null}
        <ol className="mt-3 space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="border-l border-line pl-3">
              <p className="text-sm font-medium">
                {ACTION_LABEL[review.action] ?? review.action}
                <span className="font-normal text-muted">
                  {" "}
                  · {review.actorName}
                  {review.actorRole !== "student" ? `, ${ROLE_LABEL[review.actorRole as Role] ?? review.actorRole}` : ""}
                </span>
              </p>
              {review.note ? <p className="mt-1 text-sm leading-6 text-muted">{review.note}</p> : null}
              <p className="mt-1 text-xs text-faint">{formatDay(review.createdAt)}</p>
            </li>
          ))}
        </ol>
      </Panel>

      {faculty && (actions.length > 0 || request.achievementStatus === "submitted") ? (
        <Panel>
          <h2 className="font-display text-xl">Your action</h2>
          <Field label="Note" hint="Required when you reject, send back, or deny attendance.">
            <textarea className={`${fieldClass} min-h-20 py-3`} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.danger ? "danger" : "primary"}
                disabled={busy !== ""}
                onClick={() => void act(action.id)}
              >
                {busy === action.id ? "Working…" : action.label}
              </Button>
            ))}
            {profile.role !== "student" &&
            (profile.role === "coordinator" || profile.role === "hod") &&
            request.achievementStatus === "submitted" ? (
              <>
                <Button variant="primary" disabled={busy !== ""} onClick={() => void act("verify_achievement")}>
                  Verify achievement
                </Button>
                <Button variant="ghost" disabled={busy !== ""} onClick={() => void act("return_achievement")}>
                  Return achievement
                </Button>
              </>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {editable ? (
          <Button variant="ghost" onClick={onEdit}>
            Edit and resubmit
          </Button>
        ) : null}
        {owner && request.status === "draft" ? (
          <Button variant="danger" onClick={() => void removeRequest({ data: request.id }).then(() => onBack())}>
            Delete draft
          </Button>
        ) : null}
        {profile.role === "hod" ? (
          confirmRemove ? (
            <Button
              variant="danger"
              onClick={() => {
                void removeRequest({ data: request.id }).then(() => onBack());
              }}
            >
              Confirm removal
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmRemove(true)}>
              Remove record
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-faint">{k}</dt>
      <dd className="mt-0.5 text-fg">{v}</dd>
    </div>
  );
}

function actionsFor(role: Role, request: EventRequest): { id: string; label: string; danger?: boolean }[] {
  if (role === "student") return [];
  const out: { id: string; label: string; danger?: boolean }[] = [];
  if ((role === "mentor" || role === "hod") && request.status === "pending_mentor") {
    out.push({ id: "recommend", label: "Recommend" });
    out.push({ id: "changes", label: "Send back", danger: true });
    out.push({ id: "reject", label: "Reject", danger: true });
  }
  if ((role === "coordinator" || role === "hod") && request.status === "pending_coordinator") {
    out.push({ id: "clear", label: "Clear for HoD" });
    out.push({ id: "changes", label: "Send back", danger: true });
    out.push({ id: "reject", label: "Reject", danger: true });
  }
  if (role === "hod" && request.status.startsWith("pending_")) {
    if (!out.some((a) => a.id === "approve")) out.push({ id: "approve", label: "Approve" });
    if (request.status === "pending_hod") {
      out.push({ id: "changes", label: "Send back", danger: true });
      out.push({ id: "reject", label: "Reject", danger: true });
    }
  }
  if (request.attendanceRequested && request.attendanceStatus !== "denied" && request.attendanceStatus !== "granted") {
    if (
      (role === "mentor" && request.status === "pending_mentor") ||
      (role === "coordinator" && request.status === "pending_coordinator") ||
      role === "hod"
    ) {
      out.push({ id: "deny_attendance", label: "Deny attendance", danger: true });
    }
  }
  return dedupe(out);
}

function dedupe(items: { id: string; label: string; danger?: boolean }[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
