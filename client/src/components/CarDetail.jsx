import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatCard from "./StatCard.jsx";
import ModsTab from "./ModsTab.jsx";
import MaintenanceTab from "./MaintenanceTab.jsx";
import PerformanceTab from "./PerformanceTab.jsx";
import DynoTab from "./DynoTab.jsx";
import CarPhotos from "./CarPhotos.jsx";

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function CarDetail({ carId, onDeleted, notifyChange }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("mods");
  const [error, setError] = useState("");

  const [editingMileage, setEditingMileage] = useState(false);
  const [mileageInput, setMileageInput] = useState("");
  const [mileageSaving, setMileageSaving] = useState(false);

  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);

  const loadSummary = () =>
    api
      .getCarSummary(carId)
      .then(setData)
      .catch((err) => setError(err.message));

  useEffect(() => {
    setData(null);
    setTab("mods");
    setEditingMileage(false);
    setEditingNickname(false);
    loadSummary();
  }, [carId]);

  const handleChange = () => {
    loadSummary();
    notifyChange?.();
  };

  const deleteCar = async () => {
    if (!confirm("Delete this car and all its mods/maintenance history?")) return;
    await api.deleteCar(carId);
    onDeleted?.();
  };

  const startEditMileage = () => {
    setMileageInput(data?.car.mileage != null ? String(data.car.mileage) : "");
    setEditingMileage(true);
  };

  const saveMileage = async (e) => {
    e.preventDefault();
    if (mileageInput === "") return;
    setMileageSaving(true);
    try {
      await api.updateCar(carId, { mileage: Number(mileageInput) });
      setEditingMileage(false);
      loadSummary();
    } finally {
      setMileageSaving(false);
    }
  };

  const startEditNickname = () => {
    setNicknameInput(data?.car.nickname || "");
    setEditingNickname(true);
  };

  const saveNickname = async (e) => {
    e.preventDefault();
    setNicknameSaving(true);
    try {
      await api.updateCar(carId, { nickname: nicknameInput.trim() });
      setEditingNickname(false);
      loadSummary();
      notifyChange?.();
    } finally {
      setNicknameSaving(false);
    }
  };

  if (error) return <p className="text-rose-400">{error}</p>;
  if (!data) return <p className="text-stone-500">Loading...</p>;

  const { car, summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          {editingNickname ? (
            <form onSubmit={saveNickname} className="flex items-center gap-1.5">
              <input
                className="input py-1 px-2 text-lg font-bold w-56"
                autoFocus
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Nickname"
              />
              <button type="submit" className="text-brand-400 hover:text-brand-300 text-xs" disabled={nicknameSaving}>
                {nicknameSaving ? "..." : "Save"}
              </button>
              <button
                type="button"
                className="text-stone-500 hover:text-stone-300 text-xs"
                onClick={() => setEditingNickname(false)}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button onClick={startEditNickname} className="group flex items-center gap-2">
              <h1 className="text-2xl font-bold">{car.nickname || `${car.year} ${car.make} ${car.model}`}</h1>
              <span className="text-xs text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {car.nickname ? "edit" : "+ nickname"}
              </span>
            </button>
          )}
          {car.nickname && (
            <p className="text-sm text-stone-500 mt-0.5">
              {car.year} {car.make} {car.model}
            </p>
          )}
          <div className="flex items-center gap-2 text-sm mt-1">
            <p className="text-stone-500">
              Baseline: {car.base_hp} HP / {car.base_torque} lb-ft
            </p>
            <span className="text-stone-700">·</span>
            {editingMileage ? (
              <form onSubmit={saveMileage} className="flex items-center gap-1.5">
                <input
                  className="input py-0.5 px-2 w-28 text-sm"
                  type="number"
                  autoFocus
                  value={mileageInput}
                  onChange={(e) => setMileageInput(e.target.value)}
                  placeholder="mileage"
                />
                <span className="text-stone-500">mi</span>
                <button type="submit" className="text-brand-400 hover:text-brand-300 text-xs" disabled={mileageSaving}>
                  {mileageSaving ? "..." : "Save"}
                </button>
                <button
                  type="button"
                  className="text-stone-500 hover:text-stone-300 text-xs"
                  onClick={() => setEditingMileage(false)}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button onClick={startEditMileage} className="text-stone-500 hover:text-stone-300 underline decoration-dotted">
                {car.mileage != null ? `${car.mileage.toLocaleString()} mi` : "Set mileage"}
              </button>
            )}
          </div>
        </div>
        <button onClick={deleteCar} className="btn-danger text-sm">
          Delete car
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Power Gain" value={`+${summary.total_hp_gain.toFixed(0)} HP`} accent="text-emerald-400" />
        <StatCard label="Torque Gain" value={`+${summary.total_torque_gain.toFixed(0)} lb-ft`} accent="text-emerald-400" />
        <StatCard label="Total Spend" value={money(summary.total_spend)} sub={`${money(summary.mod_spend)} mods · ${money(summary.maintenance_spend)} maint.`} />
        <StatCard label="Cost per HP" value={summary.cost_per_hp != null ? money(summary.cost_per_hp) : "—"} />
      </div>

      <div className="flex gap-2 border-b border-stone-800">
        {[
          { id: "mods", label: `Mods (${summary.mod_count})` },
          { id: "maintenance", label: `Maintenance (${summary.maintenance_count})` },
          { id: "performance", label: "Performance" },
          { id: "dyno", label: "Dyno" },
          { id: "photos", label: "Photos" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? "border-brand-500 text-brand-400" : "border-transparent text-stone-500 hover:text-stone-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "mods" && <ModsTab carId={car.id} onChange={handleChange} />}
      {tab === "maintenance" && <MaintenanceTab car={car} onChange={handleChange} />}
      {tab === "performance" && <PerformanceTab carId={car.id} />}
      {tab === "dyno" && <DynoTab carId={car.id} />}
      {tab === "photos" && <CarPhotos carId={car.id} />}
    </div>
  );
}
