import { useEffect, useState } from "react";
import { getPoster, type PosterItem } from "@/lib/seams/api";
import { CATEGORY_LABEL, LEVEL_LABEL, formatDay, monthLabel } from "@/lib/seams/labels";
import { Button, Empty, fieldClass } from "@/components/seams/ui";

export function PosterView({ initialMonth }: { initialMonth: string }) {
  const [month, setMonth] = useState(initialMonth);
  const [months, setMonths] = useState<string[]>([initialMonth]);
  const [items, setItems] = useState<PosterItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    getPoster({ data: month })
      .then((res) => {
        if (!live) return;
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setMonths(res.months);
        setItems(res.items);
        setError("");
      })
      .catch(() => {
        if (live) setError("Could not load the poster.");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [month]);

  function savePng() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f4f1eb";
    ctx.fillRect(0, 0, 1200, 1600);
    ctx.fillStyle = "#1e3348";
    ctx.fillRect(0, 0, 1200, 280);
    ctx.fillStyle = "#f4f1eb";
    ctx.font = "500 28px Georgia, serif";
    ctx.fillText("RNS Institute of Technology", 72, 96);
    ctx.font = "400 22px Georgia, serif";
    ctx.fillText("Department of Computer Science and Engineering", 72, 138);
    ctx.font = "560 64px Georgia, serif";
    ctx.fillText("Student achievements", 72, 220);
    ctx.fillStyle = "#1c1915";
    ctx.font = "560 36px Georgia, serif";
    ctx.fillText(monthLabel(month), 72, 360);
    ctx.strokeStyle = "#1e3348";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(72, 390);
    ctx.lineTo(1128, 390);
    ctx.stroke();

    let y = 450;
    const shown = items.slice(0, 8);
    if (shown.length === 0) {
      ctx.font = "400 28px Georgia, serif";
      ctx.fillText("No verified achievements in this month.", 72, y);
    }
    shown.forEach((item, index) => {
      ctx.fillStyle = "#1e3348";
      ctx.font = "600 28px Georgia, serif";
      const names =
        item.participation === "team" && item.members.length
          ? item.members.map((m) => m.name).join(", ")
          : item.ownerName;
      ctx.fillText(`${index + 1}.  ${clip(item.achievementTitle || item.title, 42)}`, 72, y);
      y += 36;
      ctx.fillStyle = "#3c3832";
      ctx.font = "400 22px Georgia, serif";
      ctx.fillText(clip(names, 70), 112, y);
      y += 30;
      ctx.fillText(
        clip(
          `${item.title} · ${LEVEL_LABEL[item.achievementLevel] ?? ""} · ${formatDay(item.endDate)}`,
          78,
        ),
        112,
        y,
      );
      y += 48;
    });

    ctx.fillStyle = "#1e3348";
    ctx.fillRect(0, 1480, 1200, 120);
    ctx.fillStyle = "#f4f1eb";
    ctx.font = "400 22px Georgia, serif";
    ctx.fillText("Verified records · SEAMS · Bengaluru", 72, 1550);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `RNSIT-CSE-achievements-${month}.png`;
    link.click();
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-faint uppercase">Monthly poster</p>
          <h1 className="mt-2 font-display text-3xl">Verified achievements</h1>
        </div>
        <div className="flex gap-2">
          <select className={`${fieldClass} w-auto`} value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
          <Button onClick={savePng} disabled={loading}>
            Save image
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <p className="text-sm text-muted">Gathering the month…</p> : null}
      {!loading && items.length === 0 ? (
        <Empty title="Nothing verified yet" body="When the coordinator or HoD verifies a result, it lands on this poster." />
      ) : null}
      <article className="overflow-hidden rounded-xl border border-line bg-paper text-ink">
        <header className="bg-seal px-5 py-6 text-paper sm:px-8">
          <p className="text-sm tracking-wide">RNS Institute of Technology</p>
          <p className="mt-1 text-sm text-paper/80">Department of Computer Science and Engineering</p>
          <h2 className="mt-4 font-display text-4xl text-paper">Student achievements</h2>
          <p className="mt-2 text-lg">{monthLabel(month)}</p>
        </header>
        <ol className="grid gap-0 px-5 py-2 sm:px-8">
          {items.map((item, index) => (
            <li key={item.id} className="border-b border-seal/15 py-4 last:border-0">
              <p className="text-xs tracking-[0.14em] text-seal/70 uppercase">
                {String(index + 1).padStart(2, "0")} · {LEVEL_LABEL[item.achievementLevel] ?? "Recognition"} ·{" "}
                {CATEGORY_LABEL[item.category]}
              </p>
              <p className="mt-1 font-display text-2xl">{item.achievementTitle}</p>
              <p className="mt-1 text-sm">
                {item.participation === "team" && item.members.length
                  ? item.members.map((m) => m.name).join(", ")
                  : `${item.ownerName}${item.ownerUsn ? ` · ${item.ownerUsn}` : ""}`}
              </p>
              <p className="mt-1 text-sm text-seal/80">
                {item.title}
                {item.prize ? ` · ${item.prize}` : ""}
                {item.rankLabel ? ` · ${item.rankLabel}` : ""} · {formatDay(item.endDate)}
              </p>
            </li>
          ))}
        </ol>
        <footer className="bg-seal px-5 py-3 text-sm text-paper sm:px-8">
          Bengaluru · Compiled from verified SEAMS records
        </footer>
      </article>
    </div>
  );
}

function clip(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
