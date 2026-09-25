# CVision AI — Full-Stack AI CV Analyzer & Smart Job Matcher

## 0. ROLE

You are a senior full-stack engineer and software architect.

You must build a production-quality educational project called:

**CVision AI — AI CV Analyzer & Smart Job Matcher**

The project is an advanced MERN Stack application with AI integration.

You must implement the project **step by step**, respecting the architecture, requirements, security rules and UI/UX requirements described in this document.

Do NOT skip architecture or create one huge file.

Do NOT put all backend logic inside `server.js`.

Do NOT put the xAI API key in the React frontend.

Do NOT create an unauthorized LinkedIn scraper.

---

# 1. PROJECT OBJECTIVE

Build a modern AI SaaS-style web application that allows users to:

1. Create an account.
2. Login securely.
3. Upload their CV/resume.
4. Support:
   - PDF
   - DOCX
   - JPG
   - JPEG
   - PNG

5. Extract text from the CV.
6. Use OCR when the CV is an image or scanned document.
7. Analyze the extracted CV content using xAI/Grok.
8. Extract structured information:
   - Personal information
   - Professional summary
   - Skills
   - Technical skills
   - Soft skills
   - Work experience
   - Education
   - Certifications
   - Languages
   - Projects
   - Technologies

9. Generate an explainable CV score from 0–100.
10. Display:
    - Strengths
    - Weaknesses
    - Missing information
    - Recommendations

11. Allow the user to enter/import a job description.
12. Compare the CV with the job description.
13. Generate a job compatibility score.
14. Display:
    - Matching skills
    - Missing skills
    - Matching experience
    - Missing experience
    - Education compatibility
    - Keywords
    - Recommendations

15. Save previous analyses.
16. Save previous job matches.
17. Provide a modern dashboard.

The final result should look like a real AI SaaS product.

---

# 2. TECHNOLOGY STACK

## Frontend

Mandatory:

- React
- Vite
- JSX
- React Router
- Tailwind CSS
- shadcn/ui
- Magic UI
- Lucide React
- Axios

Recommended:

- Recharts
- react-dropzone
- react-hot-toast
- clsx
- date-fns

Do NOT convert the frontend to TypeScript.

The frontend must use `.jsx`.

---

# 3. BACKEND

Mandatory:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- cors
- dotenv
- multer

The backend must be JavaScript.

Do not convert the backend to TypeScript unless explicitly requested later.

---

# 4. AI

Use:

**xAI API / Grok**

Official console:

https://console.x.ai

The API key must exist ONLY on the backend.

Example:

```env
XAI_API_KEY=your_secret_key
```

Never expose it through:

```env
VITE_XAI_API_KEY=
```

Never call xAI directly from React.

The architecture must be:

```text
React
   ↓
Express API
   ↓
Controller
   ↓
AI Service
   ↓
xAI / Grok
   ↓
Structured JSON
   ↓
MongoDB
   ↓
React
```

Use the current xAI API documentation and current supported model/API format when implementing the integration.

Do not hard-code assumptions if the current API documentation provides a better implementation.

---

# 5. IMPORTANT: DO NOT BUILD A LINKEDIN SCRAPER

The application needs job matching.

However:

**Do NOT implement unauthorized LinkedIn scraping.**

The first version must support:

### Option 1

Manual job description input.

### Option 2

User pastes a job description.

### Option 3

Import jobs from an authorized/public jobs API.

### Option 4

Future integration through an officially supported LinkedIn API if access is available.

The UI can mention:

```text
Paste a job description
```

and optionally:

```text
Import Job
```

Do not bypass authentication, anti-bot systems, robots rules or access restrictions.

---

# 6. PROJECT STRUCTURE

The final project must have:

```text
cv-vision-ai/
│
├── client/
│
├── server/
│
├── README.md
├── .gitignore
└── prompt.md
```

---

# 7. CLIENT STRUCTURE

Use:

```text
client/
│
├── public/
│
├── src/
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ResumeUploader.jsx
│   │   ├── ScoreCard.jsx
│   │   ├── SkillBadge.jsx
│   │   ├── SkillChart.jsx
│   │   ├── ExperienceTimeline.jsx
│   │   ├── EducationCard.jsx
│   │   ├── RecommendationCard.jsx
│   │   ├── JobMatchCard.jsx
│   │   ├── LoadingAnalysis.jsx
│   │   └── EmptyState.jsx
│   │
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── UploadResume.jsx
│   │   ├── ResumeAnalysis.jsx
│   │   ├── JobMatcher.jsx
│   │   ├── MatchResult.jsx
│   │   ├── History.jsx
│   │   └── Settings.jsx
│   │
│   ├── layouts/
│   │   └── DashboardLayout.jsx
│   │
│   ├── context/
│   │   └── AuthContext.jsx
│   │
│   ├── hooks/
│   │
│   ├── services/
│   │   └── api.js
│   │
│   ├── lib/
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env
├── .env.example
├── package.json
└── vite.config.js
```

---

# 8. SERVER STRUCTURE

Use:

```text
server/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── resumeController.js
│   ├── analysisController.js
│   ├── jobController.js
│   └── matchController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── uploadMiddleware.js
│   ├── errorMiddleware.js
│   └── validateMiddleware.js
│
├── models/
│   ├── User.js
│   ├── Resume.js
│   ├── Analysis.js
│   ├── Job.js
│   └── Match.js
│
├── routes/
│   ├── authRoutes.js
│   ├── resumeRoutes.js
│   ├── analysisRoutes.js
│   ├── jobRoutes.js
│   └── matchRoutes.js
│
├── services/
│   ├── aiService.js
│   ├── documentService.js
│   ├── ocrService.js
│   └── matchingService.js
│
├── utils/
│   ├── jwt.js
│   ├── validators.js
│   └── scoreCalculator.js
│
├── uploads/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

---

# 9. ENVIRONMENT VARIABLES

Create:

```text
server/.env
server/.env.example
client/.env
client/.env.example
```

Server `.env.example`:

```env
PORT=5000

MONGODB_URI=

JWT_SECRET=

CLIENT_URL=http://localhost:5173

XAI_API_KEY=

XAI_MODEL=
```

Client `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

Never put:

```text
MONGODB_URI
JWT_SECRET
XAI_API_KEY
```

inside the client.

Never commit `.env`.

---

# 10. GITIGNORE

Root `.gitignore`:

```gitignore
node_modules/
.env
.env.local
dist/
uploads/
*.log
.DS_Store
```

Server `.gitignore` should also protect uploaded files if uploads are stored locally.

---

# 11. DATABASE

Use MongoDB Atlas.

Database:

```text
cv_analyzer
```

Connection must be handled inside:

```text
server/config/db.js
```

Create a reusable connection function:

```text
connectDB()
```

The server must not start successfully if the database configuration is invalid.

---

# 12. USER MODEL

Create:

```text
server/models/User.js
```

Fields:

```js
{
  (name, email, password, createdAt);
}
```

Requirements:

- Email must be unique.
- Password must be hashed.
- Never return password in API responses.
- Add timestamps where useful.

---

# 13. RESUME MODEL

Create:

```text
server/models/Resume.js
```

Suggested:

```js
{
  (user,
    originalName,
    fileType,
    fileSize,
    filePath,
    extractedText,
    status,
    createdAt);
}
```

Status:

```text
uploaded
processing
processed
failed
```

---

# 14. ANALYSIS MODEL

Create:

```text
server/models/Analysis.js
```

Suggested:

```js
{
  user,
  resume,

  score,

  profile: {
    fullName,
    email,
    phone,
    location,
    summary
  },

  skills: [],

  experience: [],

  education: [],

  certifications: [],

  languages: [],

  projects: [],

  strengths: [],

  weaknesses: [],

  recommendations: [],

  createdAt
}
```

---

# 15. JOB MODEL

Create:

```text
server/models/Job.js
```

Suggested:

```js
{
  (user, title, company, location, description, source, url, createdAt);
}
```

---

# 16. MATCH MODEL

Create:

```text
server/models/Match.js
```

Suggested:

```js
{
  (user,
    resume,
    job,
    score,
    matchingSkills,
    missingSkills,
    matchingExperience,
    missingExperience,
    educationCompatibility,
    keywordMatches,
    recommendations,
    explanation,
    createdAt);
}
```

---

# 17. AUTHENTICATION

Implement:

```text
POST /api/auth/register
POST /api/auth/login
GET /api/auth/me
```

Registration:

```text
name
email
password
```

Login:

```text
email
password
```

Use:

```text
bcryptjs
JWT
```

JWT should contain the user ID.

Protected requests use:

```text
Authorization: Bearer TOKEN
```

---

# 18. AUTH MIDDLEWARE

Create:

```text
server/middleware/authMiddleware.js
```

Responsibilities:

1. Read Authorization header.
2. Extract Bearer token.
3. Verify JWT.
4. Find user.
5. Attach user to request.
6. Reject invalid/expired tokens.

Return:

```text
401 Unauthorized
```

when necessary.

---

# 19. FILE UPLOAD

Implement:

```text
POST /api/resumes/upload
```

Use multipart/form-data.

Supported:

```text
.pdf
.docx
.jpg
.jpeg
.png
```

Set a reasonable file-size limit.

Example:

```text
10 MB
```

Reject unsupported formats.

Never trust only the extension.

---

# 20. DOCUMENT PROCESSING SERVICE

Create:

```text
server/services/documentService.js
```

Responsibilities:

```text
PDF → text
DOCX → text
Image → OCR
Scanned PDF → OCR when required
```

The service should expose a clean interface such as:

```text
extractText(file)
```

The controller should not contain document parsing code.

---

# 21. OCR SERVICE

Create:

```text
server/services/ocrService.js
```

The service should process:

```text
JPG
JPEG
PNG
scanned PDF pages
```

Choose an appropriate OCR library based on the environment.

The implementation must be documented in README.

---

# 22. AI SERVICE

Create:

```text
server/services/aiService.js
```

Functions:

```text
analyzeResume()
extractResumeInformation()
analyzeJobDescription()
matchResumeWithJob()
generateRecommendations()
```

The AI service must:

- Read XAI_API_KEY from process.env.
- Use the configured model.
- Handle API errors.
- Handle timeout.
- Handle malformed output.
- Return normalized structured data.

---

# 23. AI CV ANALYSIS

Input:

```text
Extracted CV text
```

Output must contain:

```json
{
  "profile": {},
  "skills": [],
  "experience": [],
  "education": [],
  "certifications": [],
  "languages": [],
  "projects": [],
  "strengths": [],
  "weaknesses": [],
  "recommendations": []
}
```

Do not simply save a large AI paragraph.

The application needs structured data.

---

# 24. AI PROMPT

Use a strong system prompt.

Concept:

```text
You are an expert resume analysis assistant.

Analyze the resume provided by the user.

Extract only information supported by the resume.

Identify:

- personal profile
- professional summary
- technical skills
- soft skills
- work experience
- education
- certifications
- languages
- projects
- technologies

Evaluate the structure and completeness.

Identify strengths.

Identify weaknesses.

Provide practical recommendations.

Return structured JSON only.

Do not invent information that does not exist in the resume.
```

Then provide:

```text
RESUME TEXT:
{{resumeText}}
```

---

# 25. IMPORTANT AI RULE

The AI must NOT invent:

- Companies
- Degrees
- Certifications
- Skills
- Years of experience
- Job titles

If information is unavailable:

```json
null
```

or:

```json
[]
```

Use evidence from the CV.

---

# 26. CV SCORE

Implement a scoring algorithm.

Suggested weights:

```text
Contact Information       10%
Professional Summary      10%
Skills                    20%
Experience                25%
Education                 10%
Projects                  10%
Certifications             5%
Structure / Clarity        10%
--------------------------------
TOTAL                     100%
```

Return:

```text
score: 82
```

The UI should display:

```text
82 / 100
```

and:

```text
Good
```

or another neutral descriptive state based on configured ranges.

Do not imply that the score guarantees employment.

---

# 27. SCORE EXPLANATION

The result must show:

```text
Why this score?
```

Example:

```text
Strong points:
✓ Clear technical skills
✓ Relevant experience
✓ Education is clearly presented

Areas to improve:
• Add measurable achievements
• Improve professional summary
• Add project details
```

---

# 28. JOB MATCHING

Implement:

```text
POST /api/jobs/:jobId/match/:resumeId
```

The system receives:

```text
Resume analysis
+
Job description
```

Then analyzes:

```text
Skills
Experience
Education
Projects
Certifications
Keywords
Requirements
```

---

# 29. JOB MATCH SCORE

Suggested:

```text
Skills                    40%
Experience                25%
Education                 10%
Projects                  10%
Keywords                  10%
Certifications             5%
--------------------------------
TOTAL                     100%
```

Return:

```json
{
  "score": 87
}
```

---

# 30. JOB MATCH RESPONSE

Must contain:

```json
{
  "score": 87,
  "matchingSkills": [],
  "missingSkills": [],
  "matchingExperience": [],
  "missingExperience": [],
  "educationCompatibility": {},
  "keywordMatches": [],
  "recommendations": [],
  "explanation": ""
}
```

---

# 31. JOB DESCRIPTION INPUT

Create a modern form:

```text
Job Title
Company
Location
Job URL
Job Description
```

Example:

```text
Frontend Developer

We are looking for a React developer with:

React
JavaScript
TypeScript
REST APIs
Git
Tailwind CSS

2+ years of experience.
```

---

# 32. DASHBOARD

Create a professional dashboard.

Example structure:

```text
┌───────────────────────────────────────────────────┐
│ CVision AI                         Profile        │
├──────────────┬────────────────────────────────────┤
│ Dashboard    │ Welcome back                      │
│ My CVs       │                                    │
│ Job Matcher  │ ┌──────┐ ┌──────┐ ┌──────┐       │
│ History      │ │ 82%  │ │  5   │ │ 87%  │       │
│ Settings     │ │ CV   │ │ CVs  │ │ Match│       │
│              │ └──────┘ └──────┘ └──────┘       │
│              │                                    │
│              │ Recent analyses                    │
│              │ Recent matches                     │
└──────────────┴────────────────────────────────────┘
```

---

# 33. LANDING PAGE

Create a premium SaaS landing page.

Hero:

```text
Understand Your CV.
Match Your Career.

AI-powered CV analysis and job compatibility
in one intelligent workspace.

[ Analyze My CV ]

[ Try Job Matcher ]
```

Sections:

1. Hero
2. Features
3. How it works
4. CV analysis preview
5. Job matching preview
6. Technology
7. CTA
8. Footer

Use Magic UI selectively.

---

# 34. UPLOAD PAGE

Create a large drag-and-drop uploader.

Requirements:

- Drag & drop.
- Browse button.
- File validation.
- File size display.
- File preview/name.
- Remove file.
- Upload progress.
- Processing status.

Statuses:

```text
Uploading...
Extracting text...
Running OCR...
Analyzing CV...
Generating recommendations...
Complete
```

---

# 35. ANALYSIS PAGE

Create tabs:

```text
Overview
Skills
Experience
Education
Projects
Certifications
Recommendations
```

Overview should show:

```text
CV Score
Profile
Strengths
Weaknesses
Quick recommendations
```

---

# 36. SKILLS VISUALIZATION

Use:

```text
Recharts
```

or another suitable chart library.

Possible visualizations:

- Bar chart
- Radar chart
- Progress bars

Example:

```text
Frontend       85%
Backend        70%
Database       65%
DevOps         45%
AI             55%
```

---

# 37. EXPERIENCE TIMELINE

Display:

```text
2024 ─────────────── 2026
       Full Stack Developer
       Company ABC

2022 ─────────────── 2024
       Frontend Developer
       Company XYZ
```

Use a clean timeline component.

---

# 38. JOB MATCH RESULT PAGE

Display a large score:

```text
87%
Compatibility
```

Then:

```text
Matching Skills
✓ React
✓ JavaScript
✓ Git
✓ REST APIs

Missing Skills
! TypeScript
! AWS
```

Then:

```text
Experience Compatibility
Education Compatibility
Keyword Match
Recommendations
Why this score?
```

---

# 39. HISTORY PAGE

Show previous:

```text
CV analyses
Job matches
```

Example:

```text
Frontend CV
Score: 82%
Date: 25 Sep 2026

MERN Developer
Match: 91%
Date: 25 Sep 2026
```

Add:

- Search
- Filter
- Sort
- View details
- Delete

---

# 40. SETTINGS PAGE

Include:

```text
Name
Email
Password change
Theme
```

Do not expose sensitive secrets.

---

# 41. SHADCN/UI

Use shadcn/ui for:

```text
Button
Card
Badge
Dialog
Dropdown
Tabs
Progress
Input
Textarea
Select
Avatar
Alert
Skeleton
Table
Tooltip
Separator
```

Install only components actually used.

---

# 42. MAGIC UI

Use Magic UI for selected effects:

- Animated gradient
- Border beam
- Number counter
- Shimmer button
- Spotlight
- Animated background

Do not overuse animation.

The interface must remain readable and professional.

---

# 43. DESIGN SYSTEM

Use a modern AI SaaS visual language.

Suggested colors:

```text
Primary: #2563EB
Dark: #172554
Background: #F8FAFC
Text: #0F172A
Muted: #64748B
Success: #16A34A
Warning: #EA580C
```

Use:

- Rounded cards
- Soft borders
- Consistent spacing
- Clear typography
- Strong hierarchy
- Responsive design

The application must support dark mode if practical.

---

# 44. RESPONSIVE DESIGN

The application must work on:

```text
Desktop
Laptop
Tablet
Mobile
```

Sidebar should collapse on smaller screens.

Tables should become scrollable or responsive.

Cards should stack properly.

---

# 45. LOADING STATES

AI operations may take time.

Never leave the UI frozen.

Use:

```text
Skeleton
Spinner
Progress
Animated status
```

Example:

```text
Preparing your CV...

✓ File uploaded
✓ Text extracted
✓ Skills detected
● Analyzing experience
○ Generating recommendations
```

---

# 46. ERROR HANDLING

Handle:

```text
Invalid file
Unsupported file
File too large
OCR failure
Empty document
AI API error
AI malformed JSON
MongoDB error
JWT error
Unauthorized resource
Network error
```

Return useful messages.

Never expose:

```text
XAI_API_KEY
JWT_SECRET
MONGODB_URI
```

---

# 47. SECURITY

Implement:

- bcrypt password hashing
- JWT authentication
- Protected routes
- Ownership validation
- CORS
- Environment variables
- File validation
- Request validation
- Safe errors
- No secret in frontend
- No `.env` in Git

Every private database query must verify the authenticated user.

Example:

Do NOT allow:

```text
GET /api/resumes/:id
```

to return another user's CV.

---

# 48. API RESPONSE FORMAT

Use consistent responses.

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

Use appropriate HTTP status codes.

---

# 49. HTTP STATUS CODES

Use:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

---

# 50. FRONTEND API SERVICE

Create:

```text
client/src/services/api.js
```

Centralize API requests.

Do not repeat:

```text
axios.create(...)
```

inside every page.

Create one API client.

Configure:

```text
VITE_API_URL
```

---

# 51. AUTH CONTEXT

Create:

```text
client/src/context/AuthContext.jsx
```

Handle:

```text
login()
register()
logout()
getCurrentUser()
isAuthenticated
user
loading
```

Use protected routes.

---

# 52. PROTECTED ROUTES

Pages such as:

```text
/dashboard
/upload
/analysis
/jobs
/matches
/history
/settings
```

must require authentication.

Unauthenticated users should be redirected to:

```text
/login
```

---

# 53. VALIDATION

Frontend validation:

- Email format
- Required fields
- Password length
- File type
- File size
- Job description length

Backend validation must ALSO exist.

Never rely only on frontend validation.

---

# 54. AI COST CONTROL

Do not call AI unnecessarily.

Examples:

- Do not analyze the same CV repeatedly without user action.
- Store analysis results.
- Allow users to re-analyze intentionally.
- Avoid sending unnecessary repeated data.
- Trim excessive extracted text if appropriate.
- Handle model/API limits.

---

# 55. ADVANCED FEATURE: CV IMPROVEMENT

Add:

```text
Improve My CV
```

The AI can provide:

```text
Professional Summary
Skills Presentation
Experience Bullet Improvements
Project Description Improvements
Missing Sections
```

Do not automatically overwrite the user's CV.

Show suggestions for review.

---

# 56. ADVANCED FEATURE: MULTIPLE CVs

Allow:

```text
CV - Frontend
CV - Full Stack
CV - Internship
CV - Software Engineer
```

The user can analyze each independently.

---

# 57. ADVANCED FEATURE: CV COMPARISON

Allow two analyses to be compared:

```text
CV Version A
CV Version B
```

Example:

```text
                    Version A     Version B

Skills                 70%           85%
Experience             75%           88%
Structure              68%           92%
Keywords               63%           84%
```

---

# 58. ADVANCED FEATURE: EXPLAINABLE MATCHING

Never only show:

```text
87%
```

Explain:

```text
Why this score?

Strong matches:
+ React experience
+ Node.js experience
+ MongoDB experience

Gaps:
- TypeScript not clearly demonstrated
- AWS not mentioned
```

---

# 59. TESTING

At minimum test:

### Authentication

```text
Register
Login
Invalid password
Duplicate email
Invalid JWT
```

### Resume

```text
Valid PDF
Valid DOCX
Valid image
Invalid file
Large file
Empty file
```

### AI

```text
Valid analysis
Malformed response
API error
Missing API key
```

### Authorization

```text
User A cannot access User B's CV
User A cannot access User B's jobs
```

---

# 60. README

Create a professional README containing:

```text
# CVision AI

Project description

Features

Tech Stack

Architecture

Folder Structure

Installation

MongoDB Atlas Setup

xAI API Setup

Environment Variables

Running the Project

API Documentation

Screenshots

Security

Known Limitations

Future Improvements

Team Members
```

---

# 61. DEVELOPMENT PROCESS

You MUST build the application in the following phases.

Do NOT jump directly to the final UI.

---

## PHASE 1 — Project Initialization

Tasks:

1. Inspect the existing repository.
2. Determine whether client/server already exist.
3. Create missing directories.
4. Initialize client with Vite React JSX if necessary.
5. Initialize server.
6. Install dependencies.
7. Configure `.gitignore`.
8. Create `.env.example`.
9. Create README skeleton.

At the end:

```text
Client starts successfully.
Server starts successfully.
```

---

## PHASE 2 — MongoDB

Tasks:

1. Create database config.
2. Connect MongoDB Atlas.
3. Add User model.
4. Test connection.

Expected:

```text
MongoDB connected successfully
Server running on port 5000
```

---

## PHASE 3 — Authentication

Implement:

```text
Register
Login
Current User
Logout
JWT middleware
```

Test all authentication endpoints before continuing.

---

## PHASE 4 — Base Frontend

Create:

```text
Landing
Login
Register
Dashboard
```

Implement:

```text
React Router
AuthContext
API service
Protected routes
```

---

## PHASE 5 — UI SYSTEM

Install/configure:

```text
Tailwind
shadcn/ui
Lucide
Magic UI
```

Create reusable components.

Do not duplicate UI code.

---

## PHASE 6 — Resume Upload

Implement:

```text
POST /api/resumes/upload
```

Add:

- Multer
- Validation
- Upload UI
- Progress
- Error states

---

## PHASE 7 — Document Extraction

Implement:

```text
documentService.js
ocrService.js
```

Support:

```text
PDF
DOCX
JPG
JPEG
PNG
```

Test extraction independently before AI integration.

---

## PHASE 8 — AI Integration

Implement:

```text
aiService.js
```

Configure:

```text
XAI_API_KEY
XAI_MODEL
```

Create CV analysis prompt.

Return structured JSON.

Test AI integration using a sample CV.

---

## PHASE 9 — CV Analysis

Implement:

```text
POST /api/analysis/:resumeId
GET /api/analysis/:resumeId
```

Save structured analysis to MongoDB.

Create the frontend analysis page.

---

## PHASE 10 — CV Score

Implement the score calculation.

Show:

```text
Overall score
Category scores
Strengths
Weaknesses
Recommendations
```

Use visualizations.

---

## PHASE 11 — Job Module

Implement:

```text
Create job
List jobs
View job
Delete job
```

Create Job Matcher UI.

---

## PHASE 12 — Matching Engine

Implement:

```text
POST /api/jobs/:jobId/match/:resumeId
```

Compare:

```text
CV analysis
+
Job description
```

Return structured matching data.

Save Match document.

---

## PHASE 13 — Match UI

Create:

```text
MatchResult.jsx
```

Display:

```text
Compatibility score
Matching skills
Missing skills
Experience
Education
Keywords
Recommendations
Explanation
```

---

## PHASE 14 — Dashboard

Add:

```text
CV score
Number of CVs
Number of analyses
Number of matches
Recent analyses
Recent jobs
Recent matches
```

---

## PHASE 15 — History

Implement:

```text
CV analysis history
Job matching history
```

Add:

```text
Search
Filter
Sort
Delete
View
```

---

## PHASE 16 — Polish

Improve:

- Responsive design
- Animations
- Loading states
- Error states
- Empty states
- Accessibility
- Typography
- Spacing
- Consistency
- Dark mode if implemented

---

## PHASE 17 — Security Review

Before finalizing:

Check:

```text
.env protected
API key protected
JWT protected
Passwords hashed
CORS configured
Uploads validated
Ownership checked
Errors sanitized
```

---

## PHASE 18 — Final Testing

Test the complete flow:

```text
Register
↓
Login
↓
Dashboard
↓
Upload CV
↓
Extract
↓
OCR if needed
↓
AI Analysis
↓
CV Score
↓
Create Job
↓
Match CV
↓
View Match
↓
History
```

---

# 62. CODING RULES

Follow these rules throughout the project.

### Rule 1

Do not create huge files.

Bad:

```text
server.js
1000+ lines
```

Good:

```text
routes
controllers
services
models
middleware
```

### Rule 2

Do not duplicate code.

Create reusable functions/components.

### Rule 3

Use meaningful names.

Bad:

```text
data.js
thing.js
temp.js
```

Good:

```text
aiService.js
resumeController.js
matchingService.js
```

### Rule 4

Use async/await.

### Rule 5

Handle errors.

### Rule 6

Keep controllers thin.

Example:

```text
Controller
   ↓
Service
   ↓
Database/API
```

### Rule 7

Never expose secrets.

### Rule 8

Do not trust AI blindly.

Validate AI output.

### Rule 9

Do not invent resume information.

### Rule 10

Keep the UI accessible and readable.

---

# 63. NPM SCRIPT REQUIREMENTS

Server:

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

Client:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

# 64. FINAL PROJECT QUALITY

The final project must NOT look like:

```text
Basic CRUD dashboard
```

It should look like:

```text
Modern AI SaaS
```

The visual quality should include:

- Professional landing page
- Strong typography
- Clean dashboard
- Beautiful cards
- Data visualization
- Animated score
- Interactive CV analysis
- Smooth transitions
- Responsive layout
- Consistent iconography
- Good empty states
- Good loading states

---

# 65. FINAL ACCEPTANCE CRITERIA

The project is complete only when ALL of the following work:

## Authentication

- [ ] Register
- [ ] Login
- [ ] JWT
- [ ] Protected routes
- [ ] Logout

## CV

- [ ] PDF upload
- [ ] DOCX upload
- [ ] JPG upload
- [ ] PNG upload
- [ ] Text extraction
- [ ] OCR
- [ ] CV storage

## AI

- [ ] xAI API
- [ ] Secure API key
- [ ] Structured JSON
- [ ] Skills extraction
- [ ] Experience extraction
- [ ] Education extraction
- [ ] Projects extraction
- [ ] Certifications extraction
- [ ] Recommendations
- [ ] CV score

## Jobs

- [ ] Job creation
- [ ] Job description
- [ ] Job storage
- [ ] CV/job matching
- [ ] Compatibility score
- [ ] Matching skills
- [ ] Missing skills
- [ ] Explanation
- [ ] Recommendations

## Frontend

- [ ] Landing page
- [ ] Dashboard
- [ ] Upload page
- [ ] Analysis page
- [ ] Job matcher
- [ ] Match result
- [ ] History
- [ ] Settings
- [ ] Responsive UI
- [ ] shadcn/ui
- [ ] Magic UI

## Backend

- [ ] Express
- [ ] Controllers
- [ ] Routes
- [ ] Models
- [ ] Services
- [ ] Middleware
- [ ] Error handling
- [ ] CORS
- [ ] JWT
- [ ] MongoDB Atlas

## Documentation

- [ ] README
- [ ] Environment documentation
- [ ] API documentation
- [ ] Setup instructions
- [ ] Screenshots
- [ ] GitHub repository
- [ ] No secrets committed

---

# 66. FINAL INSTRUCTION TO THE CODING AGENT

Build this project carefully and incrementally.

Before implementing each phase:

1. Inspect the current project.
2. Identify what already exists.
3. Do not overwrite working code unnecessarily.
4. Implement only the current phase.
5. Test the phase.
6. Fix errors.
7. Then continue to the next phase.

When you finish a phase, verify that:

```text
No broken imports
No obvious runtime errors
No missing environment variables
No exposed secrets
No broken routes
No duplicate components
```

The final application must be:

```text
Functional
Secure
Responsive
Maintainable
Well-structured
Visually polished
AI-powered
Portfolio-ready
```

Do not replace the requested MERN + JSX architecture with another stack.

Do not use TypeScript unless explicitly requested.

Do not implement unauthorized LinkedIn scraping.

Do not expose xAI credentials.

Do not fabricate information extracted from CVs.

Build the project step by step, test each phase, and keep the code clean.
