import { useEffect, useState } from "react";
import { api } from "../api.js";
import Avatar from "./Avatar.jsx";

const fmt = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function ForumsTab({ currentUser, onSelectThread, onGoToAccount }) {
  const [threads, setThreads] = useState([]);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  const [saving, setSaving] = useState(false);

  const load = () => api.getForumThreads().then(setThreads).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    setError("");
    try {
      const thread = await api.createForumThread(form);
      setForm({ title: "", body: "" });
      setShowNew(false);
      await load();
      onSelectThread(thread.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Forums</h1>
          <p className="text-stone-500 text-sm mt-1">Build threads, questions, and bragging rights.</p>
        </div>
        {currentUser ? (
          <button onClick={() => setShowNew((v) => !v)} className="btn-primary text-sm shrink-0">
            {showNew ? "Cancel" : "+ New thread"}
          </button>
        ) : (
          <button onClick={onGoToAccount} className="btn-secondary text-sm shrink-0">
            Log in to post
          </button>
        )}
      </div>

      {showNew && currentUser && (
        <form onSubmit={submit} className="card p-4 space-y-3">
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What's this thread about?"
            />
          </div>
          <div>
            <label className="label">Post</label>
            <textarea
              className="input"
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Share the details"
            />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end">
            <button type="submit" className="btn-primary text-sm" disabled={saving}>
              {saving ? "Posting..." : "Post thread"}
            </button>
          </div>
        </form>
      )}

      {error && !showNew && <p className="text-sm text-rose-400">{error}</p>}

      <div className="card divide-y divide-stone-800">
        {threads.length === 0 ? (
          <p className="text-sm text-stone-500 p-4">No threads yet. Be the first to post.</p>
        ) : (
          threads.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectThread(t.id)}
              className="w-full text-left p-4 hover:bg-stone-900/60 transition-colors flex items-start justify-between gap-4"
            >
              <div className="min-w-0 flex items-start gap-2">
                <Avatar photo={t.avatar_photo} emoji={t.avatar} size="xs" className="mt-0.5" />
                <div className="min-w-0">
                  <h4 className="font-medium text-stone-100 truncate">{t.title}</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    {t.display_name || t.username} · {fmt(t.last_activity)}
                  </p>
                </div>
              </div>
              <span className="text-xs text-stone-500 shrink-0">
                {t.reply_count} {t.reply_count === 1 ? "reply" : "replies"}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
