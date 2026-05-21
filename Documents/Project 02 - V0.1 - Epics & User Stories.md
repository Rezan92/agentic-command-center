# **Product Backlog: Agentic Command Center**

This backlog is organized sequentially. Each epic builds the necessary foundation for the next.

## **Epic 1: Backend Foundation & Data Layer (COMPLETE)**
- Story 1.1: Initialize Express Server
- Story 1.2: Database Provisioning & Prisma Setup
- Story 1.3: Hardcoded MVP Authentication
- Story 1.4: Structured Logging Setup

## **Epic 2: Frontend Shell & Multi-Chat (COMPLETE)**
- Story 2.1: Initialize Next.js & UI Library
- Story 2.2: Build the Chat Interface UI
- Story 2.3: Establish DB Persistence
- Story 2.4: Chat History CRUD
- Story 2.5: Multi-Chat Sidebar & Navigation

## **Epic 3: The Tooling Layer (The MCP Protocol)**
*Goal: Teach the Orchestrator how to identify intent and output structured JSON commands.*

* **Story 3.1: Define Core Zod Schemas (The MCP Protocol)**
  * *Description:* Create a centralized folder defining exactly what commands the AI can issue. This is our strict contract to prevent hallucinations.
  * *Deliverables:*
    * `notion-schema.ts`: Define `search_pages`, `read_page`, and `update_database_item`.
    * `calendar-schema.ts`: Define `find_event`, `create_event`, and `delete_event`.
    * Centralized registration so the Orchestrator can load these tools dynamically.
* **Story 3.2: Orchestrator Tool Integration**
  * *Description:* Update the Gemini loop to recognize tools. When a user says "Book a meeting," the AI must return a tool-call JSON, not just text.
* **Story 3.3: Mock Worker Responses**
  * *Description:* Implement "dry run" workers that return success messages so we can test the logic without real APIs.

## **Epic 4: Integration Management & OAuth**
*Goal: Provide a secure way for users to grant the app permission to their tools.*

* **Story 4.1: Integrations UI (Settings Dashboard)**
  * *Description:* Create a "Connections" tab in the Settings modal/sidebar. Show cards for "Google Calendar" and "Notion" with "Connect" buttons and "Connected/Disconnected" status indicators.
* **Story 4.2: OAuth 2.0 Backend Core**
  * *Description:* Implement the `/api/auth/:provider` and `/api/auth/:provider/callback` routes. Use `google-auth-library` and official Notion auth patterns.
* **Story 4.3: Secure Token Management**
  * *Description:* Update the logic to save `accessToken`, `refreshToken`, and `expiresAt` into the `OAuthConnection` table. Implement a `refreshAccessToken` utility.
* **Story 4.4: Dynamic Tool Availability**
  * *Description:* Update the Orchestrator to only "show" tools to Gemini if the user has an active connection for that provider.

## **Epic 5: Worker Agents (The Hands)**
*Goal: Connect the structured JSON commands to real API calls.*

* **Story 5.1: Google Calendar Agent**
  - Build the service that maps Gemini's JSON -> Google Calendar API.
* **Story 5.2: Notion Agent**
  - Build the service for Search, Page Reading, and Database updates.

## **Epic 6: UI/UX Refinement (COMPLETE)**
- Story 6.1: Markdown & Rich Text Rendering
- Story 6.2: Dark Mode & Theme Provider
- Story 6.3: Custom Typography (Google Sans Flex)

## **Epic 7: Safety & The "Glass Engine"**
*Goal: Observability and user control.*

* **Story 7.1: Agentic Breadcrumbs**
  - Visualize the "Thinking -> Routing -> Executing" steps in the UI.
* **Story 7.2: Human-in-the-Loop (HITL)**
  - Implement "Confirm/Deny" buttons for data-modifying actions.
