# TravelMate API reference

Base URL: `http://localhost:5000/api` (the Vite dev server proxies `/api` from port 5173).

All responses use the envelope:

```json
{ "success": true, "message": "OK", "data": { }, "meta": { } }
```

Errors:

```json
{ "success": false, "message": "Human readable reason", "details": [{ "field": "email", "message": "..." }] }
```

Authenticated requests send `Authorization: Bearer <jwt>`.

---

## Meta

### `GET /meta`

Public configuration used to render selects and to confirm which database is connected.

```json
{
  "success": true,
  "data": {
    "app": "TravelMate",
    "currency": "INR",
    "roles": [{ "value": "traveller", "label": "Traveller" }, "..."],
    "boardingPoints": [{ "name": "Hyderabad", "state": "Telangana", "lat": 17.385, "lng": 78.4867 }],
    "transportModes": [{ "value": "train", "label": "Train (3AC)", "ratePerKm": 2.4, "routeFactor": 1.18 }],
    "hotelTiers": [{ "value": "budget", "label": "Budget stay" }],
    "imageCredits": { "count": 24, "source": "Wikipedia lead images and Wikimedia Commons", "creditsUrl": "/images/CREDITS.md" },
    "database": { "mode": "mongodb-atlas", "provider": "MongoDB Atlas", "host": "cluster0.xxxxx.mongodb.net", "uri": "mongodb+srv://user:***@cluster0.xxxxx.mongodb.net/travelmate", "database": "travelmate", "state": "connected" }
  }
}
```

### `GET /meta/health`

```json
{ "success": true, "data": { "status": "ok", "uptimeSeconds": 42, "database": { "mode": "mongodb-atlas", "provider": "MongoDB Atlas", "host": "cluster0.xxxxx.mongodb.net", "uri": "mongodb+srv://user:***@cluster0.xxxxx.mongodb.net/travelmate", "database": "travelmate", "state": "connected" }, "timestamp": "2026-10-25T04:20:00.000Z" } }
```

---

## Auth

### `POST /auth/register`

```json
{
  "name": "Ananya Verma",
  "email": "ananya@example.com",
  "password": "Explorer@123",
  "role": "traveller",
  "phone": "+91 90000 11111",
  "city": "Bengaluru"
}
```

`role` ∈ `traveller | guide | transport | hotel`. Password ≥ 8 characters.
Returns `201` with `{ user, token }`. Duplicate email → `409`.

### `POST /auth/login`

```json
{ "email": "traveller@travelmate.in", "password": "Demo@123" }
```

Returns `{ user, token }`; wrong credentials → `401`.

### `GET /auth/me`

Bearer token → `{ user }` including `profileCompletion`, role label and all profile fields.

### `PUT /auth/profile`

`multipart/form-data` (so a photo can be attached). Text fields: `name`, `email`, `phone`, `city`,
`state`, `bio`, `website`, `hotelCategory`, list fields sent as JSON arrays or comma-separated
strings (`languages`, `specialities`, `vehicleTypes`, `serviceAreas`, `amenities`), numbers
(`experienceYears`, `dailyRate`), and optional file `profileImage` (≤ 3 MB, JPG/PNG/WEBP/GIF).
Replacing the photo deletes the previous file. Returns the updated `user`.

### `PATCH /auth/password`

```json
{ "currentPassword": "Demo@123", "newPassword": "NewSecret@123" }
```

---

## Destinations

### `GET /destinations`

Query: `q`, `region`, `state`, `tag`, `sort` (`popular|price-low|price-high|name`), `limit` (max 100).

```json
{
  "success": true,
  "data": [
    {
      "id": "652f…",
      "slug": "goa",
      "name": "Goa",
      "state": "Goa",
      "region": "West Coast",
      "tagline": "Golden beaches, Portuguese forts and easy-going coastal days.",
      "heroImage": "/images/places/baga-beach.jpg",
      "bestTime": "November – February",
      "idealDays": 4,
      "fromPrice": 8999,
      "rating": 4.8,
      "dailyCosts": { "budgetHotel": 2200, "standardHotel": 4500, "premiumHotel": 9500, "food": 1000, "localTransport": 800, "activities": 900, "guide": 1800 },
      "places": [
        { "id": "fort-aguada", "name": "Fort Aguada", "category": "Heritage", "image": "/images/places/fort-aguada.jpg", "duration": "1–2 hours", "entryFee": 0, "highlight": "Sunset viewpoint and historic lighthouse", "bestTime": "Late afternoon" }
      ]
    }
  ],
  "meta": { "total": 6, "regions": ["Himalayas", "North India", "South India", "West Coast"], "states": ["Goa", "…"] }
}
```

### `GET /destinations/:slug`

Same object, plus `description`, `weather`, `safetyTip`, `languages`, `coordinates`.

---

## Trips

### `POST /trips/estimate` (public)

```json
{
  "boardingPoint": "Hyderabad",
  "destinationSlug": "goa",
  "days": 4,
  "travelers": 2,
  "startDate": "2026-11-15",
  "options": {
    "needTransport": true,
    "transportMode": "train",
    "needHotel": true,
    "hotelTier": "standard",
    "rooms": 1,
    "needGuide": true,
    "guideDays": 2,
    "mealPlan": true,
    "includeActivities": true
  }
}
```

Response (`data`):

```json
{
  "boardingPoint": { "name": "Hyderabad", "lat": 17.385, "lng": 78.4867, "source": "curated" },
  "destination": { "slug": "goa", "name": "Goa", "state": "Goa", "coordinates": { "lat": 15.2993, "lng": 74.124 } },
  "options": { "days": 4, "travelers": 2, "transportMode": "train", "hotelTier": "standard", "…": "…" },
  "estimate": {
    "distanceKm": 520,
    "roadDistanceKm": 614,
    "routeFactor": 1.18,
    "currency": "INR",
    "lineItems": [
      { "key": "transport", "label": "Return Train (3AC) travel", "details": "1,228 km round trip · Hyderabad ↔ Goa", "amount": 6394 },
      { "key": "hotel", "label": "Standard stay (3 nights)", "details": "₹4,500 per room × 1 room × 3 nights", "amount": 13500 },
      { "key": "meals", "label": "Meals for the full trip", "details": "₹1,000 per traveller × 2 × 4 days", "amount": 8000 },
      { "key": "localTransport", "label": "Local sightseeing transfers", "details": "₹800 per day × 1 vehicle", "amount": 3200 },
      { "key": "guide", "label": "Local travel guide", "details": "₹1,800 per day × 2 days", "amount": 3600 },
      { "key": "activities", "label": "Activities & monument entries", "details": "₹900 per traveller × 2 × 4 days", "amount": 7200 }
    ],
    "subtotal": 41894,
    "taxes": 2095,
    "contingency": 2095,
    "total": 46084,
    "perPerson": 23042,
    "assumptions": ["…"],
    "disclaimer": "Indicative estimate in Indian rupees. …"
  }
}
```

`boardingPoint` also accepts `{ "name": "Custom", "lat": 17.4, "lng": 78.5 }`. Unknown city names are
geocoded when `ENABLE_GEOCODING` is not `false`; otherwise they return `400`.

### `POST /trips` (traveller)

Same body as the estimate plus optional `notes` and `selectedServices: [serviceId]`. The server
**recalculates** the estimate and stores it with the plan. Returns `201` with the saved trip.

### `GET /trips`

`{ data: [trip], meta: { count, planned, estimatedValue } }`. Optional `status`, `limit`.

### `GET /trips/:id` · `PATCH /trips/:id` · `DELETE /trips/:id`

`PATCH` body: `{ "status": "booked" | "planned" | "completed" | "cancelled", "notes": "…" }`.
All operations are scoped to the authenticated owner.

---

## Services

### `GET /services` (public)

Query: `type` (`guide|transport|hotel`), `destinationSlug`, `q`, `minPrice`, `maxPrice`,
`sort` (`featured|price-low|price-high|rating|newest`), `limit`.

```json
{
  "success": true,
  "data": [
    {
      "id": "652f…",
      "type": "guide",
      "title": "Goa heritage & hidden-beach guide",
      "destinationSlug": "goa",
      "city": "Panaji",
      "description": "A friendly full-day guided experience …",
      "image": "/images/places/fort-aguada.jpg",
      "price": { "amount": 2200, "unit": "day" },
      "capacity": 8,
      "languages": ["English", "Hindi", "Konkani"],
      "tags": ["Heritage", "Food", "Beaches"],
      "rating": 4.9,
      "reviews": 128,
      "availability": true,
      "owner": { "id": "652e…", "name": "Meera Guide", "role": "guide", "city": "Panaji", "phone": "+91 98200 11223", "email": "guide@travelmate.in", "verified": true }
    }
  ]
}
```

### `GET /services/mine` (provider) · `GET /services/:id` (auth)

### `POST /services` (provider)

```json
{
  "type": "hotel",
  "title": "PalmShade boutique beach stay, Goa",
  "destinationSlug": "goa",
  "city": "Anjuna",
  "description": "Bright rooms five minutes from Anjuna Beach …",
  "price": { "amount": 4200, "unit": "night" },
  "capacity": 3,
  "languages": ["English", "Hindi"],
  "tags": ["Breakfast", "Near beach"],
  "contactPhone": "+91 98470 77889",
  "availability": true
}
```

`type` must equal the account role, `destinationSlug` must exist, `price.amount` > 0.
`PATCH /services/:id` accepts any subset (including `availability`), `DELETE /services/:id` removes it.

---

## Bookings

### `POST /bookings` (traveller)

```json
{
  "serviceId": "652f…",
  "bookingDate": "2026-11-20",
  "duration": 2,
  "guests": 2,
  "distanceKm": 140,
  "note": "Please include Fort Aguada at sunset.",
  "contactPhone": "+91 98765 43210",
  "tripId": "652d…"
}
```

Amount is computed from the service price unit (`day|night` × duration, `trip` × 1,
`km` × distanceKm). Provider cannot be the caller; guests must fit the service capacity.

### `GET /bookings/mine` (traveller) · `GET /bookings/provider` (provider)

Each booking includes the counterparty (traveller for providers, provider contact for travellers),
the service card data and the linked trip id.

### `PATCH /bookings/:id/status`

```json
{ "status": "confirmed" }
```

Providers: `pending → confirmed | cancelled`, `confirmed → completed`.
Travellers: `pending | confirmed → cancelled`.

---

## Dashboard

### `GET /dashboard`

Role-aware. For a traveller:

```json
{
  "success": true,
  "data": {
    "role": "traveller",
    "cards": [
      { "label": "Saved trip plans", "value": 1, "hint": "1 ready to book", "icon": "map" },
      { "label": "Booking requests", "value": 2, "hint": "Across all providers", "icon": "calendar" },
      { "label": "Planned trip value", "value": 46084, "hint": "Sum of saved estimates", "icon": "wallet", "currency": true },
      { "label": "Confirmed spend", "value": 12600, "hint": "Confirmed + completed bookings", "icon": "check", "currency": true }
    ],
    "recentBookings": ["…"]
  }
}
```

For providers the cards are published services, pending requests, confirmed bookings and confirmed
earnings, with the five most recent requests.

---

## Status codes

| Code | When |
| --- | --- |
| `200` | Successful read/update |
| `201` | Account, trip, service or booking created |
| `400` | Validation failure, invalid city, bad price/capacity |
| `401` | Missing/expired token or wrong password |
| `403` | Authenticated but the role cannot perform the action |
| `404` | Unknown route, destination, trip, service or booking |
| `409` | Duplicate email |
| `500` | Unexpected server error (details hidden, logged server-side) |
| `503` | MongoDB Atlas is not connected — every data route answers with `code: "DATABASE_UNAVAILABLE"`, the current database state and the setup steps. `/api/meta` and `/api/meta/health` stay `200` |

### `503` example (no Atlas cluster configured)

```json
{
  "success": false,
  "message": "TravelMate is not connected to MongoDB Atlas yet. Add MONGODB_URI to .env, restart the API, then run `npm run seed`.",
  "details": {
    "code": "DATABASE_UNAVAILABLE",
    "database": {
      "mode": "not-configured",
      "provider": "MongoDB Atlas",
      "host": null,
      "ready": false,
      "state": "disconnected",
      "message": "MONGODB_URI is not set. TravelMate only stores data in MongoDB Atlas."
    },
    "setupSteps": [
      "Create a free cluster at cloud.mongodb.com",
      "Add your IP under Network Access",
      "Copy the mongodb+srv:// string from Connect → Drivers",
      "Set MONGODB_URI in .env and restart the API",
      "Run npm run db:check, then npm run seed"
    ]
  }
}
```
