import { useState } from "react";
import Modal from "./Modal.jsx";
import { api } from "../api.js";

export default function AddCarModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    year: "",
    make: "",
    model: "",
    nickname: "",
    base_hp: "",
    base_torque: "",
    mileage: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [specsLoading, setSpecsLoading] = useState(false);
  const [specsNote, setSpecsNote] = useState("");
  const [specsError, setSpecsError] = useState("");

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const canLookup = form.year && form.make.trim() && form.model.trim();

  // Only queries Gemini when the user explicitly asks (button click or Enter) —
  // never on every keystroke, so it doesn't burn through the rate limit.
  const lookupStock = async () => {
    if (!canLookup || specsLoading) return;
    setSpecsError("");
    setSpecsLoading(true);
    try {
      const specs = await api.estimateCarStock({
        year: Number(form.year),
        make: form.make.trim(),
        model: form.model.trim(),
      });
      setForm((f) => ({ ...f, base_hp: String(specs.base_hp), base_torque: String(specs.base_torque) }));
      setSpecsNote(specs.summary || "");
    } catch (err) {
      setSpecsError(err.message);
    } finally {
      setSpecsLoading(false);
    }
  };

  const handleFieldKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupStock();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (
      !form.year ||
      !form.make ||
      !form.model ||
      form.base_hp === "" ||
      form.base_torque === "" ||
      form.mileage === ""
    ) {
      setError("All fields are required.");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        year: Number(form.year),
        make: form.make.trim(),
        model: form.model.trim(),
        nickname: form.nickname.trim(),
        base_hp: Number(form.base_hp),
        base_torque: Number(form.base_torque),
        mileage: Number(form.mileage),
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add a car" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Year</label>
            <input
              className="input"
              type="number"
              value={form.year}
              onChange={update("year")}
              onKeyDown={handleFieldKeyDown}
              placeholder="2018"
            />
          </div>
          <div>
            <label className="label">Make</label>
            <input
              className="input"
              value={form.make}
              onChange={update("make")}
              onKeyDown={handleFieldKeyDown}
              placeholder="Subaru"
            />
          </div>
        </div>
        <div>
          <label className="label">Model</label>
          <input
            className="input"
            value={form.model}
            onChange={update("model")}
            onKeyDown={handleFieldKeyDown}
            placeholder="WRX STI"
          />
        </div>
        <div>
          <label className="label">Nickname (optional)</label>
          <input
            className="input"
            value={form.nickname}
            onChange={update("nickname")}
            placeholder="The Beast"
          />
        </div>
        <div>
          <label className="label">Current mileage</label>
          <input
            className="input"
            type="number"
            value={form.mileage}
            onChange={update("mileage")}
            placeholder="42000"
          />
          <p className="text-xs text-stone-500 mt-1">Used to work out recommended maintenance intervals.</p>
        </div>

        <button
          type="button"
          onClick={lookupStock}
          className="btn-secondary w-full text-sm"
          disabled={!canLookup || specsLoading}
        >
          {specsLoading ? "Asking AI..." : "✨ Look up stock HP/Torque"}
        </button>

        <div>
          <span className="text-xs font-medium text-stone-400 mb-1 block">Base HP / Torque</span>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              type="number"
              value={form.base_hp}
              onChange={update("base_hp")}
              placeholder="305"
            />
            <input
              className="input"
              type="number"
              value={form.base_torque}
              onChange={update("base_torque")}
              placeholder="290"
            />
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Fill in year, make, and model, then press Enter or the button above to look up stock
            specs — or just type them in yourself.
          </p>
          {specsNote && !specsError && <p className="text-xs text-stone-500 mt-1 italic">{specsNote}</p>}
          {specsError && <p className="text-xs text-amber-400 mt-1">Lookup failed ({specsError}).</p>}
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Add car"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
