import { useEffect, useState } from "react";
import { api } from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import CarDetail from "./components/CarDetail.jsx";
import AddCarModal from "./components/AddCarModal.jsx";

export default function App() {
  const [cars, setCars] = useState([]);
  const [view, setView] = useState("dashboard"); // "dashboard" | "car"
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [showAddCar, setShowAddCar] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState("");

  const loadCars = () =>
    api
      .getCars()
      .then(setCars)
      .catch((err) => setLoadError(err.message));

  useEffect(() => {
    loadCars();
  }, [refreshKey]);

  const bump = () => setRefreshKey((k) => k + 1);

  const selectCar = (id) => {
    setSelectedCarId(id);
    setView("car");
  };

  const handleCreateCar = async (payload) => {
    const car = await api.createCar(payload);
    bump();
    selectCar(car.id);
  };

  const handleCarDeleted = () => {
    setView("dashboard");
    setSelectedCarId(null);
    bump();
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      <Sidebar
        cars={cars}
        selectedCarId={selectedCarId}
        view={view}
        onSelectCar={selectCar}
        onSelectDashboard={() => setView("dashboard")}
        onAddCar={() => setShowAddCar(true)}
      />

      <main className="flex-1 p-6 md:p-10 max-w-6xl">
        {loadError && <p className="text-rose-400 mb-4">{loadError}</p>}

        {view === "dashboard" && <Dashboard refreshKey={refreshKey} onSelectCar={selectCar} />}

        {view === "car" && selectedCarId && (
          <CarDetail carId={selectedCarId} onDeleted={handleCarDeleted} notifyChange={bump} />
        )}
      </main>

      {showAddCar && <AddCarModal onClose={() => setShowAddCar(false)} onCreate={handleCreateCar} />}
    </div>
  );
}
