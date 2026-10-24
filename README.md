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
- Automated backend tests

Services: General Enquiry, Exam Section, Accounts, Library, College Canteen, and Idea Lab.

## Stack

- React, Vite, JavaScript
- Node.js, Express
- MongoDB, Mongoose
- Staff authentication and protected backend routes

## Run locally

### Backend

```powershell
cd QueueLess/server
Copy-Item .env.example .env
npm install
npm run dev
```

Set unique local secrets and staff credentials in `.env`, then start MongoDB at the configured connection string. The default API port is `5000`.

### Frontend

```powershell
cd QueueLess/client
npm install
npm run dev
```

Open the local URL shown by Vite, typically `http://localhost:5173`.

### Tests

```powershell
cd QueueLess/server
npm test
```

## GitHub Pages deployment

The workflow in `.github/workflows/pages.yml` builds `QueueLess/client` with the correct repository base path, configures GitHub Pages, and publishes the `dist/` output. Check the [Pages workflow runs](https://github.com/lomeshpawar/QueueLess/actions/workflows/pages.yml) to confirm the latest deployment succeeds.

## For a full public deployment

1. Deploy the Express API to a Node-compatible host.
2. Use a managed MongoDB instance and store its connection string as a server-side secret.
3. Configure the frontend to call the deployed API over HTTPS.
4. Configure CORS for the intended frontend origin.
5. Test token creation, per-service isolation, staff authorization, and wait-time calculations against the hosted services.

**Security:** Never commit `.env`, JWT secrets, real staff passwords, or database credentials. Frontend UI checks do not replace server-side authorization.
