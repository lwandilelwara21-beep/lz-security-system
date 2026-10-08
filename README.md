# LZ Security Operations

A security operations management system with separate administrator and employee attendance views.

## Current features

- Administrator sign-in and company dashboard
- Employee and site creation
- Employee account provisioning with a hashed password and active site assignment
- Dedicated employee clock-in portal at `/clock-in`
- Attendance history and clock-in/clock-out confirmations
- Company-scoped API with JWT authentication and role checks

## Local development

Requirements: Node.js 18.18 or newer and npm.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` for local-only defaults. Never use the example passwords or JWT values in a hosted environment.
3. Start the API with `npm run dev:api`.
4. In a second terminal, start the web app with `npm run dev:web`.
5. Open `http://localhost:3000` for the administrator dashboard or `http://localhost:3000/clock-in` for employee attendance.

For a fresh local database, run `npx prisma db push --schema prisma/schema.prisma` before starting the API. In development, startup seeds these test accounts and a Head Office site:

- Administrator: `ADMIN001` / `Admin@123`
- Employee clock-in: `DEMO001` / `Officer@123`

The demo employee is assigned to Head Office. `DEFAULT_ADMIN_PASSWORD` and `DEFAULT_DEMO_EMPLOYEE_PASSWORD` can override the development passwords. Production startup rejects the shared administrator fallback; production demo data is disabled unless `ENABLE_DEMO_DATA=true` and a unique employee demo password is configured. Never commit `.env` files or production credentials.

## Deployment

GitHub stores this source code; the current GitHub Pages URL publishes the README and cannot host the NestJS API or its database. A client-accessible demo needs a web host for Next.js, an API host for NestJS, an isolated persistent demo database, and environment variables configured in those hosting services. Do not expose the administrator account on a public demo. Reset demo data regularly and use a separate demo tenant before inviting external clients.

## Validation

- `npm test --workspace apps/api`
- `npm run build --workspace apps/api`
- `npx tsc --noEmit --project apps/web/tsconfig.json`