import { useEffect, useState } from "react";
import { api } from "../api.js";
import { findLastService } from "../lib/maintenanceMatch.js";

const SEVERITY_CLASSES = {
  low: "bg-slate-800 text-slate-400",
  medium: "bg-amber-950 text-amber-400",
  high: "bg-rose-950 text-rose-400",
};

export default function WearParts({ car, entries }) {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .getWearParts(car.id)
      .then((rows) => {
        setParts(rows);
        setLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, [car.id]);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await api.generateWearParts(car.id);
      setParts(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-300">Common parts to watch</h3>
          <p className="text-xs text-slate-500 mt-0.5">Known weak points for this specific make/model, not routine maintenance.</p>
        </div>
        <button onClick={generate} className="btn-secondary text-xs px-3 py-1.5 shrink-0" disabled={loading}>
          {loading ? "Asking Gemini..." : parts.length > 0 ? "Re-generate" : "✨ Generate list"}
        </button>
      </div>

      {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}

      {parts.length === 0 ? (
        loaded && !loading && <p className="text-sm text-slate-500">No list generated yet.</p>
      ) : (
        <div className="space-y-2">
          {parts.map((part) => {
            const lastService = findLastService(entries, part.part);
            const severityKey = (part.severity || "medium").toLowerCase();
            const severityClass = SEVERITY_CLASSES[severityKey] || SEVERITY_CLASSES.medium;

            const pastTypical = !lastService && car.mileage != null && part.typical_mileage > 0
              ? car.mileage >= part.typical_mileage
              : false;

            return (
              <div
                key={part.id}
                className="flex items-start justify-between gap-4 border-t border-slate-800 pt-2 first:border-t-0 first:pt-0"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-slate-100 text-sm">{part.part}</h4>
                    {lastService ? (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
                        Replaced
                      </span>
                    ) : (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${severityClass}`}>
                        {part.severity || "Medium"} risk
                      </span>
                    )}
                    {pastTypical && (
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400">
                        Past typical mileage
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {part.typical_mileage > 0 ? `Typically ~${part.typical_mileage.toLocaleString()} mi` : "Mileage varies"}
                    {lastService
                      ? ` · logged: "${lastService.service}"${lastService.mileage != null ? ` at ${lastService.mileage.toLocaleString()} mi` : ""}`
                      : ""}
                  </p>
                  {part.symptoms && <p className="text-xs text-slate-500 mt-0.5">Symptoms: {part.symptoms}</p>}
                  {part.notes && <p className="text-xs text-slate-600 mt-0.5 italic">{part.notes}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
