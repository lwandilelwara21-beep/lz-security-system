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
2. Configure a local `.env` file with `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `PORT`.
3. Start the API with `npm run dev:api`.
4. In a second terminal, start the web app with `npm run dev:web`.
5. Open `http://localhost:3000` for the administrator dashboard or `http://localhost:3000/clock-in` for employee attendance.

For a fresh local database, run `npx prisma db push --schema prisma/schema.prisma` before starting the API. The current local schema uses SQLite; production deployment should use a managed database and a production-ready Prisma schema/configuration.

The local seed administrator is `ADMIN001`. Its password comes from `DEFAULT_ADMIN_PASSWORD` and defaults to `Admin@123` for local development only. Set a unique strong password and unique JWT secrets before any deployment. Never commit `.env` files or production credentials.

## Deployment

GitHub stores this source code; GitHub Pages cannot host the NestJS API or its database. A live deployment needs a web host for Next.js, an API host for NestJS, a persistent production database, and environment variables configured in those hosting services. The SQLite development setup and default local credentials are not production-ready.

## Validation

- `npm test --workspace apps/api`
- `npm run build --workspace apps/api`
- `npx tsc --noEmit --project apps/web/tsconfig.json`