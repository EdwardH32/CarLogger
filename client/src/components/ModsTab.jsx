import { useEffect, useState } from "react";
import { api } from "../api.js";

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const emptyForm = { name: "", description: "", cost: "", install_date: "" };

export default function ModsTab({ carId, onChange }) {
  const [mods, setMods] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [estimatingId, setEstimatingId] = useState(null);
  const [estimateError, setEstimateError] = useState({});

  const load = () => api.getMods(carId).then(setMods).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, [carId]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Mod name is required.");
      return;
    }
    setSaving(true);
    try {
      await api.createMod({
        car_id: carId,
        name: form.name.trim(),
        description: form.description.trim(),
        cost: form.cost === "" ? 0 : Number(form.cost),
        install_date: form.install_date || null,
      });
      setForm(emptyForm);
      load();
      onChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await api.deleteMod(id);
    load();
    onChange?.();
  };

  const estimate = async (id) => {
    setEstimatingId(id);
    setEstimateError((prev) => ({ ...prev, [id]: null }));
    try {
      await api.estimateMod(id);
      load();
      onChange?.();
    } catch (err) {
      setEstimateError((prev) => ({ ...prev, [id]: err.message }));
    } finally {
      setEstimatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-stone-300">Log a new mod</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Mod name</label>
            <input className="input" value={form.name} onChange={update("name")} placeholder="Cobb Stage 2 tune" />
          </div>
          <div>
            <label className="label">Cost</label>
            <input className="input" type="number" value={form.cost} onChange={update("cost")} placeholder="800" />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={2}
            value={form.description}
            onChange={update("description")}
            placeholder="93 octane pump gas map, stock turbo, aftermarket downpipe"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Install date</label>
            <input className="input" type="date" value={form.install_date} onChange={update("install_date")} />
          </div>
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Add mod"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {mods.length === 0 && <p className="text-sm text-stone-500">No mods logged yet.</p>}
        {mods.map((mod) => (
          <div key={mod.id} className="card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h4 className="font-semibold text-stone-100">{mod.name}</h4>
                {mod.description && <p className="text-sm text-stone-400 mt-1">{mod.description}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-500">
                  <span>{money(mod.cost)}</span>
                  {mod.install_date && <span>Installed {mod.install_date}</span>}
                </div>
              </div>
              <button onClick={() => remove(mod.id)} className="btn-danger px-2 py-1 text-xs">
                Delete
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-stone-800">
              {mod.estimated_hp_gain != null ? (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-emerald-400 font-semibold text-sm">+{mod.estimated_hp_gain.toFixed(0)} HP</span>
                  <span className="text-emerald-400 font-semibold text-sm">+{mod.estimated_torque_gain.toFixed(0)} lb-ft</span>
                  <button
                    onClick={() => estimate(mod.id)}
                    className="btn-ghost text-xs px-2 py-1"
                    disabled={estimatingId === mod.id}
                  >
                    {estimatingId === mod.id ? "Re-estimating..." : "Re-run AI estimate"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => estimate(mod.id)}
                  className="btn-secondary text-xs px-3 py-1.5"
                  disabled={estimatingId === mod.id}
                >
                  {estimatingId === mod.id ? "Asking AI..." : "✨ Get AI HP/Torque estimate"}
                </button>
              )}
              {mod.ai_summary && <p className="text-xs text-stone-500 mt-2 italic">{mod.ai_summary}</p>}
              {estimateError[mod.id] && <p className="text-xs text-rose-400 mt-2">{estimateError[mod.id]}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
