# Architecture

TravelMate is a two-package monorepo. The React client and the Express/MongoDB server are deployed
separately and only speak JSON over `/api`. Inside the server the code is organised in classic MVC
with a service layer.

```
frontend/ (React SPA)                    backend/ (Express API)
┌────────────────────────────┐           ┌─────────────────────────────────────────────┐
│ pages/  ── user screens    │           │ routes/       URL + auth + role mapping     │
│ components/ ── UI pieces   │  /api/*   │      │                                       │
│ context/ ── auth + toasts  │ ────────▶ │ controllers/  HTTP in → JSON out            │
│ lib/api.js ── fetch + JWT  │ ◀──────── │      │             │                        │
└────────────────────────────┘           │ models/       services/                     │
                                          │ (Mongoose)    (cost, geo, seed)             │
                                          │      │             │                        │
                                          │ views/        response shaping              │
                                          └──────┬──────────────────────────────────────┘
                                                 ▼
                                          MongoDB: users, destinations,
                                          services, trips, bookings
```

## 1. Models (`backend/models`)

Each Mongoose model owns its schema, validation, indexes and behaviour:

| Model | Highlights |
| --- | --- |
| `User` | Role enum, unique lowercase email, `passwordHash` with `select: false`, bcrypt pre-save hook, `comparePassword()`, virtual `profileCompletion`, `toJSON` strips secrets |
| `Destination` | Slug key, coordinates subdocument, `dailyCosts` subdocument, embedded `places[]` (famous places), indexes for filters |
| `Service` | `owner` ref, `type` enum constrained by the owner role, `price { amount, unit }`, availability, seeded `seedKey` for idempotent seeding |
| `Trip` | `owner`, resolved boarding point, `options`, full `estimate` snapshot with line items, status workflow |
| `Booking` | `traveller` + `provider` refs, optional `trip`, amount, status workflow, denormalised `serviceTitle` so history survives service edits |

`seedKey` fields (`Service`, `Trip`, `Booking`) are unique + sparse. They let the seeder run on every
boot without duplicating demo data.

## 2. Views (`backend/views/responseView.js`)

A server-rendered JSON “view layer”. Instead of leaking raw documents, controllers call
`userView`, `destinationView`, `serviceView`, `tripView`, `bookingView`. These functions:

- convert `_id` to a string `id` and drop `_id`/`__v`;
- remove `passwordHash` in every path;
- add derived fields (`roleLabel`, `profileCompletion`, mirrored `options.days`);
- populate safe subsets of related users (name, phone, email, verified) so a booking card can show
  contact details without exposing account internals;
- expose `sendSuccess(res, data, { message, status, meta })` for a consistent envelope:

```json
{ "success": true, "message": "OK", "data": { }, "meta": { "count": 6 } }
```

## 3. Controllers (`backend/controllers`)

Controllers are thin and never talk to the database driver directly:

| Controller | Responsibilities |
| --- | --- |
| `authController` | Register/login, session refresh (`me`), profile update (multipart form), password change, list-field parsing, old avatar cleanup |
| `destinationController` | Search/filter/sort destinations, single slug lookup |
| `tripController` | Public estimate, save plan (server-side recalculation), list/patch/delete own trips |
| `serviceController` | Marketplace query, own listings, create/update/delete with role and ownership checks |
| `bookingController` | Create request with amount computation, traveller/provider listing, status transitions |
| `dashboardController` | Role-aware aggregation of cards + recent activity |
| `metaController` | Public metadata (roles, boarding cities, transport rates, DB mode, image credits) |

Input validation is explicit and defensive: whitelists for sort fields, integer clamping
(`days 1–30`, `travellers 1–30`), enum checks, `ObjectId` checks, ownership filters on every write,
and a generic error normaliser for Mongoose/Multer/JWT failures.

## 4. Services (`backend/services`)

- **`costService`** — the pricing engine. `normaliseOptions()` clamps and defaults user input;
  `estimateTrip()` resolves the boarding point, computes distance and builds line items, taxes,
  contingency, per-person share, assumptions and a disclaimer. Pure functions except for the
  boarding-point resolution, which makes it easy to unit test.
- **`geoService`** — 28 curated Indian cities with aliases (e.g. *Bangalore → Bengaluru*,
  *Cochin → Kochi*), haversine distance, and an optional cached OpenStreetMap Nominatim lookup for
  free-text cities (5 s timeout, India-only).
- **`seedService`** — idempotent upserts of six destinations, four demo accounts (one per role), nine
  demo services, a saved trip and two bookings. Only runs for demo in development or when
  `SEED_DEMO_DATA=true`.

## 5. Middleware (`backend/middleware`)

- `protect` — verifies `Authorization: Bearer <jwt>`, loads the user, attaches `req.user`.
- `authorize(...roles)` — role gate used by service, booking and dashboard routes.
- `uploadProfileImage` — Multer disk storage, 3 MB limit, MIME whitelist (JPG/PNG/WEBP/GIF),
  generated filenames.
- `requireDatabase` — returns 503 with setup guidance on data routes while the Atlas cluster is
  unavailable, keeping `/api/meta/health` reachable for the setup screen.
- `errorHandler` — maps validation/cast/duplicate-key/Multer/JWT errors to
  `{ success: false, message, details? }` and hides internals on 5xx.

## 6. Database connection (`backend/config/database.js`)

**MongoDB Atlas is the only datastore.** There is no Docker service, no local `mongod`, and no
in-memory substitute anywhere in the codebase — `MONGODB_URI` is the single source of truth.

- Reads `.env` from the repo root and `backend/.env` (root wins, `backend/.env` can override).
- `mongodb+srv://` URIs get TLS, retryable writes, a 20 s server-selection window (M0 clusters warm
  up slowly) and a configurable pool size; a plain `mongodb://` URI keeps a 10 s window.
- `MONGODB_DB` can pin the database name independently of the URI, so a single cluster can serve
  several environments (`travelmate-dev`, `travelmate-prod`).
- Failures are translated by `explainConnectionError()` into actionable guidance — DNS/SRV problems,
  Atlas IP allow-list, bad credentials, an unencoded password, an invalid scheme, or a paused
  cluster — together with the five setup steps, and `npm run db:check` is recommended.
- Connection lifecycle events (`disconnected`, `reconnected`) are logged, and
  `getDatabaseInfo()` exposes `{ mode, provider, host, uri (masked), database, ready, state }` to
  `/api/meta/health` — credentials are never exposed.

### Missing or unreachable cluster (setup mode)

- `server.js` calls `connectDatabase()` once at boot.
- **Production:** any failure propagates and the process exits — a misconfigured deployment never
  serves traffic.
- **Development:** the API keeps listening so the UI can explain the problem.
  `backend/middleware/database.js` (`requireDatabase`) is mounted on `/api` after the meta routes and
  answers **503** with `{ code: 'DATABASE_UNAVAILABLE', database, setupSteps }` for every data
  endpoint, while `/api/meta` and `/api/meta/health` stay **200** so the frontend can read the state.
- The React shell is wrapped in `components/DatabaseGate.jsx`, which polls `/api/meta/health` every
  6 s and renders the **Connect MongoDB Atlas** screen — steps, the detected failure, the retry
  button — until `state === 'connected'`, then hands over to the normal routes.

### Atlas operations

- `npm run db:check` (`backend/scripts/db-check.js`) is the connection doctor: it reports the
  machine's public egress IP (for Atlas → Network Access), resolves DNS SRV/TXT records, times the
  handshake, probes read **and** write permissions, prints the server version and replica-set
  primary, and counts the TravelMate collections.
- `npm run seed` upserts the six destinations and (when `SEED_DEMO_DATA` is not `false`) the four
  demo accounts, nine services, one saved trip and two bookings. Every seed operation is idempotent
  (slug / email / `seedKey`), so it is safe to run after every deploy.
- `server.js` re-seeds on boot when `SEED_DEMO_DATA=true`, so a fresh Atlas database becomes usable
  immediately.

## 7. Frontend architecture

- **Routing** — `App.jsx` defines public pages, auth pages (standalone layout), and a nested
  dashboard route tree protected by `ProtectedRoute` (session check + role check + redirect).
- **State** — `AuthContext` owns the JWT session (`login`, `register`, `logout`, `updateProfile`,
  `changePassword`, `refreshMe`) and persists the token in `localStorage`. `ToastContext` provides
  accessible, self-dismissing notifications. Everything else is local component state, which keeps
  the app dependency-light.
- **API client** — `lib/api.js` wraps `fetch`, injects the bearer token, understands FormData, and
  translates failures into `ApiError` with a friendlier network message.
- **Planner** — `PlanTrip` debounces a POST to `/trips/estimate` whenever the request body changes
  (including aborting stale requests), so the estimate panel is always in sync and never trusts the
  client for money.
- **Styling** — three CSS files: `base.css` (tokens, buttons, forms, chrome), `pages.css` (marketing
  surfaces, detail pages, planner, auth) and `dashboard.css` (dashboard shell, panels, modals,
  responsive rules). Tokens (`--ink`, `--mint`, `--sand`, radii, shadows) keep the visual language
  consistent and make theming a one-file change.

## 8. Security posture

- Passwords hashed with bcrypt (12 rounds) and never selected by default.
- JWT signed with `JWT_SECRET` (required in production; dev fallback logs a warning path).
- Role and ownership checks on every mutating endpoint (e.g. a traveller receives 403 when trying to
  publish a service, providers cannot book their own service, trips are scoped by `owner`).
- Upload constraints: size, MIME whitelist, generated filenames, static serving with
  `X-Content-Type-Options: nosniff`.
- Mongo injection avoided by casting/whitelisting input and never passing raw objects to queries.
- CORS limited to `CLIENT_URL` (comma-separated) plus same-origin/no-origin requests.
- Basic hardening headers (`X-Powered-By` disabled, referrer policy, nosniff).

## 9. Request lifecycle example — booking a guide

```
POST /api/bookings { serviceId, bookingDate, duration, guests }
  protect → authorize('traveller')
  bookingController:
    • load service, ensure it exists, is available, and is not owned by the caller
    • clamp duration/guests, validate capacity, optional trip ownership
    • compute amount from the service's price unit (km → distance × rate)
  Booking.create(...)                       → MongoDB
  populate(service, provider, traveller)     → safe contact details
  bookingView(...)                           → API payload
  provider dashboard (/api/bookings/provider) and traveller view (/api/bookings/mine) update
```
