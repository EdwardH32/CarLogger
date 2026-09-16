import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatCard from "./StatCard.jsx";
import DynoChart from "./DynoChart.jsx";

export default function DynoTab({ carId }) {
  const [dyno, setDyno] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDyno(null);
    setLoaded(false);
    setError("");
    api
      .getDyno(carId)
      .then((result) => {
        setDyno(result);
        setLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, [carId]);

  const runEstimate = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.estimateDyno(carId);
      setDyno(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const peakHp = dyno?.points?.length ? Math.max(...dyno.points.map((p) => p.hp)) : null;
  const peakTorque = dyno?.points?.length ? Math.max(...dyno.points.map((p) => p.torque)) : null;

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-stone-300">Dyno graph</h3>
            <p className="text-xs text-stone-500 mt-0.5">AI-estimated HP/torque curve for this car's current output.</p>
          </div>
          <button onClick={runEstimate} className="btn-secondary text-xs px-3 py-1.5 shrink-0" disabled={loading}>
            {loading ? "Calculating..." : dyno ? "Re-run dyno" : "✨ Run dyno estimate"}
          </button>
        </div>

        {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}

        {dyno?.points?.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <StatCard label="Peak HP" value={`${peakHp.toFixed(0)} HP`} accent="text-emerald-400" />
              <StatCard label="Peak Torque" value={`${peakTorque.toFixed(0)} lb-ft`} accent="text-blue-400" />
              <StatCard label="Redline" value={dyno.redline_rpm ? `${dyno.redline_rpm.toLocaleString()} RPM` : "—"} />
            </div>
            <div className="bg-stone-950 rounded-xl border border-stone-800 p-2">
              <DynoChart points={dyno.points} redlineRpm={dyno.redline_rpm} />
            </div>
            {dyno.summary && <p className="text-xs text-stone-500 mt-3 italic">{dyno.summary}</p>}
          </>
        ) : (
          loaded && !loading && !error && (
            <p className="text-sm text-stone-500">No dyno graph generated yet.</p>
          )
        )}

        <p className="text-[11px] text-stone-600 mt-4 pt-3 border-t border-stone-800">
          Simulated by AI — not a real pull, but close enough to argue about at a meet. Don't put your mortgage on it.
        </p>
      </div>
    </div>
  );
}
