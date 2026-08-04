# SprachGenie (Frontend)

**Live:** [simplegerman.de](https://simplegerman.de)

## Overview

SprachGenie is an AI-assisted German vocabulary and practice platform, covering levels A1–C1. This repository is the React/Vite frontend; it talks to a separate Express/PostgreSQL backend and a separate AI microservice.

## Features

### Vocabulary

- Browse and search words by level (A1–C1) and topic, with part-of-speech filtering
- Each word includes meanings, example sentences, synonyms/antonyms/similar words, and conjugation lookups
- AI-generated extra meanings, sentences, and short paragraphs per word, with a report option for incorrect AI output
- Favorite individual words for later review

### Practice

- **Quiz** — timed vocabulary quiz by difficulty (Easy / Difficult / Mixed) or generated from your own favorited words
- **Conversations** — realistic German dialogues grouped by category and level, with per-line translation and pronunciation
- **Stories** — short graded reading passages with narration and a vocabulary list
- **Challenge & Leaderboard** — daily per-level challenges that earn XP, with a weekly leaderboard

### Personalization

- Favorite words, conversations, and stories independently, with a bulk "delete all" option
- Daily streak and XP tracking
- Light/dark theme, English/German UI language toggle
- In-app notifications and admin broadcast announcements

### Extras

- Live radio channel player
- Word-of-the-day and quick vocabulary "balloon" practice on the home page

## Admin Dashboard

Role-gated (Admin / Super Admin) tools, including:

- User management (suspend/unsuspend, role assignment)
- Content management: words, levels, topics, conversations, conversation categories, stories
- Word/AI-paragraph/conjugation report review
- Global, per-user, and per-IP usage limits
- Analytics: favorites stats (words/conversations/stories), AI usage, IP usage
- Monitoring: system status, visitor analytics, registration signals, error logs

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Redux Toolkit
- **API communication:** Axios (REST)
- **Backend:** Express, PostgreSQL, Prisma (separate repo)
- **Auth:** JWT, httpOnly cookies
- **AI:** Separate microservice (OpenAI-backed) for generated content

## Getting Started

### Prerequisites

- Node.js v18+
- Yarn
- A running instance of the [SprachGenie backend](https://github.com/Engarif3/Sprcahgenie-new-backend) (and, for AI features, the AI microservice)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/Engarif3/Sprachgenie-new-frontend.git
   cd Sprachgenie-new-frontend
   ```

2. Install dependencies:

   ```bash
   yarn
   ```

3. Create a `.env` file in the project root with:

   ```bash
   VITE_BACKEND_API_URL=http://localhost:5001/api/v1
   VITE_AI_API_URL=<ai-microservice-url>
   VITE_ADMIN_EMAILS=<comma-separated admin emails>
   VITE_DELETE_PASSWORD=<password required for destructive admin actions>
   VITE_FACEBOOK_APP_ID=<facebook app id, for social login/share features>
   ```

4. Start the dev server:

   ```bash
   yarn dev
   ```

5. Open the app:
   - http://localhost:5173

### Other scripts

```bash
yarn build     # production build
yarn preview   # preview the production build locally
yarn lint      # run ESLint
```

## Contact

- **Email:** [arif.aust.eng@gmail.com](mailto:arif.aust.eng@gmail.com)
- **LinkedIn:** [Md. Arifur Rahman](https://www.linkedin.com/in/engarif3/)
