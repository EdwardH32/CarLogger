import { useEffect, useState } from "react";
import { api } from "../api.js";
import MaintenanceIntervals from "./MaintenanceIntervals.jsx";
import WearParts from "./WearParts.jsx";

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const emptyForm = { service: "", description: "", cost: "", service_date: "", mileage: "" };

export default function MaintenanceTab({ car, onChange }) {
  const carId = car.id;
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => api.getMaintenance(carId).then(setEntries).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, [carId]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.service.trim()) {
      setError("Service name is required.");
      return;
    }
    setSaving(true);
    try {
      await api.createMaintenance({
        car_id: carId,
        service: form.service.trim(),
        description: form.description.trim(),
        cost: form.cost === "" ? 0 : Number(form.cost),
        service_date: form.service_date || null,
        mileage: form.mileage === "" ? null : Number(form.mileage),
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
    await api.deleteMaintenance(id);
    load();
    onChange?.();
  };

  return (
    <div className="space-y-6">
      <MaintenanceIntervals car={car} entries={entries} />
      <WearParts car={car} entries={entries} />

      <form onSubmit={submit} className="card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">Log maintenance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Service</label>
            <input className="input" value={form.service} onChange={update("service")} placeholder="Oil change" />
          </div>
          <div>
            <label className="label">Cost</label>
            <input className="input" type="number" value={form.cost} onChange={update("cost")} placeholder="65" />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={2}
            value={form.description}
            onChange={update("description")}
            placeholder="5W-30 full synthetic, OEM filter"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Service date</label>
            <input className="input" type="date" value={form.service_date} onChange={update("service_date")} />
          </div>
          <div>
            <label className="label">Mileage</label>
            <input className="input" type="number" value={form.mileage} onChange={update("mileage")} placeholder="45000" />
          </div>
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Add entry"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {entries.length === 0 && <p className="text-sm text-slate-500">No maintenance logged yet.</p>}
        {entries.map((entry) => (
          <div key={entry.id} className="card p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h4 className="font-semibold text-slate-100">{entry.service}</h4>
              {entry.description && <p className="text-sm text-slate-400 mt-1">{entry.description}</p>}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                <span>{money(entry.cost)}</span>
                {entry.service_date && <span>{entry.service_date}</span>}
                {entry.mileage != null && <span>{entry.mileage.toLocaleString()} mi</span>}
              </div>
            </div>
            <button onClick={() => remove(entry.id)} className="btn-danger px-2 py-1 text-xs">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
