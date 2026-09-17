const BASE = "/api";
const TOKEN_KEY = "carlogger_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
}

async function requestFormData(path, formData) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return res.json();
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

  // Photos
  getPhotos: (carId) => request(`/photos?car_id=${carId}`),
  uploadPhoto: (carId, file, caption) => {
    const body = new FormData();
    body.append("car_id", carId);
    body.append("photo", file);
    if (caption) body.append("caption", caption);
    return requestFormData("/photos", body);
  },
  deletePhoto: (id) => request(`/photos/${id}`, { method: "DELETE" }),

  // Common mod recommendations
  getModRecommendations: (carId) => request(`/mod-recommendations?car_id=${carId}`),
  generateModRecommendations: (carId) =>
    request(`/mod-recommendations/${carId}/generate`, { method: "POST" }),

  // Account
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  getMe: () => request("/auth/me"),
  updateMe: (data) => request("/auth/me", { method: "PUT", body: JSON.stringify(data) }),
  uploadAvatar: (file) => {
    const body = new FormData();
    body.append("photo", file);
    return requestFormData("/auth/me/avatar", body);
  },
  removeAvatarPhoto: () => request("/auth/me/avatar", { method: "DELETE" }),
  uploadBanner: (file) => {
    const body = new FormData();
    body.append("photo", file);
    return requestFormData("/auth/me/banner", body);
  },
  removeBannerPhoto: () => request("/auth/me/banner", { method: "DELETE" }),

  // Community directory (Discover)
  getUsers: () => request("/users"),
  getConnections: () => request("/connections"),
  connectUser: (userId) => request("/connections", { method: "POST", body: JSON.stringify({ user_id: userId }) }),
  disconnectUser: (userId) => request(`/connections/${userId}`, { method: "DELETE" }),

  // Social forums
  getForumThreads: () => request("/forums/threads"),
  createForumThread: (data) => request("/forums/threads", { method: "POST", body: JSON.stringify(data) }),
  getForumThread: (id) => request(`/forums/threads/${id}`),
  deleteForumThread: (id) => request(`/forums/threads/${id}`, { method: "DELETE" }),
  createForumReply: (threadId, data) =>
    request(`/forums/threads/${threadId}/replies`, { method: "POST", body: JSON.stringify(data) }),
  deleteForumReply: (id) => request(`/forums/replies/${id}`, { method: "DELETE" }),
};
