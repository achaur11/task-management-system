# Task Management System (Nx Monorepo)

This workspace contains a secure task app with Angular dashboard and NestJS API, with shared libraries.

## Structure

- `apps/api` (NestJS)
- `apps/dashboard` (Angular)
- `libs/data` (shared TypeScript types/DTOs)
- `libs/auth` (RBAC utilities: decorators, guards, types)

## Dev Scripts

- `npm run dev:api` — serve Nest API
- `npm run dev:dashboard` — serve Angular dashboard
- `npm run dev:all` — run both concurrently

## Requirements

- Node `20.x` (see `.nvmrc`)

## Getting Started

1. Use Node 20: `nvm use`
2. Install deps: `npm install`
3. Run both apps: `npm run dev:all`

## Notes

- E2E tests live under `apps-e2e/` (Playwright for Angular app).
- Shared RBAC utilities are exported from `libs/auth`.
