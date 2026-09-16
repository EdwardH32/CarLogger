const express = require("express");
const db = require("../db");
const { estimateModGains } = require("../gemini");

const router = express.Router();

router.get("/", (req, res) => {
  const { car_id } = req.query;
  const mods = car_id
    ? db.prepare("SELECT * FROM mods WHERE car_id = ? ORDER BY created_at DESC").all(car_id)
    : db.prepare("SELECT * FROM mods ORDER BY created_at DESC").all();
  res.json(mods);
});

router.post("/", (req, res) => {
  const { car_id, name, description, cost, install_date } = req.body;

  if (!car_id || !name) {
    return res.status(400).json({ error: "car_id and name are required" });
  }

  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(car_id);
  if (!car) return res.status(404).json({ error: "Car not found" });

  const stmt = db.prepare(
    "INSERT INTO mods (car_id, name, description, cost, install_date) VALUES (?, ?, ?, ?, ?)"
  );
  const info = stmt.run(car_id, name, description || null, cost || 0, install_date || null);
  const mod = db.prepare("SELECT * FROM mods WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(mod);
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM mods WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Mod not found" });

  const { name, description, cost, install_date } = req.body;
  db.prepare(
    "UPDATE mods SET name = ?, description = ?, cost = ?, install_date = ? WHERE id = ?"
  ).run(
    name ?? existing.name,
    description ?? existing.description,
    cost ?? existing.cost,
    install_date ?? existing.install_date,
    req.params.id
  );
  const mod = db.prepare("SELECT * FROM mods WHERE id = ?").get(req.params.id);
  res.json(mod);
});

router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM mods WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Mod not found" });
  res.status(204).end();
});

// Ask Deepseek to estimate HP/torque gain for a mod, store result on the mod row.
router.post("/:id/estimate", async (req, res) => {
  const mod = db.prepare("SELECT * FROM mods WHERE id = ?").get(req.params.id);
  if (!mod) return res.status(404).json({ error: "Mod not found" });

  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(mod.car_id);
  if (!car) return res.status(404).json({ error: "Car not found" });

  try {
    const estimate = await estimateModGains({ car, mod });

    db.prepare(
      "UPDATE mods SET estimated_hp_gain = ?, estimated_torque_gain = ?, ai_summary = ? WHERE id = ?"
    ).run(estimate.hp_gain, estimate.torque_gain, estimate.summary, mod.id);

    const updated = db.prepare("SELECT * FROM mods WHERE id = ?").get(mod.id);
    res.json(updated);
  } catch (err) {
    console.error("Gemini estimate failed:", err.message);
    res.status(502).json({ error: err.message || "Failed to get AI estimate" });
  }
});

module.exports = router;
