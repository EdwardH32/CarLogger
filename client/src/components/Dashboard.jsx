import { useEffect, useState } from "react";
import { api } from "../api.js";
import StatCard from "./StatCard.jsx";

const money = (n) => `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function Dashboard({ refreshKey, onSelectCar }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getGlobalSummary()
      .then(setData)
      .catch((err) => setError(err.message));
  }, [refreshKey]);

  if (error) return <p className="text-rose-400">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading...</p>;

  const { totals, cars } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Across {totals.car_count} car{totals.car_count === 1 ? "" : "s"} in your garage</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Power Gain" value={`+${totals.total_hp_gain.toFixed(0)} HP`} accent="text-emerald-400" />
        <StatCard label="Total Torque Gain" value={`+${totals.total_torque_gain.toFixed(0)} lb-ft`} accent="text-emerald-400" />
        <StatCard label="Total Spend" value={money(totals.total_spend)} />
        <StatCard
          label="Cost per HP"
          value={totals.cost_per_hp != null ? money(totals.cost_per_hp) : "—"}
          sub="mod spend ÷ HP gained"
        />
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Garage breakdown</h2>
        {cars.length === 0 ? (
          <p className="text-sm text-slate-500">Add a car to get started.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-800">
                  <th className="py-2 pr-4 font-medium">Car</th>
                  <th className="py-2 pr-4 font-medium">HP Gain</th>
                  <th className="py-2 pr-4 font-medium">Torque Gain</th>
                  <th className="py-2 pr-4 font-medium">Spend</th>
                  <th className="py-2 pr-4 font-medium">$/HP</th>
                </tr>
              </thead>
              <tbody>
                {cars.map(({ car, summary }) => (
                  <tr
                    key={car.id}
                    onClick={() => onSelectCar(car.id)}
                    className="border-b border-slate-900 hover:bg-slate-900/60 cursor-pointer"
                  >
                    <td className="py-2 pr-4 font-medium text-slate-200">
                      {car.year} {car.make} {car.model}
                    </td>
                    <td className="py-2 pr-4 text-emerald-400">+{summary.total_hp_gain.toFixed(0)} HP</td>
                    <td className="py-2 pr-4 text-emerald-400">+{summary.total_torque_gain.toFixed(0)} lb-ft</td>
                    <td className="py-2 pr-4">{money(summary.total_spend)}</td>
                    <td className="py-2 pr-4">{summary.cost_per_hp != null ? money(summary.cost_per_hp) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
