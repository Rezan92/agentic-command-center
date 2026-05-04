# **Product Requirements Document (PRD)**

**Project Name:** Agentic AI Command Center

**Status:** Approved / Phase 1

**Architecture Pattern:** Headless Orchestrator-Agent (API-First)

## **1\. Product Vision & Problem Statement**

**Problem:** Managing daily workflows across multiple productivity apps (Notion, Google Calendar) requires constant context switching, manual data entry, and rigid UI navigation.

**Solution:** A decoupled, API-first "Second Brain" assistant. A front-end chat interface communicates with an Express.js backend, where an AI Orchestrator ("Big Boss") delegates tasks to isolated Worker Agents ("Little Employees") to execute API calls across integrated tools.

## **2\. Target Audience & Scope**

* **Primary User:** Single-user personal deployment for the MVP, but architected fundamentally for Multi-tenant SaaS and multi-client (Web \+ Mobile) support.  
* **Environment:** Localhost MVP, architecturally ready for cloud deployment.  
* **Authentication & Multi-tenancy:** The database schema *must* include a user\_id from day one. OAuth tokens (Google, Notion) will be explicitly tied to this user\_id to handle refresh cycles natively.

## **3\. Architecture & Tech Stack**

To support future interfaces (like a React Native mobile app), the backend is strictly decoupled from the web frontend.

* **Frontend (Web Client):** Next.js (App Router), Tailwind CSS, shadcn/ui, Zustand (State Management).  
* **Backend (The Engine):** Node.js, Express.js (REST APIs and Server-Sent Events/WebSockets).  
* **Orchestrator ("Big Boss"):** Gemini 1.5 Pro (via Vercel AI SDK) \- Handles complex reasoning, intent routing, and state tracking.  
* **Worker Agents ("Little Employees"):** Gemini 1.5 Flash \- Isolated, rapid-execution scripts (e.g., Notion Agent, Calendar Agent).  
* **Storage & Memory:** PostgreSQL (with pgvector) \+ Prisma or Drizzle ORM.

## **4\. Agent Communication Protocol (MCP-Inspired Flow)**

To ensure the Orchestrator and Worker Agents communicate predictably, the system utilizes a strictly typed, MCP-inspired (Model Context Protocol) communication loop. All agents must adhere to standardized JSON request and response schemas validated by Zod.

**The Orchestrator-Agent Loop:**

1. **User Input:** The user sends a command to the frontend (e.g., *"Reschedule my 3 PM meeting to 4 PM"*).  
2. **Orchestrator Routing:** Express feeds this to the Orchestrator. The Orchestrator analyzes the intent and selects the Calendar\_Agent tool.  
3. **Standardized Request (Boss → Worker):** The Orchestrator generates a strict JSON payload adhering to the tool's Zod schema.  
   * *Example:* { "action": "update\_event", "parameters": { "original\_time": "15:00", "new\_time": "16:00" } }  
4. **Worker Execution:** The Calendar Agent receives the payload, executes the physical API call to Google, and awaits the HTTP response.  
5. **Standardized Response (Worker → Boss):** The Worker Agent formats the Google API result into a standardized response payload.  
   * *Example:* { "status": "success", "agent": "calendar", "summary": "Meeting moved to 4 PM" }  
6. **Final Synthesis:** The Orchestrator reads the Worker's response, verifies the task is complete, and streams a conversational update back to the frontend.

## **5\. Observability & UI State (The "Glass Engine")**

To prevent the user from staring at a loading spinner during multi-step executions, the UI must visualize the AI's internal state using Server-Sent Events (SSE).

* **Agentic Breadcrumbs (UI):** A dynamic stepper or terminal UI component that renders the current phase:  
  * 🟡 *Orchestrator is planning...*  
  * 🔵 *Routing to Notion Agent...*  
  * 🟢 *Notion Agent found 3 pages (0.8s)*  
  * 🔴 *Calendar API failed. Retrying (1/3)...*  
* **Execution Timers:** Every agentic hop is timed. If a worker takes \>15 seconds, a timeout exception is thrown, halting the loop and notifying the user where the bottleneck occurred.  
* **System Logging:** A structured logger (e.g., Winston) on the Express backend logs exact API requests, AI prompts, and failure stack traces for debugging.

## **6\. Token Limit & Memory Management**

To prevent Context Window Bloat and massive latency/cost spikes:

* **Task-Result Compaction:** When a Worker Agent returns a massive JSON payload, the Orchestrator does *not* keep that raw JSON in its memory history. It summarizes the result, stores the summary in its context window, and drops the raw data.  
* **Sliding Window:** The Orchestrator only retains the last 10 conversational turns in its active prompt. Older turns are asynchronously summarized and stored in Postgres via pgvector for semantic retrieval later.  
* **Separation of Memory:** \* *Chat History:* What the user sees (Stored in DB).  
  * *Scratchpad:* Temporary backend JSON logs of Agents talking to the Orchestrator (Cleared out after task completion).

## **7\. Core AI Behaviors & Constraints**

* **Human-in-the-Loop (HITL) Batching:** Any destructive action (Delete/Move) requires a boolean Confirm UI. The Orchestrator will batch proposed actions into a single approval modal to prevent alert fatigue.  
* **Strict Routing:** Workers never communicate directly. All data flows back up to the Orchestrator.  
* **Concurrency Handling:** If a user types a *new* command while the Orchestrator is executing an older command, the backend gracefully cancels the in-flight ReAct loop and prioritizes the new input.  
* **Graceful API Failures:** If an OAuth token expires, the system halts the loop and triggers a UI component asking the user to re-authenticate, rather than infinitely retrying a 401 error.

## **8\. Feature Scope (MVP / Phase 1\)**

* **Chat Interface:** Streaming text, dynamic UI components, real-time Agent Status tracking.  
* **Google Calendar Integration:** Find, Create, Update, Delete (requires HITL).  
* **Notion Integration:** Global search, Read items, Create/Update items.

## **9\. Execution Roadmap**

* **Phase 1: Backend Foundation.** Express routing, PostgreSQL setup, User/OAuth tables, structured logging.  
* **Phase 2: Frontend & Sockets.** Next.js UI shell, Zustand state, SSE/WebSocket connection to Express to stream mock Agent statuses.  
* **Phase 3: The Orchestrator.** Gemini Pro integration, Context Management (sliding window, compaction), Zod schemas.  
* **Phase 4: Worker Integrations.** Google/Notion OAuth, Gemini Flash workers, CRUD function mappings.  
* **Phase 5: Safety & Polish.** HITL batching modals, Timeout handlers, Error boundary UI.

## **10\. Success Metrics**

1. **Reliability:** 95% routing accuracy on golden-path test cases, with Graceful Degradation (asking clarifying questions) for the remaining 5%.  
2. **Observability:** 100% of errors are mapped to a specific agent/tool and displayed clearly in the UI.  
3. **Performance:** Sub-task routing and execution takes \< 3 seconds per hop.  
4. **Safety:** Zero unapproved destructive actions.

## **11\. The Master Folder Structure**

Here is the domain-driven folder structure designed specifically for your multi-agent architecture and for easy consumption by the Gemini CLI.

Plaintext  
/agentic-command-center  
│  
├── /frontend               \# Next.js Application (The Face)  
│   ├── /components         \# React components (CalendarCard, ChatMessage)  
│   ├── /store              \# Zustand state management  
│   ├── /hooks              \# Custom React hooks  
│   └── /app                \# Next.js App Router pages  
│  
├── /backend                \# Express.js Application (The Nervous System)  
│   ├── /src  
│   │   ├── /server.ts      \# Express setup & middleware  
│   │   ├── /routes         \# API endpoints exposed to the Frontend  
│   │   │  
│   │   ├── /orchestrator   \# The "Big Boss" Logic  
│   │   │   ├── router.ts   \# Decides which sub-agent to call  
│   │   │   └── memory.ts   \# Connects to DB for chat history  
│   │   │  
│   │   ├── /agents         \# The "Little Agents" (Workers)  
│   │   │   ├── /notion  
│   │   │   │   ├── index.ts      \# Notion Agent LLM setup  
│   │   │   │   └── tools.ts      \# Actual Notion API calls  
│   │   │   └── /calendar  
│   │   │       ├── index.ts      \# Calendar Agent LLM setup  
│   │   │       └── tools.ts      \# Google API calls  
│   │   │  
│   │   ├── /prompts        \# Centralized text files for LLM instructions  
│   │   │   ├── supervisor.md     \# Instructions for the Big Boss  
│   │   │   ├── agent-notion.md   \# Instructions for Notion Worker  
│   │   │   └── agent-calendar.md \# Instructions for Calendar Worker  
│   │   │  
│   │   └── /database       \# PostgreSQL Layer  
│   │       ├── schema.ts   \# Database schemas  
│   │       └── queries.ts  \# Functions to save/load memory  
│  
├── /docs                   \# Project documentation  
│  
└── .ai-instructions        \# The Master Rulebook for your Gemini CLI  
