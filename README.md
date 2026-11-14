# QueueLess — Smart Token Management System

> MERN-stack academic project for digital token generation and service-specific queue management on campus.

## Static frontend preview

**Frontend preview URL:** https://lomeshpawar.github.io/QueueLess/  
**Deployment workflow:** https://github.com/lomeshpawar/QueueLess/actions/workflows/pages.yml

The workflow builds the React/Vite frontend. GitHub Pages must be enabled by a repository administrator: open [Repository Pages settings](https://github.com/lomeshpawar/QueueLess/settings/pages), set **Build and deployment → Source** to **GitHub Actions**, and save. Then rerun the [Pages workflow](https://github.com/lomeshpawar/QueueLess/actions/workflows/pages.yml). The preview URL is not confirmed live until the deployment job succeeds.

This Pages deployment publishes the built React/Vite frontend only. Queue generation, staff authentication, token management, live queue state, and statistics need the Express API and MongoDB to be hosted separately. The public preview is not a fully live queueing service until the client API base URL points to a deployed HTTPS API and the server/database are configured.

## Features

- Token generation for six campus services
- Service-specific queue position and estimated waiting time
- Public queue snapshot and token lookup
- Staff login and queue management actions
- Dashboard statistics
- Backend unit tests and an explicitly isolated manual scenario runner

Services: General Enquiry, Exam Section, Accounts, Library, College Canteen, and Idea Lab.

## Known security limitation

The current `main` branch returns full token documents from the public queue snapshot and token-lookup endpoints. Those responses include visitor names and internal MongoDB identifiers; token numbers are not an authorization boundary. Do not use real visitor information or expose this backend publicly until public responses are reduced to a minimal DTO and visitor details are protected. See [issue #1](https://github.com/lomeshpawar/QueueLess/issues/1) and [PR #7](https://github.com/lomeshpawar/QueueLess/pull/7), which is still under review and has not been merged.


## Stack

- React, Vite, JavaScript
- Node.js, Express
- MongoDB, Mongoose
- JWT-based staff authentication

## Run locally

### Backend

```powershell
cd QueueLess/server
Copy-Item .env.example .env
npm ci
npm run dev
```

Edit `.env` before starting the server. Set a unique `JWT_SECRET` of at least 32 characters, a `STAFF_EMAIL`, a unique `STAFF_PASSWORD` of at least 12 characters, and an explicit `MONGODB_URI`. The example file supplies a localhost MongoDB URI for local development; replace it with the connection string for your chosen database. The server refuses to start if the MongoDB URI is missing, malformed, or uses an unsupported scheme. Production deployments must provide their managed database URI through the hosting provider's server-side environment settings.

The default API port is `5000`.

### Frontend

```powershell
cd QueueLess/client
npm ci
npm run dev
```

Open the local URL shown by Vite, typically `http://localhost:5173`.

## Testing

From `QueueLess/server`:

```bash
npm test
```

This runs database-free Node.js unit tests for security configuration, MongoDB URI validation, JWT middleware behavior, scenario-test environment validation, and average-service-time configuration validation (including invalid and non-finite values). GitHub Actions runs this command.

### Optional API scenario runner

`npm run test:scenarios` runs manual API scenarios and deletes current-day token records from its target database to establish a clean baseline. It now requires `TEST_MONGODB_URI`, `TEST_STAFF_EMAIL`, and `TEST_STAFF_PASSWORD`. The database name in `TEST_MONGODB_URI` must end in `_test`; a normal `queueless` database is rejected.

Use a disposable database such as `mongodb://127.0.0.1:27017/queueless_test`. Start the API separately with `MONGODB_URI` set to that same test database and `STAFF_EMAIL` / `STAFF_PASSWORD` matching the test credentials. Set `TEST_API_BASE` only if the API is not at `http://localhost:5000/api`.

**Never point the scenario runner at a development, staging, or production database.** It intentionally clears today's records in the isolated `_test` database. See [issue #2](https://github.com/lomeshpawar/QueueLess/issues/2) for further test-isolation work.

## GitHub Pages deployment

The workflow in `.github/workflows/pages.yml` builds `QueueLess/client` with the correct repository base path, configures GitHub Pages, and publishes the `dist/` output. Check the [Pages workflow runs](https://github.com/lomeshpawar/QueueLess/actions/workflows/pages.yml) to confirm the latest deployment succeeds.

## For a full public deployment

1. Deploy the Express API to a Node-compatible host.
2. Use a managed MongoDB instance and store the connection string as a server-side secret.
3. Configure the frontend to call the deployed API over HTTPS.
4. Configure CORS for the intended frontend origin.
5. Test token creation, per-service isolation, staff authorization, and wait-time calculations against the hosted services.

**Security:** Never commit `.env`, JWT secrets, real staff passwords, or database credentials. Frontend UI checks do not replace server-side authorization.
