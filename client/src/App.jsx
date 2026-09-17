import { useEffect, useState } from "react";
import { api, getToken, setToken } from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./components/Dashboard.jsx";
import CarDetail from "./components/CarDetail.jsx";
import AddCarModal from "./components/AddCarModal.jsx";
import AccountTab from "./components/AccountTab.jsx";
import ForumsTab from "./components/ForumsTab.jsx";
import ForumThreadDetail from "./components/ForumThreadDetail.jsx";
import Discover from "./components/Discover.jsx";

export default function App() {
  const [cars, setCars] = useState([]);
  const [view, setView] = useState("dashboard"); // "dashboard" | "car" | "account" | "forums" | "forum-thread" | "discover"
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [showAddCar, setShowAddCar] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const loadCars = () =>
    api
      .getCars()
      .then(setCars)
      .catch((err) => setLoadError(err.message));

  useEffect(() => {
    loadCars();
  }, [refreshKey]);

  useEffect(() => {
    if (!getToken()) return;
    api
      .getMe()
      .then(({ user }) => setCurrentUser(user))
      .catch(() => setToken(null));
  }, []);

  const bump = () => setRefreshKey((k) => k + 1);

  const selectCar = (id) => {
    setSelectedCarId(id);
    setView("car");
    setMobileNavOpen(false);
  };

  const selectDashboard = () => {
    setView("dashboard");
    setMobileNavOpen(false);
  };

  const goToAccount = () => {
    setView("account");
    setMobileNavOpen(false);
  };

  const goToForums = () => {
    setView("forums");
    setMobileNavOpen(false);
  };

  const goToDiscover = () => {
    setView("discover");
    setMobileNavOpen(false);
  };

  const selectThread = (id) => {
    setSelectedThreadId(id);
    setView("forum-thread");
    setMobileNavOpen(false);
  };

  const handleAuthed = (user) => {
    setCurrentUser(user);
    setView("forums");
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
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
    <div className="min-h-screen flex bg-stone-950">
      <header className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-950/95 backdrop-blur">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="text-stone-300 hover:text-stone-100 p-1 -ml-1"
          aria-label="Open menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-bold tracking-tight">🚗 CarLogger</span>
        <button
          onClick={() => setShowAddCar(true)}
          className="text-stone-300 hover:text-stone-100 text-xl leading-none p-1 -mr-1"
          aria-label="Add car"
        >
          +
        </button>
      </header>

      {mobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <Sidebar
        cars={cars}
        selectedCarId={selectedCarId}
        view={view}
        onSelectCar={selectCar}
        onSelectDashboard={selectDashboard}
        onSelectForums={goToForums}
        onSelectDiscover={goToDiscover}
        onSelectAccount={goToAccount}
        onAddCar={() => setShowAddCar(true)}
        currentUser={currentUser}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      <main className="flex-1 p-4 pt-20 md:p-10 md:pt-10 max-w-6xl min-w-0">
        {loadError && <p className="text-rose-400 mb-4">{loadError}</p>}

        {view === "dashboard" && <Dashboard refreshKey={refreshKey} onSelectCar={selectCar} />}

        {view === "car" && selectedCarId && (
          <CarDetail carId={selectedCarId} onDeleted={handleCarDeleted} notifyChange={bump} />
        )}

        {view === "account" && (
          <AccountTab
            currentUser={currentUser}
            onAuthed={handleAuthed}
            onUpdated={setCurrentUser}
            onLogout={handleLogout}
          />
        )}

        {view === "forums" && (
          <ForumsTab currentUser={currentUser} onSelectThread={selectThread} onGoToAccount={goToAccount} />
        )}

        {view === "discover" && <Discover currentUser={currentUser} onGoToAccount={goToAccount} />}

        {view === "forum-thread" && selectedThreadId && (
          <ForumThreadDetail
            threadId={selectedThreadId}
            currentUser={currentUser}
            onBack={goToForums}
            onDeleted={goToForums}
            onGoToAccount={goToAccount}
          />
        )}
      </main>

      {showAddCar && <AddCarModal onClose={() => setShowAddCar(false)} onCreate={handleCreateCar} />}
    </div>
  );
}
