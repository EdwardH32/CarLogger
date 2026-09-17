import { useEffect, useState } from "react";
import { api } from "../api.js";

const fmt = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

function PostCard({ author, avatar, createdAt, body, canDelete, onDelete }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-lg">{avatar || "🚗"}</span>
          <span className="font-medium text-stone-200">{author}</span>
          <span className="text-xs text-stone-500">{fmt(createdAt)}</span>
        </div>
        {canDelete && (
          <button onClick={onDelete} className="text-xs text-rose-400 hover:text-rose-300">
            Delete
          </button>
        )}
      </div>
      <p className="text-sm text-stone-300 mt-2 whitespace-pre-wrap">{body}</p>
    </div>
  );
}

export default function ForumThreadDetail({ threadId, currentUser, onBack, onDeleted, onGoToAccount }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [posting, setPosting] = useState(false);

  const load = () =>
    api
      .getForumThread(threadId)
      .then(setData)
      .catch((err) => setError(err.message));

  useEffect(() => {
    setData(null);
    setError("");
    load();
  }, [threadId]);

  const submitReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setPosting(true);
    setError("");
    try {
      await api.createForumReply(threadId, { body: reply });
      setReply("");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const deleteThread = async () => {
    if (!confirm("Delete this thread and all its replies?")) return;
    await api.deleteForumThread(threadId);
    onDeleted?.();
  };

  const deleteReply = async (id) => {
    await api.deleteForumReply(id);
    load();
  };

  if (error) return <p className="text-rose-400">{error}</p>;
  if (!data) return <p className="text-stone-500">Loading...</p>;

  const { thread, replies } = data;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-stone-500 hover:text-stone-300">
        ← Back to Forums
      </button>

      <h1 className="text-2xl font-bold">{thread.title}</h1>

      <PostCard
        author={thread.display_name || thread.username}
        avatar={thread.avatar}
        createdAt={thread.created_at}
        body={thread.body}
        canDelete={currentUser?.id === thread.user_id}
        onDelete={deleteThread}
      />

      {replies.length > 0 && (
        <div className="space-y-3">
          {replies.map((r) => (
            <PostCard
              key={r.id}
              author={r.display_name || r.username}
              avatar={r.avatar}
              createdAt={r.created_at}
              body={r.body}
              canDelete={currentUser?.id === r.user_id}
              onDelete={() => deleteReply(r.id)}
            />
          ))}
        </div>
      )}

      {currentUser ? (
        <form onSubmit={submitReply} className="card p-4 space-y-3">
          <label className="label">Reply</label>
          <textarea
            className="input"
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Add to the thread"
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end">
            <button type="submit" className="btn-primary text-sm" disabled={posting}>
              {posting ? "Posting..." : "Post reply"}
            </button>
          </div>
        </form>
      ) : (
        <div className="card p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-stone-500">Log in to reply to this thread.</p>
          <button onClick={onGoToAccount} className="btn-secondary text-sm shrink-0">
            Log in
          </button>
        </div>
      )}
    </div>
  );
}
