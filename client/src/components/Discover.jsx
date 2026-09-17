import { useEffect, useState } from "react";
import { api } from "../api.js";
import Avatar from "./Avatar.jsx";

const SWIPE_THRESHOLD = 100;

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Discover({ currentUser, onGoToAccount }) {
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connections, setConnections] = useState([]);
  const [showConnections, setShowConnections] = useState(false);
  const [toast, setToast] = useState("");

  const [drag, setDrag] = useState(null); // { startX, startY, dx, dy }
  const [exit, setExit] = useState(null); // "left" | "right"

  const loadDeck = () => {
    setLoading(true);
    setError("");
    api
      .getUsers()
      .then((users) => {
        setDeck(shuffle(users));
        setIndex(0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setConnections([]);
      return;
    }
    api.getConnections().then(setConnections).catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const current = deck[index];
  const next = deck[index + 1];

  const commitSwipe = (dir) => {
    if (!current || exit) return;
    setExit(dir);
    if (dir === "right") {
      if (!currentUser) {
        setToast("Log in to connect with people");
      } else {
        api
          .connectUser(current.id)
          .then(() => setConnections((c) => [{ ...current, connected_at: new Date().toISOString() }, ...c]))
          .catch((err) => setToast(err.message));
      }
    }
    setTimeout(() => {
      setIndex((i) => i + 1);
      setExit(null);
      setDrag(null);
    }, 220);
  };

  const onPointerDown = (e) => {
    if (exit) return;
    setDrag({ startX: e.clientX, startY: e.clientY, dx: 0, dy: 0 });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag) return;
    setDrag((d) => ({ ...d, dx: e.clientX - d.startX, dy: e.clientY - d.startY }));
  };

  const onPointerUp = () => {
    if (!drag) return;
    if (Math.abs(drag.dx) > SWIPE_THRESHOLD) {
      commitSwipe(drag.dx > 0 ? "right" : "left");
    } else {
      setDrag(null);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") commitSwipe("right");
      if (e.key === "ArrowLeft") commitSwipe("left");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, exit]);

  const dx = exit ? (exit === "right" ? 600 : -600) : drag?.dx || 0;
  const dy = exit ? 0 : drag?.dy || 0;
  const rotate = dx / 28;
  const cardStyle = {
    transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`,
    transition: drag && !exit ? "none" : "transform 220ms ease, opacity 220ms ease",
    opacity: exit ? 0 : 1,
  };
  const connectAmount = Math.min(Math.max(dx, 0) / SWIPE_THRESHOLD, 1);
  const skipAmount = Math.min(Math.max(-dx, 0) / SWIPE_THRESHOLD, 1);
  const edgeColor = connectAmount > 0 ? `rgba(52, 211, 153, ${connectAmount})` : "#292524";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Discover</h1>
          <p className="text-stone-500 text-sm mt-1">Meet other people in the CarLogger community.</p>
        </div>
        {currentUser ? (
          <button onClick={() => setShowConnections((v) => !v)} className="btn-secondary text-sm shrink-0">
            Connections ({connections.length})
          </button>
        ) : (
          <button onClick={onGoToAccount} className="btn-secondary text-sm shrink-0">
            Log in to connect
          </button>
        )}
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-stone-500">Loading the community...</p>
      ) : deck.length === 0 ? (
        <div className="card p-8 text-center text-stone-500">No one else has joined yet.</div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-sm h-[340px]">
            {!current && (
              <div className="card absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3">
                <p className="text-lg font-semibold text-stone-200">You've seen everyone in the community.</p>
                <button onClick={loadDeck} className="btn-primary text-sm">
                  Start over
                </button>
              </div>
            )}

            {next && (
              <div className="card absolute inset-0 overflow-hidden scale-95 translate-y-2 -z-10">
                <CardBody user={next} />
              </div>
            )}

            {current && (
              <div
                className="card absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
                style={{ ...cardStyle, borderColor: edgeColor }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                <span
                  className="absolute top-3 left-3 z-10 text-xs font-semibold uppercase tracking-wide text-emerald-400"
                  style={{ opacity: connectAmount }}
                >
                  Connect
                </span>
                <span
                  className="absolute top-3 right-3 z-10 text-xs font-semibold uppercase tracking-wide text-stone-400"
                  style={{ opacity: skipAmount }}
                >
                  Skip
                </span>
                <CardBody user={current} />
              </div>
            )}
          </div>

          {current && (
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => commitSwipe("left")} className="btn-secondary text-sm">
                Pass
              </button>
              <button onClick={() => commitSwipe("right")} className="btn-primary text-sm">
                Connect
              </button>
            </div>
          )}

          {toast && <p className="mt-4 text-xs text-stone-400 bg-stone-900 border border-stone-800 rounded-lg px-3 py-1.5">{toast}</p>}
        </div>
      )}

      {showConnections && currentUser && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-stone-300 mb-3">Your connections</h3>
          {connections.length === 0 ? (
            <p className="text-sm text-stone-500">Swipe right on someone to connect with them.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {connections.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-950 p-3">
                  <Avatar photo={u.avatar_photo} emoji={u.avatar} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-stone-100 truncate">{u.display_name || u.username}</p>
                    <p className="text-xs text-stone-500 truncate">@{u.username}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CardBody({ user }) {
  return (
    <div className="h-full flex flex-col items-center text-center p-6 gap-3">
      <Avatar photo={user.avatar_photo} emoji={user.avatar} size="xl" className="mt-4" />
      <div>
        <h3 className="text-xl font-bold text-stone-100">{user.display_name || user.username}</h3>
        <p className="text-sm text-stone-500">
          @{user.username}
          {user.location ? ` · ${user.location}` : ""}
        </p>
      </div>
      <p className="text-sm text-stone-400 max-w-xs">{user.bio || "No bio yet."}</p>
    </div>
  );
}
