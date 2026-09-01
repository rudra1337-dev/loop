# Contributing to LOOP

Thank you for contributing to LOOP! This document outlines code standards, branch naming, commit conventions, architectural guidelines, and pointers for new contributors.

---

## 1. Branch Naming & Commit Conventions

LOOP follows **Conventional Commits** for clear, readable git histories.

### Branch Naming:
- `feat/feature-name` (e.g. `feat/csv-channel-ingestion`)
- `fix/bug-description` (e.g. `fix/auth-cookie-same-site`)
- `refactor/scope-description` (e.g. `refactor/frontend-page-css`)

### Commit Messages:
Use concise conventional commit prefixes:
```text
feat(backend): add vector embedding generation service
fix(frontend): adjust chart padding to prevent legend overflow
refactor(services): isolate workspace checks into classification service
docs: update API endpoint reference
```

Avoid vague commits like `update`, `changes`, `fix stuff`, or `final`.

---

## 2. Local Development Environment

To run the frontend and backend locally:
- **Backend Setup**: Refer to [backend/README.md](../backend/README.md) for environment variables, database initialization, seeding (`npm run seed`), and server commands.
- **Frontend Setup**: Refer to [frontend/README.md](../frontend/README.md) for Vite dev server execution (`npm run dev`) and production builds.

---

## 3. Architecture Principles & Business Logic Placement

- **Keep Controllers Thin**: Controllers in `backend/src/controllers/` handle request validation and response formatting. Business logic belongs in services (`backend/src/services/`).
- **Enforce Workspace Isolation**: Every tenant-owned database query must explicitly pass `workspaceId` extracted from `req.user.workspaceId`. Never extract `workspaceId` from request bodies.
- **Colocate Component Styles**: In the frontend, colocate `.jsx` logic with matching `.css` files inside dedicated page or component folders (e.g., `src/pages/Dashboard/Dashboard.jsx` + `Dashboard.css`).
- **Use Bootstrap**: Prefer Bootstrap 5 utility classes and components over ad-hoc inline styles. Do not introduce Tailwind CSS.

---

## 4. Notes for New Contributors

1. **Start with the Overview**: Read [Architecture Overview](architecture-overview.md) first to understand system topology and multi-tenancy.
2. **Explore the Data Model**: Review `backend/src/models/index.js` to see all Sequelize model schemas and foreign-key associations.
3. **Trace One End-to-End Flow**: Read `auth.middleware.js` → `ingestion.controller.js` → `classification.service.js` → `utils/ai.js` to see how requests transition from HTTP middleware to AI services and MySQL storage.
4. **Inspect Existing Utilities**: Before writing new helper functions, search `backend/src/utils/` and `frontend/src/utils/` to reuse existing routines.
5. **Run Validation Checks**: Before staging files, run `git status` and `git diff --check` to prevent accidental file movements or whitespace lint errors.
6. **Verify Frontend Build**: Always test client build integrity after structural changes by running `npm run build` in `frontend/`.
7. **AI Assistant Rules**: If you are using an AI coding assistant (Codex, Claude Code, Antigravity), refer strictly to [AGENTS.md](../AGENTS.md) for automated repository modification rules.
