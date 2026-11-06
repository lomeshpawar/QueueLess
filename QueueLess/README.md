# QueueLess — Smart Token Management System

MERN stack MCA FSD micro project.

## Requirements
- Node.js 20+ recommended
- Local MongoDB Community Server running on `mongodb://127.0.0.1:27017`

## 1. Backend
```powershell
cd server
Copy-Item .env.example .env
npm install
npm run dev
```
The API runs on http://localhost:5000. The first startup creates the staff account from `.env` if it does not exist.

Default local demo credentials (change them in `.env`):
- Email: `staff@queueless.local`
- Password: `QueueLess@123`

## 2. Frontend (new terminal)
```powershell
cd client
npm install
npm run dev
```
Open the Vite URL shown, usually http://localhost:5173.

## Campus Services
The system manages 6 dedicated campus service queues:
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
- `GET /api/tokens/mine/:tokenNumber` — look up a token with service-isolated position & wait
- `GET /api/tokens/stats` — staff dashboard stats (JWT required, includes `byService` breakdown)
- `POST /api/tokens/call-next` — call oldest waiting token for a service (JWT required)
- `PATCH /api/tokens/:id/call` — call token (JWT required)
- `PATCH /api/tokens/:id/serve` — mark served (JWT required)
- `PATCH /api/tokens/:id/skip` — skip token (JWT required)
- `PATCH /api/tokens/:id/recall` — return skipped token to waiting (JWT required)

## Test status and safety

The current `npm test` script runs a manual API scenario runner. It connects to the local `queueless` MongoDB database and deletes all token records for the current date before running its scenarios.

**Do not run `npm test` against your normal development database or any database containing real or valuable records.** The script is not isolated yet, and there is no safe automated test command in the current repository. Database isolation and a non-destructive test setup are tracked in [issue #2](https://github.com/lomeshpawar/QueueLess/issues/2).

## Notes
This is an academic demonstration. The initial staff account is seeded from environment variables. Change the demo password and JWT secret before using this beyond a local demo. Waiting time is calculated per service based on active serving status and average service duration.

