export default function StatCard({ label, value, accent = "text-slate-100", sub }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}
