export default function Sidebar({
  cars,
  selectedCarId,
  view,
  onSelectCar,
  onSelectDashboard,
  onAddCar,
  isOpen,
  onClose,
}) {
  return (
    <aside
      className={`w-64 shrink-0 border-r border-stone-800 bg-stone-950 md:bg-stone-950/80 flex flex-col h-screen fixed md:sticky top-0 left-0 z-40 transition-transform duration-200 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0`}
    >
      <div className="p-4 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚗</span>
          <span className="text-lg font-bold tracking-tight">CarLogger</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-stone-500 hover:text-stone-300 text-xl leading-none"
          aria-label="Close menu"
        >
          &times;
        </button>
      </div>

      <nav className="p-2">
        <button
          onClick={onSelectDashboard}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === "dashboard" ? "bg-brand-600 text-white" : "text-stone-300 hover:bg-stone-800"
          }`}
        >
          📊 Dashboard
        </button>
      </nav>

      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Garage</p>
        <button onClick={onAddCar} className="text-brand-400 hover:text-brand-300 text-lg leading-none" title="Add car">
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {cars.length === 0 && <p className="px-3 text-sm text-stone-600">No cars yet.</p>}
        {cars.map((car) => (
          <button
            key={car.id}
            onClick={() => onSelectCar(car.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              view === "car" && selectedCarId === car.id
                ? "bg-brand-600 text-white"
                : "text-stone-300 hover:bg-stone-800"
            }`}
          >
            <div className="font-medium truncate">{car.nickname || `${car.year} ${car.make}`}</div>
            <div className="text-xs opacity-70 truncate">
              {car.nickname ? `${car.year} ${car.make} ${car.model}` : car.model}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
