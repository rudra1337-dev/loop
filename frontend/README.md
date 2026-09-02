# LOOP Frontend Application

The frontend application for LOOP provides a responsive single-page web app for feedback ingestion, analytics dashboards, Ask LOOP RAG search, report generation, and workspace administration.

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher

---

## Environment Variables

Create a `.env.local` or `.env` file in the `frontend/` directory:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend REST API | `http://localhost:5000/api` |

---

## Installation & Commands

```bash
# 1. Install dependencies
npm install

# 2. Run development server (Vite on http://localhost:5173)
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build locally
npm run preview

# 5. Run linter
npm run lint
```

---

## Directory Structure (`src/`)

- `assets/` — Static image assets and icons.
- `components/` — Reusable UI elements, route guards (`ProtectedRoute`, `GuestRoute`), charts, and common layout containers (`Layout`).
- `context/` — React Context providers, specifically `ThemeContext.jsx` for theme switching (light/dark/system mode).
- `pages/` — Top-level page views (`Dashboard`, `FeedbackExplorer`, `IngestFeedback`, `AskLoop`, `Reports`, `ReportView`, `Trends`, `WorkspaceSettings`, `Login`, `Signup`, `Landing`).
- `services/` — Axios API client (`api.js`) and service wrappers (`feedbackService.js`, `reportService.js`, `workspaceService.js`).
- `store/` — Redux Toolkit store setup (`index.js`), custom hooks (`hooks.js`), and domain slices (`authSlice.js`, `workspaceSlice.js`).
- `utils/` — Client-side utilities and logging tools (`logger.js`).

---

## State Management Architecture

LOOP uses a dual state management strategy:

1. **Redux Toolkit (`src/store/`)**: Reserved for application-wide domain state that spans across pages.
   - `authSlice.js`: Manages user authentication status, session hydration (`fetchMe`), login, signup, and logout.
   - `workspaceSlice.js`: Manages active workspace metadata, member lists, and workspace invites.
2. **React Context (`src/context/ThemeContext.jsx`)**: Manages client-side UI preference state (Light/Dark/System theme) and synchronizes HTML data attributes (`data-theme`, `data-bs-theme`).
3. **Local Component State (`useState`)**: Used for page-specific UI states, such as form inputs, active filter dropdowns, table pagination, drawer/modal toggles, and view presets.

*Rule of Thumb*: Use Redux for data required by multiple routes or layout components (e.g., current user role, workspace name). Use `useState` for state isolated to a single page component (e.g., date picker range in Reports).

---

## Architecture Deep Dive

- For detailed routing structure, component hierarchy, and data-fetching code walkthroughs, see [Frontend Architecture Documentation](../docs/architecture-frontend.md).