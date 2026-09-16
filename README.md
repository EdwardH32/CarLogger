# CarLogger

Track your project car: log mods and maintenance, auto-fill stock HP/torque
and get AI-estimated power gains from Gemini, and see cost-per-HP across
your whole garage.

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** SQLite (via Node's built-in `node:sqlite`, no native build step)
- **AI:** Google Gemini API — auto-fills factory-stock HP/torque when you add
  a car, and estimates HP/torque gain per mod

## Requirements

- **Node.js 22.5+** (uses the built-in `node:sqlite` module — no compiler/build tools needed)
- A [Gemini API key](https://aistudio.google.com/apikey) (only needed for the AI features — everything else works without it)

## Setup

```bash
cd carlogger
npm run install:all
```

Then create your server env file and add your Gemini key:

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set `GEMINI_API_KEY=...` to your real key.

## Run it

From the project root, this starts both the API (port 4000) and the frontend (port 5173):

```bash
npm run dev
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` calls to the Express backend automatically.

To run them separately instead:

```bash
npm run dev:server
npm run dev:client
```

## How it works

1. **Add a car** — enter year, make, and model. Once all three are filled in,
   base HP and torque auto-fill from Gemini (factory-stock specs) after a
   short pause — you can still edit them by hand before saving.
2. **Log mods** — name, description, cost, install date. Each mod has a
   **"Get AI HP/Torque estimate"** button that sends the car + mod details to
   Gemini and stores the returned HP/torque gain and a short explanation.
3. **Log maintenance** — service, description, cost, date, mileage. This
   counts toward total spend but not toward power gain.
4. **Dashboard** — aggregate power gain, total spend, and cost-per-HP
   (mod spend ÷ HP gained) across your whole garage, plus a per-car
   breakdown table.
5. Every car's detail page shows the same stats scoped to that car.

All data lives in a SQLite file at `server/data/carlogger.db`, created
automatically on first run.

## Project structure

```
carlogger/
├── server/              Express API
│   ├── index.js         App entrypoint
│   ├── db.js            SQLite connection + schema
│   ├── gemini.js         Gemini API client (stock specs + mod estimates)
│   └── routes/          cars, mods, maintenance, summary
└── client/              React + Vite + Tailwind frontend
    └── src/
        ├── api.js        fetch wrapper for the backend
        ├── App.jsx        layout + routing state
        └── components/    Sidebar, Dashboard, CarDetail, ModsTab, MaintenanceTab, ...
```

## API overview

| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/cars` | List / create cars |
| POST | `/api/cars/estimate-stock` | Ask Gemini for factory-stock HP/torque from year/make/model |
| DELETE | `/api/cars/:id` | Delete a car (cascades mods + maintenance) |
| GET/POST | `/api/mods?car_id=` | List / create mods |
| POST | `/api/mods/:id/estimate` | Ask Gemini for HP/torque gain from a mod |
| DELETE | `/api/mods/:id` | Delete a mod |
| GET/POST | `/api/maintenance?car_id=` | List / create maintenance entries |
| DELETE | `/api/maintenance/:id` | Delete a maintenance entry |
| GET | `/api/summary` | Garage-wide totals + per-car breakdown |
| GET | `/api/summary/:carId` | Totals for one car |

## Notes

- If `GEMINI_API_KEY` isn't set, every other feature still works — the
  stock-spec auto-fill and mod estimate button will just show a clear error
  until you add a key, and you can type HP/torque values in by hand.
- The SQLite file and `.env` are gitignored; if you deploy this, don't
  commit either.
