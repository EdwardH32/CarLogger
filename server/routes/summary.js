const express = require("express");
const db = require("../db");

const router = express.Router();

function buildSummary(carId) {
  const modAgg = db
    .prepare(
      `SELECT
         COALESCE(SUM(cost), 0) AS mod_spend,
         COALESCE(SUM(estimated_hp_gain), 0) AS hp_gain,
         COALESCE(SUM(estimated_torque_gain), 0) AS torque_gain,
         COUNT(*) AS mod_count
       FROM mods WHERE car_id = ?`
    )
    .get(carId);

  const maintAgg = db
    .prepare(
      `SELECT COALESCE(SUM(cost), 0) AS maint_spend, COUNT(*) AS maint_count
       FROM maintenance WHERE car_id = ?`
    )
    .get(carId);

  const totalSpend = modAgg.mod_spend + maintAgg.maint_spend;
  const costPerHp = modAgg.hp_gain > 0 ? modAgg.mod_spend / modAgg.hp_gain : null;

  return {
    mod_spend: modAgg.mod_spend,
    maintenance_spend: maintAgg.maint_spend,
    total_spend: totalSpend,
    total_hp_gain: modAgg.hp_gain,
    total_torque_gain: modAgg.torque_gain,
    cost_per_hp: costPerHp,
    mod_count: modAgg.mod_count,
    maintenance_count: maintAgg.maint_count,
  };
}

// Overall summary across every car, plus a per-car breakdown.
router.get("/", (req, res) => {
  const cars = db.prepare("SELECT * FROM cars").all();

  const perCar = cars.map((car) => ({
    car,
    summary: buildSummary(car.id),
  }));

  const totals = perCar.reduce(
    (acc, { summary }) => {
      acc.mod_spend += summary.mod_spend;
      acc.maintenance_spend += summary.maintenance_spend;
      acc.total_spend += summary.total_spend;
      acc.total_hp_gain += summary.total_hp_gain;
      acc.total_torque_gain += summary.total_torque_gain;
      return acc;
    },
    {
      mod_spend: 0,
      maintenance_spend: 0,
      total_spend: 0,
      total_hp_gain: 0,
      total_torque_gain: 0,
    }
  );
  totals.cost_per_hp = totals.total_hp_gain > 0 ? totals.mod_spend / totals.total_hp_gain : null;
  totals.car_count = cars.length;

  res.json({ totals, cars: perCar });
});

router.get("/:carId", (req, res) => {
  const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(req.params.carId);
  if (!car) return res.status(404).json({ error: "Car not found" });

  res.json({ car, summary: buildSummary(req.params.carId) });
});

module.exports = router;
