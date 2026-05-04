# Agentic AI Command Center

## Project Overview
A decoupled, API-first "Second Brain" assistant. A front-end chat interface communicates with an Express.js backend, where an AI Orchestrator ("Big Boss") delegates tasks to isolated Worker Agents ("Little Employees") to execute API calls across integrated tools.

## Architecture
- **Frontend:** Next.js (App Router), Tailwind CSS, Zustand.
- **Backend:** Node.js, Express.js.
- **Orchestrator:** Gemini 1.5 Pro.
- **Agents:** Gemini 1.5 Flash.
- **Database:** PostgreSQL + pgvector + Prisma.

## Repository Structure
- `/frontend`: Next.js Web Client.
- `/backend`: Express server with Orchestrator-Agent logic.
- `/docs`: Documentation and architecture diagrams.

## Getting Started
(Detailed setup instructions to be added)
