# CVision AI

**AI CV Analyzer & Smart Job Matcher** — a full-stack MERN application that turns a CV into explainable, structured data and compares it against a job description you paste in.

Upload a PDF, DOCX or image CV, let the pipeline extract text (with OCR for scans and images), then have xAI's Grok model return strict JSON. The result is an evidence-grounded CV score, strengths, weaknesses, missing information, and an explainable job-compatibility score — never a wall of AI prose, and never invented companies, degrees or skills.

> The score is a review aid, not a prediction. It cannot and does not guarantee an interview or a job.

---

## Features

| Area                 | What it does                                                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication       | Register, login, logout, JWT session restore, password change, rate-limited auth routes                                                                                |
| CV upload            | Drag & drop or browse, PDF / DOCX / JPG / JPEG / PNG, 10 MB cap, real file-signature validation, private non-public storage                                            |
| Text extraction      | PDF text layer, DOCX via `mammoth`, OCR via `tesseract.js`, scanned-PDF OCR fallback with `pdfjs-dist` + `sharp`                                                       |
| CV analysis          | Structured profile, technical / soft skills, technologies, experience, education, projects, certifications, languages, achievements                                    |
| Explainable score    | Deterministic 0–100 weighted score with per-category bars, evidence, and a "why this score?" block                                                                     |
| Missing information  | Determininistic list of what a reviewer would expect to see but cannot find                                                                                            |
| CV improvement       | AI rewrites of summary, bullets and project wording, shown as suggestions for review — never auto-overwritten                                                          |
| Multiple CVs         | Name and keep several versions, analyze each independently, compare two versions side by side                                                                          |
| Job matcher          | Paste a job description (title, company, location, URL) and match it against an analyzed CV                                                                            |
| Explainable matching | 0–100 compatibility with per-category scores, matching/missing skills, matching/missing experience, education compatibility, keyword matches, gaps and recommendations |
| History              | Searchable, filterable, sortable history of analyses and matches with view and delete                                                                                  |
| Dashboard            | Aggregate scores, totals, recent analyses, recent jobs and recent matches                                                                                              |
| UX                   | Dark mode, skeletons, staged upload status, empty and error states, responsive layout, reduced-motion support                                                          |

**No job scraping.** Job data is manual or pasted by the user. Nothing bypasses authentication, anti-bot systems or `robots.txt`.

---

## Tech stack

**Frontend** — React 19, Vite 8, JSX (no TypeScript), React Router 7, Tailwind CSS 4 (`@tailwindcss/vite`), shadcn/ui-style components on Radix primitives, Magic UI-inspired effects (border beam, number ticker, spotlight, shimmer button), Lucide React, Axios, Recharts, react-dropzone, react-hot-toast, date-fns, Vitest + Testing Library.

**Backend** — Node.js 22+, Express 5, Mongoose 9, MongoDB Atlas, `jsonwebtoken`, `bcryptjs`, `cors`, `helmet`, `express-rate-limit`, `multer`, `mammoth`, `tesseract.js`, `pdfjs-dist`, `sharp`, `dotenv`, Vitest + Supertest.

**AI** — xAI **Responses API** (`POST https://api.x.ai/v1/responses`) with `grok-4.6` by default, `text.format` JSON-schema structured output, and `store: false`. The key lives only on the server.

---

## Architecture

```text
React (JSX + Tailwind)
   │  Axios + Bearer JWT
   ▼
Express API (helmet, cors, rate limit, validation)
   │
   ├─ authMiddleware ──► ownership scoping on every private query
   │
   ├─ uploadMiddleware ──► multer (10 MB, signature-checked) ──► private uploads/
   │
   ├─ resumeController ──► documentService ──► pdfjs-dist / mammoth / ocrService (tesseract.js)
   │
   ├─ analysisController ──► aiService (xAI Responses API, JSON schema) ──► normalize + validate
   │                                └─► scoreCalculator (deterministic, explainable)
   │
   └─ matchController ──► matchingService ──► aiService ──► Match document
                                     │
                                     ▼
                              MongoDB Atlas (cv-analyzer-jadara)
```

Rules the code follows: thin controllers, services own the work, AI output is never trusted without normalization and validation, every private query is scoped to `req.user._id`, and no secret ever reaches the client or a log line.

---

## Folder structure

```text
cv-analyzer-jadara/
├── client/
│   ├── public/
│   └── src/
│       ├── components/       # ResumeUploader, ScoreCard, SkillChart, ExperienceTimeline, ...
│       │   └── ui/           # shadcn/ui-style primitives (Radix based)
│       ├── context/          # AuthContext, ThemeContext
│       ├── hooks/
│       ├── layouts/          # DashboardLayout
│       ├── lib/              # utils, validators, normalize (API contract adapter)
│       ├── pages/            # Landing, Login, Register, Dashboard, UploadResume, ...
│       ├── services/         # api.js — the only Axios client
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── config/               # db.js, env.js
│   ├── controllers/          # auth, resume, analysis, job, match, settings, dashboard
│   ├── middleware/           # auth, upload, validate, error, rateLimit
│   ├── models/               # User, Resume, Analysis, Job, Match
│   ├── routes/
│   ├── services/             # aiService, aiSchemas, documentService, ocrService, matchingService
│   ├── tests/
│   ├── utils/                # jwt, validators, scoreCalculator, presenters, fileValidation
│   ├── uploads/              # private, gitignored
│   └── server.js
├── .gitignore
├── Prompt.md
└── README.md
```

---

## Installation

```bash
git clone https://github.com/ELMACHHOUNE/cv-analyzer-with-ai
cd cv-analyzer-jadara

cd server && npm install
cd ../client && npm install
```

Copy the environment templates:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

## MongoDB Atlas setup

1. Create a free Atlas cluster.
2. **Database Access** → create a user. Do not use `admin:admin` outside a throwaway sandbox; grant only `readWrite` on the `cv-analyzer-jadara` database.
3. **Network Access** → allow your IP (or `0.0.0.0/0` only for local throwaway testing; Atlas requires TLS, so keep `ssl=true`).
4. Copy the **SRV** connection string into `MONGODB_URI` and replace `<dbuser>` / `<password>`.

The server refuses to start when `MONGODB_URI` or `JWT_SECRET` is missing or malformed, and it creates its indexes on boot.

## xAI API setup

1. Create a key at <https://console.x.ai>.
2. Set `XAI_API_KEY` in `server/.env`.
3. Optionally set `XAI_MODEL` (default `grok-4.6`) and `XAI_TIMEOUT_MS` (default `90000`, because structured analysis can take a while).

The key is read from `process.env` on the server only. There is no `VITE_XAI_API_KEY`, and React never talks to xAI.

## Environment variables

`server/.env`

| Variable                            | Purpose                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| `PORT`                              | API port (default `5000`)                                          |
| `NODE_ENV`                          | `development` / `test` / `production`                              |
| `MONGODB_URI`                       | Atlas connection string — required                                 |
| `JWT_SECRET`                        | ≥ 32 characters — required                                         |
| `JWT_EXPIRES_IN`                    | Token lifetime (default `7d`)                                      |
| `CLIENT_URL` / `CORS_ORIGINS`       | Comma-separated allowed origins (required allowlist in production) |
| `XAI_API_KEY`                       | xAI key — server only                                              |
| `XAI_MODEL`                         | Model id (default `grok-4.6`)                                      |
| `XAI_TIMEOUT_MS`                    | AI request timeout (default `90000`)                               |
| `UPLOAD_DIR`                        | Private upload directory (default `uploads`)                       |
| `MAX_UPLOAD_BYTES`                  | Upload cap (default `10485760` = 10 MB)                            |
| `OCR_LANGUAGES`                     | Tesseract languages (default `eng`)                                |
| `TRUST_PROXY`                       | `false` or an integer hop count — required when behind a proxy     |
| `AUTH_RATE_LIMIT` / `AI_RATE_LIMIT` | Rate-limit windows                                                 |

`client/.env`

| Variable       | Purpose                                        |
| -------------- | ---------------------------------------------- |
| `VITE_API_URL` | API base URL, e.g. `http://localhost:5000/api` |

Never put `MONGODB_URI`, `JWT_SECRET` or `XAI_API_KEY` in the client, and never commit `.env`.

## Running the project

Two terminals:

```bash
cd server && npm run dev     # nodemon server.js  -> http://localhost:5000
cd client && npm run dev     # vite               -> http://localhost:5173
```

Production build:

```bash
cd client && npm run build && npm run preview
cd server && npm start
```

Quality gates (both packages):

```bash
npm run lint
npm test
```

---

## API documentation

All responses use `{ "success": true, "data": {} }` or `{ "success": false, "message": "..." }`. Send `Authorization: Bearer <token>` for every route marked 🔒.

### Auth

| Method  | Path                 | Body                        | Data                         |
| ------- | -------------------- | --------------------------- | ---------------------------- |
| POST    | `/api/auth/register` | `{ name, email, password }` | `{ user, token, expiresIn }` |
| POST    | `/api/auth/login`    | `{ email, password }`       | `{ user, token, expiresIn }` |
| GET 🔒  | `/api/auth/me`       | –                           | `{ user }`                   |
| POST 🔒 | `/api/auth/logout`   | –                           | `{ loggedOut }`              |

### Resumes

| Method    | Path                  | Body / Query              | Data                    |
| --------- | --------------------- | ------------------------- | ----------------------- |
| POST 🔒   | `/api/resumes/upload` | multipart `file`, `name?` | `{ resume }`            |
| GET 🔒    | `/api/resumes`        | `page, limit`             | `{ items, pagination }` |
| GET 🔒    | `/api/resumes/:id`    | –                         | `{ resume }`            |
| PATCH 🔒  | `/api/resumes/:id`    | `{ name }`                | `{ resume }`            |
| DELETE 🔒 | `/api/resumes/:id`    | –                         | `{ deleted }`           |

### Analysis

| Method    | Path                          | Body / Query                    | Data                          |
| --------- | ----------------------------- | ------------------------------- | ----------------------------- |
| POST 🔒   | `/api/analysis/:resumeId`     | `{ name? }`                     | `{ analysis }`                |
| POST 🔒   | `/api/analysis`               | `{ resumeId, name? }`           | `{ analysis }`                |
| GET 🔒    | `/api/analysis`               | `page, limit, resumeId, search` | `{ items, pagination }`       |
| GET 🔒    | `/api/analysis/latest`        | `resumeId?`                     | `{ analysis }`                |
| GET 🔒    | `/api/analysis/:idOrResumeId` | –                               | `{ analysis }`                |
| POST 🔒   | `/api/analysis/compare`       | `{ analysisIds: [2–4] }`        | `{ analyses, summary }`       |
| POST 🔒   | `/api/analysis/:id/improve`   | `{ instructions? }`             | `{ analysisId, improvement }` |
| DELETE 🔒 | `/api/analysis/:id`           | –                               | `{ deleted }`                 |

An `analysis` exposes both the specification field names and the raw engine data:

```jsonc
{
  "score": 82,
  "label": "Strong foundation",
  "scoreBreakdown": [
    {
      "key": "skills",
      "score": 85,
      "weight": 20,
      "explanation": "…",
      "evidence": ["…"],
    },
  ],
  "profile": {
    "fullName": "…",
    "email": "…",
    "phone": "…",
    "location": "…",
    "summary": "…",
  },
  "skills": [],
  "technicalSkills": [],
  "softSkills": [],
  "technologies": [],
  "experience": [],
  "education": [],
  "projects": [],
  "certifications": [],
  "languages": [],
  "achievements": [],
  "strengths": [],
  "weaknesses": [],
  "missingInformation": [],
  "recommendations": [],
  "explanation": {
    "strongPoints": [],
    "areasToImprove": [],
    "formula": "…",
    "disclaimer": "…",
  },
}
```

### Jobs and matching

| Method    | Path                               | Body / Query                                                                          | Data                    |
| --------- | ---------------------------------- | ------------------------------------------------------------------------------------- | ----------------------- |
| POST 🔒   | `/api/jobs`                        | `{ title, description, company?, location?, employmentType?, url?, skills?, notes? }` | `{ job }`               |
| GET 🔒    | `/api/jobs`                        | `page, limit, search`                                                                 | `{ items, pagination }` |
| GET 🔒    | `/api/jobs/:id`                    | –                                                                                     | `{ job }`               |
| PATCH 🔒  | `/api/jobs/:id`                    | partial body                                                                          | `{ job }`               |
| DELETE 🔒 | `/api/jobs/:id`                    | –                                                                                     | `{ deleted }`           |
| POST 🔒   | `/api/jobs/:jobId/match/:resumeId` | `{ analysisId?, force? }`                                                             | `{ match, cached }`     |
| GET 🔒    | `/api/matches`                     | `page, limit, resumeId, jobId`                                                        | `{ items, pagination }` |
| GET 🔒    | `/api/matches/:id`                 | –                                                                                     | `{ match }`             |
| DELETE 🔒 | `/api/matches/:id`                 | –                                                                                     | `{ deleted }`           |

A `match` follows the specification's explainable shape:

```jsonc
{
  "score": 87,
  "scoreBreakdown": [
    {
      "key": "skills",
      "score": 90,
      "weight": 40,
      "explanation": "…",
      "evidence": [],
    },
  ],
  "categoryScores": {
    "skills": 90,
    "experience": 80,
    "education": 70,
    "keywords": 85,
    "impact": 75,
    "completeness": 70,
  },
  "matchingSkills": [],
  "missingSkills": [],
  "additionalSkills": [],
  "matchingExperience": [],
  "missingExperience": [],
  "educationCompatibility": {
    "score": 70,
    "label": "…",
    "explanation": "…",
    "evidence": [],
  },
  "keywordMatches": [],
  "strongMatches": [],
  "gaps": [],
  "recommendations": [],
  "explanation": "…",
}
```

### Settings, dashboard, health

| Method   | Path                     | Body                                                         | Data                                                                  |
| -------- | ------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| GET 🔒   | `/api/settings`          | –                                                            | `{ settings: { name, email, targetRole, preferredLanguage, theme } }` |
| PATCH 🔒 | `/api/settings`          | `{ name?, email?, targetRole?, preferredLanguage?, theme? }` | `{ settings }`                                                        |
| PUT 🔒   | `/api/settings/password` | `{ currentPassword, newPassword }`                           | `{ passwordChanged }`                                                 |
| GET 🔒   | `/api/dashboard`         | –                                                            | `{ stats, recentAnalyses, recentMatches, topMatches, recentJobs }`    |
| GET      | `/api/health`            | –                                                            | `{ status }`                                                          |

### Scoring model

CV score weights: contact information 10, professional summary 10, skills 20, experience 25, education 10, projects 5, quantified impact 10, clarity 10.
Job match weights: skills 40, experience 25, education 10, keywords 10, impact 10, completeness 5.

Labels are neutral and descriptive (`Strong foundation`, `Solid foundation`, `Developing foundation`, `Early-stage foundation`).

---

## Anti-hallucination guarantees

- The system prompt forbids inventing companies, degrees, certifications, skills, dates, titles or metrics; missing information is `null` or `[]`.
- Every extracted skill, link, certification, language, keyword and evidence quote is filtered against the actual document text before it is stored.
- Strengths must carry verbatim evidence; revisions must quote the source.
- AI output is parsed defensively, normalized to a fixed shape, and rejected with `AI_INVALID_RESPONSE` when it does not fit.
- Job analysis never reads the posting URL and never scrapes.

---

## Security

- `bcryptjs` password hashing; passwords and hashes are never returned or selected.
- JWT with a 32+ character secret, `tokenVersion` for instant revocation, `Authorization: Bearer` on every private route.
- Ownership validation on every private read, update and delete — user A cannot read user B's CV, job, analysis or match.
- File validation by extension **and** magic bytes, 10 MB cap, generated filenames, no path traversal, uploads stored with `0700` and never served statically.
- Helmet security headers, `x-powered-by` disabled, CORS allowlist (`*` is rejected in production), body-size limits, and rate limits on auth and AI routes.
- Request validation on body, query and params with field-level error details; safe error middleware that never leaks stack traces, keys, URIs or secrets.
- `.env` is gitignored; the client only ever knows `VITE_API_URL`.

## Known limitations

- Uploads are stored on local disk, so the API must run on a single host (or the upload volume must be shared) — object storage is the next step.
- OCR is CPU-heavy: the first Tesseract run downloads language data and can be slow.
- Scores are heuristic and language-dependent; they are review aids, not hiring decisions.
- Matching quality depends on the pasted job description, since no job board is queried.
- Chat Completions is legacy at xAI; the integration targets the Responses API and falls back to an unconstrained JSON request if the structured-output format is rejected.

## Future improvements

- S3/GridFS storage, virus scanning and per-document retention limits.
- Streaming extraction with live status via SSE instead of staged client simulation.
- Job ingestion through an officially supported, authorized jobs API.
- Weighted, per-role scoring profiles and localized scoring thresholds.
- Optional cover-letter and LinkedIn-profile (official API) review.

## Screenshots

Add your own captures of the landing page, dashboard, upload flow, analysis tabs and match result to `docs/screenshots/` and reference them here. The app ships without binary assets in Git so the repository stays reviewable.

## Team members

| Member               | Contribution                          |
| -------------------- | ------------------------------------- |
| Mohamed EL MACHHOUNE | Full-stack, AI integration, UI system |

> This project is educational. Replace the Atlas credentials and the xAI key with your own before any deployment, and never commit them.
