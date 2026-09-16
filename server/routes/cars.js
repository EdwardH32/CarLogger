const express = require("express");
const db = require("../db");
const { estimateStockSpecs } = require("../gemini");

const router = express.Router();

router.get("/", (req, res) => {
  const cars = db.prepare("SELECT * FROM cars ORDER BY created_at DESC").all();
  res.json(cars);
});

// Ask Gemini for factory-stock HP/torque given year/make/model, before a car is saved.
router.post("/estimate-stock", async (req, res) => {
  const { year, make, model } = req.body;
  if (!year || !make || !model) {
    return res.status(400).json({ error: "year, make, and model are required" });
  }

  try {
    const estimate = await estimateStockSpecs({ year, make, model });
    res.json(estimate);
  } catch (err) {
    console.error("Gemini stock spec estimate failed:", err.message);
    res.status(502).json({ error: err.message || "Failed to get AI stock spec estimate" });
  }
});

router.get("/:id", (req, res) => {
  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.id);
  if (!car) return res.status(404).json({ error: "Car not found" });
  res.json(car);
});

router.post("/", (req, res) => {
  const { year, make, model, base_hp, base_torque, mileage } = req.body;

  if (!year || !make || !model || base_hp == null || base_torque == null || mileage == null) {
    return res.status(400).json({ error: "year, make, model, base_hp, base_torque, and mileage are required" });
  }

  const stmt = db.prepare(
    "INSERT INTO cars (year, make, model, base_hp, base_torque, mileage) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const info = stmt.run(year, make, model, base_hp, base_torque, mileage);
  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json(car);
});

router.put("/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Car not found" });

  const { year, make, model, base_hp, base_torque, mileage } = req.body;
  db.prepare(
    "UPDATE cars SET year = ?, make = ?, model = ?, base_hp = ?, base_torque = ?, mileage = ? WHERE id = ?"
  ).run(
    year ?? existing.year,
    make ?? existing.make,
    model ?? existing.model,
    base_hp ?? existing.base_hp,
    base_torque ?? existing.base_torque,
    mileage ?? existing.mileage,
    req.params.id
  );
  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.id);
  res.json(car);
});

router.delete("/:id", (req, res) => {
  const info = db.prepare("DELETE FROM cars WHERE id = ?").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: "Car not found" });
  res.status(204).end();
});

module.exports = router;
