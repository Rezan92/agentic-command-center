# **Product Backlog: Agentic Command Center**

This backlog is organized sequentially. Each epic builds the necessary foundation for the next, ensuring we don't build the UI before the APIs can support it, and we don't build the AI before the data layer exists.

## **Epic 1: Backend Foundation & Data Layer**

*Goal: Stand up the core Express server and PostgreSQL database using the defined Prisma schema.*

* **Story 1.1: Initialize Express Server**  
  * *Description:* Setup the Node.js/Express repository with TypeScript, basic routing, and CORS configured to accept requests from the future Next.js frontend.  
* **Story 1.2: Database Provisioning & Prisma Setup**  
  * *Description:* Spin up a local PostgreSQL instance (with pgvector enabled), initialize Prisma, and apply the schema.prisma file to create the tables (User, OAuthConnection, Conversation, Message, MemoryEmbedding).  
* **Story 1.3: Hardcoded MVP Authentication**  
  * *Description:* Create a simple middleware to bypass full auth for MVP, automatically assigning requests to a seeded User ID in the database so foreign key relations work.  
* **Story 1.4: Structured Logging Setup**  
  * *Description:* Implement a logger (e.g., Winston) to record all incoming API requests and upcoming AI tool executions for easier debugging.

## **Epic 2: Frontend Shell & Real-Time Comms**

*Goal: Build the Next.js chat interface and connect it to the Express backend using Server-Sent Events (SSE).*

* **Story 2.1: Initialize Next.js & UI Library**  
  * *Description:* Setup Next.js (App Router), Tailwind CSS v4, and install shadcn/ui. Create the base layout.  
* **Story 2.2: Build the Chat Interface UI**  
  * *Description:* Create the input bar, message history view, and wire up Zustand for local state management.  
* **Story 2.3: Establish SSE Connection**  
  * *Description:* Create an Express endpoint that opens a Server-Sent Events (SSE) stream. Configure the Next.js frontend to listen to this stream to receive real-time updates.  
* **Story 2.4: Chat History CRUD**  
  * *Description:* Create Express REST endpoints to fetch previous Conversation and Message records from Postgres, and render them in the Next.js UI on load.

## **Epic 3: Core Orchestrator Engine ("Big Boss")**

*Goal: Integrate Gemini 1.5 Pro and define the strict communication protocol.*

* **Story 3.1: Gemini Pro Integration**  
  * *Description:* Install the Vercel AI SDK on the Express backend and configure the Gemini 1.5 Pro model to receive user chat inputs and stream text back via SSE.  
* **Story 3.2: Define MCP-Inspired Zod Schemas**  
  * *Description:* Write the strict Zod schemas for the Calendar\_Agent and Notion\_Agent tools so the Orchestrator knows exactly what JSON format to output.  
* **Story 3.3: Sliding Window Context Management**  
  * *Description:* Write logic before the LLM call to only fetch the last 10 Message records for the active context window, preventing token bloat.  
* **Story 3.4: Task-Result Compaction**  
  * *Description:* Create a utility function that takes a large JSON response from an agent and asks a lightweight Gemini model to summarize it before passing it back to the Orchestrator's memory.

## **Epic 4: Worker Agent Integrations ("Little Employees")**

*Goal: Give the Orchestrator actual tools to use by integrating Gemini 1.5 Flash with external APIs.*

* **Story 4.1: Google OAuth Flow**  
  * *Description:* Implement the Google OAuth 2.0 flow and save the accessToken, refreshToken, and expiresAt into the OAuthConnection table.  
* **Story 4.2: Google Calendar Worker Agent**  
  * *Description:* Create the isolated Gemini Flash script that takes the Orchestrator's Zod JSON, hits the Google Calendar API (Find, Create, Update), and returns a standardized JSON response.  
* **Story 4.3: Notion OAuth Flow**  
  * *Description:* Implement the Notion Integration/OAuth flow and securely save the token into the OAuthConnection table.  
* **Story 4.4: Notion Worker Agent**  
  * *Description:* Create the Gemini Flash script to handle global Notion search, reading pages, and creating new database items based on the Orchestrator's commands.

## **Epic 5: Safety, UX Polish, & Observability**

*Goal: Add the "Glass Engine" UI components, error handling, and Human-in-the-Loop safety checks.*

* **Story 5.1: Agentic Breadcrumbs UI**  
  * *Description:* Update the Next.js UI to listen for custom SSE events (e.g., "Routing to Notion") and render a dynamic stepper/terminal UI above the chat message.  
* **Story 5.2: HITL (Human-in-the-Loop) Modals**  
  * *Description:* If the Orchestrator outputs a "Delete" or "Move" intent, halt the backend loop, send a "Confirmation Required" event to the frontend, and render an Approve/Deny modal.  
* **Story 5.3: Token Refresh & Graceful Failures**  
  * *Description:* Add logic to the Workers to check expiresAt in the DB before an API call. If a 401 occurs, catch the error, halt the loop, and ask the user to re-authenticate via the UI.  
* **Story 5.4: Long-term Vector Memory (pgvector)**  
  * *Description:* Create a background worker that takes conversations older than 10 turns, generates an embedding summary using Gemini, and saves it to the MemoryEmbedding table for semantic retrieval.