# AGENTS.md

## Purpose

This document defines development guidelines for the Loop repository.

These rules apply to:

* Human contributors
* OpenAI Codex
* Claude Code
* Google Antigravity
* Other AI coding agents and automated development tools

All contributors and agents must follow these conventions unless a task explicitly requires otherwise.

---

# 1. Repository Structure

The repository is divided into two primary applications:

```text
loop/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── README.md
└── AGENTS.md
```

### Important

* Keep frontend code inside `frontend/`.
* Keep backend code inside `backend/`.
* Do not create a new `src/` directory at the repository root.
* Do not move frontend files into the repository root.
* Do not move backend files into the frontend.
* Avoid unrelated changes outside the scope of the requested task.

---

# 2. General Agent Rules

Before modifying code:

1. Inspect the existing project structure.
2. Read the relevant source files.
3. Understand existing patterns before introducing new ones.
4. Reuse existing utilities, services, components, and conventions where possible.
5. Make the smallest reasonable change required by the task.
6. Do not rewrite working code unnecessarily.
7. Do not modify unrelated files.
8. Do not introduce new dependencies unless they are genuinely required.
9. Check existing imports before moving or renaming files.
10. Verify the application after structural changes.

### Never assume

Agents must not assume that a file, directory, API, component, service, or configuration exists.

Check the repository first.

---

# 3. Frontend Guidelines

Frontend location:

```text
frontend/
```

Main source directory:

```text
frontend/src/
```

The frontend uses:

* React
* Vite
* React Router
* Bootstrap
* JavaScript/JSX

---

## 3.1 Frontend Structure

Follow the existing organization:

```text
frontend/src/
├── components/
│   ├── Layout/
│   ├── auth/
│   └── charts/
│
├── pages/
│   ├── Dashboard/
│   ├── FeedbackExplorer/
│   ├── IngestFeedback/
│   ├── Login/
│   ├── Signup/
│   └── WorkspaceSettings/
│
├── context/
├── services/
├── App.jsx
└── main.jsx
```

New directories should follow the existing organizational pattern.

---

# 4. Page Structure

Every substantial page should use a dedicated directory.

Preferred structure:

```text
src/pages/<PageName>/
├── <PageName>.jsx
└── <PageName>.css
```

Example:

```text
src/pages/Dashboard/
├── Dashboard.jsx
└── Dashboard.css
```

The JSX file should import its local stylesheet:

```js
import "./Dashboard.css";
```

### Rules

* Do not place page-specific CSS in unrelated global CSS files.
* Keep page-specific styles colocated with the page.
* Use clear and consistent page names.
* Do not create duplicate page files at `src/pages/`.

---

# 5. Component Structure

Reusable components should also be organized into dedicated directories.

Preferred structure:

```text
src/components/<Category>/<ComponentName>/
├── <ComponentName>.jsx
└── <ComponentName>.css
```

Example:

```text
src/components/charts/FeedbackVolumeChart/
├── FeedbackVolumeChart.jsx
└── FeedbackVolumeChart.css
```

The component should import its local stylesheet:

```js
import "./FeedbackVolumeChart.css";
```

### Component rules

* Keep reusable components separate from pages.
* Keep component-specific CSS colocated with the component.
* Avoid creating unnecessarily large components.
* Reuse existing components before creating duplicates.
* Do not move a component without updating all affected imports.

---

# 6. CSS Guidelines

CSS should generally be colocated with the page or component it belongs to.

Preferred:

```text
Dashboard/
├── Dashboard.jsx
└── Dashboard.css
```

Avoid:

```text
src/
└── styles/
    └── random-dashboard-styles.css
```

unless the stylesheet is intentionally global or shared across multiple unrelated components.

### CSS rules

* Use meaningful class names.
* Avoid unnecessarily generic class names that can cause collisions.
* Do not duplicate existing styles without checking whether an existing class can be reused.
* Keep page/component-specific styles local.
* Use Bootstrap where appropriate because Bootstrap is the project's preferred frontend styling framework.
* Do not introduce Tailwind for new frontend work unless explicitly requested.

---

# 7. Frontend Imports

Use explicit file paths when the project structure requires them.

Preferred:

```js
import Dashboard from "./pages/Dashboard/Dashboard";
import Layout from "./components/Layout/Layout";
```

For nested files, calculate relative paths from the actual file location.

Example:

```js
import { useAuth } from "../../context/AuthContext";
```

### Import rules

* Do not guess relative paths.
* Verify the filesystem location before changing imports.
* After moving a file, search for all imports referencing the old location.
* Do not leave broken imports behind.
* Avoid unnecessary import aliases unless the project already uses them.

---

# 8. React Guidelines

* Prefer functional components.
* Use React hooks appropriately.
* Keep components focused on a clear responsibility.
* Avoid unnecessary state.
* Avoid unnecessary effects.
* Reuse existing context providers and services.
* Do not duplicate API logic inside multiple components.
* Keep API communication inside the existing service layer where appropriate.
* Preserve existing authentication and routing behavior unless the task explicitly changes it.

---

# 9. Routing

Routing is managed through React Router.

Before changing routes:

1. Inspect `App.jsx`.
2. Check `ProtectedRoute`.
3. Check `GuestRoute`.
4. Verify the target page path.
5. Check navigation links referencing the route.

When moving a page, update all affected route imports.

Do not change authentication or authorization behavior as part of a simple structural refactor.

---

# 10. Frontend Services

API-related logic should use the existing service layer.

Before creating a new service:

1. Search `frontend/src/services/`.
2. Check whether an existing service already provides the required functionality.
3. Extend an existing service when appropriate instead of creating duplicates.

Do not move business logic into UI components unless there is a clear reason.

---

# 11. Backend Guidelines

Backend location:

```text
backend/
```

Main source directory:

```text
backend/src/
```

The backend uses:

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT authentication
* bcrypt
* Google OAuth
* Security middleware

Follow the existing backend architecture instead of introducing a second architecture.

---

# 12. Backend Structure

Before modifying backend code, inspect the existing structure.

Typical backend responsibilities should remain separated:

```text
backend/src/
├── controllers/
├── models/
├── routes/
├── middleware/
├── services/
├── utils/
├── config/
└── ...
```

Use the directories that already exist in the project.

Do not create duplicate directories for the same responsibility.

For example, do not create:

```text
backend/src/controller/
backend/src/controllers/
```

if `controllers/` already exists.

---

# 13. Backend Controllers

Controllers should primarily handle:

* Request parsing
* Validation coordination
* Calling services/models
* HTTP responses
* Error handling

Avoid putting large amounts of business logic directly inside controllers.

If business logic is becoming complex, check whether an existing service layer can be used or extended.

---

# 14. Backend Services

Use services for reusable or complex business logic where the existing architecture supports them.

Before creating a new service:

1. Search existing services.
2. Check whether the functionality already exists.
3. Reuse or extend existing logic where appropriate.
4. Avoid duplicate implementations.

---

# 15. Backend Models

Database models should remain inside the existing models directory.

When modifying a model:

* Check existing schema conventions.
* Preserve existing relationships.
* Check controllers/services using the model.
* Consider migration or compatibility implications.
* Do not silently rename fields used by existing APIs.

Avoid changing database behavior during an unrelated refactor.

---

# 16. Backend Routes

Routes should remain responsible primarily for:

* Endpoint definitions
* Middleware
* Controller mapping

Example pattern:

```text
route
  ↓
middleware
  ↓
controller
  ↓
service/model
```

Do not put large business logic directly into route files.

---

# 17. Authentication and Security

Authentication and authorization code is security-sensitive.

Do not modify authentication behavior casually.

Before changing:

* JWT handling
* Cookies
* bcrypt
* OAuth
* Passport
* Authorization middleware
* Role checks
* Workspace access checks

inspect all affected code paths.

Never:

* Hardcode secrets.
* Commit API keys.
* Commit passwords.
* Commit tokens.
* Log sensitive credentials.
* Expose environment variables in frontend code unless intentionally public.

Use environment variables for secrets.

---

# 18. API Changes

Before changing an existing API endpoint:

1. Search frontend usage.
2. Search backend routes.
3. Search controllers.
4. Check request/response structures.
5. Check authentication requirements.
6. Check whether existing clients depend on the endpoint.

Avoid breaking API contracts without explicitly documenting the change.

---

# 19. Error Handling

Follow the project's existing error-handling pattern.

Do not introduce several competing error-handling approaches.

Backend errors should provide appropriate HTTP status codes and useful messages without leaking sensitive implementation details.

Frontend code should handle expected API failures gracefully.

---

# 20. Dependencies

Before installing a dependency:

1. Check `package.json`.
2. Check whether the functionality already exists.
3. Consider whether a small existing utility can solve the problem.
4. Prefer existing dependencies.

Do not add a dependency simply because it is convenient.

After adding a dependency:

```bash
npm install
```

and verify the application still builds/runs.

---

# 21. Validation Requirements

After frontend changes, run:

```bash
cd frontend
npm run build
```

For development testing:

```bash
npm run dev
```

After backend changes, run the project's available test/lint/build commands.

If no automated tests exist for the affected functionality, manually verify the relevant behavior.

### Structural changes

After moving or renaming files:

```bash
git status
git diff --check
```

Also search for references to the old paths.

---

# 22. Git Rules

Agents must respect the current branch.

Before making changes:

```bash
git status
git branch --show-current
```

Do not switch branches unless explicitly requested.

Do not reset, rebase, force-push, or delete branches unless explicitly authorized.

### Before committing

Check:

```bash
git status
git diff --check
git diff
```

Ensure unrelated files are not staged.

### Commit messages

Use clear conventional-style commit messages.

Examples:

```text
feat(frontend): add workspace settings page
fix(backend): handle invalid workspace requests
refactor(frontend): organize page CSS and imports
fix(auth): prevent unauthorized workspace access
docs: update development guidelines
```

Do not create vague commits such as:

```text
changes
update
fix stuff
work
final
```

---

# 23. Pull Request Guidelines

A PR should clearly describe:

* What changed
* Why it changed
* Important architectural changes
* Testing performed
* Potential warnings or limitations
* Breaking changes, if any

Keep unrelated changes out of the PR.

If a structural refactor is being performed, explain the new structure in the PR description.

---

# 24. AI Agent Workflow

AI coding agents should follow this workflow:

```text
1. Inspect repository
        ↓
2. Identify relevant files
        ↓
3. Read existing implementation
        ↓
4. Understand project conventions
        ↓
5. Plan minimal changes
        ↓
6. Implement changes
        ↓
7. Search for broken references
        ↓
8. Run validation
        ↓
9. Review git diff
        ↓
10. Report changes and validation
```

Agents should not blindly modify files based only on filenames.

---

# 25. File Movement Rules

When moving or renaming files:

1. Confirm the destination.
2. Move the file.
3. Search for imports referencing the old location.
4. Update all affected imports.
5. Search for dynamic references if applicable.
6. Run the relevant build/tests.
7. Review `git status`.

Do not create duplicate copies simply to avoid fixing imports.

---

# 26. Refactoring Rules

Refactoring should preserve existing behavior unless behavior changes are explicitly requested.

During a refactor:

* Prefer small incremental changes.
* Do not rewrite unrelated code.
* Do not change API behavior unnecessarily.
* Do not change authentication behavior unnecessarily.
* Do not change database schemas unnecessarily.
* Do not introduce new architectural patterns without justification.

A structural refactor should remain a structural refactor.

---

# 27. Temporary Scripts

Temporary migration or automation scripts may be created when useful.

However:

* Clearly identify them as temporary.
* Do not leave unnecessary migration scripts in the repository.
* Remove one-time scripts after successful migration unless they have ongoing value.
* Verify the resulting repository structure after cleanup.

---

# 28. Generated Files

Do not manually modify generated output unless explicitly required.

Examples include:

```text
frontend/dist/
node_modules/
```

Follow the repository's `.gitignore` rules.

Do not commit build artifacts unless the project explicitly requires them.

---

# 29. Don't Guess — Inspect

This is one of the most important repository rules.

Before doing things such as:

* Creating a file
* Moving a file
* Installing a dependency
* Changing an API
* Changing a route
* Changing a database field
* Changing authentication
* Updating an import

inspect the repository first.

Use existing code as the source of truth.

---

# 30. Completion Checklist

Before considering a task complete, verify:

* [ ] Requested functionality is implemented.
* [ ] Existing project conventions are followed.
* [ ] No unnecessary files were created.
* [ ] No accidental root-level directories were created.
* [ ] Imports are valid.
* [ ] No unrelated files were modified.
* [ ] Relevant frontend/backend validation was performed.
* [ ] `git diff --check` passes.
* [ ] Git status was reviewed.
* [ ] Any warnings are documented.
* [ ] Security-sensitive changes were reviewed carefully.
* [ ] The final response clearly summarizes the changes and validation.

---

# 31. Final Principle

Prefer:

```text
Understand → Reuse → Modify minimally → Validate → Review
```

over:

```text
Guess → Rewrite → Add dependencies → Hope it works
```

The goal is to keep Loop maintainable, predictable, secure, and easy for both humans and AI coding agents to contribute to.
