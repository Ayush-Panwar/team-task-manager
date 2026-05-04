# Team Task Manager

A production-grade full-stack web application for team project management with role-based access control, task tracking, and real-time progress dashboards.

Built with **Next.js 16**, **TypeScript**, **PostgreSQL**, and **Prisma** — designed to demonstrate clean architecture, proper authorization patterns, and modern React practices.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 16 (App Router) | Full-stack, RSC, file-based routing, API routes, edge middleware |
| Language | TypeScript | End-to-end type safety from DB to UI |
| Database | PostgreSQL | Relational data with enforced integrity (users → projects → tasks) |
| ORM | Prisma 6 | Type-safe queries, auto-generated types, declarative migrations |
| Auth | NextAuth.js v5 | Production-grade session management, JWT, CSRF protection |
| Styling | Tailwind CSS + shadcn/ui | Accessible components, utility-first CSS, consistent design |
| Server State | TanStack Query v5 | Caching, background refetch, optimistic updates, pagination |
| Client State | Zustand | Lightweight store for UI state (mobile sidebar) |
| Validation | Zod v4 | Shared schemas between API routes and client forms |
| Forms | React Hook Form | Performant, validated forms with Zod resolver |

---

## Features

### Authentication
- Email/password signup and login
- JWT-based sessions with secure httpOnly cookies
- Protected routes via Next.js middleware
- Auto-redirect: authenticated users skip login, unauthenticated users redirected to login

### Projects & Teams
- Create projects with name and description
- Invite team members by email
- Per-project roles: **Admin** and **Member**
- Admins manage team composition and project settings
- Last-admin protection: cannot remove or demote the only admin

### Task Management
- Full CRUD with status tracking: `TODO` → `IN_PROGRESS` → `IN_REVIEW` → `DONE`
- Priority levels: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- Assign tasks to project members with validation
- Due dates with relative formatting ("Due in 3 days", "Overdue by 2 days")
- Filter by status, priority, assignee, or overdue
- Paginated API responses (default 50, max 100 per page)
- Optimistic updates — status changes are instant with automatic rollback on failure

### Dashboard
- Aggregate stats: total tasks, in progress, overdue, completed
- Personal task list sorted by urgency
- Project progress bars with completion percentages
- Recent activity feed with status indicators
- Time-of-day greeting

### Role-Based Access Control (RBAC)

Enforced at **both API and UI levels** — unauthorized API requests return 403 even via curl.

| Action | Admin | Member |
|--------|:-----:|:------:|
| View project & tasks | Yes | Yes |
| Create tasks | Yes | Yes |
| Update own/assigned task status & description | Yes | Yes |
| Update any task field (title, priority, assignee, due date) | Yes | No |
| Delete tasks | Yes | No |
| Edit project details | Yes | No |
| Delete project | Yes | No |
| Add/remove members | Yes | No |
| Change member roles | Yes | No |

Members see a clean UI — admin-only actions (delete buttons, team management) are hidden entirely.

### Production Hardening
- Input validation on every API endpoint (Zod)
- Consistent error response format with proper HTTP status codes
- Error boundaries on all route groups
- Environment variable validation at startup
- Database indexes on all foreign keys and query fields
- `onDelete: SetNull` on task assignee (prevents orphaned references)
- `onDelete: Cascade` on comments (cleanup with parent)
- Field-level authorization (non-admins restricted to status/description updates)
- Mobile-responsive layout with collapsible sidebar

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **PostgreSQL** — via Docker, local install, or cloud (Supabase/Neon/Railway)

### 1. Clone & Install

```bash
git clone <repo-url>
cd team-task-manager
npm install
```

### 2. Set Up Database

**Option A: Docker**
```bash
docker compose up -d
```

**Option B: Supabase (free cloud PostgreSQL)**
1. Create a project at [supabase.com](https://supabase.com)
2. Copy the connection strings from Project Settings → Database

**Option C: Local PostgreSQL**
```bash
createdb taskmanager
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your database URL:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskmanager"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/taskmanager"

# NextAuth (generate a secret: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

For Supabase, use the pooled URL for `DATABASE_URL` and direct URL for `DIRECT_URL`.

### 4. Initialize Database & Seed Demo Data

```bash
npm run setup
```

This pushes the schema and seeds 3 users, 3 projects, and 15 tasks.

### 5. Run Development Server

```bash
npm run dev
```

Open **http://localhost:3000**

---

## Demo Credentials

| Email | Password | Role Context |
|-------|----------|-------------|
| admin@example.com | password123 | Admin on "Website Redesign" and "Mobile App v2" |
| member@example.com | password123 | Admin on "API Integration", Member on others |
| bob@example.com | password123 | Member on "Website Redesign" and "API Integration" |

---

## API Documentation

All endpoints return JSON. Protected endpoints require a valid session cookie.

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | Public |
| POST | `/api/auth/[...nextauth]` | NextAuth sign in/out | Public |
| GET | `/api/auth/session` | Get current session | Public |

### Projects

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/projects` | List user's projects | Authenticated |
| POST | `/api/projects` | Create project (creator becomes Admin) | Authenticated |
| GET | `/api/projects/[id]` | Get project with members & recent tasks | Project Member |
| PATCH | `/api/projects/[id]` | Update name/description | Project Admin |
| DELETE | `/api/projects/[id]` | Delete project and all data | Project Admin |

### Members

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/projects/[id]/members` | List project members | Project Member |
| POST | `/api/projects/[id]/members` | Add member by email | Project Admin |
| PATCH | `/api/projects/[id]/members/[memberId]` | Change role (Admin/Member) | Project Admin |
| DELETE | `/api/projects/[id]/members/[memberId]` | Remove member | Project Admin |

### Tasks

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/projects/[id]/tasks` | List tasks (paginated, filterable) | Project Member |
| POST | `/api/projects/[id]/tasks` | Create task | Project Member |
| GET | `/api/projects/[id]/tasks/[taskId]` | Get task with comments | Project Member |
| PATCH | `/api/projects/[id]/tasks/[taskId]` | Update task (field-level RBAC) | Owner/Admin |
| DELETE | `/api/projects/[id]/tasks/[taskId]` | Delete task | Project Admin |

### Dashboard

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/dashboard` | Aggregated stats, my tasks, project summaries | Authenticated |

### Task Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| `priority` | string | Filter: `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `assigneeId` | string | Filter by assigned user |
| `overdue` | boolean | `true` = only overdue, incomplete tasks |
| `sort` | string | Sort field: `createdAt`, `dueDate`, `priority` |
| `order` | string | `asc` or `desc` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 50, max: 100) |

### Paginated Response Format

```json
{
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "totalPages": 3
  }
}
```

---

## Project Structure

```
team-task-manager/
├── app/
│   ├── (auth)/                    # Auth pages (login, signup)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── layout.tsx
│   │   └── error.tsx
│   ├── (dashboard)/               # Protected app pages
│   │   ├── page.tsx               # Dashboard home
│   │   ├── layout.tsx             # Sidebar + header layout
│   │   ├── loading.tsx            # Skeleton loader
│   │   ├── error.tsx              # Error boundary
│   │   ├── projects/
│   │   │   ├── page.tsx           # Project list
│   │   │   ├── new/page.tsx       # Create project
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Project detail
│   │   │       ├── tasks/page.tsx # Task list with filters
│   │   │       └── members/page.tsx # Team management
│   │   └── tasks/page.tsx         # My tasks (cross-project)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── signup/route.ts
│   │   ├── projects/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── tasks/
│   │   │       │   ├── route.ts
│   │   │       │   └── [taskId]/route.ts
│   │   │       └── members/
│   │   │           ├── route.ts
│   │   │           └── [memberId]/route.ts
│   │   └── dashboard/route.ts
│   ├── layout.tsx                 # Root layout with providers
│   └── globals.css
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── layout/
│   │   ├── sidebar.tsx            # Desktop + mobile sidebar
│   │   └── header.tsx             # Breadcrumb header with mobile toggle
│   └── providers.tsx              # QueryClient + SessionProvider + Toaster
├── hooks/
│   ├── use-dashboard.ts
│   ├── use-projects.ts
│   ├── use-tasks.ts               # Includes optimistic updates
│   └── use-members.ts
├── stores/
│   └── ui-store.ts                # Zustand (sidebar state)
├── lib/
│   ├── auth/
│   │   ├── auth-options.ts        # NextAuth config
│   │   └── rbac.ts                # Role-based permission helpers
│   ├── api/
│   │   └── error-handler.ts       # Centralized error handling
│   ├── validators/
│   │   ├── auth.ts                # Signup/login schemas
│   │   ├── project.ts             # Project/member schemas
│   │   └── task.ts                # Task schemas
│   ├── prisma.ts                  # Singleton client with env validation
│   ├── constants.ts               # Shared status/priority definitions
│   ├── format.ts                  # Date formatting utilities
│   ├── env.ts                     # Environment variable validation
│   └── utils.ts                   # cn() utility
├── types/
│   └── next-auth.d.ts             # Session type augmentation
├── prisma/
│   ├── schema.prisma              # 5 models, enums, indexes, cascades
│   └── seed.ts                    # Demo data (3 users, 3 projects, 15 tasks)
├── middleware.ts                  # Route protection
├── docker-compose.yml
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Database Schema

```
User ──────┬──── ProjectMember ────── Project
           │         (role: ADMIN|MEMBER)
           │
           ├──── Task (as creator)
           ├──── Task (as assignee)
           └──── Comment (as author)

Project ───┬──── Task ──── Comment
           └──── ProjectMember
```

### Models

- **User** — id, name, email, password (bcrypt)
- **Project** — id, name, description
- **ProjectMember** — junction table with `role` enum (ADMIN/MEMBER), unique on [userId, projectId]
- **Task** — id, title, description, status, priority, dueDate, assignee, creator
- **Comment** — id, content, author, task

### Indexes

Optimized for common query patterns:
- `Task`: projectId, assigneeId, creatorId, status
- `ProjectMember`: projectId, userId
- `Comment`: taskId, authorId

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Next.js App Router** | Colocates API and UI, file-based routing, server components for initial loads |
| **PostgreSQL over MongoDB** | Data is inherently relational — users belong to projects, tasks have assignees, roles are per-project |
| **Prisma over raw SQL** | Type-safe queries, auto-generated types, migrations, still allows raw SQL when needed |
| **NextAuth.js over custom JWT** | Production-grade session management, CSRF protection, extensible providers |
| **TanStack Query over Redux** | Server state ≠ client state. TanStack handles caching, deduplication, optimistic updates. No boilerplate. |
| **Zustand over Context** | Subscribe-based reactivity (no re-render cascade), 1kb, no providers needed |
| **Zod for validation** | TypeScript-native, infers types from schemas, shared between client and server |
| **RBAC at API level** | UI guards are bypassable. Every protected action is enforced server-side with proper 403 responses |
| **Optimistic updates** | Status changes feel instant. Rollback on failure preserves data integrity |
| **Paginated API** | Prevents OOM and slow responses on large datasets |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run setup` | Push schema to DB + seed demo data |
| `npm run db:push` | Push schema changes to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio (DB browser) |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:reset` | Reset database and re-seed |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled for Supabase) |
| `DIRECT_URL` | No | Direct DB connection for migrations (Supabase) |
| `NEXTAUTH_SECRET` | Yes | Session encryption key (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | No | App URL (defaults to `http://localhost:3000`) |
