import { useEffect, useState } from "react";
import { api } from "../api.js";

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const TIERS = [
  { id: "under-1500", label: "Under $1,500", test: (c) => c < 1500 },
  { id: "1500-5000", label: "$1,500 – $5,000", test: (c) => c >= 1500 && c < 5000 },
  { id: "5000-10000", label: "$5,000 – $10,000", test: (c) => c >= 5000 && c < 10000 },
  { id: "10000-plus", label: "$10,000+", test: (c) => c >= 10000 },
];

export default function ModRecommendations({ carId, onModAdded }) {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    setRecs([]);
    setLoaded(false);
    setError("");
    setAddedIds(new Set());
    api
      .getModRecommendations(carId)
      .then((rows) => {
        setRecs(rows);
        setLoaded(true);
      })
      .catch((err) => setError(err.message));
  }, [carId]);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await api.generateModRecommendations(carId);
      setRecs(rows);
      setAddedIds(new Set());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addToMods = async (rec) => {
    setAddingId(rec.id);
    setError("");
    try {
      await api.createMod({
        car_id: carId,
        name: rec.name,
        description: rec.description,
        cost: rec.estimated_cost,
        install_date: null,
      });
      setAddedIds((prev) => new Set(prev).add(rec.id));
      onModAdded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-300">Common mods for this car</h3>
          <p className="text-xs text-stone-500 mt-0.5">Popular upgrades other owners of this platform install.</p>
        </div>
        <button onClick={generate} className="btn-secondary text-xs px-3 py-1.5 shrink-0" disabled={loading}>
          {loading ? "Calculating..." : recs.length > 0 ? "Re-generate" : "✨ Get recommendations"}
        </button>
      </div>

      {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}

      {recs.length === 0 ? (
        loaded && !loading && <p className="text-sm text-stone-500">No recommendations generated yet.</p>
      ) : (
        <div className="space-y-5">
          {TIERS.map((tier) => {
            const tierRecs = recs.filter((rec) => tier.test(rec.estimated_cost));
            if (tierRecs.length === 0) return null;

            return (
              <div key={tier.id}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">{tier.label}</h4>
                <div className="space-y-3">
                  {tierRecs.map((rec) => {
                    const added = addedIds.has(rec.id);
                    return (
                      <div
                        key={rec.id}
                        className="flex items-start justify-between gap-4 border-t border-stone-800 pt-3 first:border-t-0 first:pt-0"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-stone-100 text-sm">{rec.name}</h4>
                            {rec.category && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                                {rec.category}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-stone-500">
                            <span>~{money(rec.estimated_cost)}</span>
                            {(rec.estimated_hp_gain > 0 || rec.estimated_torque_gain > 0) && (
                              <span className="text-emerald-400">
                                +{rec.estimated_hp_gain.toFixed(0)} HP / +{rec.estimated_torque_gain.toFixed(0)} lb-ft
                              </span>
                            )}
                          </div>
                          {rec.description && <p className="text-xs text-stone-500 mt-1">{rec.description}</p>}
                        </div>
                        <button
                          onClick={() => addToMods(rec)}
                          className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                          disabled={added || addingId === rec.id}
                        >
                          {added ? "Added ✓" : addingId === rec.id ? "Adding..." : "Add to my mods"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
