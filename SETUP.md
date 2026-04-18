# Lux Dental Marketing - RCM Portal

## Production-grade SaaS Application

A multi-tenant dental Revenue Cycle Management (RCM) portal built with React + Node.js + PostgreSQL.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Zustand, React Query |
| Backend | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Auth | Google OAuth + JWT + Email/Password |
| File Storage | Cloudinary (with base64 fallback) |
| AI | Cloudflare Workers AI (configurable endpoint) |

---

## Project Structure

```
dental-rcm-saas/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/             # Design system (Button, Card, Table, Modal, etc.)
│   │   │   ├── ai/             # AI features (Chat, Extract, Duplicate Detection)
│   │   │   ├── deposits/       # Deposit-specific components
│   │   │   └── layout/         # Sidebar, Topbar
│   │   ├── hooks/              # React Query hooks (useDeposits, useAuth, etc.)
│   │   ├── layouts/            # AppLayout wrapper
│   │   ├── lib/                # API client, utils, constants
│   │   ├── pages/              # All page components
│   │   ├── stores/             # Zustand stores (auth, UI, deposits)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Express backend
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Seed data
│   ├── src/
│   │   ├── lib/                # Prisma client, JWT helpers
│   │   ├── middleware/         # Auth, validation, tenant guard
│   │   └── routes/             # API routes (auth, deposits, users, etc.)
│   └── .env.example
│
├── package.json                # Workspace root
└── SETUP.md                    # This file
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+ (local or cloud - Supabase, Neon, Railway, etc.)
- **Google Cloud Console** project (for OAuth)
- **Cloudinary** account (free tier works)

---

## Quick Start

### 1. Install Dependencies

```bash
# From project root
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### 2. Configure Environment

```bash
# Server
cd server
cp .env.example .env
# Edit .env with your values:
#   DATABASE_URL - PostgreSQL connection string
#   JWT_SECRET - Random secret string (use: openssl rand -hex 32)
#   GOOGLE_CLIENT_ID - From Google Cloud Console
#   CLOUDINARY_* - From Cloudinary dashboard

# Client
cd ../client
cp .env.example .env
# Edit .env:
#   VITE_API_URL=http://localhost:4000/api
#   VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Set Up Database

```bash
cd server

# Push schema to database (creates all tables)
npx prisma db push

# Seed with sample data
npx prisma db seed

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Start Development

```bash
# From project root - starts both client and server
npm run dev

# Or start separately:
cd server && npm run dev    # Backend on http://localhost:4000
cd client && npm run dev    # Frontend on http://localhost:5173
```

### 5. Access the App

Open http://localhost:5173

**Demo Credentials** (from seed):
- Admin: `admin@luxdental.com` / `Admin@123456`
- Manager: `manager@luxdental.com` / `Manager@123456`

Or use the Demo Login buttons on the login page.

---

## Database Setup Options

### Option A: Local PostgreSQL

```bash
# macOS
brew install postgresql
brew services start postgresql
createdb dental_rcm

# Ubuntu
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres createdb dental_rcm

# Windows
# Install from https://www.postgresql.org/download/windows/
# Use pgAdmin to create a database called "dental_rcm"
```

Connection string: `postgresql://user:password@localhost:5432/dental_rcm`

### Option B: Supabase (Free Cloud)

1. Create project at https://supabase.com
2. Go to Settings > Database > Connection string
3. Copy the URI and paste into `.env`

### Option C: Neon (Free Cloud)

1. Create project at https://neon.tech
2. Copy the connection string from the dashboard

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized origins:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)
6. Add authorized redirect URIs:
   - `http://localhost:5173` (development)
7. Copy the Client ID to both `.env` files

---

## Cloudinary Setup

1. Create free account at https://cloudinary.com
2. From the Dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret
3. Create an **unsigned upload preset** named `rcm_uploads`:
   - Settings > Upload > Upload presets > Add preset
   - Signing Mode: Unsigned
   - Folder: `rcm-portal`

---

## Multi-Tenant Architecture

Every record in the database is scoped to a `tenantId`:

- **Tenant** = A dental clinic/practice
- **Users** belong to exactly one tenant
- **All queries** are automatically filtered by `tenantId` via middleware
- **No cross-tenant data access** is possible

When a user logs in, their `tenantId` is embedded in the JWT token and enforced on every API request.

---

## Role-Based Access Control

| Role | Permissions |
|------|------------|
| **Admin** | Full access: all locations, all deposits, user management, settings |
| **Manager** | View/edit deposits in assigned locations, approve deposits |
| **Coordinator** | View deposits in assigned locations/offices, coordinator-level approvals |
| **User (Front Desk)** | Create deposits, view own submissions only |

---

## Key Features

### Dashboard
- Real-time KPI cards (revenue, posted, pending, outstanding claims)
- Interactive charts (Chart.js): deposits by status, revenue trend, revenue by location
- Work queue alerts for items needing attention
- Activity timeline

### Deposit Management
- Full CRUD with role-based visibility
- Multi-step deposit creation wizard
- Bulk actions (select, delete, export)
- Deposit detail panel with post payment, comments, audit log
- File attachments with Cloudinary upload
- CSV export

### AI Features
- **AI Auto-Fill**: Upload a PDF/image, AI extracts patient and billing data
- **AI Chat**: Ask questions about deposits, get summaries
- **AI Reports**: Generate weekly/daily/flagged issue reports
- **Duplicate Detection**: Identifies duplicate patients in batch extractions

### Claims & Work Queue
- Outstanding claims tracking with aging buckets (30/60/90+ days)
- Work queue for discrepancies, pending reviews, denied claims
- Quick actions: approve, deny, appeal, write off

### Staff Management
- User CRUD with role assignment
- Location and office assignment
- Access request workflow (request > approve/reject)
- Invite link generation
- Audit log

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/google | Google OAuth sign-in |
| POST | /api/auth/login | Email/password login |
| GET | /api/auth/me | Current user profile |
| GET | /api/deposits | List deposits (paginated, filtered) |
| POST | /api/deposits | Create deposit |
| PUT | /api/deposits/:id | Update deposit |
| DELETE | /api/deposits/:id | Delete deposit (admin) |
| POST | /api/deposits/:id/comments | Add comment |
| POST | /api/deposits/:id/approve | Approve deposit |
| GET | /api/deposits/stats | Dashboard statistics |
| GET | /api/claims | Outstanding claims |
| GET | /api/claims/stats | Claims aging stats |
| GET/POST | /api/locations | Location CRUD |
| GET/POST | /api/offices | Office CRUD |
| GET/POST | /api/users | User CRUD |
| POST | /api/reports/generate | Generate AI report |
| POST | /api/files/upload | Upload file |
| GET | /api/audit | Audit log |

---

## Production Build

```bash
# Build frontend
cd client
npm run build
# Output in client/dist/

# The server can serve the built frontend:
# Set CLIENT_URL in server .env to point to the dist folder
# Or deploy frontend separately (Vercel, Netlify, Cloudflare Pages)
```

---

## Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

**Frontend:**
```bash
cd client
npx vercel --prod
```

**Backend:**
- Push to GitHub
- Connect repo to Railway
- Set environment variables
- Railway auto-detects Node.js and runs the server

### Option 2: Docker (Full Stack)

Create a `Dockerfile` for the server and use `docker-compose` with PostgreSQL.

### Option 3: VPS (DigitalOcean, AWS EC2)

```bash
# On server
git clone <repo>
cd dental-rcm-saas
npm install
cd server && npm install && npx prisma db push && npx prisma db seed
cd ../client && npm install && npm run build
cd ../server && NODE_ENV=production npm start
```

Use **Nginx** as reverse proxy, **PM2** for process management, **Let's Encrypt** for SSL.

---

## Environment Variables Reference

### Server (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_SECRET | Yes | Secret for signing JWT tokens |
| JWT_EXPIRY | No | Token expiry (default: 24h) |
| GOOGLE_CLIENT_ID | Yes | Google OAuth client ID |
| CLOUDINARY_CLOUD_NAME | No | Cloudinary cloud name |
| CLOUDINARY_API_KEY | No | Cloudinary API key |
| CLOUDINARY_API_SECRET | No | Cloudinary API secret |
| AI_API_URL | No | AI worker endpoint URL |
| PORT | No | Server port (default: 4000) |
| CLIENT_URL | No | Frontend URL for CORS (default: http://localhost:5173) |

### Client (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | No | API base URL (default: /api via proxy) |
| VITE_GOOGLE_CLIENT_ID | Yes | Google OAuth client ID |
