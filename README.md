# LOOP – AI Customer Feedback Intelligence Platform

> Transform raw customer feedback into real-time business intelligence using AI.

---

## About

LOOP is a multi-tenant AI customer-feedback intelligence platform that solves the challenge of fragmented, high-volume feedback across channels like Support, Surveys, Email, and Product Reviews. By centralizing feedback into workspace-isolated environments, LOOP uses Google Gemini to automatically classify sentiment, extract key themes, enable natural language querying via Retrieval-Augmented Generation (Ask LOOP), and generate executive Voice-of-Customer (VoC) reports with downloadable PDF summaries.

---

## Screenshots

| Screen | Description | Preview |
| :--- | :--- | :--- |
| **Dashboard** | Executive overview of feedback volume, sentiment distribution, and key theme trends. | `![Dashboard](docs/screenshots/dashboard.png)`<br>*(Placeholder — maintainer: replace with actual screenshot)* |
| **Ask LOOP** | RAG-powered natural language search over customer feedback with source citations. | `![Ask LOOP](docs/screenshots/ask-loop.png)`<br>*(Placeholder — maintainer: replace with actual screenshot)* |
| **Reports** | Automated Voice-of-Customer narrative reports with metric breakdowns and PDF export. | `![Reports](docs/screenshots/reports.png)`<br>*(Placeholder — maintainer: replace with actual screenshot)* |

---

## Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19 (Vite), Redux Toolkit, React Router v7, Bootstrap 5, Recharts, Axios |
| **Backend** | Node.js, Express v5, Sequelize ORM v6, MySQL 8 (`mysql2`), Passport.js, PDFKit |
| **Authentication** | JWT stored in `httpOnly` secure cookies, Google OAuth 2.0 |
| **AI Integration** | Google Gemini API (`@google/genai`), `gemini-3.5-flash-lite` (classification & narratives), `gemini-embedding-001` (RAG vector embeddings) |

---

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/rudra1337-dev/loop.git
cd loop

# 2. See backend and frontend guides for setup and environment variables
# Backend setup:   see backend/README.md
# Frontend setup:  see frontend/README.md
```

---

## Demo Credentials

The database seed script populates a default workspace (**Acme Corp Demo Workspace**) with the following demo accounts (password: `Password123!`):

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@acme.com` | `Password123!` | Full workspace access, user & invite management, feedback ingestion & reports |
| **Analyst** | `analyst@acme.com` | `Password123!` | Feedback ingestion, manual reclassification, report generation |
| **Viewer** | `viewer@acme.com` | `Password123!` | Read-only access to dashboards, feedback explorer, Ask LOOP, and reports |

> *Note for maintainers: Ensure database is seeded via `npm run seed` in `backend/` before attempting to log in.*

---

## Documentation Links

- [Architecture Overview](docs/architecture-overview.md) — High-level system topology and multi-tenancy model.
- [Backend Documentation](backend/README.md) — Setup, environment configuration, and service layers.
- [Frontend Documentation](frontend/README.md) — Component organization, state management, and build steps.
- [Backend Deep-Dive Architecture](docs/architecture-backend.md) — Database models, AI pipelines, and authorization flows.
- [Frontend Deep-Dive Architecture](docs/architecture-frontend.md) — Route guards, Redux slices, and data-fetching patterns.
- [API Reference](docs/api-reference.md) — Complete REST endpoint documentation and payload schemas.
- [Contributing Guide](docs/CONTRIBUTING.md) — Git workflow, branch naming, and contribution conventions.
- [AI Agent Rules](AGENTS.md) — Development rules and guidelines for human contributors and AI assistants.

---

## License

This project is licensed under the [MIT License](LICENSE).
