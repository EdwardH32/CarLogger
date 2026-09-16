# CARLOGGER

TECHNICAL DESCRIPTION AND OPERATING INSTRUCTIONS

## SAFETY SUMMARY

This summary lists each caution in this manual. Read this summary
before you do any procedure in this manual.

> **CAUTION**
>
> Do not commit the file `server/.env` to git. Do not commit the file
> `server/data/carlogger.db` to git. Do not commit the folder
> `server/data/uploads` to git. These files can contain a private API
> key or private data. Chapter 3 and Chapter 5 give this caution
> again, at the step it applies to.

## TABLE OF CONTENTS

| Chapter | Title |
|---|---|
| 1 | General Description |
| 2 | Requirements |
| 3 | Installation Procedure |
| 4 | Operating Procedure |
| 5 | Data Storage |
| 6 | Software Architecture |
| 7 | Interface Control |
| 8 | General Notes |

## 1. GENERAL DESCRIPTION

### 1.1 Purpose

CarLogger is an app for a project car. Use the app to log
modifications and maintenance. Use the app to get AI estimates of
power, performance, and lap times. Use the app to track total spend
for the car.

### 1.2 Technology Summary

Table 1-1 lists the technology this software uses.

**Table 1-1. Technology Summary**

| Item | Description |
|---|---|
| Frontend | React, Vite, and Tailwind CSS. |
| Backend | Node.js and Express. |
| Database | SQLite, through the built-in `node:sqlite` module. A separate database install is not necessary. |
| AI | The Google Gemini API. The app uses Gemini for all AI estimates. |

## 2. REQUIREMENTS

Table 2-1 lists the requirements for this software.

**Table 2-1. Requirements**

| Item | Requirement |
|---|---|
| Node.js | Version 22.5 or later. This version has the built-in `node:sqlite` module. |
| Gemini API key | Get a key at https://aistudio.google.com/apikey. A key is necessary only for the AI features. All other features work without a key. |

## 3. INSTALLATION PROCEDURE

### 3.1 Setup Procedure

Do these steps to set up the app:

1. Open a terminal in the `carlogger` folder.
2. Run this command: `npm run install:all`
3. Run this command to create the environment file:
   `cp server/.env.example server/.env`
4. Open the file `server/.env`.
5. Set the value of `GEMINI_API_KEY` to your Gemini API key.

> **CAUTION**
>
> Do not commit the file `server/.env` to git. This file can contain a
> private API key.

## 4. OPERATING PROCEDURE

### 4.1 Start the App — Combined

Do this step to start the API and the frontend together:

1. Run this command from the project root: `npm run dev`

This command starts the API on port 4000. This command also starts
the frontend on port 5180. Open `http://localhost:5180` in a browser.

> **NOTE**
>
> The Vite dev server sends all `/api` and `/uploads` requests to the
> Express backend. This happens automatically.

### 4.2 Start the App — Separate Processes

Do these steps to start the API and the frontend as separate
processes:

1. Run this command to start the API: `npm run dev:server`
2. Run this command to start the frontend: `npm run dev:client`

### 4.3 Operating Procedure

Do these steps to operate the app:

1. Add a car. Enter the year, make, and model. Enter an optional
   nickname for the car.
2. Wait a short time. The app fills in the base horsepower and torque
   values. The app gets these values from Gemini. You can change
   these values before you save the car.
3. Log a modification for the car. Enter the name, description, cost,
   and install date.
4. Select "Get AI HP/Torque estimate" for a modification. The app
   sends the car data and the modification data to Gemini. The app
   saves the horsepower gain, the torque gain, and a short
   explanation.
5. Open the Recommendations tab. Get an AI-generated list of common
   mods for the car. The list is in four cost groups: under $1,500,
   $1,500 to $5,000, $5,000 to $10,000, and over $10,000. Select "Add
   to my mods" to log a mod from the list.
6. Log a maintenance job for the car. Enter the service, description,
   cost, date, and mileage. A maintenance job adds to the total spend.
   A maintenance job does not add to the power gain.
7. Open the Performance tab. Get an AI estimate of the 0-60 mph time,
   the top speed, and the Nürburgring lap time for the car.
8. Open the Performance tab. Add the name of a race track. Get an AI
   estimate of the lap time for that track.
9. Open the Dyno tab. Get an AI-generated horsepower and torque curve
   for the car.
10. Open the Maintenance tab. Get an AI-generated maintenance
    schedule for the car. Get an AI-generated list of common wear
    parts for the car.
11. Open the Photos tab. Add photos of the car. Add an optional
    caption to each photo.
12. Open the Dashboard. View the total power gain, the total spend,
    and the cost per horsepower for all cars in the garage. View a
    table with data for each car.
13. Open a car page. View the same data for that one car.

> **NOTE**
>
> The app corrects spelling and formatting errors in text you enter.
> The app uses Gemini to do this. This applies to entries for cars,
> modifications, maintenance jobs, and tracks.

> **NOTE**
>
> The app works on a phone screen. On a narrow screen, a menu button
> opens the car list. On a narrow screen, a drop-down list replaces
> the row of tabs on a car page.

## 5. DATA STORAGE

The app stores all data in a SQLite file. The file is at
`server/data/carlogger.db`. The app creates this file on the first
run.

The app stores photo files in the folder `server/data/uploads`.

> **CAUTION**
>
> Do not commit the file `server/data/carlogger.db` to git. Do not
> commit the folder `server/data/uploads` to git. These files contain
> private data.

## 6. SOFTWARE ARCHITECTURE

Figure 6-1 shows the folder structure of this software.

**Figure 6-1. Folder Structure**

```
carlogger/
├── server/               Express API
│   ├── index.js           App entry point
│   ├── db.js               SQLite connection and schema
│   ├── gemini.js            Gemini API client
│   ├── carStats.js          Current horsepower/torque calculation
│   └── routes/               cars, mods, modRecommendations,
│                              maintenance, summary, performance,
│                              tracks, maintenance-intervals,
│                              wear-parts, dyno, photos
└── client/               React, Vite, and Tailwind frontend
    └── src/
        ├── api.js             Fetch wrapper for the backend
        ├── App.jsx             Layout and routing state
        └── components/         Sidebar, Dashboard, CarDetail,
                                  ModsTab, ModRecommendations,
                                  MaintenanceTab, PerformanceTab,
                                  DynoTab, CarPhotos, ...
```

## 7. INTERFACE CONTROL

Table 7-1 lists the API endpoints for this software.

**Table 7-1. API Summary**

| Method | Path | Description |
|---|---|---|
| GET | `/api/cars` | List all cars. |
| POST | `/api/cars` | Create a car. |
| PUT | `/api/cars/:id` | Update a car. |
| DELETE | `/api/cars/:id` | Delete a car. This also deletes its modifications and maintenance records. |
| POST | `/api/cars/estimate-stock` | Get an AI estimate of factory horsepower and torque. Send the year, make, and model. |
| GET | `/api/mods?car_id=` | List modifications for a car. |
| POST | `/api/mods` | Create a modification. |
| DELETE | `/api/mods/:id` | Delete a modification. |
| POST | `/api/mods/:id/estimate` | Get an AI estimate of the horsepower and torque gain for a modification. |
| GET | `/api/maintenance?car_id=` | List maintenance records for a car. |
| POST | `/api/maintenance` | Create a maintenance record. |
| DELETE | `/api/maintenance/:id` | Delete a maintenance record. |
| GET | `/api/summary` | Get totals and a per-car breakdown for all cars. |
| GET | `/api/summary/:carId` | Get totals for one car. |
| GET | `/api/performance/:carId` | Get the stored performance estimate for a car. |
| POST | `/api/performance/:carId/estimate` | Get an AI estimate of the 0-60 mph time, the top speed, and the lap time. |
| GET | `/api/tracks?car_id=` | List track lap times for a car. |
| POST | `/api/tracks` | Add a track. Get an AI estimate of the lap time for it. |
| DELETE | `/api/tracks/:id` | Delete a track lap time. |
| GET | `/api/maintenance-intervals?car_id=` | List the maintenance schedule for a car. |
| POST | `/api/maintenance-intervals/:carId/generate` | Get an AI-generated maintenance schedule for a car. |
| GET | `/api/wear-parts?car_id=` | List common wear parts for a car. |
| POST | `/api/wear-parts/:carId/generate` | Get an AI-generated list of common wear parts for a car. |
| GET | `/api/dyno/:carId` | Get the stored dyno curve for a car. |
| POST | `/api/dyno/:carId/estimate` | Get an AI-generated dyno curve for a car. |
| GET | `/api/photos?car_id=` | List photos for a car. |
| POST | `/api/photos` | Add a photo. Send the car ID, the photo file, and an optional caption. |
| DELETE | `/api/photos/:id` | Delete a photo. |
| GET | `/api/mod-recommendations?car_id=` | List common mod recommendations for a car. |
| POST | `/api/mod-recommendations/:carId/generate` | Get an AI-generated list of common mod recommendations for a car. |

## 8. GENERAL NOTES

> **NOTE**
>
> If you do not set `GEMINI_API_KEY`, all non-AI features still work.
> Each AI feature shows a clear error message instead of a result.
> You can enter horsepower and torque values by hand.
