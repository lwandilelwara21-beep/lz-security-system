# LZ Solutions Security Operations Management System

This repository is the foundation for a multi-tenant, production-oriented security operations platform for South African security companies.

## Phase 1 implemented

- Monorepo structure for web + API
- PostgreSQL + Prisma schema foundation
- NestJS API skeleton
- Secure authentication foundation with JWT and role-based access control
- Multi-tenant architecture assumptions
- Mobile-friendly web shell for the future employee and management interfaces

## Stack

- Frontend: Next.js + React + TypeScript
- Backend: NestJS + TypeScript
- Database: PostgreSQL + Prisma
- Auth: JWT access tokens, refresh tokens, role enforcement
- Deployment: Docker-friendly structure for future production rollout

## Important architecture principles

- Company/tenant boundaries are enforced at query and permission level
- Database time is authoritative for attendance
- Employee serial numbers are not treated as primary keys
- All critical actions are auditable
- no secrets are committed to source control

## Local development

```bash
npm install
npm run dev:api
npm run dev:web
```

## Notes

This phase establishes the secure foundation and should be extended in subsequent phases with employee management, site assignment, attendance events, and reporting.
