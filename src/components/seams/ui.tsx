import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  ACHIEVEMENT_LABEL,
  ATTENDANCE_LABEL,
  STATUS_LABEL,
  type AchievementStatus,
  type AttendanceStatus,
  type Status,
} from "@/lib/seams/labels";

export const fieldClass =
  "min-h-11 w-full rounded-md border border-line bg-bg px-3 text-base text-fg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus:border-paper focus:ring-2 focus:ring-paper/25";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-fg">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-5 text-faint">{hint}</span> : null}
    </label>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-[transform,background-color,opacity] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-paper text-ink hover:bg-paper/90",
        variant === "ghost" && "border border-line bg-surface text-fg hover:bg-surface-2",
        variant === "danger" && "border border-danger/40 bg-transparent text-danger hover:bg-danger/10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function toneFor(kind: "ok" | "wait" | "danger" | "mute") {
  if (kind === "ok") return "border-ok/40 text-ok";
  if (kind === "danger") return "border-danger/40 text-danger";
  if (kind === "wait") return "border-wait/40 text-wait";
  return "border-line text-muted";
}

export function StatusPill({ status }: { status: Status }) {
  const kind =
    status === "approved" ? "ok" : status === "rejected" ? "danger" : status === "draft" ? "mute" : "wait";
  return <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", toneFor(kind))}>{STATUS_LABEL[status]}</span>;
}

export function AttendancePill({ status }: { status: AttendanceStatus }) {
  if (status === "not_requested") return null;
  const kind = status === "granted" ? "ok" : status === "denied" ? "danger" : "wait";
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", toneFor(kind))}>
      {ATTENDANCE_LABEL[status]}
    </span>
  );
}

export function AchievementPill({ status }: { status: AchievementStatus }) {
  if (status === "none") return null;
  const kind = status === "verified" ? "ok" : status === "returned" ? "danger" : "wait";
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", toneFor(kind))}>
      {ACHIEVEMENT_LABEL[status]}
    </span>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-line bg-surface p-4 sm:p-5", className)}>{children}</section>;
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center">
      <p className="font-display text-xl text-fg">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{body}</p>
    </div>
  );
}
