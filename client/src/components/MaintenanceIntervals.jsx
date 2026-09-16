import { useEffect, useState } from "react";
import { api } from "../api.js";
import { findLastService } from "../lib/maintenanceMatch.js";

function getStatus(interval, car, lastService) {
  if (!interval.interval_miles) return { label: "—", tone: "neutral" };
  if (car.mileage == null) return { label: "Set mileage", tone: "neutral" };
  if (!lastService || lastService.mileage == null) return { label: "Not logged", tone: "neutral" };

  const milesSince = car.mileage - lastService.mileage;
  if (milesSince >= interval.interval_miles) return { label: "Overdue", tone: "danger" };
  if (milesSince >= interval.interval_miles * 0.85) return { label: "Due soon", tone: "warn" };
  return { label: "OK", tone: "ok" };
}

const TONE_CLASSES = {
  neutral: "bg-slate-800 text-slate-400",
  ok: "bg-emerald-950 text-emerald-400",
  warn: "bg-amber-950 text-amber-400",
  danger: "bg-rose-950 text-rose-400",
};

export default function MaintenanceIntervals({ car, entries }) {
  const [intervals, setIntervals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .getMaintenanceIntervals(car.id)
      .then((rows) => {
        setIntervals(rows);
        setLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, [car.id]);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await api.generateMaintenanceIntervals(car.id);
      setIntervals(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">Recommended service intervals</h3>
        <button onClick={generate} className="btn-secondary text-xs px-3 py-1.5" disabled={loading}>
          {loading ? "Asking Gemini..." : intervals.length > 0 ? "Re-generate" : "✨ Generate schedule"}
        </button>
      </div>

      {car.mileage == null && (
        <p className="text-xs text-amber-400 mb-3">
          Set this car's current mileage (next to the baseline stats above) to see due/overdue status.
        </p>
      )}
      {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}

      {intervals.length === 0 ? (
        loaded && !loading && <p className="text-sm text-slate-500">No schedule generated yet.</p>
      ) : (
        <div className="space-y-2">
          {intervals.map((interval) => {
            const lastService = findLastService(entries, interval.part);
            const status = getStatus(interval, car, lastService);
            return (
              <div
                key={interval.id}
                className="flex items-start justify-between gap-4 border-t border-slate-800 pt-2 first:border-t-0 first:pt-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-slate-100 text-sm">{interval.part}</h4>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${TONE_CLASSES[status.tone]}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Every {interval.interval_miles.toLocaleString()} mi
                    {interval.interval_months ? ` / ${interval.interval_months} mo` : ""}
                    {lastService
                      ? ` · last: "${lastService.service}"${lastService.mileage != null ? ` at ${lastService.mileage.toLocaleString()} mi` : ""}`
                      : " · not logged yet"}
                  </p>
                  {interval.notes && <p className="text-xs text-slate-600 mt-0.5 italic">{interval.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
