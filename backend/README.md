# LOOP Backend API

The backend API for LOOP handles multi-tenant authentication, workspace management, feedback ingestion, statistical analytics, AI-powered classification and RAG retrieval, and report generation.

---

## Prerequisites

- **Node.js**: `v18.0.0` or higher
- **Database**: MySQL `8.0+`
- **API Key**: Google Gemini API key (`GEMINI_API_KEY`)

---

## Environment Variables

Create a `.env` file in the `backend/` directory based on the following reference:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `5000` |
| `NODE_ENV` | Application runtime mode (`development` / `production`) | `development` |
| `DB_HOST` | MySQL database host address | `localhost` |
| `DB_PORT` | MySQL database port | `3306` |
| `DB_NAME` | MySQL database name | `loop_db` |
| `DB_USER` | MySQL database username | `root` |
| `DB_PASSWORD` | MySQL database password | `password123` |
| `DB_SSL` | Enable SSL database connection (`true` / `false`) | `false` |
| `DB_CA` | Certificate Authority content for SSL (optional) | `""` |
| `JWT_SECRET` | Secret key for signing session JWTs | `super-secret-jwt-key-change-in-prod` |
| `COOKIE_NAME` | Name of httpOnly authentication cookie | `token` |
| `COOKIE_SECURE` | Enforce HTTPS-only cookie delivery (`true` / `false`) | `false` |
| `COOKIE_SAME_SITE` | SameSite cookie attribute (`lax` / `none` / `strict`) | `lax` |
| `FRONTEND_URL` | Primary allowed frontend origin | `http://localhost:5173` |
| `FRONTEND_URLS` | Comma-separated CORS allowed origins | `http://localhost:5173,http://localhost:3000` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSyYourGeminiApiKeyHere` |
| `GEMINI_MODEL` | Gemini LLM model for text tasks | `gemini-3.5-flash-lite` |
| `GEMINI_EMBEDDING_MODEL` | Gemini embedding model for RAG vector search | `gemini-embedding-001` |
| `AI_PROVIDER_NAME` | Display name of AI provider | `Gemini` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID (optional) | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret (optional) | `GOCSPX-your-google-client-secret` |
| `GOOGLE_CALLBACK_URL` | Google OAuth redirect URL (optional) | `http://localhost:5000/api/auth/google/callback` |

---

## Installation & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Initialization & Seeding**:
   Ensure MySQL is running and the database specified in `DB_NAME` exists.
   ```bash
   # Sync schema and populate demo workspace, users, themes, and sample feedback
   npm run seed

   # Generate vector embeddings for Ask LOOP RAG search
   npm run backfill-embeddings
   ```

3. **Development Mode**:
   ```bash
   npm run dev
   ```

4. **Production Server**:
   ```bash
   npm start
   ```

---

## Seed Data

Running `npm run seed` executes `src/seeders/seed.js` which:
- Clears and recreates database tables via `sequelize.sync({ force: true })`.
- Creates a default workspace named **Acme Corp Demo Workspace**.
- Creates 3 demo users with password `Password123!`: `admin@acme.com` (ADMIN), `analyst@acme.com` (ANALYST), `viewer@acme.com` (VIEWER).
- Populates initial theme categories and seeds 125 multi-channel feedback records.
- Associates feedback records with themes using keyword mapping rules.

Running `npm run backfill-embeddings` executes `src/seeders/backfillEmbeddings.js`, which generates vector embeddings for any feedback records lacking an embedding row, enabling vector similarity search for Ask LOOP.

---

## Directory Structure (`src/`)

- `config/` — Database (Sequelize), AI provider (Gemini), cookie options, and Passport OAuth setup.
- `controllers/` — HTTP request handlers parsing inputs, checking permissions, and delegating to services.
- `data/` — Predefined static channel templates and seed dataset configurations.
- `lib/` — Shared schema validations (Zod validators for ingestion, Ask LOOP, and reports).
- `middleware/` — Authentication (`authenticate`) and role authorization (`authorize`) middleware.
- `models/` — Sequelize data models (`Workspace`, `User`, `Feedback`, `Theme`, `Embedding`, `Report`, `WorkspaceInvite`).
- `routes/` — Express route definitions for Auth, Workspace, Feedback, and Reports.
- `seeders/` — Database seeding scripts and vector embedding backfill script.
- `services/` — Core business logic, multi-tenant database operations, Gemini AI integration, and PDF generation.
- `utils/` — Utility helpers for JWT generation, AI provider calls, and keyword theme matchers.

---

## Further Architecture & API Reference

- For a deep dive into backend layers, AI pipelines, and database ER diagrams, see [Backend Architecture Documentation](../docs/architecture-backend.md).
- For complete endpoint specifications, HTTP methods, and payload structures, see [API Reference Documentation](../docs/api-reference.md).