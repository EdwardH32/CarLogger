const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Cars
  getCars: () => request("/cars"),
  createCar: (data) => request("/cars", { method: "POST", body: JSON.stringify(data) }),
  updateCar: (id, data) => request(`/cars/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCar: (id) => request(`/cars/${id}`, { method: "DELETE" }),
  estimateCarStock: (data) => request("/cars/estimate-stock", { method: "POST", body: JSON.stringify(data) }),

  // Mods
  getMods: (carId) => request(`/mods?car_id=${carId}`),
  createMod: (data) => request("/mods", { method: "POST", body: JSON.stringify(data) }),
  deleteMod: (id) => request(`/mods/${id}`, { method: "DELETE" }),
  estimateMod: (id) => request(`/mods/${id}/estimate`, { method: "POST" }),

  // Maintenance
  getMaintenance: (carId) => request(`/maintenance?car_id=${carId}`),
  createMaintenance: (data) => request("/maintenance", { method: "POST", body: JSON.stringify(data) }),
  deleteMaintenance: (id) => request(`/maintenance/${id}`, { method: "DELETE" }),

  // Summary
  getGlobalSummary: () => request("/summary"),
  getCarSummary: (carId) => request(`/summary/${carId}`),

  // Performance (0-60, top speed, Nordschleife)
  getPerformance: (carId) => request(`/performance/${carId}`),
  estimatePerformance: (carId) => request(`/performance/${carId}/estimate`, { method: "POST" }),

  // Track lap times
  getTracks: (carId) => request(`/tracks?car_id=${carId}`),
  addTrack: (data) => request("/tracks", { method: "POST", body: JSON.stringify(data) }),
  deleteTrack: (id) => request(`/tracks/${id}`, { method: "DELETE" }),

  // Recommended maintenance intervals
  getMaintenanceIntervals: (carId) => request(`/maintenance-intervals?car_id=${carId}`),
  generateMaintenanceIntervals: (carId) =>
    request(`/maintenance-intervals/${carId}/generate`, { method: "POST" }),

  // Common known wear/failure parts
  getWearParts: (carId) => request(`/wear-parts?car_id=${carId}`),
  generateWearParts: (carId) => request(`/wear-parts/${carId}/generate`, { method: "POST" }),

  // Dyno graph (HP/torque curve)
  getDyno: (carId) => request(`/dyno/${carId}`),
  estimateDyno: (carId) => request(`/dyno/${carId}/estimate`, { method: "POST" }),
};
