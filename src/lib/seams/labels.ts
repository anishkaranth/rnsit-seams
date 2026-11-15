export const ROLES = ["student", "mentor", "coordinator", "hod"] as const;
export type Role = (typeof ROLES)[number];

export const CATEGORIES = ["academic", "technical", "co_curricular", "extracurricular"] as const;
export type Category = (typeof CATEGORIES)[number];

export const SCOPES = ["internal", "external"] as const;
export type Scope = (typeof SCOPES)[number];

export const PARTICIPATION = ["individual", "team"] as const;
export type Participation = (typeof PARTICIPATION)[number];

export const STATUSES = [
  "draft",
  "pending_mentor",
  "pending_coordinator",
  "pending_hod",
  "approved",
  "rejected",
  "changes_requested",
] as const;
export type Status = (typeof STATUSES)[number];

export const ATTENDANCE = ["not_requested", "pending", "recommended", "granted", "denied"] as const;
export type AttendanceStatus = (typeof ATTENDANCE)[number];

export const ACHIEVEMENTS = ["none", "submitted", "verified", "returned"] as const;
export type AchievementStatus = (typeof ACHIEVEMENTS)[number];

export const LEVELS = ["college", "university", "state", "national", "international"] as const;

export const DOC_TYPES = [
  "invitation",
  "registration",
  "participation_certificate",
  "achievement_certificate",
  "photograph",
  "other",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  student: "Student",
  mentor: "Class mentor",
  coordinator: "Faculty coordinator",
  hod: "Head of Department",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  academic: "Academic",
  technical: "Technical",
  co_curricular: "Co-curricular",
  extracurricular: "Extracurricular",
};

export const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft",
  pending_mentor: "With class mentor",
  pending_coordinator: "With coordinator",
  pending_hod: "With HoD",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes requested",
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  not_requested: "Not requested",
  pending: "Attendance pending",
  recommended: "Mentor recommended",
  granted: "Attendance granted",
  denied: "Attendance denied",
};

export const ACHIEVEMENT_LABEL: Record<AchievementStatus, string> = {
  none: "Not reported",
  submitted: "Achievement reported",
  verified: "Verified",
  returned: "Returned",
};

export const LEVEL_LABEL: Record<string, string> = {
  college: "College",
  university: "University",
  state: "State",
  national: "National",
  international: "International",
};

export const DOC_LABEL: Record<string, string> = {
  invitation: "Invitation",
  registration: "Registration",
  participation_certificate: "Participation certificate",
  achievement_certificate: "Achievement certificate",
  photograph: "Photograph",
  other: "Other evidence",
};

export const ACTION_LABEL: Record<string, string> = {
  recommend: "Recommended",
  clear: "Cleared for HoD",
  approve: "Approved",
  reject: "Rejected",
  changes: "Changes requested",
  deny_attendance: "Attendance denied",
  verify_achievement: "Achievement verified",
  return_achievement: "Achievement returned",
  resubmit: "Resubmitted",
  submit: "Submitted",
};

export function refCode(id: number, startDate: string): string {
  const year = /^\d{4}/.test(startDate) ? startDate.slice(0, 4) : "2026";
  return `CSE-${year}-${String(id).padStart(4, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  const month = Number(m);
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  if (!y || !month || month < 1 || month > 12) return key;
  return `${names[month - 1]} ${y}`;
}

export function formatDay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${names[m - 1]} ${y}`;
}

export function istMonth(d = new Date()): string {
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 7);
}
