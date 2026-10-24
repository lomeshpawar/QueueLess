# QueueLess — Smart Token Management System

A MERN-stack academic project for managing service-specific queues in a college environment. Visitors can create a token and check their place in the appropriate service queue; staff can call, serve, skip, or recall tokens from a dashboard.

## Project status and hosting

**Repository:** https://github.com/lomeshpawar/QueueLess

The app uses React/Vite in the browser and an Express/MongoDB backend. GitHub Pages can host only a static frontend build; it cannot run Express or MongoDB. This repository currently documents a local workflow, so do not treat it as a fully live online queueing service until the frontend is built for a public base path and the API/database are deployed separately.

## Features

- Token creation for six campus services
- Service-isolated queue position and waiting-time estimates
- Public queue snapshot and token lookup
- Staff sign-in and token workflow actions
- Staff dashboard statistics
- Automated backend tests for queue isolation and staff operations

### Campus services

1. General Enquiry
2. Exam Section
3. Accounts
4. Library
5. College Canteen
6. Idea Lab

## Technology stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JWT-based staff authentication |
| Testing | Node test suite |
| Local tools | MongoDB Community Server, MongoDB Compass |

## Project structure

```text
QueueLess/
├── QueueLess/
│   ├── client/     # React + Vite frontend
│   ├── server/     # Express REST API and MongoDB models
│   └── README.md
├── .gitignore
└── README.md
```

## Run locally on Windows

### 1. Start MongoDB

Install MongoDB Community Server and make sure the local service is running at:

```text
mongodb://127.0.0.1:27017
```

MongoDB Compass can be used to inspect the local database.

### 2. Start the backend

Open PowerShell:

```powershell
cd QueueLess/server
Copy-Item .env.example .env
npm install
npm run dev
```

Edit `.env` and set unique local secrets and staff credentials before running. Do not publish demo passwords, JWT secrets, or database credentials.

The backend defaults to `http://localhost:5000`, unless changed by configuration.

### 3. Start the frontend

Open a second terminal:

```powershell
cd QueueLess/client
npm install
npm run dev
```

Open the Vite URL printed in the terminal, normally `http://localhost:5173`.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Staff login |
| GET | `/api/tokens` | Queue snapshot; supports service filtering |
| POST | `/api/tokens` | Create a visitor token |
| GET | `/api/tokens/mine/:tokenNumber` | Look up token position and wait time |
| GET | `/api/tokens/stats` | Staff statistics (authenticated) |
| POST | `/api/tokens/call-next` | Call the next waiting token for a service |
| PATCH | `/api/tokens/:id/call` | Call a selected token |
| PATCH | `/api/tokens/:id/serve` | Mark a token served |
| PATCH | `/api/tokens/:id/skip` | Skip a token |
| PATCH | `/api/tokens/:id/recall` | Return a skipped token to waiting |

## Tests

Run the backend test suite:

```powershell
cd QueueLess/server
npm test
```

The tests are intended to cover service-specific queue isolation, queue positions, wait estimates, and staff operations. Check the command output before claiming the suite passes.

## Deployment notes

For a public deployment:

1. Host the Express API on a Node-compatible host.
2. Host MongoDB in a reachable managed instance and use a private connection string.
3. Configure the frontend's API base URL for the deployed HTTPS API.
4. Configure CORS to allow only the intended frontend origin.
5. Build the Vite frontend with the correct base path if deploying to GitHub Pages, then publish the build output rather than the source folder.
6. Keep all secrets in host environment settings, not in the frontend or Git repository.

## Security

- Replace all example staff passwords and JWT secrets.
- Do not commit `.env` files.
- Enforce staff permissions on the backend for every staff-only endpoint.
- Validate token and service inputs server-side.
- Treat a frontend-only deployment as a UI demo, not a secured live queueing service.

## Author

**Lomesh Pawar** · [GitHub](https://github.com/lomeshpawar)
