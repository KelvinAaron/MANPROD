# MANPROD — Nigeria's Local Skills Marketplace

> Connecting verified skilled workers with residents who need their services.

MANPROD is a web-based marketplace that bridges the gap between informal skilled workers (plumbers, electricians, tutors, tailors, etc.) and local residents in Nigerian communities. It digitizes the trust-building process through document verification and builds a portable work history that providers can use as evidence of experience when applying for formal employment.

---

## Features

### For Service Seekers
- Browse and search verified skilled workers by skill, name, or location
- View provider profiles with ratings, bio, and service listings
- Book a service and track its status (Pending → Confirmed → Completed)
- Leave a star rating and review after a completed job
- In-app notifications when a job is marked complete

### For Service Providers
- Create a profile with skill set and bio
- Upload multiple verification documents (NIN, Trade Certificate, etc.) for admin review
- Create and manage service listings (title, description, price, location)
- Accept, decline, or mark bookings as complete
- In-app notifications when a new booking is made
- Download a professional PDF portfolio of completed work and reviews

### For Administrators
- Review pending verification documents from providers
- Approve or reject documents to grant/revoke the verified badge
- View and manage all registered users

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | PostgreSQL (via Neon) |
| ORM | Prisma 5 |
| Auth | NextAuth.js v4 (JWT + Credentials) |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| PDF Generation | jsPDF |

---

## Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- A **PostgreSQL** database (local install or a free cloud instance via [Neon](https://neon.tech))

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd MANPROD
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

You will receive a separate `.env.local` file with the required credentials. Place it in the root of the project directory alongside `package.json`.

It must contain the following variables:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# NextAuth configuration
NEXTAUTH_SECRET="your-random-secret-string"
NEXTAUTH_URL="http://localhost:3000"
```

> **Tip:** To generate a secure `NEXTAUTH_SECRET`, run:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 4. Push the database schema

This creates all the required tables in your PostgreSQL database:

```bash
npm run db:push
```

### 5. Seed the admin account

This creates the default administrator account:

```bash
npm run db:seed
```

Default admin credentials:
- **Email:** `admin@manprod.com`
- **Password:** `admin1234`

> Change these credentials after first login in a production environment.

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build the application for production |
| `npm start` | Start the production server (after build) |
| `npm run db:push` | Sync Prisma schema with the database |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:seed` | Seed the admin account |

---

## User Roles & Access

| Role | Default Landing Page | Access |
|---|---|---|
| **Service Seeker** | `/seeker/dashboard` | Browse services, make bookings, leave reviews |
| **Service Provider** | `/provider/dashboard` | Manage listings, accept bookings, upload documents |
| **Administrator** | `/admin/verifications` | Review verification documents, manage users |

After registering, users are automatically redirected to their role-specific dashboard.

---

## Project Structure

```
MANPROD/
├── app/
│   ├── api/              # All API routes (REST endpoints)
│   ├── admin/            # Admin pages
│   ├── provider/         # Provider dashboard, listings, bookings, verification, portfolio
│   ├── seeker/           # Seeker dashboard and bookings
│   ├── services/         # Public browse page
│   ├── profile/          # Shared profile page (all roles)
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   └── page.tsx          # Public landing page
├── components/           # Reusable UI components (Navbar, ProviderCard, etc.)
├── lib/                  # Auth config, Prisma client, utility functions
├── prisma/
│   ├── schema.prisma     # Full database schema
│   └── seed.ts           # Admin account seeder
├── public/uploads/       # Uploaded verification documents (local storage)
└── middleware.ts         # Route protection by role
```

---

## Notes

- **File uploads** are stored locally in `public/uploads/`. In a production deployment, these should be moved to a cloud storage service (e.g. AWS S3 or Cloudinary).
- **Medical and healthcare services** are intentionally excluded from the skill categories per the project's design constraints.
- The app is fully responsive and works on both desktop and mobile browsers (Chrome, Edge, Firefox).

---

*Prepared by Kelvin Aaron-Onuigbo — African Leadership University*
