# TravelMate — plan India, with a number you can trust

TravelMate is a full-stack travel platform for trips inside India. A traveller picks a destination,
chooses a boarding point, and optionally adds a **travel guide**, **transport** and **hotel**;
TravelMate then returns an itemised cost estimate before anything is booked. Guides, transport
agencies and hotels each get their own dashboard to publish services, manage profile details and
respond to booking requests.

Built with a **separate React frontend** and an **Express + MongoDB backend written in MVC style**.
Every destination ships with real photographs of its famous places (Goa → Fort Aguada, Baga Beach,
Anjuna Beach, Chapora Fort, and so on).

![TravelMate home page](docs/screenshots/home.jpg)

---

## Table of contents

1. [What it does](#what-it-does)
2. [Screenshots](#screenshots)
3. [Tech stack](#tech-stack)
4. [Architecture (MVC)](#architecture-mvc)
5. [Project structure](#project-structure)
6. [Quick start](#quick-start)
7. [Environment variables](#environment-variables)
8. [Demo accounts](#demo-accounts)
9. [How the cost estimate works](#how-the-cost-estimate-works)
10. [Data models](#data-models)
11. [API reference](#api-reference)
12. [Tests](#tests)
13. [Destinations and famous places](#destinations-and-famous-places)
14. [Image credits and licences](#image-credits-and-licences)
15. [Notes, limits and next steps](#notes-limits-and-next-steps)

---

## What it does

**Accounts and auth**

- Registration + sign in for four roles: **Traveller**, **Travel Guide**, **Transport Agency**, **Hotel**.
- Passwords hashed with bcrypt (`bcryptjs`, 12 salt rounds), sessions issued as JWT bearer tokens.
- Role-based authorisation middleware protects every write route and each dashboard.
- Editable profile for every role: **profile photo upload** (replace any time), name, email, phone,
  city/state, bio, language list, plus role-specific fields (specialities, day rate, vehicle types,
  hotel category, amenities, service areas, website).

**Traveller**

- Browse destinations, filter by region/interest, search, sort.
- Destination pages with four photographed famous places, best season, weather, safety notes and
  typical daily costs.
- Trip planner: choose a boarding city, start date, days, travellers, travel mode, hotel tier,
  optional guide and meals; get a live itemised estimate.
- Save the plan to MongoDB, view the stored breakdown later, mark it booked/completed, delete it.
- Request bookings directly with guides, transport agencies and hotels; track request status.

**Travel Guide / Transport Agency / Hotel**

- Dashboard summary cards (services, pending requests, confirmed bookings, earnings).
- Publish, edit, pause and delete services with price + price unit (`per day / per night / per trip / per km / per hour`).
- See incoming booking requests with traveller contact details and confirm/decline/complete them.
- Public marketplace listing so travellers can discover them.

**Platform**

- Six curated Indian destinations (Goa, Jaipur, Agra, Kerala, Manali, Delhi), 24 famous places, 24
  credited local photographs.
- Transparent estimate maths exposed in the UI (“How this estimate is calculated”).
- **MongoDB Atlas only**: a `mongodb+srv://` URI, TLS, retryable writes, Atlas-aware timeouts and a
  `npm run db:check` connection doctor. There is no local/Docker/in-memory database — if the cluster
  is not reachable the API serves a guided setup screen instead of pretending to work.

## Screenshots

| Destination gallery | Trip cost estimator |
| --- | --- |
| ![Goa destination page](docs/screenshots/destination-goa.jpg) | ![Trip planner](docs/screenshots/planner.jpg) |

| Traveller dashboard | Guide dashboard |
| --- | --- |
| ![Traveller dashboard](docs/screenshots/traveller-dashboard.jpg) | ![Guide dashboard](docs/screenshots/guide-dashboard.jpg) |

| Services marketplace | Editable profile | Sign in |
| --- | --- | --- |
| ![Marketplace](docs/screenshots/services.jpg) | ![Profile](docs/screenshots/profile.jpg) | ![Login](docs/screenshots/login.jpg) |

More in [`docs/screenshots`](docs/screenshots): destinations list, registration, bookings,
booking modal, provider service manager, mobile home.

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18, React Router 6, Vite 5, Lucide icons, hand-written CSS design system |
| Backend | Node.js, Express 4, Mongoose 8, JWT (`jsonwebtoken`), bcryptjs, Multer 2, Morgan, CORS |
| Database | **MongoDB Atlas** (`mongodb+srv://`) — the only supported datastore |
| Tooling | npm workspaces, `concurrently`, `node --watch`, Vite dev proxy |

No UI framework is required; the interface is a small, reusable set of CSS components (tokens,
cards, chips, toggles, steppers, modals, toasts) so the design is easy to restyle.

## Architecture (MVC)

The backend follows MVC with an extra service layer for calculation logic. The frontend is a
separate SPA that consumes the JSON API — it is never rendered by Express.

```
┌──────────────────────────────┐        HTTPS/JSON        ┌───────────────────────────────────┐
│  React SPA (frontend/)       │  ───────────────────────▶ │  Express API (backend/)   MVC      │
│  Vite dev server :5173       │      /api/*  (proxy)      │  :5000                            │
│                              │ ◀───────────────────────  │                                   │
│  pages/ components/ context/ │                           │  routes → controllers → models    │
│  lib/api.js (fetch + JWT)    │                           │            ↓            ↓         │
└──────────────────────────────┘                           │        services/      views/      │
                                                            │  (cost, geo, seed)  (response)    │
                                                            └──────────────┬────────────────────┘
                                                                           ▼
                                                                    MongoDB (Mongoose)
                                               users · destinations · services · trips · bookings
```

| MVC piece | Location | Responsibility |
| --- | --- | --- |
| **Models** | `backend/models/*.js` | Mongoose schemas, validation, indexes, password hashing hooks |
| **Views** | `backend/views/responseView.js` | Shapes API payloads per resource (what the client sees), strips `passwordHash`/`__v`, computes derived fields |
| **Controllers** | `backend/controllers/*.js` | Thin HTTP layer: validate input, call models/services, return a view |
| **Routes** | `backend/routes/*.js` | URL → controller mapping, auth + role middleware |
| **Services** | `backend/services/*.js` | Domain logic: cost engine, distance/geocoding, seeding |
| **Middleware** | `backend/middleware/*.js` | `protect` (JWT), `authorize(...roles)`, upload handling, error normalisation |
| **Config** | `backend/config/database.js` | Mongo connection (real URI or dev memory server) |

Request flow example — saving a trip plan:

```
POST /api/trips
  → middleware/auth.protect          verifies JWT, loads req.user
  → routes/tripRoutes                routes to tripController.createTrip
  → controllers/tripController       validates destination, calls the cost service
  → services/costService             resolves boarding point + builds line items
  → models/Trip.create               persists plan, options and full estimate in MongoDB
  → views/responseView.tripView      normalises ids + nested options for the client
  → JSON { success, message, data }
```

More detail: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Endpoint list: [`docs/API.md`](docs/API.md).

## Project structure

```
travelmate/
├── backend/                      # Express + Mongoose API (MVC)
│   ├── config/database.js        # MongoDB Atlas connection (single source of truth)
│   ├── controllers/              # auth, destinations, trips, services, bookings, dashboard, meta
│   ├── middleware/               # auth (JWT + roles), multer upload, error handler
│   ├── models/                   # User, Destination, Service, Trip, Booking
│   ├── routes/                   # one router per resource
│   ├── services/                 # costService, geoService, seedService
│   ├── views/responseView.js     # response shaping for every resource
│   ├── data/                     # destination catalogue + boarding-point coordinates
│   ├── scripts/                  # seed.js, smoke.js
│   ├── uploads/                  # profile images (URL stored in MongoDB)
│   ├── app.js                    # express app, middleware, route mounting
│   └── server.js                 # bootstrap: DB, seed, listen, graceful shutdown
├── frontend/                     # React SPA
│   ├── public/images/places/     # 24 local landmark photographs
│   ├── public/images/CREDITS.md  # attribution table (auto-generated)
│   └── src/
│       ├── components/           # Layout, DestinationCard, ServiceCard, CostBreakdown,
│       │                         # BookingModal, ProtectedRoute, ui.jsx primitives
│       ├── context/              # AuthContext (JWT session), ToastContext
│       ├── lib/                  # api client, formatters, role/transport constants
│       ├── pages/                # Home, Destinations, DestinationDetail, PlanTrip,
│       │   └── dashboards/       # Services, Login, Register, NotFound,
│       │                         # DashboardLayout, Traveller, Provider, Profile,
│       │                         # ServicesManager, Bookings
│       ├── styles/               # base.css, pages.css, dashboard.css
│       ├── App.jsx               # routes, protected routes, scroll restore
│       └── main.jsx              # providers + router
├── docs/                         # architecture, API docs, screenshots
├── scripts/fetch-place-images.py # re-downloads landmark photos + credits
├── .env.example
└── package.json                  # npm workspaces + dev/build/seed/smoke scripts
```

## Quick start

### Prerequisites

- Node.js **18+** (tested on Node 20) and npm 9+.
- A **MongoDB Atlas** cluster. The free M0 tier is more than enough; no Docker, no local server.

### 1. Install

```bash
cd travelmate
npm install          # installs backend + frontend workspaces
```

### 2. Connect MongoDB Atlas (the only database — no Docker, no local server)

1. Sign in at <https://cloud.mongodb.com> and create a **free M0 cluster** (any region).
2. **Database Access** → *Add New Database User* → username + password, role **Read and write to any database**.
3. **Network Access** → *Add IP Address*:
   - add your own IP for local development, and
   - add the IP of the machine that will seed/deploy (this workspace's egress IP is printed by
     `npm run db:check`; `0.0.0.0/0` is fine while developing, but tighten it for production).
4. **Database** → **Connect** → **Drivers** → copy the **`mongodb+srv://…`** string.
5. Put it in `.env` (created for you already; `cp .env.example .env` if not):

   ```bash
   # .env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/travelmate?retryWrites=true&w=majority&appName=TravelMate
   JWT_SECRET=<openssl rand -hex 32>
   SEED_DEMO_DATA=true
   ```

   If the password contains `@ : / ? # [ ] %`, URL-encode it (`@` → `%40`). The database name
   `travelmate` in the path is created automatically on the first write.

6. Verify the connection, then load the destinations and demo accounts:

   ```bash
   npm run db:check     # guided diagnosis: DNS, auth, allow-list, read/write, collections
   npm run seed         # 6 destinations + 4 demo accounts + 9 services + demo trips/bookings
   ```

`npm run db:check` prints exactly what to fix if something is off — wrong password, missing IP
allow-list, a paused cluster, an unencoded password, or blocked DNS SRV lookups.

### 3. Run both apps

```bash
npm run dev          # API on :5000 + Vite on :5173 (concurrently)
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` and `/uploads` to the API, so no
CORS configuration is needed during development.

Prefer separate terminals?

```bash
npm run dev -w backend     # http://localhost:5000
npm run dev -w frontend    # http://localhost:5173
```

Every document — accounts, profiles, destinations, services, trip estimates and bookings — is
written to your Atlas cluster, so it survives restarts and is visible in **Atlas → Browse
Collections**.

### Before the cluster is connected

There is no fallback database. If `MONGODB_URI` is missing or the cluster cannot be reached, the
API still starts in development but every data route returns **503** with setup guidance, and the
web app shows a **Connect MongoDB Atlas** screen with the four steps, the detected problem (missing
URI, paused cluster, blocked IP, bad credentials) and a *Retry connection* button. It disappears the
moment `/api/meta/health` reports `state: "connected"`.

![MongoDB Atlas setup screen](docs/screenshots/setup-atlas.jpg)

### Production build

```bash
npm run build               # builds frontend/dist
NODE_ENV=production \
MONGODB_URI="mongodb+srv://…/travelmate" \
JWT_SECRET="a-long-random-secret" \
npm start                   # Express API (serve frontend/dist with any static host / CDN)
```

In production the API refuses to start without `MONGODB_URI` and `JWT_SECRET`, and it exits
immediately if the Atlas cluster cannot be reached — misconfiguration never silently degrades.

## Environment variables

| Variable | Default | Used by | Notes |
| --- | --- | --- | --- |
| `PORT` | `5000` | backend | API port |
| `NODE_ENV` | `development` | backend | `production` disables demo seeding |
| `MONGODB_URI` | — | backend | **Required.** Atlas `mongodb+srv://` connection string; the only datastore |
| `MONGODB_DB` | from URI path | backend | Override the database name (lets one cluster host several apps) |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | `20000` (Atlas) / `10000` | backend | How long to wait for an Atlas node |
| `MONGODB_CONNECT_TIMEOUT_MS` | `20000` | backend | TCP/TLS connect timeout |
| `MONGODB_MAX_POOL_SIZE` | `10` | backend | Connection pool size per instance |
| `JWT_SECRET` | dev-only fallback | backend | **Required in production** |
| `JWT_EXPIRES_IN` | `7d` | backend | Token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | backend | Comma-separated CORS allow-list |
| `SEED_DEMO_DATA` | `true` in dev | backend | Seed demo accounts, services, trips |
| `ENABLE_GEOCODING` | `true` | backend | Set `false` to only accept curated boarding cities |
| `VITE_API_URL` | `/api` | frontend | Point at a remote API if not using the proxy |

## Demo accounts

Demo data is seeded automatically in development (or on a fresh production database when
`SEED_DEMO_DATA=true`). Password for all four: **`Demo@123`**

| Role | Email | Dashboard |
| --- | --- | --- |
| Traveller | `traveller@travelmate.in` | `/dashboard/traveller` |
| Travel Guide | `guide@travelmate.in` | `/dashboard/guide` |
| Transport Agency | `transport@travelmate.in` | `/dashboard/transport` |
| Hotel | `hotel@travelmate.in` | `/dashboard/hotel` |

The login page has one-click buttons that fill these credentials. Seeded content includes 3 guide
services, 3 transport services, 3 hotel services, a saved Hyderabad → Goa plan, one pending guide
request and one confirmed hotel booking.

## How the cost estimate works

The estimate is always computed **on the server** (`backend/services/costService.js`), so a saved
plan can't carry a tampered total. The UI shows every line item and the assumptions.

1. **Boarding point → destination distance**
   - 28 curated Indian cities have coordinates; unknown names are geocoded through OpenStreetMap
     Nominatim (5 s timeout, `countrycodes=in`, cached in memory) or rejected with a helpful message.
   - Great-circle distance via the haversine formula, multiplied by a mode-specific route factor.

2. **Line items**

   | Item | Formula |
   | --- | --- |
   | Return travel | `roundTripKm × ratePerKm × passengers` (or × vehicles for cab/self-drive) `+ baseFare + tolls` |
   | Stay | `nightlyRate(tier) × rooms × max(1, days − 1)` |
   | Meals | `foodPerDay × travellers × days` (× 0.65 when the meal plan is off) |
   | Local transfers | `localTransportPerDay × ceil(travellers / 4) × days` |
   | Guide (optional) | `guidePerDay × guideDays` |
   | Activities (optional) | `activitiesPerDay × travellers × days` |
   | Taxes & fees | 5% of subtotal |
   | Contingency | 5% of subtotal |
   | **Total** | subtotal + taxes + contingency; per-person = total ÷ travellers |

   Transport profiles: bus ₹2.2/km + ₹450, train ₹2.4/km + ₹250, flight ₹8.5/km + ₹1,200, cab
   ₹14/km + ₹900 (per vehicle), self-drive ₹8/km (per vehicle). Hotel/food/activity rates are stored
   per destination in MongoDB, so they are data, not code.

3. **Optionality** — transport, hotel, guide, meal plan and activities are independent toggles. Turn
   everything off and the estimate is just food, local transfers and activities, or nothing at all.

> All amounts are **indicative planning estimates in INR**, not live inventory or a booking quote.

## Data models

```
User          name, email(unique), passwordHash(hidden), role, phone, city, state, bio,
              profileImage, languages[], specialities[], experienceYears, dailyRate,
              vehicleTypes[], serviceAreas[], hotelCategory, amenities[], website,
              verified, lastLoginAt, timestamps   →  virtual profileCompletion

Destination   slug(unique), name, state, region, tagline, description, heroImage,
              coordinates{lat,lng}, bestTime, idealDays, fromPrice, rating, tags[],
              languages[], weather, safetyTip, dailyCosts{...}, places[famous places],
              active

Service       owner→User, type(guide|transport|hotel), title, destinationSlug, city,
              description, image, price{amount,unit}, capacity, contactPhone/Email,
              languages[], tags[], availability, rating, reviews, featured

Trip          owner→User, boardingPoint{name,lat,lng,source}, destinationSlug/Name,
              startDate, days, travelers, options{...}, estimate{lineItems,total,...},
              selectedServices[], status(planned|booked|completed|cancelled), notes

Booking       traveller→User, provider→User, service→Service, trip→Trip (optional),
              serviceTitle/Type, destinationSlug, bookingDate, duration, guests,
              amount, status(pending|confirmed|completed|cancelled), note, contactPhone
```

Profile photos are uploaded with Multer to `backend/uploads/` (3 MB limit, MIME-checked) and the
public URL (`/uploads/…`) is stored on the user document in MongoDB; replacing a photo deletes the
previous file. If you require image bytes themselves inside MongoDB, swap the upload middleware for
GridFS — nothing else in the app needs to change because `profileImage` is just a string.

## API reference

Base URL `/api`. Full request/response examples: [`docs/API.md`](docs/API.md).

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/meta` | — | App metadata: roles, boarding cities, transport modes, hotel tiers, DB info |
| GET | `/meta/health` | — | Health + database state |
| POST | `/auth/register` | — | Create account (any role) |
| POST | `/auth/login` | — | Email + password → JWT |
| GET | `/auth/me` | ✅ | Current user |
| PUT | `/auth/profile` | ✅ | Update profile (multipart, optional `profileImage`) |
| PATCH | `/auth/password` | ✅ | Change password |
| GET | `/destinations` | — | List/filter (`q`, `region`, `tag`, `sort`, `state`) |
| GET | `/destinations/:slug` | — | Destination + famous places + daily costs |
| POST | `/trips/estimate` | — | Itemised estimate (works for guests) |
| GET | `/trips` | ✅ | My saved plans + totals |
| POST | `/trips` | ✅ | Save a plan (recalculates server-side) |
| GET/PATCH/DELETE | `/trips/:id` | ✅ | Read / update status & notes / delete |
| GET | `/services` | — | Marketplace (`type`, `destinationSlug`, `q`, `sort`, price range) |
| GET | `/services/mine` | provider | My listings |
| GET | `/services/:id` | ✅ | Single service with owner contact |
| POST/PATCH/DELETE | `/services[/:id]` | provider | Manage listings (own only, type must match role) |
| POST | `/bookings` | traveller | Request a booking |
| GET | `/bookings/mine` | traveller | My requests |
| GET | `/bookings/provider` | provider | Incoming requests |
| PATCH | `/bookings/:id/status` | both | Provider confirms/declines/completes; traveller cancels |
| GET | `/dashboard` | ✅ | Role-aware summary cards + recent activity |

Errors are always `{ success: false, message, details? }` with sensible status codes
(400 validation, 401 auth, 403 role, 404 missing, 409 duplicate email).

## Tests

**API smoke test** (dependency-free, needs the API running):

```bash
npm run smoke
```

It asserts the health/meta endpoints, destination seed quality (4 famous places each, Goa's four
required landmarks), server-side estimates, optional-service behaviour, auth failures, role guards,
saved trips, service listings, booking creation and provider visibility — 16 checks.

**Manual UI checklist** (all verified during development with Playwright):

1. Register a traveller → lands on `/dashboard/traveller`, JWT persisted in `localStorage`.
2. `/plan`: change destination/boarding city/toggles → estimate recalculates; “Save this trip plan” →
   appears on the dashboard with the same breakdown.
3. `/services` → “Request booking” → request appears under **My bookings** and in the provider's
   **Booking requests**; provider confirms; traveller sees the new status.
4. `/dashboard/profile` → upload a photo, edit phone/city/bio → save → header avatar and dashboard
   reflect the change; role-specific fields persist for provider roles.
5. Provider `/dashboard/services` → publish/edit/pause/delete a service.
6. Sign out → protected dashboard URLs redirect to `/login`; unknown URLs show the 404 page.
7. Mobile 390 px: hamburger navigation, stacked planner, single-column cards.

## Destinations and famous places

| Destination | State | Famous places |
| --- | --- | --- |
| Goa | Goa | Fort Aguada, Baga Beach, Anjuna Beach, Chapora Fort |
| Jaipur | Rajasthan | Amer Fort, Hawa Mahal, City Palace, Jal Mahal |
| Agra | Uttar Pradesh | Taj Mahal, Agra Fort, Mehtab Bagh, Fatehpur Sikri |
| Kerala | Kerala | Munnar Tea Gardens, Alappuzha Backwaters, Fort Kochi, Periyar National Park |
| Manali | Himachal Pradesh | Solang Valley, Rohtang Pass, Hadimba Temple, Old Manali & Beas River |
| Delhi | NCT of Delhi | Red Fort, India Gate, Qutub Minar, Humayun's Tomb |

Add a destination by inserting a document in `backend/data/destinations.js` (slug, coordinates,
`dailyCosts`, `places[]`) and re-running `npm run seed`. The planner, filters and marketplace pick it
up automatically.

## MongoDB Atlas troubleshooting

`npm run db:check` covers all of these, but for reference:

| Symptom | Cause | Fix |
| --- | --- | --- |
| `querySrv ENOTFOUND _mongodb._tcp.<host>` | Wrong cluster hostname, or the network blocks DNS SRV | Copy the hostname again from Atlas; try another network |
| `Server selection timed out` / `ETIMEDOUT` | Your IP is not allow-listed, or the cluster is paused | Atlas → Network Access → add your IP (or `0.0.0.0/0` in dev); resume the cluster |
| `bad auth : authentication failed` | Wrong username/password, or unencoded special characters | Reset the database user's password; URL-encode `@ : / ? # [ ] %` |
| `MongooseServerSelectionError` on first connect | Cluster still provisioning (M0 can take ~3 min) | Wait for **Active**, then retry |
| Works locally, fails in production | Missing `MONGODB_URI`/`JWT_SECRET` env vars | Both are mandatory when `NODE_ENV=production` |
| Seeded data missing | `SEED_DEMO_DATA=false` or seed never run | `npm run seed` (idempotent: safe to re-run) |
| App shows the “Connect MongoDB Atlas” screen | `MONGODB_URI` missing, or the cluster is unreachable | Follow the steps on the screen; `npm run db:check` names the exact cause |

Atlas connection details are never exposed: `/api/meta/health` returns the host, database name and
pool state with credentials masked, and `npm run db:check` prints `mongodb+srv://user:***@host/db`.

## Image credits and licences

The 24 landmark photographs in `frontend/public/images/places/` were downloaded from Wikipedia lead
images / Wikimedia Commons by `scripts/fetch-place-images.py`. Each file keeps its original licence
(mainly CC BY-SA 3.0/4.0, some public domain) and is listed with author, licence and source link in
**[`frontend/public/images/CREDITS.md`](frontend/public/images/CREDITS.md)** (also served at
`/images/CREDITS.md`). Keep that attribution if you deploy publicly; re-run
`npm run images` to refresh the set.

Avatars in `frontend/public/images/avatars/` are original SVGs created for this project.

## Notes, limits and next steps

- **Estimates, not bookings** — prices are planning averages stored per destination; no payment
  gateway or live availability is integrated. Booking requests are confirmed by the provider.
- **Database** — MongoDB Atlas is the only store. Nothing is cached or persisted locally, so the app
  needs network access to the cluster; without it you get the setup screen rather than stale data.
- **Geocoding** — curated cities work offline. Free-text boarding points use Nominatim and respect a
  short timeout; heavy production use should switch to a paid geocoder or a local places table.
- **Uploads on disk** — fine for a single server; use S3/Cloudinary or GridFS for horizontal scale.
- Ideas for a next iteration: itinerary day-by-day builder, reviews and ratings written by
  travellers, availability calendars, email/SMS notifications, Razorpay payment, Mapbox route
  previews, admin moderation of providers, and i18n for Indian languages.

---

Built as a full-stack MVC reference project: **React · Express · MongoDB**, with a codebase that is
meant to be read as much as run.
