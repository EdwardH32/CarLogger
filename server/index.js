require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");

require("./db"); // ensures tables exist on boot

const carsRouter = require("./routes/cars");
const modsRouter = require("./routes/mods");
const maintenanceRouter = require("./routes/maintenance");
const summaryRouter = require("./routes/summary");
const performanceRouter = require("./routes/performance");
const tracksRouter = require("./routes/tracks");
const maintenanceIntervalsRouter = require("./routes/maintenanceIntervals");
const wearPartsRouter = require("./routes/wearParts");
const dynoRouter = require("./routes/dyno");
const photosRouter = require("./routes/photos");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "data", "uploads")));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/cars", carsRouter);
app.use("/api/mods", modsRouter);
app.use("/api/maintenance", maintenanceRouter);
app.use("/api/summary", summaryRouter);
app.use("/api/performance", performanceRouter);
app.use("/api/tracks", tracksRouter);
app.use("/api/maintenance-intervals", maintenanceIntervalsRouter);
app.use("/api/wear-parts", wearPartsRouter);
app.use("/api/dyno", dynoRouter);
app.use("/api/photos", photosRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`CarLogger API running on http://localhost:${PORT}`);
});
