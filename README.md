# ResumeXray

An AI-powered resume vs. job-description analyzer with explainable match scores,
a skill-gap learning roadmap, and an AI bullet rewriter — built with Spring Boot,
React, PostgreSQL and Groq's free LLM API.

## Project structure

```
resumexray/
├── backend/    Spring Boot (Java 17)
└── frontend/   React + Vite
```

## 1. Get a free Groq API key

1. Go to https://console.groq.com and sign up (free, no card needed).
2. Create an API key.
3. Set it as an environment variable before starting the backend:

   ```
   export GROQ_API_KEY=your_key_here      # macOS/Linux
   set GROQ_API_KEY=your_key_here         # Windows cmd
   ```

## 2. Set up PostgreSQL

Create a database:

```sql
CREATE DATABASE resumexray;
```

Update `backend/src/main/resources/application.properties` if your username/password differ
from the defaults (`postgres` / `postgres`).

## 3. Run the backend

```
cd backend
mvn spring-boot:run
```

Backend runs on **http://localhost:8080**. Tables are auto-created on first run
(`spring.jpa.hibernate.ddl-auto=update`).

## 4. Run the frontend

```
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173** and proxies `/api` calls to the backend.

## 5. Try it

1. Open http://localhost:5173, create an account, log in.
2. Paste a resume and a job description on the **Scan Report** tab → get an
   explainable match score.
3. Click "Generate skill-gap roadmap" → see a 4-week learning plan for missing skills.
4. Go to **Bullet Rewriter** → paste an existing bullet + the JD → get it rewritten
   to match the JD's language.

## Notes for your resume / interview

- Groq exposes an **OpenAI-compatible** `/chat/completions` endpoint, so `GroqClient`
  is written the same way you'd write a real OpenAI/Spring AI integration — swapping
  providers later is a one-line change (`base-url` + `model`).
- The AI is prompted to return raw JSON only, which is parsed with Jackson — this is
  the "structured output from an LLM" pattern interviewers like to probe.
- `MatchReport` entity + `MatchReportRepository` are already wired for a future
  **history dashboard** (score over time, per resume) — a good "what would you add
  next" answer if asked.
- JWT auth mirrors the pattern from your earlier project (JwtAuthFilter, JwtUtil,
  CustomUserDetailsService) so the story of "why did you build it this way" stays
  consistent across your projects.

## Known simplifications (mention if asked, don't hide them)

- `/api/match/analyze` takes pasted resume text directly (simpler than requiring a
  prior file upload) — the `/api/resume/upload` PDF-extraction endpoint exists
  separately and can be wired in as a next step.
- No rate-limiting/caching on Groq calls yet — fine for a demo, worth mentioning as
  a production concern.
