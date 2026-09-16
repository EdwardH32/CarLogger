import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatCard from "./StatCard.jsx";

export default function PerformanceTab({ carId }) {
  const [perf, setPerf] = useState(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [perfError, setPerfError] = useState("");

  const [tracks, setTracks] = useState([]);
  const [trackName, setTrackName] = useState("");
  const [trackSaving, setTrackSaving] = useState(false);
  const [trackError, setTrackError] = useState("");

  const loadPerf = () => api.getPerformance(carId).then(setPerf).catch((err) => setPerfError(err.message));
  const loadTracks = () => api.getTracks(carId).then(setTracks).catch(() => {});

  useEffect(() => {
    setPerf(null);
    setTracks([]);
    setPerfError("");
    loadPerf();
    loadTracks();
  }, [carId]);

  const runPerfEstimate = async () => {
    setPerfLoading(true);
    setPerfError("");
    try {
      const result = await api.estimatePerformance(carId);
      setPerf(result);
    } catch (err) {
      setPerfError(err.message);
    } finally {
      setPerfLoading(false);
    }
  };

  const addTrack = async (e) => {
    e.preventDefault();
    setTrackError("");
    if (!trackName.trim()) {
      setTrackError("Track name is required.");
      return;
    }
    setTrackSaving(true);
    try {
      await api.addTrack({ car_id: carId, track_name: trackName.trim() });
      setTrackName("");
      loadTracks();
    } catch (err) {
      setTrackError(err.message);
    } finally {
      setTrackSaving(false);
    }
  };

  const removeTrack = async (id) => {
    await api.deleteTrack(id);
    loadTracks();
  };

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-300">Estimated performance</h3>
          <button onClick={runPerfEstimate} className="btn-secondary text-xs px-3 py-1.5" disabled={perfLoading}>
            {perfLoading ? "Calculating..." : perf ? "Re-estimate" : "✨ Estimate performance"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="0-60 mph" value={perf ? `${perf.zero_to_60.toFixed(1)}s` : "—"} />
          <StatCard label="Top Speed" value={perf ? `${perf.top_speed.toFixed(0)} mph` : "—"} />
          <StatCard label="Nordschleife" value={perf?.nordschleife_time || "—"} sub="Nürburgring lap time" />
        </div>

        {perf?.summary && <p className="text-xs text-stone-500 mt-3 italic">{perf.summary}</p>}
        {perfError && <p className="text-xs text-rose-400 mt-3">{perfError}</p>}
        {!perf && !perfError && !perfLoading && (
          <p className="text-xs text-stone-500 mt-3">
            Estimates use this car's current output (baseline + logged mod gains).
          </p>
        )}
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-stone-300 mb-3">Track lap times</h3>

        <form onSubmit={addTrack} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            className="input flex-1"
            value={trackName}
            onChange={(e) => setTrackName(e.target.value)}
            placeholder="Laguna Seca, Spa-Francorchamps, Road Atlanta..."
            disabled={trackSaving}
          />
          <button type="submit" className="btn-primary text-sm whitespace-nowrap" disabled={trackSaving}>
            {trackSaving ? "Estimating..." : "✨ Add track"}
          </button>
        </form>
        {trackError && <p className="text-xs text-rose-400 -mt-2 mb-3">{trackError}</p>}

        {tracks.length === 0 ? (
          <p className="text-sm text-stone-500">No tracks added yet.</p>
        ) : (
          <div className="space-y-3">
            {tracks.map((track) => (
              <div key={track.id} className="flex items-start justify-between gap-4 border-t border-stone-800 pt-3 first:border-t-0 first:pt-0">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h4 className="font-semibold text-stone-100">{track.track_name}</h4>
                    <span className="text-emerald-400 font-semibold text-sm">{track.lap_time}</span>
                  </div>
                  {track.summary && <p className="text-xs text-stone-500 mt-1 italic">{track.summary}</p>}
                </div>
                <button onClick={() => removeTrack(track.id)} className="btn-danger px-2 py-1 text-xs shrink-0">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
