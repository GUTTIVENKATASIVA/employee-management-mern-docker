# Employee Management System using MERN Stack and Docker Compose

A DevOps college project (Assignment Part 4, Question 62). A full-stack employee dashboard built with **React + Vite**, **Node.js + Express** and **MongoDB**, packaged as three Docker Compose services. It is independent of any earlier React + Flask + MySQL project.

## Features

- Add, view, edit and delete employees; search by name, email or position; filter by department and status.
- Dashboard statistics (headcount, active staff, average salary, payroll) and a clickable department chart.
- Responsive layout (table on desktop, cards on phones) with light and dark themes.
- REST API with input validation, JSON error responses, health check and statistics.
- Data persists in the named Docker volume `mongodb_data`.

## Architecture

```
 Browser  http://localhost:8080
    |
    v
+-------------------------+     /api/*      +-------------------+      +----------------------+
| frontend                |  ------------>  | backend           | ---> | mongodb              |
| Nginx serves React build|  proxy_pass     | Node.js + Express |      | official mongo:7.0   |
| port 80 (8080 on host)  |  http://backend | port 5000         |      | port 27017           |
+-------------------------+      :5000      +-------------------+      +----------+-----------+
          all three services share the Docker network "employee_net"             |
                                                                      volume: mongodb_data
```

The browser only talks to Nginx. Nginx serves the React files and forwards every `/api` request to the service named `backend` (Docker's internal DNS resolves the name). The backend reaches the database using the service name `mongodb`.

## Project structure

```
employee-management-mern-docker/
├── docker-compose.yml        # frontend, backend, mongodb + network + mongodb_data volume
├── .env.example              # configuration template (copy to .env)
├── .gitignore                # excludes .env, node_modules, dist
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── server.js         # start-up, Mongo connection with retry, seeding
│   │   ├── app.js            # Express routes, validation, error handling
│   │   ├── config.js  constants.js  errors.js  validation.js  stats.js
│   │   ├── seed.js  seedCli.js
│   │   ├── models/Employee.js
│   │   └── repositories/mongoEmployeeRepository.js
│   └── tests/                # automated tests (node:test)
├── frontend/
│   ├── Dockerfile            # multi-stage: Vite build -> Nginx
│   ├── nginx.conf            # serves React, proxies /api to backend:5000
│   ├── package.json  vite.config.js  index.html
│   ├── scripts/verify-build.mjs   # frontend build check
│   └── src/ (App.jsx, api.js, constants.js, styles.css, components/)
├── database/
│   ├── sample-employees.json # 15 sample employees
│   └── init-mongo.js         # creates collection + indexes on first start
├── scripts/                  # PowerShell helpers (start, stop, test, verify...)
└── docs/screenshots/         # put your screenshots here
```

## API reference

| Method | Route | Description | Success |
| --- | --- | --- | --- |
| GET | `/api/health` | Service and database status | 200 (503 if DB down) |
| GET | `/api/stats` | Totals, averages, per-department and per-status counts | 200 |
| GET | `/api/employees?search=&department=&status=` | List with optional filters | 200 |
| GET | `/api/employees/:id` | One employee | 200 / 404 |
| POST | `/api/employees` | Create | 201 / 422 / 409 |
| PUT | `/api/employees/:id` | Replace (update) | 200 / 404 / 422 |
| DELETE | `/api/employees/:id` | Delete | 200 / 404 |

Employee fields: `name`, `email` (unique), `phone` (optional), `department`, `position`, `salary`, `joiningDate` (`YYYY-MM-DD`), `status` (`Active`, `On Leave`, `Inactive`). Errors are returned as `{ "error": "...", "details": { "field": "message" } }`.

## Run with Docker Desktop on Windows (beginner steps)

1. Install **Docker Desktop** (https://www.docker.com/products/docker-desktop/), start it and wait until it says *Engine running*.
2. Unzip `employee-management-mern-docker.zip`, then open **PowerShell** in that folder
   (File Explorer > open the folder > type `powershell` in the address bar > Enter).
3. Check Docker works:

```powershell
docker --version
docker compose version
```

4. Create your private settings file and set a password:

```powershell
Copy-Item .env.example .env
notepad .env
```

   Change `MONGO_ROOT_PASSWORD` to your own value and save. `.env` is ignored by Git.

5. Build and start everything:

```powershell
docker compose up -d --build
```

   The first build downloads images and can take several minutes.

6. Open the app at **http://localhost:8080** (API health: http://localhost:8080/api/health).

If PowerShell blocks the helper scripts, allow them for this window only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\start.ps1     # creates .env if missing, starts the stack, waits until healthy
```

### Useful Docker commands

```powershell
docker compose ps                    # service status and health
docker compose logs -f backend       # follow backend logs
docker compose stop                  # stop, keep containers
docker compose down                  # remove containers, KEEP data (volume stays)
docker compose down -v               # remove containers AND all data
docker volume ls                     # you should see mongodb_data
docker volume inspect mongodb_data
docker compose exec backend npm run seed -- --reset   # reload the 15 sample employees
```

### Prove that data persists

```powershell
.\scripts\verify-persistence.ps1
```

It creates a record, runs `docker compose down`, starts new containers and confirms the record is still there. You can also do it by hand: add an employee in the browser, run `docker compose down`, then `docker compose up -d`, and refresh the page.

Sample data is inserted only when the collection is empty. If you delete every employee and restart the backend, the 15 samples are inserted again. Set `SEED_ON_START=false` in `.env` to disable this.

## Run without Docker (development)

Requires Node.js 20+ and a local MongoDB (or use only the `mongodb` service from Compose).

```powershell
# Terminal 1 - database only
docker compose up -d mongodb

# Terminal 2 - backend (uses the published Mongo port 27018 from .env)
cd backend
npm install
$env:MONGO_URI = "mongodb://admin:YOUR_PASSWORD@localhost:27018/employee_db?authSource=admin"
$env:SEED_ON_START = "true"
npm run dev

# Terminal 3 - frontend (Vite proxies /api to localhost:5000)
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## Testing

```powershell
.\scripts\test-backend.ps1           # npm install + npm test in backend/
.\scripts\check-frontend-build.ps1   # npm install + vite build + output verification
```

Or by hand: `cd backend; npm install; npm test` and `cd frontend; npm install; npm run check`.

What the backend tests cover (Node's built-in test runner, no database required):

- `validation.test.js`: valid/invalid payloads, normalisation, impossible dates, salary limits.
- `stats.test.js`: statistics calculations.
- `seed.test.js`: sample file validity and idempotent seeding.
- `api.test.js`: every endpoint (health, create, read, update, delete, search, filters, stats, 400/404/409/422/503 responses) against the real Express app with an in-memory repository.

### Test status for this package (honest report)

The project was generated in a sandbox without internet access, Docker, MongoDB, or the npm packages Express/Mongoose/Vite. So:

| Check | Result |
| --- | --- |
| Backend `validation`, `stats`, `seed` tests (13 tests) | **Passed** (run with Node 22) |
| Syntax check of every backend `.js` file | **Passed** |
| `database/sample-employees.json` passes the backend validator | **Passed** |
| `docker-compose.yml` parses as valid YAML with 3 services and `mongodb_data` | **Passed** |
| React components bundle with esbuild and render to HTML (server-side render of App, table, forms, stats, dialog) | **Passed** (partial check, not a browser test) |
| `backend/tests/api.test.js` (needs Express) | **Not run** |
| `npm install`, `vite build`, `npm run check` | **Not run** |
| `docker compose build/up`, Nginx config, MongoDB connection, volume persistence | **Not run** |
| PowerShell scripts | **Not run** |
| Visual check in a browser | **Not run** |

Please run the commands above on your PC and use that output as your real evidence. If anything fails, see Troubleshooting.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `error during connect ... docker daemon` | Start Docker Desktop and wait for *Engine running*. |
| `Copy .env.example to .env first` | Run `Copy-Item .env.example .env`. |
| `port is already allocated` | Change `FRONTEND_PORT`, `BACKEND_PORT` or `MONGO_HOST_PORT` in `.env`, then `docker compose up -d`. |
| Page opens but shows "Cannot reach the server" | `docker compose ps` and `docker compose logs backend`. The backend must be `healthy`. |
| Backend repeats "MongoDB connection attempt failed" | Wait for `mongodb` to become healthy. If you changed the password in `.env` after the first run, the old volume keeps the old password: run `docker compose down -v` (deletes data) and start again. |
| `502 Bad Gateway` on `/api` | The backend is down or restarting; check `docker compose logs backend`. |
| Frontend build fails on `npm install` | Check your internet connection or proxy; run `docker compose build --no-cache frontend`. |
| `running scripts is disabled` | `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` |
| Data disappeared | You ran `docker compose down -v` or `reset-data.ps1`; those delete the volume. |
| Slow first start on Windows | Make sure Docker Desktop uses the WSL 2 backend and has enough memory (4 GB+). |

## Upload to GitHub

```powershell
git --version
git init
git add .
git status                      # confirm .env is NOT listed
git commit -m "Employee Management System: MERN + Docker Compose"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/employee-management-mern-docker.git
git push -u origin main
```

Create the empty repository on github.com first (no README or .gitignore). Only `.env.example` is committed; `.env` and `node_modules` are ignored. If you ever commit a real password by mistake, change the password immediately.

## Demo video script (about 4 minutes)

1. **Intro (0:00-0:20)**: Title, your name, goal: MERN app on Docker Compose.
2. **Project tour (0:20-0:50)**: Show the folder structure, `docker-compose.yml` (three services, `mongodb_data`), and `.env.example`.
3. **Start (0:50-1:30)**: `Copy-Item .env.example .env`, `docker compose up -d --build`, then `docker compose ps` showing healthy services.
4. **Dashboard (1:30-2:30)**: Open http://localhost:8080. Point out stats and the department chart. Use search, department filter and status filter.
5. **CRUD (2:30-3:15)**: Add an employee (show a validation error first), edit it, delete it with the confirmation.
6. **API (3:15-3:35)**: Open `/api/health` and `/api/stats` in the browser.
7. **Persistence (3:35-4:00)**: `docker compose down`, `docker compose up -d`, refresh and show the data is still there. Run `docker volume ls`.

## Screenshot checklist

Save into `docs/screenshots/`:

- [ ] `docker compose ps` with all three services healthy
- [ ] `docker volume ls` showing `mongodb_data`
- [ ] Dashboard with statistics and department chart
- [ ] Search results and department filter applied
- [ ] Add employee form with a validation message
- [ ] Edit form and delete confirmation
- [ ] `/api/health` and `/api/stats` JSON in the browser
- [ ] Mobile-width view (browser dev tools)
- [ ] Data still present after `docker compose down` and `up`
- [ ] Backend test output and frontend build check output
- [ ] GitHub repository page showing `.env.example` but no `.env`

## Viva questions and answers

**1. Why use Docker Compose instead of running each service by hand?**
Compose describes all services, networks and volumes in one file, so one command (`docker compose up`) starts the same environment on any machine. It also handles start order and gives each service a DNS name.

**2. How does the frontend reach the backend?**
The browser calls `/api/...` on Nginx. Nginx's `proxy_pass http://backend:5000` forwards it to the `backend` service; Docker's internal DNS resolves the service name on the `employee_net` network. The backend is not needed by the browser directly, which avoids CORS problems.

**3. How is data kept after containers are removed?**
MongoDB stores its files in `/data/db`, which is mounted from the named volume `mongodb_data`. `docker compose down` removes containers but not named volumes, so new containers reuse the data. Only `docker compose down -v` deletes it.

**4. How are secrets handled?**
Real values live in `.env`, which `.gitignore` excludes. The repository contains only `.env.example` with placeholders. Compose reads `.env` and passes values to the containers; the compose file refuses to start if the credentials are missing.

**5. How does the project ensure services start in the right order and stay healthy?**
Each service has a health check: MongoDB answers a `ping`, the backend serves `/api/health` (which reports the database status), and Nginx serves `/nginx-health`. `depends_on` with `condition: service_healthy` makes the backend wait for MongoDB and the frontend wait for the backend. The backend also retries its database connection.

## Configuration summary

| Variable (`.env`) | Default | Used by |
| --- | --- | --- |
| `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`, `MONGO_DB_NAME` | admin / placeholder / employee_db | mongodb, backend |
| `FRONTEND_PORT` | 8080 | host port for Nginx |
| `BACKEND_PORT` | 5000 | host port for the API (localhost only) |
| `MONGO_HOST_PORT` | 27018 | host port for MongoDB (localhost only) |
| `SEED_ON_START` | true | backend |
| `CORS_ORIGIN` | * | backend |

Notes: the salary is shown in INR; change `CURRENCY` and `LOCALE` in `frontend/src/constants.js` to use another currency. There is no login system, so do not expose this app to the public internet as is. `npm install` is used in the Dockerfiles because no lock files are included; run `npm install` once locally and commit the generated `package-lock.json` files if you want reproducible builds.
