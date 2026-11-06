# QueueLess — Smart Token Management System

MERN stack MCA FSD micro project.

## Requirements
- Node.js 20+
- MongoDB Community Server for local development

## 1. Backend

```powershell
cd server
Copy-Item .env.example .env
npm ci
npm run dev
```

Edit `.env` before starting. Set a unique `JWT_SECRET` with at least 32 characters, `STAFF_EMAIL`, and a unique `STAFF_PASSWORD` with at least 12 characters. The committed example contains placeholders only. The API refuses to start when these values are missing, weak, or unchanged placeholders. The first startup creates the configured staff account if it does not exist.

The API runs on `http://localhost:5000`.

## 2. Frontend (new terminal)

```powershell
cd client
npm ci
npm run dev
```

Open the Vite URL shown, usually `http://localhost:5173`.

## Campus Services

The system manages six dedicated campus service queues:
1. General Enquiry
2. Exam Section
3. Accounts
4. Library
5. College Canteen
6. Idea Lab

## Main API routes

- `POST /api/auth/login` — staff login
- `GET /api/tokens` — public queue snapshot (supports `?service=` filter)
- `POST /api/tokens` — create a visitor token
- `GET /api/tokens/mine/:tokenNumber` — look up a token with service-isolated position and wait
- `GET /api/tokens/stats` — staff dashboard stats (JWT required)
- `POST /api/tokens/call-next` — call the oldest waiting token for a service (JWT required)
- `PATCH /api/tokens/:id/call` — call token (JWT required)
- `PATCH /api/tokens/:id/serve` — mark served (JWT required)
- `PATCH /api/tokens/:id/skip` — skip token (JWT required)
- `PATCH /api/tokens/:id/recall` — return skipped token to waiting (JWT required)

## Tests

Run the database-free unit tests:

```bash
npm test
```

The tests cover required security configuration, JWT middleware behavior, and validation of the scenario-test database target. GitHub Actions runs this command.

## Optional API scenario runner

`npm run test:scenarios` runs manual API scenarios. It deletes current-day token records to create a clean baseline, so it must use a disposable MongoDB database whose name ends in `_test`.

Required environment variables:
- `TEST_MONGODB_URI` — for example `mongodb://127.0.0.1:27017/queueless_test`
- `TEST_STAFF_EMAIL`
- `TEST_STAFF_PASSWORD`
- Optional `TEST_API_BASE` (defaults to `http://localhost:5000/api`)

Start the API separately with `MONGODB_URI` set to the same disposable test database and `STAFF_EMAIL` / `STAFF_PASSWORD` matching the test credentials. A database named `queueless` is rejected by the scenario runner.

**Never run scenario tests against a database containing valuable development or real user data.** The runner intentionally clears today's records from the isolated `_test` database.

## Notes

This is an academic demonstration. Use unique secrets and staff credentials for every deployment. Waiting time is calculated per service based on active serving status and average service duration.
