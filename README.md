# SprachGenie (Frontend)

## Project Overview

SprachGenie is an AI-powered language learning platform built with React JS, TypeScript, Express JS, and PostgreSQL, designed to help users improve their German vocabulary (A1–C1).

- Words include pre-set meanings and example sentences
- Users can click the AI button next to a word to generate:
  - More meanings
  - Additional sentences
  - A short paragraph
- Users can report incorrect AI-generated content
- Search and filter words by language level (A1–C1) and topic
- Add words to a Favorites list for better progress tracking

## Admin Features

- Manage users (suspend/unsuspend, assign roles)
- Create and update words and conversations
- Monitor favorite counts
- Set global and per-user limits
- Control overall usage
- Review reported AI content

## Security & Authentication

- Email verification ensures genuine accounts
- Password reset available for forgotten credentials
- Unverified accounts are automatically removed by cron jobs

## Frontend & Backend Communication

- Frontend communicates with backend via RESTful APIs using Axios
- Redux handles state management for smooth experience

## Technologies

- Frontend: React JS, Tailwind CSS, TypeScript
- State Management: Redux
- API Communication: Axios, RESTful APIs
- Backend: Express JS, PostgreSQL, Prisma
- Authentication: JSON Web Token (JWT)
- AI: OpenAI GPT-4.0 Mini

## Getting Started

### Prerequisites

- Node.js v18+ installed
- Setup SprachGenie Backend [Link Text](https://sprach-genie.netlify.app/backend)
- Update the base API URL in `.env` file

### Run Locally

1. Clone the repository:

   ```bash
   git clone <https://github.com/Engarif3/Sprachgenie-new-frontend.git>
   cd <repository-folder>
   ```

2. Install dependencies::

   ```bash
   yarn
   ```

3. Start the app:

   ```bash
   yarn dev
   ```

4. Access the application locally:
   ```bash
   https://localhost:5173 or https://127.0.0.1:5173
   ```

## 📞 Contact

For any inquiries or issues, feel free to reach out:

- **Email:** [arif.aust.eng@gmail.com](mailto:arif.aust.eng@gmail.com)
- **LinkedIn:** [Md. Arifur Rahman](https://www.linkedin.com/in/engarif3/)

# SprachGenie-frontend

# E-Sprachgenie-new-frontend
