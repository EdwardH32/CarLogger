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
| 8 | User Accounts |
| 9 | Social Forums |
| 10 | Discover |
| 11 | General Notes |

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

The SQLite file holds every user account. This includes a hashed
password and active session tokens for each user.

> **CAUTION**
>
> Do not commit the file `server/data/carlogger.db` to git. Do not
> commit the folder `server/data/uploads` to git. These files contain
> private data, including hashed passwords and session tokens.

## 6. SOFTWARE ARCHITECTURE

Figure 6-1 shows the folder structure of this software.

**Figure 6-1. Folder Structure**

```
carlogger/
├── server/               Express API
│   ├── index.js           App entry point
│   ├── db.js               SQLite connection and schema
│   ├── gemini.js            Gemini API client
│   ├── auth.js              Password hashing and session tokens
│   ├── upload.js            Shared image upload configuration
│   ├── carStats.js          Current horsepower/torque calculation
│   └── routes/               cars, mods, modRecommendations,
│                              maintenance, summary, performance,
│                              tracks, maintenance-intervals,
│                              wear-parts, dyno, photos, auth,
│                              forums, users, connections
└── client/               React, Vite, and Tailwind frontend
    └── src/
        ├── api.js             Fetch wrapper for the backend
        ├── App.jsx             Layout and routing state
        └── components/         Sidebar, Dashboard, CarDetail,
                                  ModsTab, ModRecommendations,
                                  MaintenanceTab, PerformanceTab,
                                  DynoTab, CarPhotos, AccountTab,
                                  Avatar, ForumsTab,
                                  ForumThreadDetail, Discover, ...
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
| POST | `/api/auth/register` | Create a user account. Return an access token. |
| POST | `/api/auth/login` | Log in. Return an access token. |
| POST | `/api/auth/logout` | End the current session. |
| GET | `/api/auth/me` | Get the current logged-in user. |
| PUT | `/api/auth/me` | Update the display name, avatar, bio, or location for the current user. |
| POST | `/api/auth/me/avatar` | Upload a profile photo for the current user. Send the photo file. |
| DELETE | `/api/auth/me/avatar` | Remove the profile photo for the current user. |
| POST | `/api/auth/me/banner` | Upload a banner photo for the current user. Send the photo file. |
| DELETE | `/api/auth/me/banner` | Remove the banner photo for the current user. |
| GET | `/api/forums/threads` | List all forum threads. |
| POST | `/api/forums/threads` | Create a forum thread. You must be logged in. |
| GET | `/api/forums/threads/:id` | Get one forum thread and its replies. |
| DELETE | `/api/forums/threads/:id` | Delete a forum thread. You must be the author. |
| POST | `/api/forums/threads/:id/replies` | Add a reply to a forum thread. You must be logged in. |
| DELETE | `/api/forums/replies/:id` | Delete a forum reply. You must be the author. |
| GET | `/api/users` | List community members. This list excludes the current logged-in user. |
| GET | `/api/connections` | List the connections for the current user. You must be logged in. |
| POST | `/api/connections` | Connect with another user. Send the user ID. You must be logged in. |
| DELETE | `/api/connections/:userId` | Remove a connection. You must be logged in. |

## 8. USER ACCOUNTS

### 8.1 Purpose

A user account lets a person post in the forums. A user account also
holds a profile: a display name, an emoji avatar or a photo, a banner
photo, a location, and a bio.

### 8.2 Account Procedure

Do these steps to create an account and set up a profile:

1. Open the Account tab.
2. Select "Sign up".
3. Enter a username, an email address, an optional display name, and
   a password. The password must be at least 6 characters.
4. Select "Sign up" to submit the form. The app logs you in.
5. Select "Edit profile" to change your profile.
6. Select "Upload photo" to add a profile photo. Select "Upload
   banner" to add a banner photo. Select "Remove" to remove a photo
   you added. If you do not add a profile photo, the app shows your
   emoji avatar instead.
7. Enter a display name, a location, and a bio. Select "Save" to save
   your changes.
8. Select "Log out" to end your session on this device.

> **NOTE**
>
> A username and an email address must each be unique. You can log in
> with either one.

> **NOTE**
>
> The app stores your access token on this device only. The app sends
> this token with each request, so the app can identify you without
> asking for your password again.

> **NOTE**
>
> The app corrects spelling and formatting errors in a display name,
> a location, and a bio. The app uses Gemini to do this.

> **NOTE**
>
> A profile photo and a banner photo must be a JPEG, PNG, WebP, or GIF
> file. Each file must be 10 MB or smaller.

## 9. SOCIAL FORUMS

### 9.1 Purpose

The forums are a shared space for build threads, questions, and
comparisons between users.

### 9.2 Forum Procedure

Do these steps to use the forums:

1. Open the Forums tab. View the list of threads. A thread shows its
   title, its author, and its reply count. This step does not need a
   user account.
2. Select a thread to view the full post and its replies.
3. Log in to post. Select "New thread" to start a thread. Enter a
   title and a post. Select "Post thread" to submit it.
4. Log in to reply. Open a thread. Enter a reply. Select "Post reply"
   to submit it.
5. Select "Delete" on your own thread or your own reply to remove it.

> **NOTE**
>
> The app corrects spelling and formatting errors in a thread title,
> a thread post, and a reply. The app uses Gemini to do this.

## 10. DISCOVER

### 10.1 Purpose

The Discover page lets a user meet the other members of the CarLogger
community, one at a time. A user can connect with a member to save
that member for later.

### 10.2 Discover Procedure

Do these steps to use Discover:

1. Open the Discover tab. The app shows one community member at a
   time: their photo or avatar, their display name, their username,
   and their bio. This step does not need a user account.
2. Select "Pass" to skip the member. Select "Connect" to save the
   member to your connections. You can also drag the card left to
   pass or right to connect.
3. Log in to connect with a member. If you are not logged in, select
   "Connect" to view a message that tells you to log in.
4. Select "Connections" to view your list of saved members.
5. Select "Start over" after you reach the end of the list, to view
   the list again from the start.

> **NOTE**
>
> The Discover list excludes your own account.

## 11. GENERAL NOTES

> **NOTE**
>
> If you do not set `GEMINI_API_KEY`, all non-AI features still work.
> Each AI feature shows a clear error message instead of a result.
> You can enter horsepower and torque values by hand.
