const express = require("express");
const db = require("../db");
const { cleanupEntryText } = require("../gemini");

const router = express.Router();

router.get("/", (req, res) => {
  const { car_id } = req.query;
  const entries = car_id
    ? db.prepare("SELECT * FROM maintenance WHERE car_id = ? ORDER BY created_at DESC").all(car_id)
    : db.prepare("SELECT * FROM maintenance ORDER BY created_at DESC").all();
  res.json(entries);
});

router.post("/", async (req, res) => {
  const { car_id, service, description, cost, service_date, mileage } = req.body;

  if (!car_id || !service) {
    return res.status(400).json({ error: "car_id and service are required" });
  }

  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(car_id);
  if (!car) return res.status(404).json({ error: "Car not found" });

  const cleaned = await cleanupEntryText({ service, description });

  const stmt = db.prepare(
    "INSERT INTO maintenance (car_id, service, description, cost, service_date, mileage) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const info = stmt.run(
    car_id,
    cleaned.service,
    cleaned.description || null,
    cost || 0,
    service_date || null,
    mileage || null
  );
  const entry = db.prepare("SELECT * FROM maintenance WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(entry);
});

router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM maintenance WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Entry not found" });
  res.status(204).end();
});

module.exports = router;
