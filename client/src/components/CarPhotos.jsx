import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

export default function CarPhotos({ carId }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = () => api.getPhotos(carId).then(setPhotos).catch((err) => setError(err.message));

  useEffect(() => {
    setPhotos([]);
    setPendingFile(null);
    setPreviewUrl("");
    setCaption("");
    setError("");
    load();
  }, [carId]);

  const pickFile = () => fileInputRef.current?.click();

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const cancelPending = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl("");
    setCaption("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const upload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    setError("");
    try {
      await api.uploadPhoto(carId, pendingFile, caption.trim());
      cancelPending();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id) => {
    await api.deletePhoto(id);
    load();
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-stone-300">Photos</h3>
        <button onClick={pickFile} className="btn-secondary text-xs px-3 py-1.5">
          📷 Add photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      {pendingFile && (
        <div className="rounded-xl border border-stone-800 p-3 mb-4 flex items-center gap-3">
          <img src={previewUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-stone-800" />
          <div className="flex-1 min-w-0">
            <input
              className="input text-sm"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption (optional)"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={upload} className="btn-primary text-xs px-3 py-1.5" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button onClick={cancelPending} className="btn-secondary text-xs px-3 py-1.5" disabled={uploading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}

      {photos.length === 0 ? (
        <p className="text-sm text-stone-500">No photos yet. Show off the build.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-stone-800 bg-stone-950">
              <img src={`/uploads/${photo.filename}`} alt={photo.caption || "Car photo"} className="w-full h-32 object-cover" />
              {photo.caption && (
                <p className="text-[11px] text-stone-300 px-2 py-1 truncate bg-stone-900/80">{photo.caption}</p>
              )}
              <button
                onClick={() => remove(photo.id)}
                className="absolute top-1 right-1 bg-stone-950/80 text-rose-400 hover:text-rose-300 text-xs rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
