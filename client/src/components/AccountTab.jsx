import { useRef, useState } from "react";
import { api, setToken } from "../api.js";
import Avatar from "./Avatar.jsx";

const AVATAR_CHOICES = ["🚗", "🏎️", "🛻", "🚙", "🔧", "🏁", "⚙️", "💨"];

function LoginForm({ onSwitch, onAuthed }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { token, user } = await api.login(form);
      setToken(token);
      onAuthed(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3 max-w-sm">
      <h3 className="text-sm font-semibold text-stone-300">Log in</h3>
      <div>
        <label className="label">Username or email</label>
        <input className="input" value={form.username} onChange={update("username")} autoComplete="username" />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          className="input"
          type="password"
          value={form.password}
          onChange={update("password")}
          autoComplete="current-password"
        />
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={onSwitch} className="text-xs text-stone-500 hover:text-stone-300">
          Need an account? Sign up
        </button>
        <button type="submit" className="btn-primary text-sm" disabled={saving}>
          {saving ? "Logging in..." : "Log in"}
        </button>
      </div>
    </form>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterForm({ onSwitch, onAuthed }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", display_name: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      setError("Username, email, and password are required.");
      return;
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setSaving(true);
    try {
      const { token, user } = await api.register(form);
      setToken(token);
      onAuthed(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-4 space-y-3 max-w-sm">
      <h3 className="text-sm font-semibold text-stone-300">Sign up</h3>
      <div>
        <label className="label">Username</label>
        <input
          className="input"
          value={form.username}
          onChange={update("username")}
          placeholder="e.g. wrx_wagoneer"
          autoComplete="username"
        />
        <p className="text-xs text-stone-500 mt-1">3-20 characters: letters, numbers, underscore.</p>
      </div>
      <div>
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          value={form.email}
          onChange={update("email")}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="label">Display name (optional)</label>
        <input className="input" value={form.display_name} onChange={update("display_name")} placeholder="Shown on your posts" />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          className="input"
          type="password"
          value={form.password}
          onChange={update("password")}
          autoComplete="new-password"
        />
        <p className="text-xs text-stone-500 mt-1">At least 6 characters.</p>
      </div>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={onSwitch} className="text-xs text-stone-500 hover:text-stone-300">
          Already have an account? Log in
        </button>
        <button type="submit" className="btn-primary text-sm" disabled={saving}>
          {saving ? "Signing up..." : "Sign up"}
        </button>
      </div>
    </form>
  );
}

function ProfileView({ user, onUpdated, onLogout }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    display_name: user.display_name || "",
    avatar: user.avatar || "🚗",
    bio: user.bio || "",
    location: user.location || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const startEdit = () => {
    setForm({
      display_name: user.display_name || "",
      avatar: user.avatar || "🚗",
      bio: user.bio || "",
      location: user.location || "",
    });
    setError("");
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { user: updated } = await api.updateMe(form);
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore — we're logging out client-side regardless
    }
    onLogout();
  };

  const pickAvatarFile = () => avatarInputRef.current?.click();
  const pickBannerFile = () => bannerInputRef.current?.click();

  const onAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError("");
    try {
      const { user: updated } = await api.uploadAvatar(file);
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const onBannerFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setError("");
    try {
      const { user: updated } = await api.uploadBanner(file);
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  const removeAvatarPhoto = async () => {
    const { user: updated } = await api.removeAvatarPhoto();
    onUpdated(updated);
  };

  const removeBannerPhoto = async () => {
    const { user: updated } = await api.removeBannerPhoto();
    onUpdated(updated);
  };

  const hiddenFileInputs = (
    <>
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onAvatarFileChange}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onBannerFileChange}
      />
    </>
  );

  if (editing) {
    return (
      <form onSubmit={save} className="card p-4 space-y-4 max-w-sm">
        <h3 className="text-sm font-semibold text-stone-300">Edit profile</h3>

        {hiddenFileInputs}

        <div>
          <label className="label">Banner</label>
          <div className="h-20 rounded-lg bg-stone-950 border border-stone-800 overflow-hidden relative">
            {user.banner_photo && (
              <img src={`/uploads/${user.banner_photo}`} alt="Banner" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={pickBannerFile} className="btn-secondary text-xs px-3 py-1.5" disabled={uploadingBanner}>
              {uploadingBanner ? "Uploading..." : "Upload banner"}
            </button>
            {user.banner_photo && (
              <button type="button" onClick={removeBannerPhoto} className="btn-ghost text-xs px-3 py-1.5">
                Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="label">Photo</label>
          <div className="flex items-center gap-3">
            <Avatar photo={user.avatar_photo} emoji={form.avatar} size="lg" />
            <div className="flex gap-2">
              <button type="button" onClick={pickAvatarFile} className="btn-secondary text-xs px-3 py-1.5" disabled={uploadingAvatar}>
                {uploadingAvatar ? "Uploading..." : "Upload photo"}
              </button>
              {user.avatar_photo && (
                <button type="button" onClick={removeAvatarPhoto} className="btn-ghost text-xs px-3 py-1.5">
                  Remove
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-stone-500 mt-2">Or pick an emoji, used when there's no photo:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {AVATAR_CHOICES.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setForm({ ...form, avatar: a })}
                className={`text-xl w-10 h-10 rounded-lg border transition-colors ${
                  form.avatar === a ? "border-brand-500 bg-stone-800" : "border-stone-800 hover:bg-stone-800"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Display name</label>
          <input
            className="input"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Location</label>
          <input
            className="input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Portland, OR"
          />
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea
            className="input"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell the forums about your build"
          />
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-secondary text-sm" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary text-sm" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="card max-w-sm overflow-hidden">
      <div className="h-24 bg-stone-950">
        {user.banner_photo && (
          <img src={`/uploads/${user.banner_photo}`} alt="Banner" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-4 pt-0 space-y-4">
        <Avatar photo={user.avatar_photo} emoji={user.avatar} size="xl" className="-mt-10 border-4 border-stone-950" />
        <div className="min-w-0">
          <h3 className="font-semibold text-stone-100 truncate">{user.display_name || user.username}</h3>
          <p className="text-xs text-stone-500">@{user.username}</p>
          {user.location && <p className="text-xs text-stone-500 mt-1">{user.location}</p>}
        </div>
        {user.bio && <p className="text-sm text-stone-400">{user.bio}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={startEdit} className="btn-secondary text-sm">
            Edit profile
          </button>
          <button onClick={logout} className="btn-danger text-sm">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AccountTab({ currentUser, onAuthed, onUpdated, onLogout }) {
  const [mode, setMode] = useState("login");

  if (currentUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Account</h1>
        <ProfileView user={currentUser} onUpdated={onUpdated} onLogout={onLogout} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-stone-500 text-sm mt-1">Log in to post in the forums and keep a profile.</p>
      </div>
      {mode === "login" ? (
        <LoginForm onSwitch={() => setMode("register")} onAuthed={onAuthed} />
      ) : (
        <RegisterForm onSwitch={() => setMode("login")} onAuthed={onAuthed} />
      )}
    </div>
  );
}
